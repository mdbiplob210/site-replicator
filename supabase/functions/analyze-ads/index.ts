import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    // Verify admin
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages, adAccountId } = await req.json();

    // Fetch ad data for context
    let campaignQuery = supabaseAdmin
      .from("meta_campaigns")
      .select("*")
      .order("spend", { ascending: false })
      .limit(50);
    
    if (adAccountId && adAccountId !== "all") {
      campaignQuery = campaignQuery.eq("ad_account_id", adAccountId);
    }

    const { data: campaigns } = await campaignQuery;

    let adsetQuery = supabaseAdmin
      .from("meta_adsets")
      .select("*")
      .order("spend", { ascending: false })
      .limit(50);
    
    if (adAccountId && adAccountId !== "all") {
      adsetQuery = adsetQuery.eq("ad_account_id", adAccountId);
    }

    const { data: adsets } = await adsetQuery;

    // Fetch recent ad spends
    const { data: spends } = await supabaseAdmin
      .from("ad_spends")
      .select("*")
      .order("spend_date", { ascending: false })
      .limit(30);

    // Fetch order stats
    const { data: orders } = await supabaseAdmin
      .from("orders")
      .select("status, total_amount, created_at")
      .order("created_at", { ascending: false })
      .limit(200);

    const totalOrders = orders?.length || 0;
    const deliveredOrders = orders?.filter((o: any) => o.status === "delivered").length || 0;
    const cancelledOrders = orders?.filter((o: any) => o.status === "cancelled").length || 0;
    const totalRevenue = orders?.reduce((s: number, o: any) => s + (Number(o.total_amount) || 0), 0) || 0;

    const adDataContext = `
## বর্তমান Ad Data Summary:

### ক্যাম্পেইন ডাটা (${campaigns?.length || 0}টি):
${campaigns?.map((c: any) => `- ${c.name}: Spend $${c.spend}, Clicks ${c.clicks}, CTR ${c.ctr}%, Purchases ${c.purchases}, ROAS ${c.roas}, Status: ${c.status}`).join("\n") || "কোনো ক্যাম্পেইন ডাটা নেই"}

### Ad Set ডাটা (${adsets?.length || 0}টি):
${adsets?.slice(0, 20).map((a: any) => `- ${a.name}: Spend $${a.spend}, Clicks ${a.clicks}, CTR ${a.ctr}%, Purchases ${a.purchases}, ROAS ${a.roas}`).join("\n") || "কোনো Ad Set ডাটা নেই"}

### সাম্প্রতিক Ad Spend (${spends?.length || 0} দিন):
${spends?.slice(0, 10).map((s: any) => `- ${s.spend_date}: $${s.amount_usd} (৳${s.amount_bdt})`).join("\n") || "কোনো spend ডাটা নেই"}
Total Ad Spend: $${spends?.reduce((s: number, e: any) => s + Number(e.amount_usd), 0).toFixed(2) || 0}

### অর্ডার পরিসংখ্যান:
- মোট অর্ডার: ${totalOrders}
- ডেলিভার্ড: ${deliveredOrders}
- ক্যানসেল্ড: ${cancelledOrders}
- মোট রেভিনিউ: ৳${totalRevenue.toFixed(0)}
- ডেলিভারি রেট: ${totalOrders > 0 ? ((deliveredOrders / totalOrders) * 100).toFixed(1) : 0}%
`;

    const systemPrompt = `আপনি একজন Facebook Ads বিশেষজ্ঞ AI এজেন্ট। আপনার কাজ হলো ইউজারের Facebook Ad Account এর ডাটা বিশ্লেষণ করে:

1. পারফরম্যান্স রিপোর্ট দেওয়া
2. কোন ক্যাম্পেইন ভালো করছে, কোনটা খারাপ সেটা বলা
3. কী করলে ROAS বাড়বে সেটার পরামর্শ দেওয়া
4. বাজেট কিভাবে অপটিমাইজ করা যায় বলা
5. CTR, CPC, CPP উন্নতির উপায় বলা

সবসময় বাংলায় উত্তর দিন। ডাটা-ড্রিভেন ও অ্যাকশনেবল পরামর্শ দিন। সংখ্যা ও পরিসংখ্যান সহ বিশ্লেষণ করুন।

${adDataContext}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. কিছুক্ষণ পর আবার চেষ্টা করুন।" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI ক্রেডিট শেষ। Settings → Workspace → Usage থেকে ক্রেডিট যোগ করুন।" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(aiResponse.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("analyze-ads error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
