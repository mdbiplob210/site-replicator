import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FB_GRAPH_URL = "https://graph.facebook.com/v21.0";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const cronSecret = Deno.env.get("CRON_SECRET") || "";
    const isCronCall = cronSecret && token === cronSecret;

    if (!isCronCall) {
      const { data, error: claimsError } = await supabase.auth.getClaims(token);
      if (claimsError || !data?.claims) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Verify admin role
      const userId = data.claims.sub as string;
      const { data: roleData } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();

      if (!roleData) {
        return new Response(JSON.stringify({ error: "Admin access required" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action || "campaigns";
    const datePreset = body.date_preset || "today";
    const timeRange = body.time_range;

    // ─── EXCHANGE TOKEN action: short-lived → long-lived ───
    if (action === "exchange_token") {
      const FB_APP_ID = Deno.env.get("FB_APP_ID");
      const FB_APP_SECRET = Deno.env.get("FB_APP_SECRET");
      const shortToken = body.short_lived_token || Deno.env.get("FB_ACCESS_TOKEN");
      if (!FB_APP_ID || !FB_APP_SECRET) {
        return new Response(JSON.stringify({ error: "FB_APP_ID or FB_APP_SECRET not configured" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const exchangeUrl = `${FB_GRAPH_URL}/oauth/access_token?grant_type=fb_exchange_token&client_id=${FB_APP_ID}&client_secret=${FB_APP_SECRET}&fb_exchange_token=${shortToken}`;
      const exRes = await fetch(exchangeUrl);
      const exData = await exRes.json();
      if (exData.error) {
        return new Response(JSON.stringify({ error: `Token exchange failed: ${exData.error.message}` }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({
        success: true,
        access_token: exData.access_token,
        token_type: exData.token_type,
        expires_in: exData.expires_in,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ─── SYNC action: fetch from FB API and save to DB ───
    if (action === "sync") {
      const FB_ACCESS_TOKEN = Deno.env.get("FB_ACCESS_TOKEN");
      const FB_AD_ACCOUNT_ID = Deno.env.get("FB_AD_ACCOUNT_ID");
      if (!FB_ACCESS_TOKEN || !FB_AD_ACCOUNT_ID) {
        return new Response(JSON.stringify({ error: "Facebook credentials not configured" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const adAccountId = FB_AD_ACCOUNT_ID.startsWith("act_") ? FB_AD_ACCOUNT_ID : `act_${FB_AD_ACCOUNT_ID}`;
      let timeParams = "";
      if (timeRange?.since && timeRange?.until) {
        timeParams = `&time_range={"since":"${timeRange.since}","until":"${timeRange.until}"}`;
      } else {
        timeParams = `&date_preset=${datePreset}`;
      }

      // 1. Fetch campaigns
      const campaignsUrl = `${FB_GRAPH_URL}/${adAccountId}/campaigns?fields=id,name,status,objective,daily_budget,lifetime_budget&access_token=${FB_ACCESS_TOKEN}&limit=100`;
      const campaignsRes = await fetch(campaignsUrl);
      const campaignsData = await campaignsRes.json();
      if (campaignsData.error) throw new Error(`FB API: ${campaignsData.error.message}`);

      // Campaign insights
      const cInsightsUrl = `${FB_GRAPH_URL}/${adAccountId}/insights?fields=campaign_id,campaign_name,spend,impressions,clicks,ctr,cpc,actions,action_values,cost_per_action_type&level=campaign${timeParams}&access_token=${FB_ACCESS_TOKEN}&limit=500`;
      const cInsightsRes = await fetch(cInsightsUrl);
      const cInsightsData = await cInsightsRes.json();
      const cInsightsMap = new Map();
      if (cInsightsData.data) {
        for (const i of cInsightsData.data) cInsightsMap.set(i.campaign_id, i);
      }

      const campaignRows = (campaignsData.data || []).map((c: any) => {
        const ins = cInsightsMap.get(c.id) || {};
        const purchases = ins.actions?.find((a: any) => a.action_type === "purchase")?.value || 0;
        const purchaseValue = ins.action_values?.find((a: any) => a.action_type === "purchase")?.value || 0;
        const costPerPurchase = ins.cost_per_action_type?.find((a: any) => a.action_type === "purchase")?.value || 0;
        const spend = parseFloat(ins.spend || "0");
        const roas = spend > 0 ? parseFloat(purchaseValue) / spend : 0;
        return {
          id: c.id, name: c.name, status: c.status, objective: c.objective || null,
          daily_budget: c.daily_budget ? parseFloat(c.daily_budget) / 100 : null,
          lifetime_budget: c.lifetime_budget ? parseFloat(c.lifetime_budget) / 100 : null,
          spend, impressions: parseInt(ins.impressions || "0"), clicks: parseInt(ins.clicks || "0"),
          ctr: parseFloat(ins.ctr || "0"), purchases: parseInt(purchases),
          purchase_value: parseFloat(purchaseValue), cost_per_purchase: parseFloat(costPerPurchase),
          roas: parseFloat(roas.toFixed(2)), date_preset: datePreset, synced_at: new Date().toISOString(),
        };
      });

      // Upsert campaigns
      if (campaignRows.length > 0) {
        const { error: cErr } = await supabaseAdmin.from("meta_campaigns").upsert(campaignRows, { onConflict: "id" });
        if (cErr) console.error("Campaign upsert error:", cErr);
      }

      // 2. For each campaign, fetch ad sets
      let totalAdsets = 0;
      let totalAds = 0;
      for (const camp of campaignRows) {
        const adsetsUrl = `${FB_GRAPH_URL}/${camp.id}/adsets?fields=id,name,status,targeting,daily_budget,lifetime_budget&access_token=${FB_ACCESS_TOKEN}&limit=100`;
        const adsetsRes = await fetch(adsetsUrl);
        const adsetsData = await adsetsRes.json();
        if (adsetsData.error) { console.error(`Adset fetch error for ${camp.id}:`, adsetsData.error); continue; }

        const asInsightsUrl = `${FB_GRAPH_URL}/${camp.id}/insights?fields=adset_id,spend,impressions,clicks,ctr,actions,action_values,cost_per_action_type&level=adset${timeParams}&access_token=${FB_ACCESS_TOKEN}&limit=500`;
        const asInsightsRes = await fetch(asInsightsUrl);
        const asInsightsData = await asInsightsRes.json();
        const asMap = new Map();
        if (asInsightsData.data) { for (const i of asInsightsData.data) asMap.set(i.adset_id, i); }

        const adsetRows = (adsetsData.data || []).map((a: any) => {
          const ins = asMap.get(a.id) || {};
          const purchases = ins.actions?.find((x: any) => x.action_type === "purchase")?.value || 0;
          const purchaseValue = ins.action_values?.find((x: any) => x.action_type === "purchase")?.value || 0;
          const costPerPurchase = ins.cost_per_action_type?.find((x: any) => x.action_type === "purchase")?.value || 0;
          const spend = parseFloat(ins.spend || "0");
          const roas = spend > 0 ? parseFloat(purchaseValue) / spend : 0;
          const targeting = a.targeting || {};
          const audience = `${targeting.age_min || ""}-${targeting.age_max || ""} · ${targeting.geo_locations?.countries?.join(", ") || ""}`;
          return {
            id: a.id, campaign_id: camp.id, name: a.name, status: a.status, audience,
            spend, clicks: parseInt(ins.clicks || "0"), ctr: parseFloat(ins.ctr || "0"),
            purchases: parseInt(purchases), cost_per_purchase: parseFloat(costPerPurchase),
            roas: parseFloat(roas.toFixed(2)), date_preset: datePreset, synced_at: new Date().toISOString(),
          };
        });

        if (adsetRows.length > 0) {
          const { error: asErr } = await supabaseAdmin.from("meta_adsets").upsert(adsetRows, { onConflict: "id" });
          if (asErr) console.error("Adset upsert error:", asErr);
          totalAdsets += adsetRows.length;
        }

        // 3. For each ad set, fetch ads
        for (const adset of adsetRows) {
          const adsUrl = `${FB_GRAPH_URL}/${adset.id}/ads?fields=id,name,status&access_token=${FB_ACCESS_TOKEN}&limit=100`;
          const adsRes = await fetch(adsUrl);
          const adsData = await adsRes.json();
          if (adsData.error) { console.error(`Ad fetch error for ${adset.id}:`, adsData.error); continue; }

          const adInsUrl = `${FB_GRAPH_URL}/${adset.id}/insights?fields=ad_id,spend,clicks,ctr,actions,action_values,cost_per_action_type&level=ad${timeParams}&access_token=${FB_ACCESS_TOKEN}&limit=500`;
          const adInsRes = await fetch(adInsUrl);
          const adInsData = await adInsRes.json();
          const adMap = new Map();
          if (adInsData.data) { for (const i of adInsData.data) adMap.set(i.ad_id, i); }

          const adRows = (adsData.data || []).map((ad: any) => {
            const ins = adMap.get(ad.id) || {};
            const purchases = ins.actions?.find((x: any) => x.action_type === "purchase")?.value || 0;
            const purchaseValue = ins.action_values?.find((x: any) => x.action_type === "purchase")?.value || 0;
            const costPerResult = ins.cost_per_action_type?.find((x: any) => x.action_type === "purchase")?.value || 0;
            const spend = parseFloat(ins.spend || "0");
            const roas = spend > 0 ? parseFloat(purchaseValue) / spend : 0;
            return {
              id: ad.id, adset_id: adset.id, name: ad.name, status: ad.status,
              spend, clicks: parseInt(ins.clicks || "0"), ctr: parseFloat(ins.ctr || "0"),
              purchases: parseInt(purchases), cost_per_result: parseFloat(costPerResult),
              roas: parseFloat(roas.toFixed(2)), date_preset: datePreset, synced_at: new Date().toISOString(),
            };
          });

          if (adRows.length > 0) {
            const { error: adErr } = await supabaseAdmin.from("meta_ads").upsert(adRows, { onConflict: "id" });
            if (adErr) console.error("Ad upsert error:", adErr);
            totalAds += adRows.length;
          }
        }
      }

      return new Response(JSON.stringify({
        success: true,
        synced: { campaigns: campaignRows.length, adsets: totalAdsets, ads: totalAds },
        date_preset: datePreset,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Invalid action. Use 'sync'." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Edge function error:", err);
    return new Response(JSON.stringify({ error: "An internal error occurred. Please try again later." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
