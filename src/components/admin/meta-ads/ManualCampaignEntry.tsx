import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, ArrowLeft, Megaphone, LayoutList, FileText } from "lucide-react";

type Tab = "campaigns" | "adsets" | "ads";

export function ManualCampaignEntry({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<Tab>("campaigns");
  const [datePreset, setDatePreset] = useState("today");
  const queryClient = useQueryClient();

  // ── Campaign form ──
  const [cName, setCName] = useState("");
  const [cSpend, setCSpend] = useState("");
  const [cImpressions, setCImpressions] = useState("");
  const [cClicks, setCClicks] = useState("");
  const [cPurchases, setCPurchases] = useState("");
  const [cPurchaseValue, setCPurchaseValue] = useState("");
  const [cStatus, setCStatus] = useState("ACTIVE");

  // ── Adset form ──
  const [asCampaignId, setAsCampaignId] = useState("");
  const [asName, setAsName] = useState("");
  const [asSpend, setAsSpend] = useState("");
  const [asClicks, setAsClicks] = useState("");
  const [asPurchases, setAsPurchases] = useState("");
  const [asStatus, setAsStatus] = useState("ACTIVE");

  // ── Ad form ──
  const [adAdsetId, setAdAdsetId] = useState("");
  const [adName, setAdName] = useState("");
  const [adSpend, setAdSpend] = useState("");
  const [adClicks, setAdClicks] = useState("");
  const [adPurchases, setAdPurchases] = useState("");
  const [adStatus, setAdStatus] = useState("ACTIVE");

  // ── Fetch existing data ──
  const { data: campaigns = [] } = useQuery({
    queryKey: ["meta_campaigns_db", datePreset],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meta_campaigns")
        .select("*")
        .eq("date_preset", datePreset)
        .order("spend", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: adsets = [] } = useQuery({
    queryKey: ["meta_adsets_all", datePreset],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meta_adsets")
        .select("*")
        .eq("date_preset", datePreset)
        .order("spend", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: ads = [] } = useQuery({
    queryKey: ["meta_ads_all", datePreset],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meta_ads")
        .select("*")
        .eq("date_preset", datePreset)
        .order("spend", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["meta_campaigns_db"] });
    queryClient.invalidateQueries({ queryKey: ["meta_adsets_db"] });
    queryClient.invalidateQueries({ queryKey: ["meta_ads_db"] });
    queryClient.invalidateQueries({ queryKey: ["meta_adsets_all"] });
    queryClient.invalidateQueries({ queryKey: ["meta_ads_all"] });
  };

  // ── Add Campaign ──
  const addCampaign = useMutation({
    mutationFn: async () => {
      const spend = parseFloat(cSpend) || 0;
      const purchases = parseInt(cPurchases) || 0;
      const purchaseValue = parseFloat(cPurchaseValue) || 0;
      const clicks = parseInt(cClicks) || 0;
      const impressions = parseInt(cImpressions) || 0;
      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
      const roas = spend > 0 ? purchaseValue / spend : 0;
      const costPerPurchase = purchases > 0 ? spend / purchases : 0;

      const id = `manual_${Date.now()}`;
      const { error } = await supabase.from("meta_campaigns").upsert({
        id, name: cName, status: cStatus, spend, impressions, clicks,
        ctr: parseFloat(ctr.toFixed(2)), purchases, purchase_value: purchaseValue,
        cost_per_purchase: parseFloat(costPerPurchase.toFixed(2)),
        roas: parseFloat(roas.toFixed(2)), date_preset: datePreset,
        synced_at: new Date().toISOString(),
      }, { onConflict: "id" });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      setCName(""); setCSpend(""); setCImpressions(""); setCClicks(""); setCPurchases(""); setCPurchaseValue("");
      toast.success("ক্যাম্পেইন যোগ হয়েছে!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // ── Add Adset ──
  const addAdset = useMutation({
    mutationFn: async () => {
      const spend = parseFloat(asSpend) || 0;
      const purchases = parseInt(asPurchases) || 0;
      const clicks = parseInt(asClicks) || 0;
      const ctr = clicks > 0 ? 0 : 0;
      const roas = 0;
      const costPerPurchase = purchases > 0 ? spend / purchases : 0;

      const id = `manual_as_${Date.now()}`;
      const { error } = await supabase.from("meta_adsets").upsert({
        id, campaign_id: asCampaignId, name: asName, status: asStatus,
        spend, clicks, ctr, purchases, cost_per_purchase: parseFloat(costPerPurchase.toFixed(2)),
        roas, date_preset: datePreset, synced_at: new Date().toISOString(),
      }, { onConflict: "id" });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      setAsName(""); setAsSpend(""); setAsClicks(""); setAsPurchases("");
      toast.success("অ্যাড সেট যোগ হয়েছে!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // ── Add Ad ──
  const addAd = useMutation({
    mutationFn: async () => {
      const spend = parseFloat(adSpend) || 0;
      const purchases = parseInt(adPurchases) || 0;
      const clicks = parseInt(adClicks) || 0;
      const costPerResult = purchases > 0 ? spend / purchases : 0;

      const id = `manual_ad_${Date.now()}`;
      const { error } = await supabase.from("meta_ads").upsert({
        id, adset_id: adAdsetId, name: adName, status: adStatus,
        spend, clicks, ctr: 0, purchases, cost_per_result: parseFloat(costPerResult.toFixed(2)),
        roas: 0, date_preset: datePreset, synced_at: new Date().toISOString(),
      }, { onConflict: "id" });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      setAdName(""); setAdSpend(""); setAdClicks(""); setAdPurchases("");
      toast.success("অ্যাড যোগ হয়েছে!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // ── Delete ──
  const deleteCampaign = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("meta_campaigns").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { invalidateAll(); toast.success("ডিলিট হয়েছে!"); },
  });

  const deleteAdset = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("meta_adsets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { invalidateAll(); toast.success("ডিলিট হয়েছে!"); },
  });

  const deleteAd = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("meta_ads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { invalidateAll(); toast.success("ডিলিট হয়েছে!"); },
  });

  const tabs = [
    { key: "campaigns" as Tab, label: "Campaigns", icon: Megaphone, count: campaigns.length },
    { key: "adsets" as Tab, label: "Ad Sets", icon: LayoutList, count: adsets.length },
    { key: "ads" as Tab, label: "Ads", icon: FileText, count: ads.length },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="h-9 w-9 rounded-lg border border-border flex items-center justify-center hover:bg-secondary transition-colors">
          <ArrowLeft className="h-4 w-4 text-muted-foreground" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Manual Campaign Entry</h1>
          <p className="text-sm text-muted-foreground">Facebook API ছাড়াই ক্যাম্পেইন, অ্যাড সেট ও অ্যাড ডাটা যোগ করুন</p>
        </div>
      </div>

      {/* Date Preset */}
      <div className="bg-card rounded-2xl border border-border p-4 flex items-center gap-4">
        <label className="text-sm font-medium text-foreground">Date Preset:</label>
        <Select value={datePreset} onValueChange={setDatePreset}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="yesterday">Yesterday</SelectItem>
            <SelectItem value="last_7d">Last 7 Days</SelectItem>
            <SelectItem value="last_30d">Last 30 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-card rounded-xl border border-border p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tab === t.key
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
            {t.count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                tab === t.key ? "bg-primary-foreground/20" : "bg-secondary"
              }`}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Campaign Form */}
      {tab === "campaigns" && (
        <div className="space-y-4">
          <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" /> নতুন ক্যাম্পেইন যোগ করুন
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="col-span-2 md:col-span-1">
                <label className="text-xs font-medium text-muted-foreground">Campaign Name *</label>
                <Input value={cName} onChange={(e) => setCName(e.target.value)} placeholder="Campaign name" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Spend (USD) *</label>
                <Input type="number" step="0.01" value={cSpend} onChange={(e) => setCSpend(e.target.value)} placeholder="0.00" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Impressions</label>
                <Input type="number" value={cImpressions} onChange={(e) => setCImpressions(e.target.value)} placeholder="0" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Clicks</label>
                <Input type="number" value={cClicks} onChange={(e) => setCClicks(e.target.value)} placeholder="0" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Purchases</label>
                <Input type="number" value={cPurchases} onChange={(e) => setCPurchases(e.target.value)} placeholder="0" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Purchase Value (USD)</label>
                <Input type="number" step="0.01" value={cPurchaseValue} onChange={(e) => setCPurchaseValue(e.target.value)} placeholder="0.00" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Status</label>
                <Select value={cStatus} onValueChange={setCStatus}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="PAUSED">Paused</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={() => addCampaign.mutate()} disabled={!cName.trim() || addCampaign.isPending} className="gap-2">
              {addCampaign.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              ক্যাম্পেইন যোগ করুন
            </Button>
          </div>

          {/* Existing campaigns */}
          {campaigns.length > 0 && (
            <div className="bg-card rounded-2xl border border-border p-6">
              <h3 className="font-bold text-foreground mb-3">বিদ্যমান ক্যাম্পেইন ({campaigns.length})</h3>
              <div className="space-y-2">
                {campaigns.map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Spend: ${Number(c.spend).toFixed(2)} · Purchases: {c.purchases} · ROAS: {Number(c.roas).toFixed(2)}x
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        c.status === "ACTIVE" ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400" : "bg-muted text-muted-foreground"
                      }`}>{c.status}</span>
                      <button onClick={() => deleteCampaign.mutate(c.id)} className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Adset Form */}
      {tab === "adsets" && (
        <div className="space-y-4">
          <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" /> নতুন অ্যাড সেট যোগ করুন
            </h3>
            {campaigns.length === 0 && (
              <p className="text-sm text-orange-600 bg-orange-50 dark:bg-orange-950/20 p-3 rounded-lg">
                ⚠️ আগে একটি ক্যাম্পেইন যোগ করুন
              </p>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Campaign *</label>
                <Select value={asCampaignId} onValueChange={setAsCampaignId}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select campaign" /></SelectTrigger>
                  <SelectContent>
                    {campaigns.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Ad Set Name *</label>
                <Input value={asName} onChange={(e) => setAsName(e.target.value)} placeholder="Ad set name" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Spend (USD)</label>
                <Input type="number" step="0.01" value={asSpend} onChange={(e) => setAsSpend(e.target.value)} placeholder="0.00" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Clicks</label>
                <Input type="number" value={asClicks} onChange={(e) => setAsClicks(e.target.value)} placeholder="0" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Purchases</label>
                <Input type="number" value={asPurchases} onChange={(e) => setAsPurchases(e.target.value)} placeholder="0" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Status</label>
                <Select value={asStatus} onValueChange={setAsStatus}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="PAUSED">Paused</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={() => addAdset.mutate()} disabled={!asName.trim() || !asCampaignId || addAdset.isPending} className="gap-2">
              {addAdset.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              অ্যাড সেট যোগ করুন
            </Button>
          </div>

          {adsets.length > 0 && (
            <div className="bg-card rounded-2xl border border-border p-6">
              <h3 className="font-bold text-foreground mb-3">বিদ্যমান অ্যাড সেট ({adsets.length})</h3>
              <div className="space-y-2">
                {adsets.map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{a.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Spend: ${Number(a.spend).toFixed(2)} · Clicks: {a.clicks} · Purchases: {a.purchases}
                      </p>
                    </div>
                    <button onClick={() => deleteAdset.mutate(a.id)} className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Ad Form */}
      {tab === "ads" && (
        <div className="space-y-4">
          <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" /> নতুন অ্যাড যোগ করুন
            </h3>
            {adsets.length === 0 && (
              <p className="text-sm text-orange-600 bg-orange-50 dark:bg-orange-950/20 p-3 rounded-lg">
                ⚠️ আগে একটি অ্যাড সেট যোগ করুন
              </p>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Ad Set *</label>
                <Select value={adAdsetId} onValueChange={setAdAdsetId}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select ad set" /></SelectTrigger>
                  <SelectContent>
                    {adsets.map((a: any) => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Ad Name *</label>
                <Input value={adName} onChange={(e) => setAdName(e.target.value)} placeholder="Ad name" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Spend (USD)</label>
                <Input type="number" step="0.01" value={adSpend} onChange={(e) => setAdSpend(e.target.value)} placeholder="0.00" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Clicks</label>
                <Input type="number" value={adClicks} onChange={(e) => setAdClicks(e.target.value)} placeholder="0" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Purchases</label>
                <Input type="number" value={adPurchases} onChange={(e) => setAdPurchases(e.target.value)} placeholder="0" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Status</label>
                <Select value={adStatus} onValueChange={setAdStatus}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="PAUSED">Paused</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={() => addAd.mutate()} disabled={!adName.trim() || !adAdsetId || addAd.isPending} className="gap-2">
              {addAd.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              অ্যাড যোগ করুন
            </Button>
          </div>

          {ads.length > 0 && (
            <div className="bg-card rounded-2xl border border-border p-6">
              <h3 className="font-bold text-foreground mb-3">বিদ্যমান অ্যাড ({ads.length})</h3>
              <div className="space-y-2">
                {ads.map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{a.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Spend: ${Number(a.spend).toFixed(2)} · Clicks: {a.clicks} · Purchases: {a.purchases}
                      </p>
                    </div>
                    <button onClick={() => deleteAd.mutate(a.id)} className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
