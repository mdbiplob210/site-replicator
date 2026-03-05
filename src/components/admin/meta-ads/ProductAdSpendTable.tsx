import { Package, ShoppingCart } from "lucide-react";

type ProductSpend = {
  name: string;
  code: string;
  orders: number;
  spendUsd: number;
  spendBdt: number;
  costPerOrder: number;
  costPerOrderBdt: number;
  status: "Efficient" | "Needs Optimization" | "Unmapped";
};

const mockProducts: ProductSpend[] = [
  {
    name: "key ring with number",
    code: "206",
    orders: 25,
    spendUsd: 11.47,
    spendBdt: 1457,
    costPerOrder: 0.46,
    costPerOrderBdt: 58,
    status: "Efficient",
  },
  {
    name: "Unmapped",
    code: "",
    orders: 0,
    spendUsd: 30.42,
    spendBdt: 3863,
    costPerOrder: 0,
    costPerOrderBdt: 0,
    status: "Unmapped",
  },
];

const statusColors: Record<string, string> = {
  Efficient: "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400",
  "Needs Optimization": "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400",
  Unmapped: "bg-muted text-muted-foreground",
};

export function ProductAdSpendTable() {
  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
        <Package className="h-4 w-4 text-primary" /> Product-wise Ad Spend
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="text-left py-3 font-medium">Product</th>
              <th className="text-center py-3 font-medium">Orders</th>
              <th className="text-right py-3 font-medium">Spend (USD)</th>
              <th className="text-right py-3 font-medium">Spend (BDT)</th>
              <th className="text-right py-3 font-medium">Cost/Order</th>
              <th className="text-center py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {mockProducts.map((p, i) => (
              <tr key={i} className="border-b border-border/50 last:border-0">
                <td className="py-3.5">
                  <div className="font-medium text-foreground">{p.name}</div>
                  {p.code && <div className="text-xs text-muted-foreground">{p.code}</div>}
                </td>
                <td className="text-center text-foreground">{p.orders}</td>
                <td className="text-right text-foreground">${p.spendUsd.toFixed(2)}</td>
                <td className="text-right text-muted-foreground">৳{p.spendBdt.toLocaleString()}</td>
                <td className="text-right text-foreground">
                  {p.costPerOrder > 0 ? (
                    <>
                      ${p.costPerOrder.toFixed(2)}{" "}
                      <span className="text-muted-foreground text-xs">(৳{p.costPerOrderBdt})</span>
                    </>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="text-center">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[p.status]}`}>
                    {p.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
