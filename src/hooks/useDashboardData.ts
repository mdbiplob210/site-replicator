import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, endOfDay, startOfWeek, startOfMonth, subDays } from "date-fns";

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

  const orders = ordersQuery.data || [];
  const finance = financeQuery.data || [];
  const adSpends = adSpendQuery.data || [];
  const products = stockQuery.data || [];

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
  const cancelled = countAndAmount("cancelled");
  const onHold = countAndAmount("on_hold");
  const shipLater = countAndAmount("ship_later");
  const inCourier = countAndAmount("in_courier");

  // Incomplete = processing + confirmed + on_hold + cancelled (not yet shipped/delivered)
  const incompleteTotal = processing.count + confirmed.count + onHold.count + cancelled.count;

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
      processing,
      confirmed,
      cancelled,
      onHold,
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
      loanCount: loans.length,
      loanTotal,
      investmentTotal,
      netValue,
    },
  };
}
