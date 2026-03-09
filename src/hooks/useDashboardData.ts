import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, endOfDay, startOfWeek, startOfMonth, subDays, format, eachDayOfInterval, parseISO } from "date-fns";

type TimeFilter = "Today" | "Yesterday" | "This Week" | "This Month";

function getDateRange(filter: TimeFilter) {
  const now = new Date();
  switch (filter) {
    case "Today":
      return { from: startOfDay(now).toISOString(), to: endOfDay(now).toISOString() };
    case "Yesterday": {
      const y = subDays(now, 1);
      return { from: startOfDay(y).toISOString(), to: endOfDay(y).toISOString() };
    }
    case "This Week":
      return { from: startOfWeek(now, { weekStartsOn: 6 }).toISOString(), to: endOfDay(now).toISOString() };
    case "This Month":
      return { from: startOfMonth(now).toISOString(), to: endOfDay(now).toISOString() };
  }
}

export function useDashboardData(filter: TimeFilter) {
  const { from, to } = getDateRange(filter);

  const ordersQuery = useQuery({
    queryKey: ["dashboard-orders", filter],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .gte("created_at", from)
        .lte("created_at", to);
      if (error) throw error;
      return data || [];
    },
  });

  const orderItemsQuery = useQuery({
    queryKey: ["dashboard-order-items", filter],
    queryFn: async () => {
      const orderIds = (ordersQuery.data || []).map((o) => o.id);
      if (orderIds.length === 0) return [];
      // fetch in batches of 200 ids
      let allItems: any[] = [];
      for (let i = 0; i < orderIds.length; i += 200) {
        const batch = orderIds.slice(i, i + 200);
        const { data, error } = await supabase
          .from("order_items")
          .select("order_id, product_name, product_code, product_id, quantity, unit_price, total_price")
          .in("order_id", batch);
        if (error) throw error;
        if (data) allItems = allItems.concat(data);
      }
      return allItems;
    },
    enabled: !!ordersQuery.data,
  });

  const financeQuery = useQuery({
    queryKey: ["dashboard-finance"],
    queryFn: async () => {
      const { data, error } = await supabase.from("finance_records").select("*");
      if (error) throw error;
      return data || [];
    },
  });

  const adSpendQuery = useQuery({
    queryKey: ["dashboard-adspend", filter],
    queryFn: async () => {
      const fromDate = from.split("T")[0];
      const toDate = to.split("T")[0];
      const { data, error } = await supabase
        .from("ad_spends")
        .select("*")
        .gte("spend_date", fromDate)
        .lte("spend_date", toDate);
      if (error) throw error;
      return data || [];
    },
  });

  const stockQuery = useQuery({
    queryKey: ["dashboard-stock"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("purchase_price, stock_quantity");
      if (error) throw error;
      return data || [];
    },
  });

  const courierBalanceQuery = useQuery({
    queryKey: ["dashboard-courier-balance"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("total_amount")
        .eq("status", "in_courier" as any);
      if (error) throw error;
      const items = data || [];
      return { amount: items.reduce((s, o) => s + Number(o.total_amount), 0), count: items.length };
    },
  });

  const orders = ordersQuery.data || [];
  const orderItems = orderItemsQuery.data || [];
  const finance = financeQuery.data || [];
  const adSpends = adSpendQuery.data || [];
  const products = stockQuery.data || [];
  const courierBalance = courierBalanceQuery.data?.amount || 0;
  const courierCount = courierBalanceQuery.data?.count || 0;

  // Order stats
  const totalOrders = orders.length;
  const totalAmount = orders.reduce((s, o) => s + Number(o.total_amount), 0);

  const byStatus = (status: string) => orders.filter((o) => o.status === status);
  const countAndAmount = (status: string) => {
    const filtered = byStatus(status);
    return {
      count: filtered.length,
      amount: filtered.reduce((s, o) => s + Number(o.total_amount), 0),
      pct: totalOrders > 0 ? Math.round((filtered.length / totalOrders) * 100) : 0,
    };
  };

  const processing = countAndAmount("processing");
  const confirmed = countAndAmount("confirmed");
  const inquiry = countAndAmount("inquiry");
  const cancelled = countAndAmount("cancelled");
  const onHold = countAndAmount("on_hold");
  const shipLater = countAndAmount("ship_later");
  const inCourier = countAndAmount("in_courier");
  const delivered = countAndAmount("delivered");
  const returned = countAndAmount("returned");
  const pendingReturn = countAndAmount("pending_return");
  const handDelivery = countAndAmount("hand_delivery");

  // Incomplete = processing + confirmed + inquiry + on_hold + cancelled (not yet shipped/delivered)
  const incompleteTotal = processing.count + confirmed.count + inquiry.count + onHold.count + cancelled.count;

  // Average order value
  const avgOrderValue = totalOrders > 0 ? Math.round(totalAmount / totalOrders) : 0;

  // Payment status breakdown
  const paidOrders = orders.filter((o) => o.payment_status === "paid");
  const unpaidOrders = orders.filter((o) => o.payment_status === "unpaid");
  const partialPaidOrders = orders.filter((o) => o.payment_status === "partial");
  const paymentStats = {
    paid: { count: paidOrders.length, amount: paidOrders.reduce((s, o) => s + Number(o.total_amount), 0) },
    unpaid: { count: unpaidOrders.length, amount: unpaidOrders.reduce((s, o) => s + Number(o.total_amount), 0) },
    partial: { count: partialPaidOrders.length, amount: partialPaidOrders.reduce((s, o) => s + Number(o.total_amount), 0) },
  };

  // Top selling products (by quantity)
  const productMap = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const item of orderItems) {
    // Only count items from non-cancelled/returned orders
    const order = orders.find((o) => o.id === item.order_id);
    if (!order || ["cancelled", "returned"].includes(order.status)) continue;
    const key = item.product_name || item.product_code || "Unknown";
    const existing = productMap.get(key) || { name: key, qty: 0, revenue: 0 };
    existing.qty += Number(item.quantity);
    existing.revenue += Number(item.total_price);
    productMap.set(key, existing);
  }
  const topProducts = Array.from(productMap.values())
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  // Hourly order distribution
  const hourlyOrders = Array(24).fill(0);
  for (const o of orders) {
    const hour = new Date(o.created_at).getHours();
    hourlyOrders[hour]++;
  }

  // Source breakdown
  const sourceMap = new Map<string, { count: number; amount: number }>();
  for (const o of orders) {
    const src = o.source || "Unknown";
    const existing = sourceMap.get(src) || { count: 0, amount: 0 };
    existing.count++;
    existing.amount += Number(o.total_amount);
    sourceMap.set(src, existing);
  }
  const sourceBreakdown = Array.from(sourceMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.count - a.count);

  // Profit calculation
  const revenue = orders
    .filter((o) => !["cancelled", "returned"].includes(o.status))
    .reduce((s, o) => s + Number(o.total_amount), 0);
  const deliveryCost = orders
    .filter((o) => !["cancelled", "returned"].includes(o.status))
    .reduce((s, o) => s + Number(o.delivery_charge), 0);
  const productCost = orders
    .filter((o) => !["cancelled", "returned"].includes(o.status))
    .reduce((s, o) => s + Number(o.product_cost), 0);
  const returnAmount = orders
    .filter((o) => o.status === "returned")
    .reduce((s, o) => s + Number(o.total_amount), 0);
  const adsCostBdt = adSpends.reduce((s, a) => s + Number(a.amount_bdt), 0);
  const adsCostUsd = adSpends.reduce((s, a) => s + Number(a.amount_usd), 0);
  const estProfit = revenue - productCost - adsCostBdt - deliveryCost;
  const finalProfit = estProfit - returnAmount;

  // Finance
  const bankBalance = finance
    .filter((f) => f.type === "bank")
    .reduce((s, f) => s + Number(f.amount), 0);
  const loans = finance.filter((f) => f.type === "loan_in" || f.type === "loan_out");
  const loanTotal = finance
    .filter((f) => f.type === "loan_in").reduce((s, f) => s + Number(f.amount), 0)
    - finance.filter((f) => f.type === "loan_out").reduce((s, f) => s + Number(f.amount), 0);
  const investmentTotal = finance
    .filter((f) => f.type === "investment_in").reduce((s, f) => s + Number(f.amount), 0)
    - finance.filter((f) => f.type === "investment_out").reduce((s, f) => s + Number(f.amount), 0);

  // Stock value
  const stockValue = products.reduce(
    (s, p) => s + Number(p.purchase_price) * Number(p.stock_quantity),
    0
  );
  const netValue = bankBalance + stockValue + investmentTotal - loanTotal;

  return {
    isLoading: ordersQuery.isLoading || financeQuery.isLoading || adSpendQuery.isLoading || stockQuery.isLoading,
    orderStats: {
      totalOrders,
      totalAmount,
      avgOrderValue,
      processing,
      confirmed,
      inquiry,
      cancelled,
      onHold,
      delivered,
      returned,
      pendingReturn,
      handDelivery,
    },
    shippingStats: {
      shipLater,
      inCourier,
      incompleteTotal,
      incompleteBadges: {
        confirmed: confirmed.count,
        processing: processing.count,
        hold: onHold.count,
        cancelled: cancelled.count,
      },
    },
    profitStats: {
      revenue,
      productCost,
      adsCostBdt,
      adsCostUsd,
      deliveryCost,
      returnAmount,
      estProfit,
      finalProfit,
    },
    financeStats: {
      bankBalance,
      stockValue,
      courierBalance,
      courierCount,
      loanCount: loans.length,
      loanTotal,
      investmentTotal,
      netValue,
    },
    salesDetails: {
      paymentStats,
      topProducts,
      hourlyOrders,
      sourceBreakdown,
    },
  };
}

export function useSalesTrend() {
  const now = new Date();
  const from30 = subDays(now, 29);

  return useQuery({
    queryKey: ["sales-trend-30d"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("created_at, total_amount, status")
        .gte("created_at", startOfDay(from30).toISOString())
        .lte("created_at", endOfDay(now).toISOString());
      if (error) throw error;

      const days = eachDayOfInterval({ start: startOfDay(from30), end: startOfDay(now) });
      const dayMap = new Map<string, { orders: number; revenue: number }>();
      for (const d of days) {
        dayMap.set(format(d, "yyyy-MM-dd"), { orders: 0, revenue: 0 });
      }

      for (const o of data || []) {
        const key = format(parseISO(o.created_at), "yyyy-MM-dd");
        const entry = dayMap.get(key);
        if (entry) {
          entry.orders++;
          if (!["cancelled", "returned"].includes(o.status)) {
            entry.revenue += Number(o.total_amount);
          }
        }
      }

      return days.map((d) => {
        const key = format(d, "yyyy-MM-dd");
        const entry = dayMap.get(key)!;
        return { date: format(d, "dd MMM"), orders: entry.orders, revenue: entry.revenue };
      });
    },
  });
}
