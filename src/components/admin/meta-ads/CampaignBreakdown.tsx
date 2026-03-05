import { useState, useMemo } from "react";
import {
  ChevronRight, ChevronDown, Megaphone, Layers, FileImage,
  Loader2, RefreshCw, Database, DollarSign, Target, TrendingUp,
  MousePointer, BarChart3, Coins
} from "lucide-react";
import { useMetaCampaigns, useMetaAdSets, useMetaAds, useSyncMetaAds } from "@/hooks/useMetaAds";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

interface Props {
  dateRange: string;
}

const statusBadge = (s: string) => {
  const upper = s?.toUpperCase();
  return upper === "ACTIVE"
    ? "bg-green-500 text-white"
    : "bg-muted text-muted-foreground";
};

const perfLabel = (roas: number, spend: number) => {
  if (spend === 0) return "";
  if (roas >= 3) return "Top Performer";
  if (roas >= 1.5) return "Average";
  if (roas > 0) return "Needs Optimization";
  return "Wasting Budget";
};

const perfBadge = (roas: number, spend: number) => {
  if (spend === 0) return "";
  if (roas >= 3) return "border border-green-300 text-green-700 dark:border-green-700 dark:text-green-400";
  if (roas >= 1.5) return "border border-yellow-300 text-yellow-700 dark:border-yellow-700 dark:text-yellow-400";
  if (roas > 0) return "border border-orange-300 text-orange-700 dark:border-orange-700 dark:text-orange-400";
  return "border border-red-300 text-red-600 dark:border-red-700 dark:text-red-400";
};

