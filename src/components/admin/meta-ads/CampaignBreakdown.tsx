import { useState } from "react";
import { ChevronRight, ChevronDown, Megaphone, Layers, FileImage } from "lucide-react";

type Ad = {
  name: string;
  status: "ACTIVE" | "PAUSED";
  spend: number;
  result: number;
  resultType: string;
  costPerResult: number;
  roas: number;
  ctr: number;
  performance: string;
};

type AdSet = {
  name: string;
  audience: string;
  status: "ACTIVE" | "PAUSED";
  spend: number;
  purchases: number;
  costPerPurchase: number;
  roas: number;
  ctr: number;
  performance: string;
  ads?: Ad[];
};

type Campaign = {
  name: string;
  productCode: string;
  productName: string;
  status: "ACTIVE" | "PAUSED";
  objective: string;
  spend: number;
  result: number;
  resultType: string;
  costPerResult: number;
  roas: number;
  ctr: number;
  performance: "Top Performer" | "Needs Optimization";
  adSets?: AdSet[];
};

const mockCampaigns: Campaign[] = [
  {
    name: "200 Key 3 Final Sales Cam",
    productCode: "206",
    productName: "key ring with number",
    status: "ACTIVE",
    objective: "Sales",
    spend: 5.73,
    result: 5,
    resultType: "Purchases",
    costPerResult: 1.15,
    roas: 3.19,
    ctr: 1.36,
    performance: "Top Performer",
    adSets: [
      {
        name: "Key Sales Ad Set",
        audience: "18-65 · BD",
        status: "ACTIVE",
        spend: 4.80,
        purchases: 5,
        costPerPurchase: 0.96,
        roas: 3.89,
        ctr: 1.19,
        performance: "Top Performer",
        ads: [
          { name: "Key Ring Carousel Ad", status: "ACTIVE", spend: 2.80, result: 3, resultType: "Purchases", costPerResult: 0.93, roas: 4.12, ctr: 1.45, performance: "Top Performer" },
          { name: "Key Ring Video Ad", status: "ACTIVE", spend: 2.00, result: 2, resultType: "Purchases", costPerResult: 1.00, roas: 3.50, ctr: 0.98, performance: "Needs Optimization" },
        ],
      },
    ],
  },
  {
    name: "206 Key 26 Sales - 00",
    productCode: "206",
    productName: "key ring with number",
    status: "ACTIVE",
    objective: "Sales",
    spend: 4.80,
    result: 5,
    resultType: "Purchases",
    costPerResult: 0.96,
    roas: 3.89,
    ctr: 1.19,
    performance: "Top Performer",
    adSets: [
      {
        name: "Broad BD Audience",
        audience: "18-55 · BD",
        status: "ACTIVE",
        spend: 3.20,
        purchases: 3,
        costPerPurchase: 1.07,
        roas: 3.45,
        ctr: 1.32,
        performance: "Needs Optimization",
        ads: [
          { name: "Single Image - Offer", status: "ACTIVE", spend: 1.80, result: 2, resultType: "Purchases", costPerResult: 0.90, roas: 3.80, ctr: 1.55, performance: "Top Performer" },
          { name: "Single Image - Feature", status: "PAUSED", spend: 1.40, result: 1, resultType: "Purchases", costPerResult: 1.40, roas: 2.90, ctr: 1.10, performance: "Needs Optimization" },
        ],
      },
      {
        name: "Lookalike 1%",
        audience: "LAL 1% · BD",
        status: "ACTIVE",
        spend: 1.60,
        purchases: 2,
        costPerPurchase: 0.80,
        roas: 4.50,
        ctr: 1.05,
        performance: "Top Performer",
        ads: [
          { name: "Carousel - Multi Product", status: "ACTIVE", spend: 1.60, result: 2, resultType: "Purchases", costPerResult: 0.80, roas: 4.50, ctr: 1.05, performance: "Top Performer" },
        ],
      },
    ],
  },
  {
    name: "206 Key 26 Sales - 01",
    productCode: "206",
    productName: "key ring with number",
    status: "ACTIVE",
    objective: "Sales",
    spend: 4.51,
    result: 2,
    resultType: "Purchases",
    costPerResult: 2.25,
    roas: 4.84,
    ctr: 1.66,
    performance: "Needs Optimization",
    adSets: [
      {
        name: "Interest - Accessories",
        audience: "18-45 · BD",
        status: "ACTIVE",
        spend: 4.51,
        purchases: 2,
        costPerPurchase: 2.25,
        roas: 4.84,
        ctr: 1.66,
        performance: "Needs Optimization",
        ads: [
          { name: "Video Ad - Unboxing", status: "ACTIVE", spend: 2.51, result: 1, resultType: "Purchases", costPerResult: 2.51, roas: 5.10, ctr: 1.88, performance: "Needs Optimization" },
          { name: "Image Ad - Lifestyle", status: "ACTIVE", spend: 2.00, result: 1, resultType: "Purchases", costPerResult: 2.00, roas: 4.50, ctr: 1.44, performance: "Needs Optimization" },
        ],
      },
    ],
  },
  {
    name: "702 Key Ring Sales Cam -AB -02",
    productCode: "206",
    productName: "key ring with number",
    status: "ACTIVE",
    objective: "Sales",
    spend: 3.87,
    result: 3,
    resultType: "Purchases",
    costPerResult: 1.29,
    roas: 3.59,
    ctr: 2.60,
    performance: "Needs Optimization",
  },
  {
    name: "702 Key Ring Sales Cam -AB",
    productCode: "206",
    productName: "key ring with number",
    status: "PAUSED",
    objective: "Sales",
    spend: 2.16,
    result: 1,
    resultType: "Purchases",
    costPerResult: 2.16,
    roas: 1.77,
    ctr: 2.48,
    performance: "Needs Optimization",
  },
];

