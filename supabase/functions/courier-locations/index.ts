import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Auth check
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: claims, error: claimsErr } = await authClient.auth.getClaims(authHeader.replace("Bearer ", ""));
  if (claimsErr || !claims?.claims) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  try {
    const url = new URL(req.url);
    const providerId = url.searchParams.get("provider_id");
    const action = url.searchParams.get("action"); // cities, zones, areas
    const cityId = url.searchParams.get("city_id");
    const zoneId = url.searchParams.get("zone_id");

    if (!providerId || !action) {
      return new Response(
        JSON.stringify({ error: "provider_id and action required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get provider config from DB
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: provider, error: provError } = await supabase
      .from("courier_providers")
      .select("*")
      .eq("id", providerId)
      .single();

    if (provError || !provider) {
      return new Response(
        JSON.stringify({ error: "Provider not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const configs = Array.isArray(provider.api_configs)
      ? provider.api_configs
      : JSON.parse(provider.api_configs || "[]");

    if (configs.length === 0) {
      return new Response(
        JSON.stringify({ error: "No API config found for this provider" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const config = configs[0]; // Use first API config
    const slug = provider.slug;

    let result: any = [];

    if (slug === "pathao") {
      result = await handlePathao(config, action, cityId, zoneId);
    } else if (slug === "steadfast") {
      result = await handleSteadfast(config, action, cityId, zoneId);
    } else if (slug === "redx") {
      result = await handleRedx(config, action, cityId, zoneId);
    } else if (slug === "ecourier") {
      result = await handleEcourier(config, action, cityId, zoneId);
    } else {
      return new Response(
        JSON.stringify({ error: `Unsupported courier: ${slug}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Courier locations error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ========== PATHAO ==========
async function getPathaoToken(config: any): Promise<string> {
  // If api_key looks like a bearer token, use it directly
  if (config.api_key && config.api_key.length > 50) {
    return config.api_key;
  }

  // Otherwise, issue token using client credentials
  const baseUrl = config.base_url || "https://api-hermes.pathao.com";
  const resp = await fetch(`${baseUrl}/aladdin/api/v1/issue-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: config.client_id || "",
      client_secret: config.secret_key || "",
      username: config.api_key || "",
      password: config.secret_key || "",
      grant_type: "password",
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Pathao auth failed [${resp.status}]: ${errText}`);
  }

  const data = await resp.json();
  return data.token || data.access_token || "";
}

async function handlePathao(config: any, action: string, cityId: string | null, zoneId: string | null) {
  const baseUrl = config.base_url || "https://api-hermes.pathao.com";
  const token = await getPathaoToken(config);

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  let endpoint = "";
  if (action === "cities") {
    endpoint = `${baseUrl}/aladdin/api/v1/countries/1/city-list`;
  } else if (action === "zones" && cityId) {
    endpoint = `${baseUrl}/aladdin/api/v1/cities/${cityId}/zone-list`;
  } else if (action === "areas" && zoneId) {
    endpoint = `${baseUrl}/aladdin/api/v1/zones/${zoneId}/area-list`;
  } else {
    throw new Error(`Invalid action: ${action}`);
  }

  const resp = await fetch(endpoint, { headers });
  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Pathao API failed [${resp.status}]: ${errText}`);
  }

  const data = await resp.json();
  // Pathao returns { data: { data: [...] } } or { data: [...] }
  const items = data?.data?.data || data?.data || [];

  return items.map((item: any) => ({
    id: item.city_id || item.zone_id || item.area_id || item.id,
    name: item.city_name || item.zone_name || item.area_name || item.name,
  }));
}

// ========== STEADFAST ==========
async function handleSteadfast(_config: any, action: string, _cityId: string | null, _zoneId: string | null) {
  // Steadfast doesn't have city/zone/area API - they take free-text address
  // Return empty to signal no structured locations
  if (action === "cities" || action === "zones" || action === "areas") {
    return [];
  }
  return [];
}

// ========== REDX ==========
async function handleRedx(config: any, action: string, _cityId: string | null, _zoneId: string | null) {
  const baseUrl = config.base_url || "https://openapi.redx.com.bd/v1.0.0-beta";
  const headers = {
    "API-ACCESS-TOKEN": `Bearer ${config.api_key}`,
    "Content-Type": "application/json",
  };

  if (action === "cities") {
    // RedX uses areas endpoint
    const resp = await fetch(`${baseUrl}/pickup/areas`, { headers });
    if (!resp.ok) return [];
    const data = await resp.json();
    const areas = data?.areas || [];
    // Extract unique districts as "cities"
    const districtMap: Record<string, any> = {};
    areas.forEach((a: any) => {
      if (a.district_name && !districtMap[a.district_name]) {
        districtMap[a.district_name] = { id: a.district_id || a.district_name, name: a.district_name };
      }
    });
    return Object.values(districtMap);
  }

  return [];
}

// ========== eCourier ==========
async function handleEcourier(config: any, action: string, cityId: string | null, _zoneId: string | null) {
  const baseUrl = config.base_url || "https://backoffice.ecourier.com.bd/api";
  const headers = {
    "API-KEY": config.api_key || "",
    "API-SECRET": config.secret_key || "",
    "USER-ID": config.client_id || "",
    "Content-Type": "application/json",
  };

  if (action === "cities") {
    const resp = await fetch(`${baseUrl}/city-list`, {
      method: "POST",
      headers,
    });
    if (!resp.ok) return [];
    const data = await resp.json();
    return (data || []).map((c: any) => ({ id: c.name, name: c.name }));
  }

  if (action === "zones" && cityId) {
    const resp = await fetch(`${baseUrl}/thana-list`, {
      method: "POST",
      headers,
      body: JSON.stringify({ city: cityId }),
    });
    if (!resp.ok) return [];
    const data = await resp.json();
    return (data || []).map((t: any) => ({ id: t.name, name: t.name }));
  }

  if (action === "areas" && cityId) {
    const resp = await fetch(`${baseUrl}/area-list`, {
      method: "POST",
      headers,
      body: JSON.stringify({ postcode: cityId }),
    });
    if (!resp.ok) return [];
    const data = await resp.json();
    return (data || []).map((a: any) => ({ id: a.name, name: a.name }));
  }

  return [];
}
