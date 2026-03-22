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

  // Only fetch needed columns instead of SELECT *
  const ordersQuery = useQuery({
    queryKey: ["dashboard-orders", filter],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, status, total_amount, delivery_charge, product_cost, payment_status, source, cancel_reason, created_at")
        .gte("created_at", from)
        .lte("created_at", to);
      if (error) throw error;
      return data || [];
    },
    staleTime: 60 * 1000, // 1 min cache for dashboard
  });

  const orderItemsQuery = useQuery({
    queryKey: ["dashboard-order-items", filter],
    queryFn: async () => {
      const orderIds = (ordersQuery.data || []).map((o) => o.id);
      if (orderIds.length === 0) return [];
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
    staleTime: 60 * 1000,
  });

  const financeQuery = useQuery({
    queryKey: ["dashboard-finance"],
    queryFn: async () => {
      const { data, error } = await supabase.from("finance_records").select("type, amount");
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const adSpendQuery = useQuery({
    queryKey: ["dashboard-adspend", filter],
    queryFn: async () => {
      const fromDate = from.split("T")[0];
      const toDate = to.split("T")[0];
      const { data, error } = await supabase
        .from("ad_spends")
        .select("amount_bdt, amount_usd")
        .gte("spend_date", fromDate)
        .lte("spend_date", toDate);
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
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
    staleTime: 5 * 60 * 1000,
  });

  const courierBalanceQuery = useQuery({
    queryKey: ["dashboard-courier-balance"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("total_amount")
        .in("status", ["in_courier", "pending_return"] as any);
      if (error) throw error;
      const items = data || [];
      return { amount: items.reduce((s, o) => s + Number(o.total_amount), 0), count: items.length };
    },
    staleTime: 2 * 60 * 1000,
  });

  const orders = ordersQuery.data || [];
  const orderItems = orderItemsQuery.data || [];
  const finance = financeQuery.data || [];
  const adSpends = adSpendQuery.data || [];
  const products = stockQuery.data || [];
  const courierBalance = courierBalanceQuery.data?.amount || 0;
  const courierCount = courierBalanceQuery.data?.count || 0;

  // Single pass over orders for all stats
  const totalOrders = orders.length;
  let totalAmount = 0;
  const statusCounts: Record<string, { count: number; amount: number }> = {};
  const paymentCounts: Record<string, { count: number; amount: number }> = {};
  let revenue = 0, deliveryCost = 0, productCost = 0, returnAmount = 0;
  const hourlyOrders = new Array(24).fill(0);
  const sourceMap = new Map<string, { count: number; amount: number }>();

  for (const o of orders) {
    const amt = Number(o.total_amount);
    totalAmount += amt;

    // Status counts
    if (!statusCounts[o.status]) statusCounts[o.status] = { count: 0, amount: 0 };
    statusCounts[o.status].count++;
    statusCounts[o.status].amount += amt;

    // Payment stats
    const ps = o.payment_status || "unpaid";
    if (!paymentCounts[ps]) paymentCounts[ps] = { count: 0, amount: 0 };
    paymentCounts[ps].count++;
    paymentCounts[ps].amount += amt;

    // Revenue/cost (exclude cancelled & returned)
    if (o.status !== "cancelled" && o.status !== "returned") {
      revenue += amt;
      deliveryCost += Number(o.delivery_charge);
      productCost += Number(o.product_cost);
    }
    if (o.status === "returned") returnAmount += amt;

    // Hourly
    hourlyOrders[new Date(o.created_at).getHours()]++;

    // Source
    const src = o.source || "Unknown";
    const existing = sourceMap.get(src) || { count: 0, amount: 0 };
    existing.count++;
    existing.amount += amt;
    sourceMap.set(src, existing);
  }

  const sc = (status: string) => {
    const s = statusCounts[status] || { count: 0, amount: 0 };
    return { ...s, pct: totalOrders > 0 ? Math.round((s.count / totalOrders) * 100) : 0 };
  };

  const processing = sc("processing");
  const confirmed = sc("confirmed");
  const inquiry = sc("inquiry");
  const cancelled = sc("cancelled");
  const onHold = sc("on_hold");
  const shipLater = sc("ship_later");
  const inCourier = sc("in_courier");
  const delivered = sc("delivered");
  const returned = sc("returned");
  const pendingReturn = sc("pending_return");
  const handDelivery = sc("hand_delivery");

  const incompleteTotal = processing.count + confirmed.count + inquiry.count + onHold.count + cancelled.count;
  const avgOrderValue = totalOrders > 0 ? Math.round(totalAmount / totalOrders) : 0;

  const paymentStats = {
    paid: paymentCounts["paid"] || { count: 0, amount: 0 },
    unpaid: paymentCounts["unpaid"] || { count: 0, amount: 0 },
    partial: paymentCounts["partial"] || { count: 0, amount: 0 },
  };

  // Use Map for O(1) order lookup instead of O(n) find()
  const orderMap = new Map(orders.map(o => [o.id, o]));
  const productMap = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const item of orderItems) {
    const order = orderMap.get(item.order_id);
    if (!order || order.status === "cancelled" || order.status === "returned") continue;
    const key = item.product_name || item.product_code || "Unknown";
    const existing = productMap.get(key) || { name: key, qty: 0, revenue: 0 };
    existing.qty += Number(item.quantity);
    existing.revenue += Number(item.total_price);
    productMap.set(key, existing);
  }
  const topProducts = Array.from(productMap.values())
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const sourceBreakdown = Array.from(sourceMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.count - a.count);

  const adsCostBdt = adSpends.reduce((s, a) => s + Number(a.amount_bdt), 0);
  const adsCostUsd = adSpends.reduce((s, a) => s + Number(a.amount_usd), 0);
  const estProfit = revenue - productCost - adsCostBdt - deliveryCost;
  const finalProfit = estProfit - returnAmount;

  // Single pass over finance
  let bankBalance = 0, loanIn = 0, loanOut = 0, investIn = 0, investOut = 0;
  let totalIncome = 0, totalExpense = 0, totalProductPurchase = 0, loanCount = 0;
  for (const f of finance) {
    const amt = Number(f.amount);
    switch (f.type) {
      case "bank": bankBalance += amt; break;
      case "loan_in": loanIn += amt; loanCount++; break;
      case "loan_out": loanOut += amt; loanCount++; break;
      case "investment_in": investIn += amt; break;
      case "investment_out": investOut += amt; break;
      case "income": totalIncome += amt; break;
      case "expense": totalExpense += amt; break;
      case "product_purchase": totalProductPurchase += amt; break;
    }
  }
  const loanTotal = loanIn - loanOut;
  const investmentTotal = investIn - investOut;
  const moneyIn = totalIncome + loanIn + investIn;
  const moneyOut = totalExpense + totalProductPurchase + loanOut + investOut;

  const stockValue = products.reduce(
    (s, p) => s + Number(p.purchase_price) * Number(p.stock_quantity),
    0
  );
  const netValue = bankBalance + stockValue + investmentTotal - loanTotal;

  return {
    isLoading: ordersQuery.isLoading || financeQuery.isLoading || adSpendQuery.isLoading || stockQuery.isLoading,
    orderStats: {
      totalOrders, totalAmount, avgOrderValue,
      processing, confirmed, inquiry, cancelled, onHold, delivered, returned, pendingReturn, handDelivery,
    },
    shippingStats: {
      shipLater, inCourier, incompleteTotal,
      incompleteBadges: { confirmed: confirmed.count, processing: processing.count, hold: onHold.count, cancelled: cancelled.count },
    },
    profitStats: { revenue, productCost, adsCostBdt, adsCostUsd, deliveryCost, returnAmount, estProfit, finalProfit },
    financeStats: {
      bankBalance, stockValue, courierBalance, courierCount, loanCount: loans.length, loanTotal,
      investmentTotal, totalIncome, totalExpense, totalProductPurchase, moneyIn, moneyOut, netValue,
    },
    salesDetails: { paymentStats, topProducts, hourlyOrders, sourceBreakdown },
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
    staleTime: 2 * 60 * 1000,
  });
}
