import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FB_GRAPH_URL = "https://graph.facebook.com/v21.0";

async function getSettingValue(supabaseAdmin: any, key: string, envFallback?: string): Promise<string> {
  try {
    const { data } = await supabaseAdmin
      .from("site_settings")
      .select("value")
      .eq("key", key)
      .maybeSingle();
    if (data?.value) return data.value;
  } catch (_) {}
  return envFallback || "";
}

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
      const FB_APP_ID = await getSettingValue(supabaseAdmin, "fb_app_id", Deno.env.get("FB_APP_ID"));
      const FB_APP_SECRET = await getSettingValue(supabaseAdmin, "fb_app_secret", Deno.env.get("FB_APP_SECRET"));
      const shortToken = body.short_lived_token || await getSettingValue(supabaseAdmin, "fb_access_token", Deno.env.get("FB_ACCESS_TOKEN"));
      if (!FB_APP_ID || !FB_APP_SECRET) {
        return new Response(JSON.stringify({ error: "FB_APP_ID or FB_APP_SECRET not configured. Website Settings → Tracking ট্যাবে সেট করুন।" }), {
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
      try {
        const { data: existing } = await supabaseAdmin.from("site_settings").select("id").eq("key", "fb_access_token").maybeSingle();
        if (existing) {
          await supabaseAdmin.from("site_settings").update({ value: exData.access_token, updated_at: new Date().toISOString() }).eq("key", "fb_access_token");
        } else {
          await supabaseAdmin.from("site_settings").insert({ key: "fb_access_token", value: exData.access_token, is_public: false });
        }
      } catch (e) { console.error("Failed to save exchanged token:", e); }

      return new Response(JSON.stringify({
        success: true,
        access_token: exData.access_token,
        token_type: exData.token_type,
        expires_in: exData.expires_in,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ─── LIST AD ACCOUNTS from Business Manager ───
    if (action === "list_accounts") {
      const FB_ACCESS_TOKEN = await getSettingValue(supabaseAdmin, "fb_access_token", Deno.env.get("FB_ACCESS_TOKEN"));
      if (!FB_ACCESS_TOKEN) {
        return new Response(JSON.stringify({ error: "Facebook Access Token not configured." }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // First get all businesses the token has access to
      const meUrl = `${FB_GRAPH_URL}/me/businesses?fields=id,name&access_token=${FB_ACCESS_TOKEN}&limit=100`;
      const meRes = await fetch(meUrl);
      const meData = await meRes.json();

      const accounts: any[] = [];

      if (meData.data && meData.data.length > 0) {
        // For each business, get ad accounts
        for (const biz of meData.data) {
          const acUrl = `${FB_GRAPH_URL}/${biz.id}/owned_ad_accounts?fields=id,name,account_id,account_status,currency,timezone_name,business_name&access_token=${FB_ACCESS_TOKEN}&limit=100`;
          const acRes = await fetch(acUrl);
          const acData = await acRes.json();
          if (acData.data) {
            for (const ac of acData.data) {
              accounts.push({
                id: ac.account_id || ac.id.replace("act_", ""),
                act_id: ac.id.startsWith("act_") ? ac.id : `act_${ac.id}`,
                name: ac.name || "Unnamed",
                business_id: biz.id,
                business_name: biz.name || ac.business_name || "",
                currency: ac.currency || "USD",
                timezone: ac.timezone_name || "",
                status: ac.account_status,
              });
            }
          }
        }
      }

      // Fallback: also try /me/adaccounts for personal accounts
      if (accounts.length === 0) {
        const personalUrl = `${FB_GRAPH_URL}/me/adaccounts?fields=id,name,account_id,account_status,currency,timezone_name&access_token=${FB_ACCESS_TOKEN}&limit=100`;
        const personalRes = await fetch(personalUrl);
        const personalData = await personalRes.json();
        if (personalData.data) {
          for (const ac of personalData.data) {
            accounts.push({
              id: ac.account_id || ac.id.replace("act_", ""),
              act_id: ac.id.startsWith("act_") ? ac.id : `act_${ac.id}`,
              name: ac.name || "Unnamed",
              business_id: "",
              business_name: "Personal",
              currency: ac.currency || "USD",
              timezone: ac.timezone_name || "",
              status: ac.account_status,
            });
          }
        }
        if (personalData.error) {
          return new Response(JSON.stringify({ error: `FB API Error: ${personalData.error.message}` }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      return new Response(JSON.stringify({ success: true, accounts }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── SYNC action: fetch from FB API and save to DB ───
    if (action === "sync") {
      const FB_ACCESS_TOKEN = await getSettingValue(supabaseAdmin, "fb_access_token", Deno.env.get("FB_ACCESS_TOKEN"));
      
      // Support single account or multiple accounts
      const requestedAccountId = body.ad_account_id || await getSettingValue(supabaseAdmin, "fb_ad_account_id", Deno.env.get("FB_AD_ACCOUNT_ID"));
      const accountIds: string[] = body.ad_account_ids || (requestedAccountId ? [requestedAccountId] : []);

      if (!FB_ACCESS_TOKEN || accountIds.length === 0) {
        return new Response(JSON.stringify({ error: "Facebook credentials not configured. Access Token ও Ad Account ID সেট করুন।" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let timeParams = "";
      if (timeRange?.since && timeRange?.until) {
        timeParams = `&time_range={"since":"${timeRange.since}","until":"${timeRange.until}"}`;
      } else {
        timeParams = `&date_preset=${datePreset}`;
      }

      let grandTotalCampaigns = 0;
      let grandTotalAdsets = 0;
      let grandTotalAds = 0;
      const syncedAccounts: string[] = [];

      for (const rawAccountId of accountIds) {
        const adAccountId = rawAccountId.startsWith("act_") ? rawAccountId : `act_${rawAccountId}`;
        const accountIdClean = rawAccountId.replace("act_", "");

        try {
          // 1. Fetch campaigns
          const campaignsUrl = `${FB_GRAPH_URL}/${adAccountId}/campaigns?fields=id,name,status,objective,daily_budget,lifetime_budget&access_token=${FB_ACCESS_TOKEN}&limit=100`;
          const campaignsRes = await fetch(campaignsUrl);
          const campaignsData = await campaignsRes.json();
          if (campaignsData.error) {
            console.error(`Campaign fetch error for ${adAccountId}:`, campaignsData.error);
            continue;
          }

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
              ad_account_id: accountIdClean,
            };
          });

          if (campaignRows.length > 0) {
            const { error: cErr } = await supabaseAdmin.from("meta_campaigns").upsert(campaignRows, { onConflict: "id" });
            if (cErr) console.error("Campaign upsert error:", cErr);
            grandTotalCampaigns += campaignRows.length;
          }

          // 2. For each campaign, fetch ad sets
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
                ad_account_id: accountIdClean,
              };
            });

            if (adsetRows.length > 0) {
              const { error: asErr } = await supabaseAdmin.from("meta_adsets").upsert(adsetRows, { onConflict: "id" });
              if (asErr) console.error("Adset upsert error:", asErr);
              grandTotalAdsets += adsetRows.length;
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
                  ad_account_id: accountIdClean,
                };
              });

              if (adRows.length > 0) {
                const { error: adErr } = await supabaseAdmin.from("meta_ads").upsert(adRows, { onConflict: "id" });
                if (adErr) console.error("Ad upsert error:", adErr);
                grandTotalAds += adRows.length;
              }
            }
          }

          syncedAccounts.push(accountIdClean);
        } catch (accErr) {
          console.error(`Error syncing account ${adAccountId}:`, accErr);
        }
      }

      return new Response(JSON.stringify({
        success: true,
        synced: { campaigns: grandTotalCampaigns, adsets: grandTotalAdsets, ads: grandTotalAds },
        synced_accounts: syncedAccounts,
        date_preset: datePreset,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Invalid action. Use 'sync', 'list_accounts', or 'exchange_token'." }), {
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