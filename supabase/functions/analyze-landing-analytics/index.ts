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
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabaseUser.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError) throw roleError;

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const {
      summaries = [],
      funnelData = [],
      cohortData = null,
      utmData = { sources: [] },
    } = await req.json();

    const topSummaries = Array.isArray(summaries) ? summaries.slice(0, 15) : [];
    const topFunnel = Array.isArray(funnelData) ? funnelData.slice(0, 10) : [];
    const topSources = Array.isArray(utmData?.sources) ? utmData.sources.slice(0, 10) : [];

    const systemPrompt = `আপনি একজন CRO (Conversion Rate Optimization) এবং ল্যান্ডিং পেজ অ্যানালিটিক্স বিশেষজ্ঞ।
শুধু ইউজার যে analytics data দিয়েছে সেটার উপর ভিত্তি করে বাংলা ভাষায় analysis দিন।
Facebook Ads, campaign spend, ROAS বা ad account analysis নিয়ে কথা বলবেন না যদি data-তে না থাকে।
খুব স্পষ্ট, data-driven এবং action-oriented insight দিন।
অপ্রয়োজনীয় ভূমিকা বা generic text লিখবেন না।`;

    const userPrompt = `নিচের landing page analytics data বিশ্লেষণ করুন:

পেজ সামারি:
${topSummaries.length > 0
  ? topSummaries
      .map(
        (summary: any) =>
          `- ${summary.title}: ${summary.views} ভিউ, ${summary.clicks} ক্লিক, ${summary.orderClicks} অর্ডার-ক্লিক, ${summary.conversions} কনভার্সন, CTR ${Number(summary.ctr || 0).toFixed(1)}%, কনভ. রেট ${Number(summary.conversionRate || 0).toFixed(1)}%, বাউন্স ${Number(summary.bounceRate || 0).toFixed(0)}%, গড় সময় ${Number(summary.avgTimeOnPage || 0).toFixed(0)}s`
      )
      .join("\n")
  : "ডেটা নেই"}

ফানেল:
${topFunnel.length > 0
  ? topFunnel.map((step: any) => `- ${step.label}: ${step.count}`).join("\n")
  : "ডেটা নেই"}

কোহর্ট / রিটেনশন:
${cohortData
  ? `- মোট ভিজিটর: ${cohortData.totalVisitors || 0}\n- নতুন: ${cohortData.newVisitors || 0}\n- রিটার্নিং: ${cohortData.returningVisitors || 0}\n- রিটেনশন রেট: ${Number(cohortData.retentionRate || 0).toFixed(1)}%`
  : "ডেটা নেই"}

UTM সোর্স:
${topSources.length > 0
  ? topSources
      .map(
        (source: any) =>
          `- ${source.name}: ${source.views} ভিউ, ${source.conversions} কনভার্সন, রেট ${Number(source.rate || 0).toFixed(1)}%`
      )
      .join("\n")
  : "ডেটা নেই"}

এই exact format-এ উত্তর দিন:
1. সমস্যা চিহ্নিতকরণ
2. কোথায় ভিজিটর হারাচ্ছে
3. সবচেয়ে দ্রুত ৫টি করণীয়
4. ৩টি A/B test idea
5. ১ লাইনের executive summary`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: true,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("analyze-landing-analytics AI gateway error:", aiResponse.status, errorText);
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(aiResponse.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("analyze-landing-analytics error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
