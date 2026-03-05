import { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";

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

type AdSet = {
  name: string;
  audience: string;
  spend: number;
  purchases: number;
  costPerPurchase: number;
  roas: number;
  ctr: number;
  performance: string;
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
        spend: 4.80,
        purchases: 5,
        costPerPurchase: 0.96,
        roas: 3.89,
        ctr: 1.19,
        performance: "Needs Optimization",
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
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-foreground">Campaign Breakdown</h3>
        <span className="text-xs text-muted-foreground bg-secondary px-2.5 py-1 rounded-md">
          {mockCampaigns.length} campaigns
        </span>
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
            {mockCampaigns.map((c, i) => (
              <>
                <tr
                  key={i}
                  className="border-b border-border/50 hover:bg-secondary/30 cursor-pointer transition-colors"
                  onClick={() => setExpanded(expanded === i ? null : i)}
                >
                  <td className="py-3.5 pl-2">
                    <div className="flex items-center gap-2">
                      {c.adSets ? (
                        expanded === i ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        )
                      ) : (
                        <div className="w-4" />
                      )}
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
                    <div className="text-xs text-muted-foreground">Cost / {c.resultType.slice(0, -1)}</div>
                  </td>
                  <td className="text-right text-foreground">{c.roas.toFixed(2)}x</td>
                  <td className="text-right text-foreground">{c.ctr.toFixed(2)}%</td>
                  <td className="text-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${perfBadge(c.performance)}`}>
                      {c.performance}
                    </span>
                  </td>
                </tr>
                {expanded === i && c.adSets && (
                  <>
                    <tr className="bg-secondary/20">
                      <td colSpan={9} className="py-2 pl-14">
                        <span className="text-xs font-medium text-muted-foreground">
                          Ad Sets ({c.adSets.length})
                        </span>
                      </td>
                    </tr>
                    {c.adSets.map((a, j) => (
                      <tr key={`${i}-${j}`} className="bg-secondary/10 border-b border-border/30">
                        <td className="py-3 pl-14">
                          <div className="font-medium text-foreground text-sm">{a.name}</div>
                          <div className="text-xs text-muted-foreground">{a.audience}</div>
                        </td>
                        <td className="text-center">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusBadge("ACTIVE")}`}>
                            ACTIVE
                          </span>
                        </td>
                        <td />
                        <td className="text-right text-foreground">${a.spend.toFixed(2)}</td>
                        <td className="text-center text-foreground">{a.purchases}</td>
                        <td className="text-right text-foreground">${a.costPerPurchase.toFixed(2)}</td>
                        <td className="text-right text-foreground">{a.roas.toFixed(2)}x</td>
                        <td className="text-right text-foreground">{a.ctr.toFixed(2)}%</td>
                        <td className="text-center">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${perfBadge(a.performance)}`}>
                            {a.performance}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
