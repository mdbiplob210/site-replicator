import { useState, useEffect } from "react";
import { Facebook, LogIn, LogOut, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useSiteSettings, useUpdateSiteSetting } from "@/hooks/useSiteSettings";
import { useExchangeToken, useAdAccounts } from "@/hooks/useMetaAds";
import { supabase } from "@/integrations/supabase/client";

declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

export function FacebookLogin() {
  const { data: settings } = useSiteSettings();
  const updateSetting = useUpdateSiteSetting();
  const exchangeToken = useExchangeToken();
  const { data: adAccounts = [], refetch: refetchAccounts } = useAdAccounts();

  const [fbStatus, setFbStatus] = useState<"unknown" | "connected" | "not_authorized" | "disconnected">("unknown");
  const [fbUser, setFbUser] = useState<{ name: string; id: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [manualToken, setManualToken] = useState("");
  const [showManual, setShowManual] = useState(false);

  const appId = settings?.fb_app_id || "";
  const hasToken = !!settings?.fb_access_token;

  // Load Facebook SDK
  useEffect(() => {
    if (!appId || sdkLoaded) return;

    window.fbAsyncInit = function () {
      window.FB.init({
        appId: appId,
        cookie: true,
        xfbml: false,
        version: "v21.0",
      });
      setSdkLoaded(true);
      
      window.FB.getLoginStatus((response: any) => {
        handleStatusChange(response);
      });
    };

    // Load SDK script
    if (!document.getElementById("facebook-jssdk")) {
      const script = document.createElement("script");
      script.id = "facebook-jssdk";
      script.src = "https://connect.facebook.net/en_US/sdk.js";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }, [appId]);

  const handleStatusChange = (response: any) => {
    setFbStatus(response.status);
    if (response.status === "connected") {
      window.FB.api("/me", { fields: "name,id" }, (user: any) => {
        setFbUser({ name: user.name, id: user.id });
      });
    } else {
      setFbUser(null);
    }
  };

  const handleFBLogin = () => {
    if (!sdkLoaded || !window.FB) {
      toast.error("Facebook SDK লোড হয়নি। App ID চেক করুন।");
      return;
    }
    setLoading(true);
    window.FB.login(
      async (response: any) => {
        if (response.authResponse) {
          handleStatusChange(response);
          const shortToken = response.authResponse.accessToken;
          
          // Save short-lived token first
          await updateSetting.mutateAsync({ key: "fb_access_token", value: shortToken });
          
          // Exchange for long-lived token
          try {
            const res = await supabase.functions.invoke("fetch-meta-ads", {
              body: { action: "exchange_token", short_lived_token: shortToken },
            });
            if (res.data?.access_token) {
              toast.success(`✅ Facebook লগইন সফল! Long-lived token সেভ হয়েছে (${Math.round((res.data.expires_in || 0) / 86400)} দিন)`);
              refetchAccounts();
            } else {
              toast.success("✅ Facebook লগইন সফল! Short-lived token সেভ হয়েছে।");
            }
          } catch {
            toast.success("✅ Facebook লগইন সফল!");
          }
        } else {
          toast.error("Facebook লগইন বাতিল করা হয়েছে।");
        }
        setLoading(false);
      },
      { scope: "ads_read,ads_management,business_management,read_insights" }
    );
  };

  const handleFBLogout = () => {
    if (window.FB) {
      window.FB.logout(() => {
        setFbStatus("disconnected");
        setFbUser(null);
      });
    }
    updateSetting.mutate({ key: "fb_access_token", value: "" });
    toast.success("Facebook ডিসকানেক্ট হয়েছে।");
  };

  const handleManualTokenSave = async () => {
    if (!manualToken.trim()) return;
    setLoading(true);
    await updateSetting.mutateAsync({ key: "fb_access_token", value: manualToken.trim() });
    
    // Try to exchange for long-lived
    try {
      const res = await supabase.functions.invoke("fetch-meta-ads", {
        body: { action: "exchange_token", short_lived_token: manualToken.trim() },
      });
      if (res.data?.access_token) {
        toast.success(`Long-lived token পাওয়া গেছে! (${Math.round((res.data.expires_in || 0) / 86400)} দিন)`);
      } else {
        toast.success("Token সেভ হয়েছে!");
      }
    } catch {
      toast.success("Token সেভ হয়েছে!");
    }
    setManualToken("");
    setShowManual(false);
    setLoading(false);
    refetchAccounts();
  };

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-5 text-white">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
            <Facebook className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Facebook Ads কানেকশন</h3>
            <p className="text-blue-100 text-sm">
              {hasToken
                ? `✅ কানেক্টেড${adAccounts.length > 0 ? ` — ${adAccounts.length}টি Ad Account` : ""}`
                : "লগইন করে আপনার Ad Account কানেক্ট করুন"}
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Status */}
        {hasToken && (
          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-xl border border-green-200 dark:border-green-800">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-700 dark:text-green-400 font-medium">
              Access Token কানেক্টেড
              {fbUser && ` — ${fbUser.name}`}
            </span>
          </div>
        )}

        {!hasToken && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <span className="text-sm text-amber-700 dark:text-amber-400">
              Facebook কানেক্ট করুন অথবা ম্যানুয়ালি Access Token দিন
            </span>
          </div>
        )}

        {/* Login Buttons */}
        <div className="flex flex-wrap gap-3">
          {!hasToken ? (
            <>
              <Button
                onClick={handleFBLogin}
                disabled={loading || !appId}
                className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                Facebook দিয়ে লগইন
              </Button>
              <Button variant="outline" className="gap-2" onClick={() => setShowManual(!showManual)}>
                🔑 ম্যানুয়াল Token
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" className="gap-2" onClick={handleFBLogout}>
                <LogOut className="h-4 w-4" /> ডিসকানেক্ট
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => exchangeToken.mutate()}
                disabled={exchangeToken.isPending}
              >
                {exchangeToken.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "🔄"}
                Token রিফ্রেশ
              </Button>
              <Button variant="outline" className="gap-2" onClick={() => setShowManual(!showManual)}>
                🔑 নতুন Token
              </Button>
            </>
          )}
        </div>

        {/* Manual Token Input */}
        {showManual && (
          <div className="border border-border rounded-xl p-4 space-y-3 bg-secondary/30">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Access Token (User বা System User)</Label>
              <Input
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                placeholder="EAAxxxxxxxx..."
                className="font-mono text-xs"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Facebook Developer → Business Settings → System Users → Generate New Token (ads_read permission)
            </p>
            <Button size="sm" onClick={handleManualTokenSave} disabled={loading || !manualToken.trim()}>
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
              সেভ করুন
            </Button>
          </div>
        )}

        {/* App ID info */}
        {!appId && (
          <p className="text-xs text-muted-foreground">
            ⚠️ Facebook App ID সেট করুন: Admin → Settings → Tracking → Facebook App ID
          </p>
        )}

        {/* Connected Accounts */}
        {adAccounts.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">কানেক্টেড Ad Accounts:</p>
            <div className="flex flex-wrap gap-2">
              {adAccounts.map((ac) => (
                <div key={ac.id} className="text-xs px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  {ac.name} · {ac.business_name} ({ac.currency})
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
