import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const API_TIMEOUT_MS = 15000;
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const JSON_HEADERS = { ...corsHeaders, "Content-Type": "application/json" };
const UPSTREAM_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
  "User-Agent": "LovableCloud-BDCourier/1.0",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, serviceRoleKey);
const bdcourierKey = Deno.env.get("BDCOURIER_API_KEY");

const bengaliDigitMap: Record<string, string> = {
  "০": "0",
  "১": "1",
  "২": "2",
  "৩": "3",
  "৪": "4",
  "৫": "5",
  "৬": "6",
  "৭": "7",
  "৮": "8",
  "৯": "9",
};

function normalizeBDPhone(raw: string): string | null {
  let sanitized = "";

  for (const ch of String(raw || "")) {
    if (bengaliDigitMap[ch]) sanitized += bengaliDigitMap[ch];
    else if (/[0-9]/.test(ch)) sanitized += ch;
    else if (ch === "+" && sanitized.length === 0) sanitized += ch;
  }

  if (sanitized.startsWith("+880")) sanitized = `0${sanitized.slice(4)}`;
  sanitized = sanitized.replace(/\D/g, "");

  if (sanitized.startsWith("880") && sanitized.length >= 13) {
    sanitized = `0${sanitized.slice(3)}`;
  }

  if (sanitized.length === 10 && sanitized.startsWith("1")) {
    sanitized = `0${sanitized}`;
  }

  if (sanitized.length === 11 && sanitized.startsWith("01")) {
    return sanitized;
  }

  return null;
}

async function readJsonSafely(resp: Response) {
  const text = await resp.text();
  try {
    return JSON.parse(text);
  } catch {
    return { error: "Invalid upstream response", raw: text.slice(0, 1000) };
  }
}

async function fetchFromApi(phone: string, signal: AbortSignal): Promise<{ data: any; ok: boolean }> {
  const resp = await fetch("https://api.bdcourier.com/courier-check", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${bdcourierKey}`,
      ...UPSTREAM_HEADERS,
    },
    body: JSON.stringify({ phone }),
    signal,
  });

  const data = await readJsonSafely(resp);
  return { data, ok: resp.ok };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { phone, action } = body;

    if (!bdcourierKey) {
      return new Response(JSON.stringify({ error: "BDCOURIER_API_KEY not configured" }), {
        status: 500,
        headers: JSON_HEADERS,
      });
    }

    if (action === "check-connection") {
      const resp = await fetch("https://api.bdcourier.com/check-connection", {
        headers: { Authorization: `Bearer ${bdcourierKey}`, Accept: "application/json" },
      });
      const data = await readJsonSafely(resp);
      return new Response(JSON.stringify(data), { status: resp.status, headers: JSON_HEADERS });
    }

    if (action === "my-plan") {
      const resp = await fetch("https://api.bdcourier.com/my-plan", {
        headers: { Authorization: `Bearer ${bdcourierKey}`, Accept: "application/json" },
      });
      const data = await readJsonSafely(resp);
      return new Response(JSON.stringify(data), { status: resp.status, headers: JSON_HEADERS });
    }

    const normalizedPhone = normalizeBDPhone(phone);
    if (!normalizedPhone) {
      return new Response(JSON.stringify({ error: "Valid phone number required" }), {
        status: 400,
        headers: JSON_HEADERS,
      });
    }

    const { data: cached } = await supabase
      .from("courier_check_cache")
      .select("response_data, created_at")
      .eq("phone", normalizedPhone)
      .limit(1)
      .maybeSingle();

    if (cached) {
      const cacheAge = Date.now() - new Date(cached.created_at).getTime();
      if (cacheAge < CACHE_TTL_MS) {
        return new Response(
          JSON.stringify({ ...(cached.response_data as Record<string, unknown>), _cached: true }),
          { status: 200, headers: JSON_HEADERS },
        );
      }
    }

    const abortCtrl = new AbortController();
    const timeoutId = setTimeout(() => abortCtrl.abort("timeout"), API_TIMEOUT_MS);

    let apiResult: { data: any; ok: boolean } | null = null;
    let timedOut = false;

    try {
      apiResult = await fetchFromApi(normalizedPhone, abortCtrl.signal);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        timedOut = true;
      } else {
        console.error("bd-courier-check upstream error", error);
      }
    } finally {
      clearTimeout(timeoutId);
    }

    if (!apiResult) {
      if (cached) {
        return new Response(
          JSON.stringify({ ...(cached.response_data as Record<string, unknown>), _cached: true, _stale: true }),
          { status: 200, headers: JSON_HEADERS },
        );
      }

      return new Response(JSON.stringify({ error: timedOut ? "Request timeout" : "Courier check failed" }), {
        status: timedOut ? 504 : 502,
        headers: JSON_HEADERS,
      });
    }

    if (apiResult.ok) {
      const payload = {
        phone: normalizedPhone,
        response_data: apiResult.data,
        created_at: new Date().toISOString(),
      };

      supabase
        .from("courier_check_cache")
        .upsert(payload, { onConflict: "phone" })
        .then(({ error }) => {
          if (error) console.error("bd-courier-check cache upsert error", error);
        });
    }

    return new Response(JSON.stringify(apiResult.data), {
      status: apiResult.ok ? 200 : 400,
      headers: JSON_HEADERS,
    });
  } catch (error) {
    console.error("bd-courier-check fatal error", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }),
      { status: 500, headers: JSON_HEADERS },
    );
  }
});
