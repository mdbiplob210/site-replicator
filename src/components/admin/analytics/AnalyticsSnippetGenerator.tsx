import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Check, Code, Globe } from "lucide-react";
import { toast } from "sonner";

interface Props {
  apiKey: string;
  projectId: string;
}

export function AnalyticsSnippetGenerator({ apiKey, projectId }: Props) {
  const [copied, setCopied] = useState<string | null>(null);

  const baseUrl = `https://${projectId}.supabase.co/functions/v1/track-website-event`;

  const jsSnippet = `<!-- Analytics Tracking Snippet -->
<script>
(function() {
  var API_KEY = "${apiKey}";
  var ENDPOINT = "${baseUrl}";
  var visitorId = localStorage.getItem("_wa_vid");
  if (!visitorId) { visitorId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substr(2); localStorage.setItem("_wa_vid", visitorId); }
  var sessionId = sessionStorage.getItem("_wa_sid");
  if (!sessionId) { sessionId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substr(2); sessionStorage.setItem("_wa_sid", sessionId); }

  function getDeviceType() {
    var w = window.innerWidth;
    if (w < 768) return "mobile";
    if (w < 1024) return "tablet";
    return "desktop";
  }

  window._waTrack = function(eventType, extra) {
    var data = Object.assign({
      event_type: eventType || "page_view",
      page_path: location.pathname,
      page_title: document.title,
      visitor_id: visitorId,
      session_id: sessionId,
      referrer: document.referrer || "",
      device_type: getDeviceType(),
    }, extra || {});

    if (navigator.sendBeacon) {
      var blob = new Blob([JSON.stringify(data)], { type: "application/json" });
      navigator.sendBeacon(ENDPOINT + "?key=" + API_KEY, blob);
    } else {
      fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-API-Key": API_KEY },
        body: JSON.stringify(data),
        keepalive: true
      }).catch(function() {});
    }
  };

  // Auto-track page view
  window._waTrack("page_view");

  // Track SPA navigation
  var lastPath = location.pathname;
  setInterval(function() {
    if (location.pathname !== lastPath) {
      lastPath = location.pathname;
      window._waTrack("page_view");
    }
  }, 1000);
})();
</script>`;

  const apiExample = `// POST ${baseUrl}
// Header: X-API-Key: ${apiKey || "YOUR_API_KEY"}

// Single event
fetch("${baseUrl}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": "${apiKey || "YOUR_API_KEY"}"
  },
  body: JSON.stringify({
    event_type: "page_view",       // page_view | product_view | add_to_cart | purchase
    page_path: "/products/shoes",
    page_title: "Running Shoes",
    product_name: "Nike Air Max",  // optional
    product_code: "NK-001",        // optional
    visitor_id: "abc123",          // optional
    session_id: "sess456",         // optional
    referrer: "https://facebook.com",
    device_type: "mobile"          // mobile | tablet | desktop
  })
});

// Batch events (max 50)
fetch("${baseUrl}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": "${apiKey || "YOUR_API_KEY"}"
  },
  body: JSON.stringify({
    events: [
      { event_type: "page_view", page_path: "/" },
      { event_type: "product_view", page_path: "/product/1", product_name: "Shoe" },
      { event_type: "purchase", page_path: "/checkout", product_code: "NK-001" }
    ]
  })
});`;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success("কপি করা হয়েছে!");
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Code className="h-4 w-4" />
          বাহ্যিক ওয়েবসাইটে Analytics যোগ করুন
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!apiKey ? (
          <div className="text-center py-6 text-muted-foreground">
            <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>প্রথমে একটি API Key তৈরি করুন API Keys সেকশন থেকে।</p>
            <p className="text-xs mt-1">তারপর এখানে snippet ও API example দেখতে পাবেন।</p>
          </div>
        ) : (
          <Tabs defaultValue="snippet">
            <TabsList className="mb-4">
              <TabsTrigger value="snippet">JS Snippet</TabsTrigger>
              <TabsTrigger value="api">API Example</TabsTrigger>
              <TabsTrigger value="events">Event Types</TabsTrigger>
            </TabsList>

            <TabsContent value="snippet">
              <p className="text-sm text-muted-foreground mb-3">
                এই কোডটি আপনার ওয়েবসাইটের <code className="bg-muted px-1 rounded">&lt;head&gt;</code> বা <code className="bg-muted px-1 rounded">&lt;body&gt;</code> ট্যাগের আগে পেস্ট করুন।
                স্বয়ংক্রিয়ভাবে page view ট্র্যাক হবে।
              </p>
              <div className="relative">
                <pre className="bg-muted rounded-lg p-4 text-xs overflow-x-auto max-h-[300px] overflow-y-auto text-foreground">
                  {jsSnippet}
                </pre>
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute top-2 right-2"
                  onClick={() => handleCopy(jsSnippet, "snippet")}
                >
                  {copied === "snippet" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
              <div className="mt-4 p-3 bg-accent/50 rounded-lg text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">প্রোডাক্ট ভিউ ট্র্যাক করতে:</p>
                <code className="text-xs bg-muted px-2 py-1 rounded block mt-1">
                  {`window._waTrack("product_view", { product_name: "Product Name", product_code: "P001" });`}
                </code>
                <p className="font-medium text-foreground mb-1 mt-3">পার্চেজ ট্র্যাক করতে:</p>
                <code className="text-xs bg-muted px-2 py-1 rounded block mt-1">
                  {`window._waTrack("purchase", { product_name: "Product Name", product_code: "P001" });`}
                </code>
              </div>
            </TabsContent>

            <TabsContent value="api">
              <p className="text-sm text-muted-foreground mb-3">
                আপনার সার্ভার বা অ্যাপ্লিকেশন থেকে সরাসরি API কল করে ইভেন্ট পাঠান।
              </p>
              <div className="relative">
                <pre className="bg-muted rounded-lg p-4 text-xs overflow-x-auto max-h-[400px] overflow-y-auto text-foreground">
                  {apiExample}
                </pre>
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute top-2 right-2"
                  onClick={() => handleCopy(apiExample, "api")}
                >
                  {copied === "api" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="events">
              <div className="space-y-3">
                {[
                  { type: "page_view", desc: "পেজ ভিজিট ট্র্যাক করে", auto: true },
                  { type: "product_view", desc: "প্রোডাক্ট পেজ দেখা ট্র্যাক করে", auto: false },
                  { type: "add_to_cart", desc: "কার্টে যোগ করা ট্র্যাক করে", auto: false },
                  { type: "purchase", desc: "অর্ডার/পার্চেজ ট্র্যাক করে", auto: false },
                ].map((evt) => (
                  <div key={evt.type} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <code className="text-sm font-mono font-medium text-foreground">{evt.type}</code>
                      <p className="text-xs text-muted-foreground mt-0.5">{evt.desc}</p>
                    </div>
                    {evt.auto && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        অটো
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
