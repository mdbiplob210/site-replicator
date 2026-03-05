import { useState } from "react";
import { ChevronRight, ChevronDown, Megaphone, Layers, FileImage, Loader2, WifiOff } from "lucide-react";
import { useMetaCampaigns, useMetaAdSets, useMetaAds } from "@/hooks/useMetaAds";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  dateRange: string;
  isConnected: boolean;
}

const statusBadge = (s: string) => {
  const upper = s?.toUpperCase();
  return upper === "ACTIVE"
    ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400"
    : "bg-muted text-muted-foreground";
};

const perfLabel = (roas: number) =>
  roas >= 3 ? "Top Performer" : roas >= 1.5 ? "Average" : "Needs Optimization";

const perfBadge = (roas: number) => {
  if (roas >= 3) return "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400";
  if (roas >= 1.5) return "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400";
  return "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400";
};

export function CampaignBreakdown({ dateRange, isConnected }: Props) {
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(new Set());
  const [expandedAdSets, setExpandedAdSets] = useState<Set<string>>(new Set());
  const [level, setLevel] = useState<"campaign" | "adset" | "ad">("campaign");

  const { data: campaignData, isLoading, error } = useMetaCampaigns(dateRange, isConnected);
  const campaigns = campaignData?.campaigns || [];

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

  if (!isConnected) {
    return (
      <div className="bg-card rounded-2xl border border-border p-8 text-center">
        <WifiOff className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
        <h3 className="font-bold text-foreground mb-1">Campaign Data Unavailable</h3>
        <p className="text-sm text-muted-foreground">
          Facebook অ্যাকাউন্ট কানেক্ট করলে এখানে ক্যাম্পেইন, অ্যাড সেট ও অ্যাড ডাটা দেখা যাবে।
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl border border-border p-6 space-y-3">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card rounded-2xl border border-border p-6">
        <p className="text-sm text-destructive">
          ক্যাম্পেইন ডাটা লোড করতে সমস্যা: {(error as Error).message}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-primary" /> Campaign Breakdown
        </h3>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 bg-secondary rounded-lg p-1">
            {(["campaign", "adset", "ad"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  level === l
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {l === "campaign" ? "Campaign" : l === "adset" ? "Ad Set" : "Ad"}
              </button>
            ))}
          </div>
          <span className="text-xs text-muted-foreground bg-secondary px-2.5 py-1 rounded-md">
            {campaigns.length} campaigns
          </span>
        </div>
      </div>

      {campaigns.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">এই সময়ের জন্য কোনো ক্যাম্পেইন ডাটা নেই।</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left py-3 font-medium pl-8">Campaign</th>
                <th className="text-center py-3 font-medium">Status</th>
                <th className="text-right py-3 font-medium">Spend</th>
                <th className="text-center py-3 font-medium">Purchases</th>
                <th className="text-right py-3 font-medium">Cost / Purchase</th>
                <th className="text-right py-3 font-medium">ROAS</th>
                <th className="text-right py-3 font-medium">CTR</th>
                <th className="text-center py-3 font-medium">Performance</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c: any) => {
                const isOpen = expandedCampaigns.has(c.id);
                return (
                  <CampaignRow
                    key={c.id}
                    campaign={c}
                    isOpen={isOpen}
                    onToggle={() => toggleCampaign(c.id)}
                    expandedAdSets={expandedAdSets}
                    onToggleAdSet={toggleAdSet}
                    dateRange={dateRange}
                    level={level}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CampaignRow({
  campaign: c,
  isOpen,
  onToggle,
  expandedAdSets,
  onToggleAdSet,
  dateRange,
  level,
}: {
  campaign: any;
  isOpen: boolean;
  onToggle: () => void;
  expandedAdSets: Set<string>;
  onToggleAdSet: (key: string) => void;
  dateRange: string;
  level: string;
}) {
  const { data: adsetData, isLoading: adsetsLoading } = useMetaAdSets(
    isOpen ? c.id : null,
    dateRange
  );
  const adsets = adsetData?.adsets || [];
  const perf = perfLabel(c.roas);

  return (
    <>
      <tr
        className="border-b border-border/50 hover:bg-secondary/30 cursor-pointer transition-colors"
        onClick={onToggle}
      >
        <td className="py-3.5 pl-2">
          <div className="flex items-center gap-2">
            {isOpen ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            <Megaphone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <div>
              <div className="font-medium text-foreground">{c.name}</div>
              <div className="text-xs text-muted-foreground">{c.objective}</div>
            </div>
          </div>
        </td>
        <td className="text-center">
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusBadge(c.status)}`}>
            {c.status}
          </span>
        </td>
        <td className="text-right text-foreground">${c.spend.toFixed(2)}</td>
        <td className="text-center text-foreground">{c.purchases}</td>
        <td className="text-right text-foreground">
          {c.purchases > 0 ? `$${c.cost_per_purchase.toFixed(2)}` : "—"}
        </td>
        <td className="text-right text-foreground">{c.roas > 0 ? `${c.roas}x` : "—"}</td>
        <td className="text-right text-foreground">{c.ctr.toFixed(2)}%</td>
        <td className="text-center">
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${perfBadge(c.roas)}`}>
            {perf}
          </span>
        </td>
      </tr>

      {/* Ad Sets */}
      {isOpen && adsetsLoading && (
        <tr>
          <td colSpan={8} className="py-3 pl-12">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading ad sets...
            </div>
          </td>
        </tr>
      )}
      {isOpen &&
        !adsetsLoading &&
        adsets.map((adSet: any) => {
          const isAdSetOpen = expandedAdSets.has(adSet.id);
          return (
            <AdSetRow
              key={adSet.id}
              adSet={adSet}
              isOpen={isAdSetOpen}
              onToggle={() => onToggleAdSet(adSet.id)}
              dateRange={dateRange}
              showAds={level === "ad"}
            />
          );
        })}
    </>
  );
}

function AdSetRow({
  adSet,
  isOpen,
  onToggle,
  dateRange,
  showAds,
}: {
  adSet: any;
  isOpen: boolean;
  onToggle: () => void;
  dateRange: string;
  showAds: boolean;
}) {
  const { data: adsData, isLoading: adsLoading } = useMetaAds(
    isOpen ? adSet.id : null,
    dateRange
  );
  const ads = adsData?.ads || [];
  const perf = perfLabel(adSet.roas);

  return (
    <>
      <tr
        className="bg-secondary/15 border-b border-border/30 hover:bg-secondary/30 cursor-pointer transition-colors"
        onClick={onToggle}
      >
        <td className="py-3 pl-10">
          <div className="flex items-center gap-2">
            {isOpen ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            )}
            <Layers className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <div>
              <div className="font-medium text-foreground text-sm">{adSet.name}</div>
              <div className="text-xs text-muted-foreground">{adSet.audience}</div>
            </div>
          </div>
        </td>
        <td className="text-center">
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusBadge(adSet.status)}`}>
            {adSet.status}
          </span>
        </td>
        <td className="text-right text-foreground">${adSet.spend.toFixed(2)}</td>
        <td className="text-center text-foreground">{adSet.purchases}</td>
        <td className="text-right text-foreground">
          {adSet.purchases > 0 ? `$${adSet.cost_per_purchase.toFixed(2)}` : "—"}
        </td>
        <td className="text-right text-foreground">{adSet.roas > 0 ? `${adSet.roas}x` : "—"}</td>
        <td className="text-right text-foreground">{adSet.ctr.toFixed(2)}%</td>
        <td className="text-center">
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${perfBadge(adSet.roas)}`}>
            {perf}
          </span>
        </td>
      </tr>

      {/* Ads */}
      {isOpen && adsLoading && (
        <tr>
          <td colSpan={8} className="py-3 pl-[4.5rem]">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading ads...
            </div>
          </td>
        </tr>
      )}
      {isOpen &&
        !adsLoading &&
        ads.map((ad: any) => {
          const adPerf = perfLabel(ad.roas);
          return (
            <tr key={ad.id} className="bg-secondary/5 border-b border-border/20">
              <td className="py-2.5 pl-[4.5rem]">
                <div className="flex items-center gap-2">
                  <FileImage className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-sm text-foreground">{ad.name}</span>
                </div>
              </td>
              <td className="text-center">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusBadge(ad.status)}`}>
                  {ad.status}
                </span>
              </td>
              <td className="text-right text-foreground text-xs">${ad.spend.toFixed(2)}</td>
              <td className="text-center text-foreground text-xs">{ad.purchases}</td>
              <td className="text-right text-foreground text-xs">
                {ad.purchases > 0 ? `$${ad.cost_per_result.toFixed(2)}` : "—"}
              </td>
              <td className="text-right text-foreground text-xs">
                {ad.roas > 0 ? `${ad.roas}x` : "—"}
              </td>
              <td className="text-right text-foreground text-xs">{ad.ctr.toFixed(2)}%</td>
              <td className="text-center">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${perfBadge(ad.roas)}`}>
                  {adPerf}
                </span>
              </td>
            </tr>
          );
        })}
    </>
  );
}