export function CampaignBreakdown({ dateRange }: Props) {
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(new Set());
  const [expandedAdSets, setExpandedAdSets] = useState<Set<string>>(new Set());

  const { data: campaigns = [], isLoading, error } = useMetaCampaigns(dateRange);
  const syncMutation = useSyncMetaAds();

  // Summary stats
  const summary = useMemo(() => {
    let spend = 0, purchases = 0, clicks = 0, impressions = 0, purchaseValue = 0;
    for (const c of campaigns as any[]) {
      spend += Number(c.spend) || 0;
      purchases += Number(c.purchases) || 0;
      clicks += Number(c.clicks) || 0;
      impressions += Number(c.impressions) || 0;
      purchaseValue += Number(c.purchase_value) || 0;
    }
    const costPerPurchase = purchases > 0 ? spend / purchases : 0;
    const roas = spend > 0 ? purchaseValue / spend : 0;
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const cpc = clicks > 0 ? spend / clicks : 0;
    return { spend, purchases, costPerPurchase, roas, clicks, ctr, cpc, impressions };
  }, [campaigns]);

  const toggleCampaign = (id: string) => {
    setExpandedCampaigns((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAdSet = (id: string) => {
    setExpandedAdSets((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const lastSynced = campaigns.length > 0 ? (campaigns[0] as any)?.synced_at : null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <ShoppingCartIcon className="h-5 w-5 text-primary" />
          Purchase Campaigns
          <span className="text-sm font-normal text-muted-foreground">({campaigns.length} campaigns)</span>
        </h2>
        <div className="flex items-center gap-3">
          {lastSynced && (
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Database className="h-3 w-3" />
              Last sync: {new Date(lastSynced).toLocaleString("bn-BD", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}
            </span>
          )}
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs"
            onClick={() => syncMutation.mutate(dateRange)}
            disabled={syncMutation.isPending}
          >
            {syncMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            {syncMutation.isPending ? "Syncing..." : "Sync from Facebook"}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {!isLoading && campaigns.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: DollarSign, label: "Spend", value: `$${summary.spend.toFixed(2)}`, color: "text-orange-500 bg-orange-100 dark:bg-orange-950/40" },
            { icon: Target, label: "Purchases", value: String(summary.purchases), color: "text-green-500 bg-green-100 dark:bg-green-950/40" },
            { icon: TrendingUp, label: "Cost / Purchase", value: `$${summary.costPerPurchase.toFixed(2)}`, color: "text-blue-500 bg-blue-100 dark:bg-blue-950/40" },
            { icon: Megaphone, label: "Reach", value: summary.impressions.toLocaleString(), color: "text-pink-500 bg-pink-100 dark:bg-pink-950/40" },
            { icon: TrendingUp, label: "ROAS", value: `${summary.roas.toFixed(2)}x`, color: "text-green-600 bg-green-100 dark:bg-green-950/40" },
            { icon: MousePointer, label: "Clicks", value: summary.clicks.toLocaleString(), color: "text-teal-500 bg-teal-100 dark:bg-teal-950/40" },
            { icon: BarChart3, label: "CTR", value: `${summary.ctr.toFixed(2)}%`, color: "text-cyan-600 bg-cyan-100 dark:bg-cyan-950/40" },
            { icon: Coins, label: "CPC", value: `$${summary.cpc.toFixed(2)}`, color: "text-amber-500 bg-amber-100 dark:bg-amber-950/40" },
          ].map((s, i) => (
            <div key={i} className="bg-card rounded-xl border border-border p-4 flex items-start gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold text-foreground">{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Campaign Table */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-foreground">Campaign Breakdown</h3>
          <span className="text-xs font-medium border border-border px-3 py-1 rounded-md">Level: Campaign</span>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : error ? (
          <p className="text-sm text-destructive py-4">ডাটা লোড করতে সমস্যা: {(error as Error).message}</p>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-8">
            <Database className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-3">কোনো ক্যাম্পেইন ডাটা নেই।</p>
            <Button
              size="sm"
              className="gap-2"
              onClick={() => syncMutation.mutate(dateRange)}
              disabled={syncMutation.isPending}
            >
              {syncMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Facebook থেকে সিঙ্ক করুন
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left py-3 font-medium pl-8">Campaign</th>
                  <th className="text-center py-3 font-medium">Status</th>
                  <th className="text-left py-3 font-medium">Objective</th>
                  <th className="text-right py-3 font-medium">Spend</th>
                  <th className="text-center py-3 font-medium">Result</th>
                  <th className="text-right py-3 font-medium">Cost / Result</th>
                  <th className="text-right py-3 font-medium">ROAS</th>
                  <th className="text-right py-3 font-medium">CTR</th>
                  <th className="text-center py-3 font-medium">Performance</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c: any) => (
                  <CampaignRow
                    key={c.id}
                    campaign={c}
                    isOpen={expandedCampaigns.has(c.id)}
                    onToggle={() => toggleCampaign(c.id)}
                    expandedAdSets={expandedAdSets}
                    onToggleAdSet={toggleAdSet}
                    dateRange={dateRange}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function ShoppingCartIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/>
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
    </svg>
  );
}

function CampaignRow({
  campaign: c, isOpen, onToggle, expandedAdSets, onToggleAdSet, dateRange,
}: {
  campaign: any; isOpen: boolean; onToggle: () => void;
  expandedAdSets: Set<string>; onToggleAdSet: (key: string) => void; dateRange: string;
}) {
  const { data: adsets = [], isLoading: adsetsLoading } = useMetaAdSets(isOpen ? c.id : null, dateRange);
  const perf = perfLabel(c.roas, c.spend);

  return (
    <>
      <tr className="border-b border-border/50 hover:bg-secondary/30 cursor-pointer transition-colors" onClick={onToggle}>
        <td className="py-4 pl-2">
          <div className="flex items-center gap-2">
            {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
            <span className="font-medium text-foreground">{c.name}</span>
          </div>
        </td>
        <td className="text-center"><span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${statusBadge(c.status)}`}>{c.status}</span></td>
        <td className="text-left">
          <div>
            <span className="text-foreground text-sm">{c.objective || "—"}</span>
            {c.purchases > 0 && <div className="text-[11px] text-muted-foreground">Purchases</div>}
          </div>
        </td>
        <td className="text-right text-foreground font-medium">${Number(c.spend).toFixed(2)}</td>
        <td className="text-center">
          <div>
            <span className="text-foreground font-medium">{c.purchases}</span>
            {c.purchases > 0 && <div className="text-[11px] text-muted-foreground">Purchases</div>}
          </div>
        </td>
        <td className="text-right">
          <div>
            <span className="text-foreground">{c.purchases > 0 ? `$${Number(c.cost_per_purchase).toFixed(2)}` : "—"}</span>
            {c.purchases > 0 && <div className="text-[11px] text-muted-foreground">Cost / Purchase</div>}
          </div>
        </td>
        <td className="text-right text-foreground">{c.roas > 0 ? `${c.roas}x` : "—"}</td>
        <td className="text-right text-foreground">{Number(c.ctr).toFixed(2)}%</td>
        <td className="text-center">
          {perf && <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${perfBadge(c.roas, c.spend)}`}>{perf}</span>}
        </td>
      </tr>

      {/* Ad Sets Section */}
      {isOpen && (
        <tr>
          <td colSpan={9} className="p-0">
            <div className="bg-secondary/10 border-y border-border/30 px-6 py-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Layers className="h-4 w-4 text-muted-foreground" />
                  Ad Sets ({adsetsLoading ? "..." : adsets.length})
                </h4>
                <span className="text-xs font-medium border border-border px-2.5 py-0.5 rounded-md bg-card">Level: Ad Set</span>
              </div>

              {adsetsLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading ad sets...
                </div>
              ) : adsets.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">কোনো Ad Set পাওয়া যায়নি।</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50 text-muted-foreground">
                      <th className="text-left py-2 font-medium pl-6">Ad Set</th>
                      <th className="text-left py-2 font-medium">Audience</th>
                      <th className="text-right py-2 font-medium">Spend</th>
                      <th className="text-center py-2 font-medium">Purchases</th>
                      <th className="text-right py-2 font-medium">Cost / Purchase</th>
                      <th className="text-right py-2 font-medium">ROAS</th>
                      <th className="text-right py-2 font-medium">CTR</th>
                      <th className="text-center py-2 font-medium">Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adsets.map((adSet: any) => (
                      <AdSetRow
                        key={adSet.id}
                        adSet={adSet}
                        isOpen={expandedAdSets.has(adSet.id)}
                        onToggle={() => onToggleAdSet(adSet.id)}
                        dateRange={dateRange}
                      />
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function AdSetRow({ adSet, isOpen, onToggle, dateRange }: { adSet: any; isOpen: boolean; onToggle: () => void; dateRange: string }) {
  const { data: ads = [], isLoading: adsLoading } = useMetaAds(isOpen ? adSet.id : null, dateRange);
  const perf = perfLabel(adSet.roas, adSet.spend);

  return (
    <>
      <tr className="border-b border-border/30 hover:bg-secondary/20 cursor-pointer transition-colors" onClick={onToggle}>
        <td className="py-3 pl-2">
          <div className="flex items-center gap-2">
            {isOpen ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
            <span className="font-medium text-foreground text-sm">{adSet.name}</span>
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${statusBadge(adSet.status)}`}>{adSet.status}</span>
          </div>
        </td>
        <td className="text-sm text-muted-foreground">{adSet.audience || "—"}</td>
        <td className="text-right text-foreground">${Number(adSet.spend).toFixed(2)}</td>
        <td className="text-center text-foreground">{adSet.purchases}</td>
        <td className="text-right text-foreground">{adSet.purchases > 0 ? `$${Number(adSet.cost_per_purchase).toFixed(2)}` : "—"}</td>
        <td className="text-right text-foreground">{adSet.roas > 0 ? `${adSet.roas}x` : "—"}</td>
        <td className="text-right text-foreground">{Number(adSet.ctr).toFixed(2)}%</td>
        <td className="text-center">
          {perf && <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${perfBadge(adSet.roas, adSet.spend)}`}>{perf}</span>}
        </td>
      </tr>

      {/* Ads Section */}
      {isOpen && (
        <tr>
          <td colSpan={8} className="p-0">
            <div className="bg-secondary/5 border-y border-border/20 px-4 py-3 ml-4">
              <div className="flex items-center justify-between mb-2">
                <h5 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <FileImage className="h-3.5 w-3.5 text-muted-foreground" />
                  Ads ({adsLoading ? "..." : ads.length})
                </h5>
                <span className="text-xs font-medium border border-border px-2.5 py-0.5 rounded-md bg-card">Level: Ad</span>
              </div>

              {adsLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading ads...
                </div>
              ) : ads.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">কোনো Ad পাওয়া যায়নি।</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/30 text-muted-foreground">
                      <th className="text-left py-2 font-medium">Ad</th>
                      <th className="text-right py-2 font-medium">Spend</th>
                      <th className="text-center py-2 font-medium">Purchases</th>
                      <th className="text-right py-2 font-medium">Cost / Purchase</th>
                      <th className="text-right py-2 font-medium">ROAS</th>
                      <th className="text-right py-2 font-medium">CTR</th>
                      <th className="text-right py-2 font-medium">CPC</th>
                      <th className="text-center py-2 font-medium">Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ads.map((ad: any) => {
                      const adPerf = perfLabel(ad.roas, ad.spend);
                      const cpc = ad.clicks > 0 ? (Number(ad.spend) / ad.clicks) : 0;
                      return (
                        <tr key={ad.id} className="border-b border-border/20 hover:bg-secondary/10 transition-colors">
                          <td className="py-2.5">
                            <div>
                              <span className="text-sm font-medium text-foreground">{ad.name}</span>
                            </div>
                          </td>
                          <td className="text-right text-foreground text-xs">${Number(ad.spend).toFixed(2)}</td>
                          <td className="text-center text-foreground text-xs">{ad.purchases || "—"}</td>
                          <td className="text-right text-foreground text-xs">{ad.purchases > 0 ? `$${Number(ad.cost_per_result).toFixed(2)}` : "—"}</td>
                          <td className="text-right text-foreground text-xs">{ad.roas > 0 ? `${ad.roas}x` : "—"}</td>
                          <td className="text-right text-foreground text-xs">{Number(ad.ctr).toFixed(2)}%</td>
                          <td className="text-right text-foreground text-xs">{cpc > 0 ? `$${cpc.toFixed(2)}` : "—"}</td>
                          <td className="text-center">
                            {adPerf && <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap ${perfBadge(ad.roas, ad.spend)}`}>{adPerf}</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
