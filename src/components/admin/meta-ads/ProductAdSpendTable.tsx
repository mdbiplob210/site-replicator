import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Package } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type ProductSpendRow = {
  name: string;
  code: string;
  orders: number;
  quantity: number;
  revenue: number;
  spendUsd: number;
  spendBdt: number;
  costPerOrder: number;
  costPerOrderBdt: number;
  roas: number;
  status: "Profitable" | "Efficient" | "Needs Optimization" | "No Orders";
};

const statusColors: Record<string, string> = {
  Profitable: "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400",
  Efficient: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
  "Needs Optimization": "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400",
  "No Orders": "bg-muted text-muted-foreground",
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

  // Fetch orders in date range (non-cancelled)
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

  // Fetch order_items for those orders
  const orderIds = orders?.map((o) => o.id) || [];
  const { data: orderItems, isLoading: itemsLoading } = useQuery({
    queryKey: ["order_items_for_ads", orderIds],
    queryFn: async () => {
      if (orderIds.length === 0) return [];
      const { data, error } = await supabase
        .from("order_items" as any)
        .select("*")
        .in("order_id", orderIds);
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: orderIds.length > 0,
  });

  const isLoading = productsLoading || ordersLoading || itemsLoading;
  const totalOrders = orders?.length || 0;
  const hasOrderItems = (orderItems?.length || 0) > 0;

  // Build product-level stats from order_items
  const productStats = new Map<string, { orders: Set<string>; quantity: number; revenue: number }>();
  
  if (hasOrderItems && orderItems) {
    for (const item of orderItems) {
      const pid = item.product_id || item.product_name; // fallback to name if no product_id
      if (!productStats.has(pid)) {
        productStats.set(pid, { orders: new Set(), quantity: 0, revenue: 0 });
      }
      const stat = productStats.get(pid)!;
      stat.orders.add(item.order_id);
      stat.quantity += Number(item.quantity);
      stat.revenue += Number(item.total_price);
    }
  }

  // Total revenue from mapped items (for proportional spend allocation)
  const totalMappedRevenue = Array.from(productStats.values()).reduce((s, v) => s + v.revenue, 0);
  const unmappedOrderCount = hasOrderItems
    ? totalOrders - new Set(orderItems?.map((i: any) => i.order_id)).size
    : totalOrders;

  // Build rows
  const rows: ProductSpendRow[] = [];

  if (hasOrderItems && products) {
    // Create a map of product info
    const productMap = new Map(products.map((p) => [p.id, p]));

    // Also collect items by product name for items without product_id
    const nameMap = new Map<string, typeof products[0]>();
    for (const p of products) {
      nameMap.set(p.name, p);
    }

    for (const [pid, stat] of productStats) {
      const product = productMap.get(pid) || nameMap.get(pid);
      const name = product?.name || pid;
      const code = product?.product_code || "";

      // Proportional spend: based on revenue share
      const revenueShare = totalMappedRevenue > 0 ? stat.revenue / totalMappedRevenue : 0;
      const spendUsd = totalSpendUsd * revenueShare;
      const spendBdt = spendUsd * rate;
      const orderCount = stat.orders.size;
      const costPerOrder = orderCount > 0 ? spendUsd / orderCount : 0;
      const costPerOrderBdt = costPerOrder * rate;
      const roas = spendUsd > 0 ? stat.revenue / (spendBdt) : 0; // revenue BDT / spend BDT

      let status: ProductSpendRow["status"];
      if (orderCount === 0) status = "No Orders";
      else if (roas >= 3) status = "Profitable";
      else if (roas >= 1.5) status = "Efficient";
      else status = "Needs Optimization";

      rows.push({
        name, code, orders: orderCount, quantity: stat.quantity,
        revenue: stat.revenue, spendUsd: parseFloat(spendUsd.toFixed(2)),
        spendBdt: parseFloat(spendBdt.toFixed(0)),
        costPerOrder: parseFloat(costPerOrder.toFixed(2)),
        costPerOrderBdt: parseFloat(costPerOrderBdt.toFixed(0)),
        roas: parseFloat(roas.toFixed(2)), status,
      });
    }

    // Sort by revenue desc
    rows.sort((a, b) => b.revenue - a.revenue);

  } else if (!isLoading && products && products.length > 0) {
    // Fallback: equal distribution (no order_items data)
    const spendPerProduct = totalSpendUsd / products.length;
    const ordersPerProduct = Math.round(totalOrders / products.length);

    for (const p of products) {
      const costPerOrder = ordersPerProduct > 0 ? spendPerProduct / ordersPerProduct : 0;
      rows.push({
        name: p.name, code: p.product_code,
        orders: ordersPerProduct, quantity: ordersPerProduct,
        revenue: ordersPerProduct * Number(p.selling_price),
        spendUsd: parseFloat(spendPerProduct.toFixed(2)),
        spendBdt: parseFloat((spendPerProduct * rate).toFixed(0)),
        costPerOrder: parseFloat(costPerOrder.toFixed(2)),
        costPerOrderBdt: parseFloat((costPerOrder * rate).toFixed(0)),
        roas: 0, status: ordersPerProduct === 0 ? "No Orders" : "Needs Optimization",
      });
    }
  }

  if (!isLoading && rows.length === 0) {
    rows.push({
      name: "Unmapped", code: "", orders: totalOrders, quantity: 0,
      revenue: 0, spendUsd: totalSpendUsd, spendBdt: totalSpendUsd * rate,
      costPerOrder: totalOrders > 0 ? totalSpendUsd / totalOrders : 0,
      costPerOrderBdt: totalOrders > 0 ? (totalSpendUsd / totalOrders) * rate : 0,
      roas: 0, status: "No Orders",
    });
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <Package className="h-4 w-4 text-primary" /> Product-wise Ad Spend
        </h3>
        <div className="flex items-center gap-3">
          {hasOrderItems && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400">
              order_items ✓
            </span>
          )}
          <span className="text-xs text-muted-foreground">
            {totalOrders} orders · ${totalSpendUsd.toFixed(2)} spend
          </span>
        </div>
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
                <th className="text-center py-3 font-medium">Qty</th>
                <th className="text-right py-3 font-medium">Revenue (৳)</th>
                <th className="text-right py-3 font-medium">Ad Spend</th>
                <th className="text-right py-3 font-medium">Cost/Order</th>
                <th className="text-right py-3 font-medium">ROAS</th>
                <th className="text-center py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-muted-foreground">
                    কোনো প্রোডাক্ট বা অর্ডার নেই
                  </td>
                </tr>
              ) : (
                rows.map((p, i) => (
                  <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-secondary/20 transition-colors">
                    <td className="py-3.5">
                      <div className="font-medium text-foreground">{p.name}</div>
                      {p.code && <div className="text-xs text-muted-foreground">{p.code}</div>}
                    </td>
                    <td className="text-center text-foreground">{p.orders}</td>
                    <td className="text-center text-foreground">{p.quantity}</td>
                    <td className="text-right text-foreground font-medium">৳{p.revenue.toLocaleString()}</td>
                    <td className="text-right">
                      <div className="text-foreground">${p.spendUsd.toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">৳{p.spendBdt.toLocaleString()}</div>
                    </td>
                    <td className="text-right text-foreground">
                      {p.costPerOrder > 0 ? (
                        <>
                          ${p.costPerOrder.toFixed(2)}
                          <span className="text-muted-foreground text-xs block">৳{p.costPerOrderBdt}</span>
                        </>
                      ) : "—"}
                    </td>
                    <td className="text-right">
                      {p.roas > 0 ? (
                        <span className={`font-semibold ${p.roas >= 3 ? "text-green-600" : p.roas >= 1.5 ? "text-yellow-600" : "text-orange-600"}`}>
                          {p.roas}x
                        </span>
                      ) : "—"}
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
