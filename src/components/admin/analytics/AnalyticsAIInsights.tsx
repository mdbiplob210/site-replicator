import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { PageAnalyticsSummary } from "@/hooks/useLandingPageAnalytics";

interface Props {
  summaries?: PageAnalyticsSummary[];
  funnelData?: { step: string; label: string; count: number }[];
  cohortData?: { totalVisitors: number; newVisitors: number; returningVisitors: number; retentionRate: number };
  utmData?: { sources: { name: string; views: number; conversions: number; rate: number }[] };
}

export function AnalyticsAIInsights({ summaries, funnelData, cohortData, utmData }: Props) {
  const [insights, setInsights] = useState("");
  const [loading, setLoading] = useState(false);

  const generateInsights = async () => {
    setLoading(true);
    setInsights("");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("লগইন সেশন পাওয়া যায়নি");
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-landing-analytics`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          summaries,
          funnelData,
          cohortData,
          utmData,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let message = "AI ইনসাইট জেনারেট করা যায়নি";

        try {
          const parsed = JSON.parse(errorText);
          message = parsed.error || message;
        } catch {
          if (errorText) message = errorText;
        }

        throw new Error(message);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let result = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex = buffer.indexOf("\n");
        while (newlineIndex !== -1) {
          const rawLine = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          const line = rawLine.endsWith("\r") ? rawLine.slice(0, -1) : rawLine;
          if (!line.startsWith("data: ")) {
            newlineIndex = buffer.indexOf("\n");
            continue;
          }

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            newlineIndex = -1;
            continue;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              result += content;
              setInsights(result);
            }
          } catch {
            // Ignore partial SSE chunks
          }

          newlineIndex = buffer.indexOf("\n");
        }
      }

      if (!result.trim()) {
        setInsights("AI ইনসাইট জেনারেট করা যায়নি।");
      }
    } catch (error) {
      console.error("Landing analytics AI error:", error);
      setInsights(error instanceof Error ? error.message : "AI ইনসাইট জেনারেট করতে সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Brain className="h-4 w-4 text-primary" /> AI ইনসাইট ও রিকমেন্ডেশন
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!insights && !loading ? (
          <div className="py-10 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h3 className="mb-2 font-semibold text-foreground">AI দিয়ে আপনার ল্যান্ডিং পেজ বিশ্লেষণ করুন</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              AI আপনার ডেটা পড়ে bottleneck, conversion gap আর দ্রুত করণীয়গুলো বের করে দেবে।
            </p>
            <Button onClick={generateInsights} className="gap-2">
              <Brain className="h-4 w-4" /> ইনসাইট জেনারেট করুন
            </Button>
          </div>
        ) : loading ? (
          <div className="py-10 text-center">
            <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">AI ডেটা বিশ্লেষণ করছে...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="prose prose-sm max-w-none whitespace-pre-wrap text-sm leading-relaxed dark:prose-invert">
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
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  );
}
