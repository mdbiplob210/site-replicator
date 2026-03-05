import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Package } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type ProductSpendRow = {
  name: string;
  code: string;
  orders: number;
  spendUsd: number;
  spendBdt: number;
  costPerOrder: number;
  costPerOrderBdt: number;
  status: "Efficient" | "Needs Optimization" | "Unmapped";
};

const statusColors: Record<string, string> = {
  Efficient: "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400",
  "Needs Optimization": "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400",
  Unmapped: "bg-muted text-muted-foreground",
};

interface Props {
  dateRange: string;
  totalSpendUsd: number;
  rate: number;
}

function getDateRangeValues(range: string) {
  const now = new Date();
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const today = fmt(now);
  switch (range) {
    case "yesterday": {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      return { from: fmt(y), to: fmt(y) };
    }
    case "7days": {
      const d = new Date(now);
      d.setDate(d.getDate() - 6);
      return { from: fmt(d), to: today };
    }
    case "30days": {
      const d = new Date(now);
      d.setDate(d.getDate() - 29);
      return { from: fmt(d), to: today };
    }
    default:
      return { from: today, to: today };
  }
}

export function ProductAdSpendTable({ dateRange, totalSpendUsd, rate }: Props) {
  const { from, to } = getDateRangeValues(dateRange);

  // Fetch products
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["products_for_ads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, product_code, selling_price, purchase_price")
        .eq("status", "active");
      if (error) throw error;
      return data;
    },
  });

  // Fetch orders in date range
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["orders_for_ads", from, to],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, total_amount, product_cost, status")
        .gte("created_at", `${from}T00:00:00`)
        .lte("created_at", `${to}T23:59:59`)
        .not("status", "eq", "cancelled");
      if (error) throw error;
      return data;
    },
  });

  const isLoading = productsLoading || ordersLoading;
  const totalOrders = orders?.length || 0;

  // Build product rows
  const rows: ProductSpendRow[] = [];
  if (products && products.length > 0) {
    // Distribute spend proportionally (equal for now since no order-product mapping)
    const spendPerProduct = products.length > 0 ? totalSpendUsd / products.length : 0;
    const ordersPerProduct = products.length > 0 ? Math.round(totalOrders / products.length) : 0;

    for (const p of products) {
      const costPerOrder = ordersPerProduct > 0 ? spendPerProduct / ordersPerProduct : 0;
      const costPerOrderBdt = costPerOrder * rate;
      const sellingPrice = Number(p.selling_price);
      const status: ProductSpendRow["status"] =
        ordersPerProduct === 0
          ? "Needs Optimization"
          : costPerOrderBdt < sellingPrice * 0.3
            ? "Efficient"
            : "Needs Optimization";

      rows.push({
        name: p.name,
        code: p.product_code,
        orders: ordersPerProduct,
        spendUsd: parseFloat(spendPerProduct.toFixed(2)),
        spendBdt: parseFloat((spendPerProduct * rate).toFixed(0)),
        costPerOrder: parseFloat(costPerOrder.toFixed(2)),
        costPerOrderBdt: parseFloat(costPerOrderBdt.toFixed(0)),
        status,
      });
    }

    // Unmapped spend (if no products, all is unmapped)
    if (products.length === 0) {
      rows.push({
        name: "Unmapped",
        code: "",
        orders: 0,
        spendUsd: totalSpendUsd,
        spendBdt: totalSpendUsd * rate,
        costPerOrder: 0,
        costPerOrderBdt: 0,
        status: "Unmapped",
      });
    }
  } else if (!isLoading) {
    rows.push({
      name: "Unmapped",
      code: "",
      orders: totalOrders,
      spendUsd: totalSpendUsd,
      spendBdt: totalSpendUsd * rate,
      costPerOrder: totalOrders > 0 ? totalSpendUsd / totalOrders : 0,
      costPerOrderBdt: totalOrders > 0 ? (totalSpendUsd / totalOrders) * rate : 0,
      status: "Unmapped",
    });
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <Package className="h-4 w-4 text-primary" /> Product-wise Ad Spend
        </h3>
        <span className="text-xs text-muted-foreground">
          {totalOrders} orders · ${totalSpendUsd.toFixed(2)} total spend
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
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
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-muted-foreground">
                    কোনো প্রোডাক্ট বা অর্ডার নেই
                  </td>
                </tr>
              ) : (
                rows.map((p, i) => (
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
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
