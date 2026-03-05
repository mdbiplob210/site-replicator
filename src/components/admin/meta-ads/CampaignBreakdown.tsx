import { useState } from "react";
import { ChevronRight, ChevronDown, Megaphone, Layers, FileImage, Loader2, RefreshCw, Database } from "lucide-react";
import { useMetaCampaigns, useMetaAdSets, useMetaAds, useSyncMetaAds } from "@/hooks/useMetaAds";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

interface Props {
  dateRange: string;
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

export function CampaignBreakdown({ dateRange }: Props) {
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(new Set());
  const [expandedAdSets, setExpandedAdSets] = useState<Set<string>>(new Set());

  const { data: campaigns = [], isLoading, error } = useMetaCampaigns(dateRange);
  const syncMutation = useSyncMetaAds();

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
    <div className="bg-card rounded-2xl border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-primary" /> Campaign Breakdown
        </h3>
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
          <span className="text-xs text-muted-foreground bg-secondary px-2.5 py-1 rounded-md">
            {campaigns.length} campaigns
          </span>
        </div>
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
                <th className="text-right py-3 font-medium">Spend</th>
                <th className="text-center py-3 font-medium">Purchases</th>
                <th className="text-right py-3 font-medium">Cost / Purchase</th>
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
  );
}

function CampaignRow({
  campaign: c, isOpen, onToggle, expandedAdSets, onToggleAdSet, dateRange,
}: {
  campaign: any; isOpen: boolean; onToggle: () => void;
  expandedAdSets: Set<string>; onToggleAdSet: (key: string) => void; dateRange: string;
}) {
  const { data: adsets = [], isLoading: adsetsLoading } = useMetaAdSets(isOpen ? c.id : null, dateRange);
  const perf = perfLabel(c.roas);

  return (
    <>
      <tr className="border-b border-border/50 hover:bg-secondary/30 cursor-pointer transition-colors" onClick={onToggle}>
        <td className="py-3.5 pl-2">
          <div className="flex items-center gap-2">
            {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
            <Megaphone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <div>
              <div className="font-medium text-foreground">{c.name}</div>
              <div className="text-xs text-muted-foreground">{c.objective}</div>
            </div>
          </div>
        </td>
        <td className="text-center"><span className={`px-2 py-0.5 rounded text-xs font-medium ${statusBadge(c.status)}`}>{c.status}</span></td>
        <td className="text-right text-foreground">${Number(c.spend).toFixed(2)}</td>
        <td className="text-center text-foreground">{c.purchases}</td>
        <td className="text-right text-foreground">{c.purchases > 0 ? `$${Number(c.cost_per_purchase).toFixed(2)}` : "—"}</td>
        <td className="text-right text-foreground">{c.roas > 0 ? `${c.roas}x` : "—"}</td>
        <td className="text-right text-foreground">{Number(c.ctr).toFixed(2)}%</td>
        <td className="text-center"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${perfBadge(c.roas)}`}>{perf}</span></td>
      </tr>

      {isOpen && adsetsLoading && (
        <tr><td colSpan={8} className="py-3 pl-12">
          <div className="flex items-center gap-2 text-muted-foreground text-sm"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading ad sets...</div>
        </td></tr>
      )}
      {isOpen && !adsetsLoading && adsets.map((adSet: any) => (
        <AdSetRow key={adSet.id} adSet={adSet} isOpen={expandedAdSets.has(adSet.id)} onToggle={() => onToggleAdSet(adSet.id)} dateRange={dateRange} />
      ))}
    </>
  );
}

function AdSetRow({ adSet, isOpen, onToggle, dateRange }: { adSet: any; isOpen: boolean; onToggle: () => void; dateRange: string }) {
  const { data: ads = [], isLoading: adsLoading } = useMetaAds(isOpen ? adSet.id : null, dateRange);
  const perf = perfLabel(adSet.roas);

  return (
    <>
      <tr className="bg-secondary/15 border-b border-border/30 hover:bg-secondary/30 cursor-pointer transition-colors" onClick={onToggle}>
        <td className="py-3 pl-10">
          <div className="flex items-center gap-2">
            {isOpen ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
            <Layers className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <div>
              <div className="font-medium text-foreground text-sm">{adSet.name}</div>
              <div className="text-xs text-muted-foreground">{adSet.audience}</div>
            </div>
          </div>
        </td>
        <td className="text-center"><span className={`px-2 py-0.5 rounded text-xs font-medium ${statusBadge(adSet.status)}`}>{adSet.status}</span></td>
        <td className="text-right text-foreground">${Number(adSet.spend).toFixed(2)}</td>
        <td className="text-center text-foreground">{adSet.purchases}</td>
        <td className="text-right text-foreground">{adSet.purchases > 0 ? `$${Number(adSet.cost_per_purchase).toFixed(2)}` : "—"}</td>
        <td className="text-right text-foreground">{adSet.roas > 0 ? `${adSet.roas}x` : "—"}</td>
        <td className="text-right text-foreground">{Number(adSet.ctr).toFixed(2)}%</td>
        <td className="text-center"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${perfBadge(adSet.roas)}`}>{perf}</span></td>
      </tr>

      {isOpen && adsLoading && (
        <tr><td colSpan={8} className="py-3 pl-[4.5rem]">
          <div className="flex items-center gap-2 text-muted-foreground text-sm"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading ads...</div>
        </td></tr>
      )}
      {isOpen && !adsLoading && ads.map((ad: any) => {
        const adPerf = perfLabel(ad.roas);
        return (
          <tr key={ad.id} className="bg-secondary/5 border-b border-border/20">
            <td className="py-2.5 pl-[4.5rem]">
              <div className="flex items-center gap-2">
                <FileImage className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-sm text-foreground">{ad.name}</span>
              </div>
            </td>
            <td className="text-center"><span className={`px-2 py-0.5 rounded text-xs font-medium ${statusBadge(ad.status)}`}>{ad.status}</span></td>
            <td className="text-right text-foreground text-xs">${Number(ad.spend).toFixed(2)}</td>
            <td className="text-center text-foreground text-xs">{ad.purchases}</td>
            <td className="text-right text-foreground text-xs">{ad.purchases > 0 ? `$${Number(ad.cost_per_result).toFixed(2)}` : "—"}</td>
            <td className="text-right text-foreground text-xs">{ad.roas > 0 ? `${ad.roas}x` : "—"}</td>
            <td className="text-right text-foreground text-xs">{Number(ad.ctr).toFixed(2)}%</td>
            <td className="text-center"><span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${perfBadge(ad.roas)}`}>{adPerf}</span></td>
          </tr>
        );
      })}
    </>
  );
}
