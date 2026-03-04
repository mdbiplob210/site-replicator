import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays, startOfDay, endOfDay, format, startOfMonth, endOfMonth, subMonths, startOfYear } from "date-fns";

type Period = "today" | "yesterday" | "monthly" | "yearly" | "custom";

function getDateRange(period: Period) {
  const now = new Date();
  switch (period) {
    case "today":
      return { from: startOfDay(now), to: endOfDay(now) };
    case "yesterday":
      const y = subDays(now, 1);
      return { from: startOfDay(y), to: endOfDay(y) };
    case "monthly":
      return { from: startOfMonth(now), to: endOfDay(now) };
    case "yearly":
      return { from: startOfYear(now), to: endOfDay(now) };
    default:
      return { from: subDays(now, 30), to: endOfDay(now) };
  }
}

export function useAnalyticsData(period: Period) {
  const { from, to } = getDateRange(period);

  return useQuery({
    queryKey: ["analytics", period],
    queryFn: async () => {
      // Fetch orders in date range
      const { data: orders = [] } = await supabase
        .from("orders")
        .select("*")
        .gte("created_at", from.toISOString())
        .lte("created_at", to.toISOString());

      // Fetch all orders for general stats
      const { data: allOrders = [] } = await supabase
        .from("orders")
        .select("*");

      // Fetch finance records in date range
      const { data: finance = [] } = await supabase
        .from("finance_records")
        .select("*")
        .gte("created_at", from.toISOString())
        .lte("created_at", to.toISOString());

      // Fetch all finance for totals
      const { data: allFinance = [] } = await supabase
        .from("finance_records")
        .select("*");

      // Fetch ad spends in date range
      const { data: adSpends = [] } = await supabase
        .from("ad_spends")
        .select("*")
        .gte("spend_date", format(from, "yyyy-MM-dd"))
        .lte("spend_date", format(to, "yyyy-MM-dd"));

      // Fetch products
      const { data: products = [] } = await supabase
        .from("products")
        .select("*");

      // === Order Stats ===
      const totalOrders = orders.length;
      const confirmed = orders.filter(o => o.status === "confirmed").length;
      const cancelled = orders.filter(o => o.status === "cancelled").length;
      const delivered = orders.filter(o => o.status === "delivered").length;
      const processing = orders.filter(o => o.status === "processing").length;
      const onHold = orders.filter(o => o.status === "on_hold").length;
      const inCourier = orders.filter(o => o.status === "in_courier").length;
      const returned = orders.filter(o => o.status === "returned").length;
      const shipLater = orders.filter(o => o.status === "ship_later").length;

      const confirmRate = totalOrders > 0 ? Math.round((confirmed / totalOrders) * 100) : 0;
      const cancelRate = totalOrders > 0 ? Math.round((cancelled / totalOrders) * 100) : 0;

      const totalRevenue = orders.reduce((s, o) => s + Number(o.total_amount), 0);
      const totalProductCost = orders.reduce((s, o) => s + Number(o.product_cost), 0);
      const totalDelivery = orders.reduce((s, o) => s + Number(o.delivery_charge), 0);
      const totalDiscount = orders.reduce((s, o) => s + Number(o.discount), 0);

      // === Ad Spend Stats ===
      const totalAdSpendBDT = adSpends.reduce((s, a) => s + Number(a.amount_bdt), 0);
      const totalAdSpendUSD = adSpends.reduce((s, a) => s + Number(a.amount_usd), 0);
      const costPerOrder = totalOrders > 0 ? totalAdSpendBDT / totalOrders : 0;

      // === Profit ===
      const grossProfit = totalRevenue - totalProductCost - totalAdSpendBDT;
      const profitMargin = totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 100) : 0;

      // === Finance Stats ===
      const totalIncome = finance.filter(f => f.type === "income").reduce((s, f) => s + Number(f.amount), 0);
      const totalExpense = finance.filter(f => f.type === "expense").reduce((s, f) => s + Number(f.amount), 0);
      const bankBalance = allFinance.filter(f => f.type === "bank").reduce((s, f) => s + Number(f.amount), 0);
      const totalLoans = allFinance.filter(f => f.type === "loan_in").reduce((s, f) => s + Number(f.amount), 0)
        - allFinance.filter(f => f.type === "loan_out").reduce((s, f) => s + Number(f.amount), 0);

      const burnRatePerDay = finance.length > 0 ? totalExpense / Math.max(1, Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))) : 0;
      const survivalDays = burnRatePerDay > 0 ? Math.round(bankBalance / burnRatePerDay) : 999;
      const cashFlowStability = totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0;

      // === Product Stats ===
      const activeProducts = products.filter(p => p.status === "active").length;
      const outOfStock = products.filter(p => p.stock_quantity <= 0).length;
      const totalStockValue = products.reduce((s, p) => s + Number(p.purchase_price) * p.stock_quantity, 0);

      // === Daily trend data (for charts) ===
      const dailyOrders: Record<string, number> = {};
      const dailyRevenue: Record<string, number> = {};
      orders.forEach(o => {
        const day = format(new Date(o.created_at), "MM/dd");
        dailyOrders[day] = (dailyOrders[day] || 0) + 1;
        dailyRevenue[day] = (dailyRevenue[day] || 0) + Number(o.total_amount);
      });

      const dailyTrend = Object.entries(dailyOrders).map(([date, count]) => ({
        date,
        orders: count,
        revenue: dailyRevenue[date] || 0,
      })).sort((a, b) => a.date.localeCompare(b.date));

      // === Status breakdown for pie chart ===
      const statusBreakdown = [
        { name: "Processing", value: processing, color: "#3b82f6" },
        { name: "Confirmed", value: confirmed, color: "#10b981" },
        { name: "In Courier", value: inCourier, color: "#8b5cf6" },
        { name: "Delivered", value: delivered, color: "#059669" },
        { name: "Cancelled", value: cancelled, color: "#ef4444" },
        { name: "On Hold", value: onHold, color: "#f59e0b" },
        { name: "Returned", value: returned, color: "#f87171" },
        { name: "Ship Later", value: shipLater, color: "#14b8a6" },
      ].filter(s => s.value > 0);

      // === Expense breakdown ===
      const expenseByLabel: Record<string, number> = {};
      finance.filter(f => f.type === "expense").forEach(f => {
        expenseByLabel[f.label] = (expenseByLabel[f.label] || 0) + Number(f.amount);
      });
      const expenseBreakdown = Object.entries(expenseByLabel).map(([name, value]) => ({ name, value }));

      // === Daily finance for cash flow chart ===
      const dailyCashIn: Record<string, number> = {};
      const dailyCashOut: Record<string, number> = {};
      finance.forEach(f => {
        const day = format(new Date(f.created_at), "MM/dd");
        if (f.type === "income" || f.type === "loan_in" || f.type === "investment_in") {
          dailyCashIn[day] = (dailyCashIn[day] || 0) + Number(f.amount);
        } else if (f.type === "expense" || f.type === "loan_out" || f.type === "investment_out") {
          dailyCashOut[day] = (dailyCashOut[day] || 0) + Number(f.amount);
        }
      });
      const allDays = [...new Set([...Object.keys(dailyCashIn), ...Object.keys(dailyCashOut)])].sort();
      const cashFlowTrend = allDays.map(date => ({
        date,
        cashIn: dailyCashIn[date] || 0,
        cashOut: dailyCashOut[date] || 0,
      }));

      return {
        dateRange: { from: format(from, "yyyy-MM-dd"), to: format(to, "yyyy-MM-dd") },
        orders: {
          total: totalOrders, confirmed, cancelled, delivered, processing,
          onHold, inCourier, returned, shipLater,
          confirmRate, cancelRate,
        },
        revenue: {
          total: totalRevenue, productCost: totalProductCost,
          delivery: totalDelivery, discount: totalDiscount,
          adSpendBDT: totalAdSpendBDT, adSpendUSD: totalAdSpendUSD,
          costPerOrder, grossProfit, profitMargin,
        },
        finance: {
          totalIncome, totalExpense, bankBalance, totalLoans,
          burnRatePerDay, survivalDays, cashFlowStability,
        },
        products: {
          active: activeProducts, outOfStock, totalStockValue, total: products.length,
        },
        charts: {
          dailyTrend, statusBreakdown, expenseBreakdown, cashFlowTrend,
        },
      };
    },
  });
}
