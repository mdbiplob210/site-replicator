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
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const FB_ACCESS_TOKEN = Deno.env.get("FB_ACCESS_TOKEN");
    const FB_AD_ACCOUNT_ID = Deno.env.get("FB_AD_ACCOUNT_ID");

    if (!FB_ACCESS_TOKEN || !FB_AD_ACCOUNT_ID) {
      return new Response(
        JSON.stringify({ error: "Facebook credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body = await req.json().catch(() => ({}));
    const action = body.action || "campaigns";
    const datePreset = body.date_preset || "today";
    const timeRange = body.time_range; // { since: "YYYY-MM-DD", until: "YYYY-MM-DD" }

    const adAccountId = FB_AD_ACCOUNT_ID.startsWith("act_")
      ? FB_AD_ACCOUNT_ID
      : `act_${FB_AD_ACCOUNT_ID}`;

    // Build time params
    let timeParams = "";
    if (timeRange?.since && timeRange?.until) {
      timeParams = `&time_range={"since":"${timeRange.since}","until":"${timeRange.until}"}`;
    } else {
      timeParams = `&date_preset=${datePreset}`;
    }

    if (action === "campaigns") {
      // Fetch campaigns with insights
      const campaignsUrl = `${FB_GRAPH_URL}/${adAccountId}/campaigns?fields=id,name,status,objective,daily_budget,lifetime_budget&access_token=${FB_ACCESS_TOKEN}&limit=100`;
      const campaignsRes = await fetch(campaignsUrl);
      const campaignsData = await campaignsRes.json();

      if (campaignsData.error) {
        throw new Error(`FB API Error: ${campaignsData.error.message}`);
      }

      // Fetch insights for the account
      const insightsUrl = `${FB_GRAPH_URL}/${adAccountId}/insights?fields=campaign_id,campaign_name,spend,impressions,clicks,ctr,cpc,actions,action_values,cost_per_action_type&level=campaign${timeParams}&access_token=${FB_ACCESS_TOKEN}&limit=500`;
      const insightsRes = await fetch(insightsUrl);
      const insightsData = await insightsRes.json();

      // Merge insights into campaigns
      const insightsMap = new Map();
      if (insightsData.data) {
        for (const insight of insightsData.data) {
          insightsMap.set(insight.campaign_id, insight);
        }
      }

      const campaigns = (campaignsData.data || []).map((c: any) => {
        const insight = insightsMap.get(c.id) || {};
        const purchases = insight.actions?.find((a: any) => a.action_type === "purchase")?.value || 0;
        const purchaseValue = insight.action_values?.find((a: any) => a.action_type === "purchase")?.value || 0;
        const costPerPurchase = insight.cost_per_action_type?.find((a: any) => a.action_type === "purchase")?.value || 0;
        const spend = parseFloat(insight.spend || "0");
        const roas = spend > 0 ? parseFloat(purchaseValue) / spend : 0;

        return {
          id: c.id,
          name: c.name,
          status: c.status,
          objective: c.objective,
          spend: spend,
          impressions: parseInt(insight.impressions || "0"),
          clicks: parseInt(insight.clicks || "0"),
          ctr: parseFloat(insight.ctr || "0"),
          purchases: parseInt(purchases),
          purchase_value: parseFloat(purchaseValue),
          cost_per_purchase: parseFloat(costPerPurchase),
          roas: parseFloat(roas.toFixed(2)),
        };
      });

      return new Response(JSON.stringify({ campaigns, total: campaigns.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "adsets") {
      const campaignId = body.campaign_id;
      if (!campaignId) {
        return new Response(JSON.stringify({ error: "campaign_id required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const adsetsUrl = `${FB_GRAPH_URL}/${campaignId}/adsets?fields=id,name,status,targeting,daily_budget,lifetime_budget&access_token=${FB_ACCESS_TOKEN}&limit=100`;
      const adsetsRes = await fetch(adsetsUrl);
      const adsetsData = await adsetsRes.json();

      if (adsetsData.error) {
        throw new Error(`FB API Error: ${adsetsData.error.message}`);
      }

      // Insights at adset level
      const insightsUrl = `${FB_GRAPH_URL}/${campaignId}/insights?fields=adset_id,adset_name,spend,impressions,clicks,ctr,actions,action_values,cost_per_action_type&level=adset${timeParams}&access_token=${FB_ACCESS_TOKEN}&limit=500`;
      const insightsRes = await fetch(insightsUrl);
      const insightsData = await insightsRes.json();

      const insightsMap = new Map();
      if (insightsData.data) {
        for (const i of insightsData.data) insightsMap.set(i.adset_id, i);
      }

      const adsets = (adsetsData.data || []).map((a: any) => {
        const ins = insightsMap.get(a.id) || {};
        const purchases = ins.actions?.find((x: any) => x.action_type === "purchase")?.value || 0;
        const purchaseValue = ins.action_values?.find((x: any) => x.action_type === "purchase")?.value || 0;
        const costPerPurchase = ins.cost_per_action_type?.find((x: any) => x.action_type === "purchase")?.value || 0;
        const spend = parseFloat(ins.spend || "0");
        const roas = spend > 0 ? parseFloat(purchaseValue) / spend : 0;

        // Extract audience info from targeting
        const targeting = a.targeting || {};
        const ageMin = targeting.age_min || "";
        const ageMax = targeting.age_max || "";
        const geoNames = targeting.geo_locations?.countries?.join(", ") || "";
        const audience = `${ageMin}-${ageMax} · ${geoNames}`;

        return {
          id: a.id,
          name: a.name,
          status: a.status,
          audience,
          spend,
          clicks: parseInt(ins.clicks || "0"),
          ctr: parseFloat(ins.ctr || "0"),
          purchases: parseInt(purchases),
          cost_per_purchase: parseFloat(costPerPurchase),
          roas: parseFloat(roas.toFixed(2)),
        };
      });

      return new Response(JSON.stringify({ adsets }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "ads") {
      const adsetId = body.adset_id;
      if (!adsetId) {
        return new Response(JSON.stringify({ error: "adset_id required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const adsUrl = `${FB_GRAPH_URL}/${adsetId}/ads?fields=id,name,status,creative{title,body,thumbnail_url}&access_token=${FB_ACCESS_TOKEN}&limit=100`;
      const adsRes = await fetch(adsUrl);
      const adsData = await adsRes.json();

      if (adsData.error) {
        throw new Error(`FB API Error: ${adsData.error.message}`);
      }

      const insightsUrl = `${FB_GRAPH_URL}/${adsetId}/insights?fields=ad_id,ad_name,spend,impressions,clicks,ctr,actions,action_values,cost_per_action_type&level=ad${timeParams}&access_token=${FB_ACCESS_TOKEN}&limit=500`;
      const insightsRes = await fetch(insightsUrl);
      const insightsData = await insightsRes.json();

      const insightsMap = new Map();
      if (insightsData.data) {
        for (const i of insightsData.data) insightsMap.set(i.ad_id, i);
      }

      const ads = (adsData.data || []).map((a: any) => {
        const ins = insightsMap.get(a.id) || {};
        const purchases = ins.actions?.find((x: any) => x.action_type === "purchase")?.value || 0;
        const purchaseValue = ins.action_values?.find((x: any) => x.action_type === "purchase")?.value || 0;
        const costPerResult = ins.cost_per_action_type?.find((x: any) => x.action_type === "purchase")?.value || 0;
        const spend = parseFloat(ins.spend || "0");
        const roas = spend > 0 ? parseFloat(purchaseValue) / spend : 0;

        return {
          id: a.id,
          name: a.name,
          status: a.status,
          spend,
          clicks: parseInt(ins.clicks || "0"),
          ctr: parseFloat(ins.ctr || "0"),
          purchases: parseInt(purchases),
          cost_per_result: parseFloat(costPerResult),
          roas: parseFloat(roas.toFixed(2)),
        };
      });

      return new Response(JSON.stringify({ ads }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Account summary
    if (action === "summary") {
      const summaryUrl = `${FB_GRAPH_URL}/${adAccountId}/insights?fields=spend,impressions,clicks,ctr,actions,action_values&${timeParams.replace("&", "")}&access_token=${FB_ACCESS_TOKEN}`;
      const summaryRes = await fetch(summaryUrl);
      const summaryData = await summaryRes.json();

      const d = summaryData.data?.[0] || {};
      const purchases = d.actions?.find((a: any) => a.action_type === "purchase")?.value || 0;
      const purchaseValue = d.action_values?.find((a: any) => a.action_type === "purchase")?.value || 0;

      return new Response(
        JSON.stringify({
          spend: parseFloat(d.spend || "0"),
          impressions: parseInt(d.impressions || "0"),
          clicks: parseInt(d.clicks || "0"),
          ctr: parseFloat(d.ctr || "0"),
          purchases: parseInt(purchases),
          purchase_value: parseFloat(purchaseValue),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("FB API Error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
