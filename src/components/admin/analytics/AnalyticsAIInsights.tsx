import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Loader2, Sparkles, AlertTriangle, TrendingUp, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { PageAnalyticsSummary } from "@/hooks/useLandingPageAnalytics";

interface Props {
  summaries?: PageAnalyticsSummary[];
  funnelData?: { step: string; label: string; count: number }[];
  cohortData?: { totalVisitors: number; newVisitors: number; returningVisitors: number; retentionRate: number };
  utmData?: { sources: { name: string; views: number; conversions: number; rate: number }[] };
}

export function AnalyticsAIInsights({ summaries, funnelData, cohortData, utmData }: Props) {
  const [insights, setInsights] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const generateInsights = async () => {
    setLoading(true);
    try {
      const prompt = `তুমি একজন ডিজিটাল মার্কেটিং এক্সপার্ট। নিচের ল্যান্ডিং পেজ অ্যানালিটিক্স ডেটা বিশ্লেষণ করে বাংলায় ইনসাইট দাও:

পেজ সামারি:
${summaries?.map(s => `- ${s.title}: ${s.views} ভিউ, ${s.clicks} ক্লিক, ${s.conversions} কনভার্সন, CTR ${s.ctr.toFixed(1)}%, কনভ.রেট ${s.conversionRate.toFixed(1)}%, বাউন্স ${s.bounceRate.toFixed(0)}%, গড় সময় ${s.avgTimeOnPage}s`).join("\n") || "ডেটা নেই"}

ফানেল:
${funnelData?.map(f => `- ${f.label}: ${f.count}`).join("\n") || "ডেটা নেই"}

কোহর্ট: মোট ${cohortData?.totalVisitors || 0}, নতুন ${cohortData?.newVisitors || 0}, রিটার্নিং ${cohortData?.returningVisitors || 0}, রিটেনশন ${cohortData?.retentionRate.toFixed(0) || 0}%

UTM সোর্স:
${utmData?.sources?.slice(0, 5).map(s => `- ${s.name}: ${s.views} ভিউ, ${s.conversions} কনভ., ${s.rate.toFixed(1)}% রেট`).join("\n") || "ডেটা নেই"}

নিচের ফরম্যাটে উত্তর দাও:
1. **সমস্যা চিহ্নিতকরণ** — সবচেয়ে বড় ৩টি সমস্যা
2. **উন্নতির পরামর্শ** — প্রতিটি সমস্যার সমাধান
3. **A/B টেস্ট আইডিয়া** — ২-৩টি A/B টেস্ট সাজেশন
4. **কনভার্সন বাড়ানোর কৌশল** — অ্যাকশনেবল ৩-৫টি টিপস`;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-ads`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            messages: [{ role: "user", content: prompt }],
          }),
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "AI gateway error");
      }

      // Parse SSE stream
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");
      const decoder = new TextDecoder();
      let result = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              result += content;
              setInsights(result);
            }
          } catch { /* partial JSON, skip */ }
        }
      }

      if (!result) setInsights("ইনসাইট জেনারেট করা যায়নি।");
    } catch (err) {
      console.error("AI Error:", err);
      setInsights("AI ইনসাইট জেনারেট করতে সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Brain className="h-4 w-4 text-purple-500" /> AI ইনসাইট ও রিকমেন্ডেশন
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!insights && !loading ? (
          <div className="text-center py-10">
            <div className="h-16 w-16 rounded-2xl bg-purple-100 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-8 w-8 text-purple-500" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">AI দিয়ে আপনার ল্যান্ডিং পেজ বিশ্লেষণ করুন</h3>
            <p className="text-sm text-muted-foreground mb-4">
              AI আপনার সব ডেটা বিশ্লেষণ করে সমস্যা চিহ্নিত করবে এবং কনভার্সন বাড়ানোর পরামর্শ দিবে।
            </p>
            <Button onClick={generateInsights} className="gap-2">
              <Brain className="h-4 w-4" /> ইনসাইট জেনারেট করুন
            </Button>
          </div>
        ) : loading ? (
          <div className="text-center py-10">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-purple-500 mb-4" />
            <p className="text-sm text-muted-foreground">AI ডেটা বিশ্লেষণ করছে...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap text-sm leading-relaxed">
              {insights}
            </div>
            <Button variant="outline" size="sm" onClick={generateInsights} className="gap-2">
              <RefreshIcon className="h-3 w-3" /> আবার জেনারেট করুন
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RefreshIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" /><path d="M16 16h5v5" />
    </svg>
  );
}