const statusBadge = (s: string) =>
  s === "ACTIVE"
    ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400"
    : "bg-muted text-muted-foreground";

const perfBadge = (p: string) =>
  p === "Top Performer"
    ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400"
    : "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400";

export function CampaignBreakdown() {
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<number>>(new Set());
  const [expandedAdSets, setExpandedAdSets] = useState<Set<string>>(new Set());
  const [level, setLevel] = useState<"campaign" | "adset" | "ad">("campaign");

  const toggleCampaign = (i: number) => {
    setExpandedCampaigns((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const toggleAdSet = (key: string) => {
    setExpandedAdSets((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

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
            {mockCampaigns.length} campaigns
          </span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="text-left py-3 font-medium pl-8">Campaign</th>
              <th className="text-center py-3 font-medium">Status</th>
              <th className="text-center py-3 font-medium">Objective</th>
              <th className="text-right py-3 font-medium">Spend</th>
              <th className="text-center py-3 font-medium">Result</th>
              <th className="text-right py-3 font-medium">Cost / Result</th>
              <th className="text-right py-3 font-medium">ROAS</th>
              <th className="text-right py-3 font-medium">CTR</th>
              <th className="text-center py-3 font-medium">Performance</th>
            </tr>
          </thead>
          <tbody>
            {mockCampaigns.map((c, i) => {
              const isCampaignOpen = expandedCampaigns.has(i);
              const hasAdSets = c.adSets && c.adSets.length > 0;

              return (
                <CampaignRow
                  key={i}
                  campaign={c}
                  index={i}
                  isOpen={isCampaignOpen}
                  hasChildren={!!hasAdSets}
                  onToggle={() => toggleCampaign(i)}
                  expandedAdSets={expandedAdSets}
                  onToggleAdSet={toggleAdSet}
                  level={level}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CampaignRow({
  campaign: c,
  index: i,
  isOpen,
  hasChildren,
  onToggle,
  expandedAdSets,
  onToggleAdSet,
  level,
}: {
  campaign: Campaign;
  index: number;
  isOpen: boolean;
  hasChildren: boolean;
  onToggle: () => void;
  expandedAdSets: Set<string>;
  onToggleAdSet: (key: string) => void;
  level: string;
}) {
  const showAdSets = level !== "campaign";

  return (
    <>
      {/* Campaign Row */}
      <tr
        className="border-b border-border/50 hover:bg-secondary/30 cursor-pointer transition-colors"
        onClick={hasChildren ? onToggle : undefined}
      >
        <td className="py-3.5 pl-2">
          <div className="flex items-center gap-2">
            {hasChildren ? (
              isOpen ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              )
            ) : (
              <div className="w-4" />
            )}
            <Megaphone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <div>
              <div className="font-medium text-foreground">{c.name}</div>
              <div className="text-xs text-muted-foreground">
                <span className="bg-secondary px-1.5 py-0.5 rounded text-xs">{c.productCode}</span>{" "}
                · {c.productName}
              </div>
            </div>
          </div>
        </td>
        <td className="text-center">
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusBadge(c.status)}`}>
            {c.status}
          </span>
        </td>
        <td className="text-center text-foreground">{c.objective}</td>
        <td className="text-right text-foreground">${c.spend.toFixed(2)}</td>
        <td className="text-center">
          <div className="text-foreground font-medium">{c.result}</div>
          <div className="text-xs text-muted-foreground">{c.resultType}</div>
        </td>
        <td className="text-right">
          <div className="text-foreground">${c.costPerResult.toFixed(2)}</div>
          <div className="text-xs text-muted-foreground">Cost / Purchase</div>
        </td>
        <td className="text-right text-foreground">{c.roas.toFixed(2)}x</td>
        <td className="text-right text-foreground">{c.ctr.toFixed(2)}%</td>
        <td className="text-center">
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${perfBadge(c.performance)}`}>
            {c.performance}
          </span>
        </td>
      </tr>

      {/* Ad Sets */}
      {isOpen && c.adSets && c.adSets.map((adSet, j) => {
        const adSetKey = `${i}-${j}`;
        const isAdSetOpen = expandedAdSets.has(adSetKey);
        const hasAds = adSet.ads && adSet.ads.length > 0;

        return (
          <AdSetRow
            key={adSetKey}
            adSet={adSet}
            adSetKey={adSetKey}
            isOpen={isAdSetOpen}
            hasAds={!!hasAds}
            onToggle={() => onToggleAdSet(adSetKey)}
            showAds={level === "ad"}
          />
        );
      })}
    </>
  );
}

function AdSetRow({
  adSet,
  adSetKey,
  isOpen,
  hasAds,
  onToggle,
  showAds,
}: {
  adSet: AdSet;
  adSetKey: string;
  isOpen: boolean;
  hasAds: boolean;
  onToggle: () => void;
  showAds: boolean;
}) {
  return (
    <>
      <tr
        className="bg-secondary/15 border-b border-border/30 hover:bg-secondary/30 cursor-pointer transition-colors"
        onClick={hasAds ? onToggle : undefined}
      >
        <td className="py-3 pl-10">
          <div className="flex items-center gap-2">
            {hasAds ? (
              isOpen ? (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              )
            ) : (
              <div className="w-3.5" />
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
        <td />
        <td className="text-right text-foreground">${adSet.spend.toFixed(2)}</td>
        <td className="text-center text-foreground">{adSet.purchases}</td>
        <td className="text-right text-foreground">${adSet.costPerPurchase.toFixed(2)}</td>
        <td className="text-right text-foreground">{adSet.roas.toFixed(2)}x</td>
        <td className="text-right text-foreground">{adSet.ctr.toFixed(2)}%</td>
        <td className="text-center">
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${perfBadge(adSet.performance)}`}>
            {adSet.performance}
          </span>
        </td>
      </tr>

      {/* Ads */}
      {isOpen && adSet.ads && adSet.ads.map((ad, k) => (
        <tr key={`${adSetKey}-${k}`} className="bg-secondary/5 border-b border-border/20">
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
          <td />
          <td className="text-right text-foreground text-xs">${ad.spend.toFixed(2)}</td>
          <td className="text-center">
            <div className="text-foreground text-xs">{ad.result}</div>
            <div className="text-[10px] text-muted-foreground">{ad.resultType}</div>
          </td>
          <td className="text-right text-foreground text-xs">${ad.costPerResult.toFixed(2)}</td>
          <td className="text-right text-foreground text-xs">{ad.roas.toFixed(2)}x</td>
          <td className="text-right text-foreground text-xs">{ad.ctr.toFixed(2)}%</td>
          <td className="text-center">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${perfBadge(ad.performance)}`}>
              {ad.performance}
            </span>
          </td>
        </tr>
      ))}
    </>
  );
}
