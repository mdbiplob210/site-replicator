import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PATHAO_LOCATION_CACHE_TTL_MS = 15 * 60 * 1000;

let pathaoTokenCache: { key: string; token: string; expiresAt: number } | null = null;
const pathaoLocationCache = new Map<string, { data: Array<{ id: string | number; name: string }>; expiresAt: number }>();

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const JSON_HEADERS = { ...corsHeaders, "Content-Type": "application/json" };

  // Auth check - use getUser instead of getClaims
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: JSON_HEADERS,
    });
  }
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await authClient.auth.getUser();
  if (userErr || !userData?.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: JSON_HEADERS,
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
        { status: 400, headers: JSON_HEADERS }
      );
    }

    // Get provider config from DB
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: provider, error: provError } = await supabase
      .from("courier_providers")
      .select("*")
      .eq("id", providerId)
      .single();

    if (provError || !provider) {
      return new Response(
        JSON.stringify({ error: "Provider not found" }),
        { status: 404, headers: JSON_HEADERS }
      );
    }

    const configs = Array.isArray(provider.api_configs)
      ? provider.api_configs
      : JSON.parse(provider.api_configs || "[]");

    if (configs.length === 0) {
      return new Response(
        JSON.stringify({ error: "No API config found for this provider" }),
        { status: 400, headers: JSON_HEADERS }
      );
    }

    const config = configs[0]; // Use first API config
    const slug = provider.slug;

    console.log(`[courier-locations] slug=${slug}, action=${action}, cityId=${cityId}, zoneId=${zoneId}`);

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
        { status: 400, headers: JSON_HEADERS }
      );
    }

    console.log(`[courier-locations] ${slug}/${action} returned ${result.length} items`);

    return new Response(JSON.stringify({ data: result }), {
      headers: JSON_HEADERS,
    });
  } catch (err: any) {
    console.error("Courier locations error:", err.message || err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: JSON_HEADERS }
    );
  }
});

// ========== PATHAO ==========
const getPathaoConfigCacheKey = (config: any) =>
  JSON.stringify([
    config.base_url || "https://api-hermes.pathao.com",
    config.client_id || "",
    config.email || config.api_key || "",
    config.secret_key || "",
    config.password || "",
  ]);

async function getPathaoToken(config: any): Promise<string> {
  // If api_key looks like a bearer token (long string), use it directly
  if (config.api_key && config.api_key.length > 50) {
    return config.api_key;
  }

  const cacheKey = getPathaoConfigCacheKey(config);
  if (pathaoTokenCache && pathaoTokenCache.key === cacheKey && Date.now() < pathaoTokenCache.expiresAt) {
    console.log("[pathao-token] Using cached token");
    return pathaoTokenCache.token;
  }

  // Otherwise, issue token using client credentials
  const baseUrl = config.base_url || "https://api-hermes.pathao.com";

  // Pathao requires: client_id, client_secret, username (email), password, grant_type
  const tokenPayload = {
    client_id: config.client_id || "",
    client_secret: config.secret_key || "",
    username: config.email || config.api_key || "",
    password: config.password || config.secret_key || "",
    grant_type: "password",
  };

  console.log(`[pathao-token] Requesting token from ${baseUrl}, client_id=${tokenPayload.client_id}, username=${tokenPayload.username}`);

  const resp = await fetch(`${baseUrl}/aladdin/api/v1/issue-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(tokenPayload),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    console.error(`[pathao-token] Auth failed [${resp.status}]: ${errText}`);
    throw new Error(`Pathao auth failed [${resp.status}]: ${errText}`);
  }

  const data = await resp.json();
  const token = data.token || data.access_token || "";
  const expiresInSeconds = Number(data.expires_in || 3600);
  pathaoTokenCache = {
    key: cacheKey,
    token,
    expiresAt: Date.now() + Math.max(expiresInSeconds - 60, 60) * 1000,
  };
  console.log(`[pathao-token] Token obtained, length=${token.length}`);
  return token;
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

  const cacheKey = `${getPathaoConfigCacheKey(config)}:${endpoint}`;
  const cachedLocations = pathaoLocationCache.get(cacheKey);
  if (cachedLocations && Date.now() < cachedLocations.expiresAt) {
    console.log(`[pathao] Cache hit for ${endpoint}`);
    return cachedLocations.data;
  }

  console.log(`[pathao] Fetching ${endpoint}`);
  const resp = await fetch(endpoint, { headers });
  if (!resp.ok) {
    const errText = await resp.text();
    console.error(`[pathao] API failed [${resp.status}]: ${errText}`);
    throw new Error(`Pathao API failed [${resp.status}]: ${errText}`);
  }

  const data = await resp.json();
  // Pathao returns { data: { data: [...] } } or { data: [...] }
  const items = data?.data?.data || data?.data || [];

  const mappedItems = items.map((item: any) => ({
    id: item.city_id || item.zone_id || item.area_id || item.id,
    name: item.city_name || item.zone_name || item.area_name || item.name,
  }));

  pathaoLocationCache.set(cacheKey, {
    data: mappedItems,
    expiresAt: Date.now() + PATHAO_LOCATION_CACHE_TTL_MS,
  });

  return mappedItems;
}

// ========== STEADFAST ==========
async function handleSteadfast(_config: any, action: string, _cityId: string | null, _zoneId: string | null) {
  // Steadfast doesn't have city/zone/area API - they take free-text address
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
    const resp = await fetch(`${baseUrl}/pickup/areas`, { headers });
    if (!resp.ok) return [];
    const data = await resp.json();
    const areas = data?.areas || [];
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
    const resp = await fetch(`${baseUrl}/city-list`, { method: "POST", headers });
    if (!resp.ok) return [];
    const data = await resp.json();
    return (data || []).map((c: any) => ({ id: c.name, name: c.name }));
  }

  if (action === "zones" && cityId) {
    const resp = await fetch(`${baseUrl}/thana-list`, {
      method: "POST", headers,
      body: JSON.stringify({ city: cityId }),
    });
    if (!resp.ok) return [];
    const data = await resp.json();
    return (data || []).map((t: any) => ({ id: t.name, name: t.name }));
  }

  if (action === "areas" && cityId) {
    const resp = await fetch(`${baseUrl}/area-list`, {
      method: "POST", headers,
      body: JSON.stringify({ postcode: cityId }),
    });
    if (!resp.ok) return [];
    const data = await resp.json();
    return (data || []).map((a: any) => ({ id: a.name, name: a.name }));
  }

  return [];
}
