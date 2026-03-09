import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays, startOfDay, endOfDay, format, startOfMonth, endOfMonth, startOfYear, differenceInDays, getHours } from "date-fns";

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

function getPrevDateRange(from: Date, to: Date) {
  const days = differenceInDays(to, from) || 1;
  return { from: subDays(from, days), to: subDays(from, 1) };
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

      // Fetch previous period orders for growth comparison
      const prev = getPrevDateRange(from, to);
      const { data: prevOrders = [] } = await supabase
        .from("orders")
        .select("id, total_amount, status, created_at")
        .gte("created_at", prev.from.toISOString())
        .lte("created_at", prev.to.toISOString());

      // Fetch order items for product analytics
      const orderIds = orders.map(o => o.id);
      let orderItems: any[] = [];
      if (orderIds.length > 0) {
        const { data } = await supabase
          .from("order_items")
          .select("*")
          .in("order_id", orderIds.slice(0, 500));
        orderItems = data || [];
      }

      // Fetch all finance records in range
      const { data: finance = [] } = await supabase
        .from("finance_records")
        .select("*")
        .gte("created_at", from.toISOString())
        .lte("created_at", to.toISOString());

      // All finance for totals
      const { data: allFinance = [] } = await supabase
        .from("finance_records")
        .select("*");

      // Ad spends
      const { data: adSpends = [] } = await supabase
        .from("ad_spends")
        .select("*")
        .gte("spend_date", format(from, "yyyy-MM-dd"))
        .lte("spend_date", format(to, "yyyy-MM-dd"));

      // Products
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
      const inquiry = orders.filter(o => o.status === "inquiry").length;
      const handDelivery = orders.filter(o => o.status === "hand_delivery").length;
      const pendingReturn = orders.filter(o => o.status === "pending_return").length;

      const confirmRate = totalOrders > 0 ? Math.round((confirmed / totalOrders) * 100) : 0;
      const cancelRate = totalOrders > 0 ? Math.round((cancelled / totalOrders) * 100) : 0;
      const deliveryRate = (delivered + inCourier) > 0 ? Math.round((delivered / (delivered + inCourier + returned)) * 100) : 0;
      const returnRate = (delivered + returned) > 0 ? Math.round((returned / (delivered + returned)) * 100) : 0;

      const totalRevenue = orders.reduce((s, o) => s + Number(o.total_amount), 0);
      const totalProductCost = orders.reduce((s, o) => s + Number(o.product_cost), 0);
      const totalDelivery = orders.reduce((s, o) => s + Number(o.delivery_charge), 0);
      const totalDiscount = orders.reduce((s, o) => s + Number(o.discount), 0);
      const aov = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

      // === Growth Comparison ===
      const prevTotalOrders = prevOrders.length;
      const prevRevenue = prevOrders.reduce((s, o) => s + Number(o.total_amount), 0);
      const orderGrowth = prevTotalOrders > 0 ? Math.round(((totalOrders - prevTotalOrders) / prevTotalOrders) * 100) : 0;
      const revenueGrowth = prevRevenue > 0 ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100) : 0;

      // === Ad Spend Stats ===
      const totalAdSpendBDT = adSpends.reduce((s, a) => s + Number(a.amount_bdt), 0);
      const totalAdSpendUSD = adSpends.reduce((s, a) => s + Number(a.amount_usd), 0);
      const costPerOrder = totalOrders > 0 ? totalAdSpendBDT / totalOrders : 0;
      const roas = totalAdSpendBDT > 0 ? (totalRevenue / totalAdSpendBDT) : 0;

      // === Profit ===
      const grossProfit = totalRevenue - totalProductCost - totalAdSpendBDT;
      const profitMargin = totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 100) : 0;
      const netProfit = grossProfit - finance.filter(f => f.type === "expense").reduce((s, f) => s + Number(f.amount), 0);

      // === Finance Stats ===
      const totalIncome = finance.filter(f => f.type === "income").reduce((s, f) => s + Number(f.amount), 0);
      const totalExpense = finance.filter(f => f.type === "expense" || f.type === "product_purchase").reduce((s, f) => s + Number(f.amount), 0);
      const totalProductPurchase = finance.filter(f => f.type === "product_purchase").reduce((s, f) => s + Number(f.amount), 0);
      const bankBalance = allFinance.filter(f => f.type === "bank").reduce((s, f) => s + Number(f.amount), 0);
      const totalLoans = allFinance.filter(f => f.type === "loan_in").reduce((s, f) => s + Number(f.amount), 0)
        - allFinance.filter(f => f.type === "loan_out").reduce((s, f) => s + Number(f.amount), 0);
      const totalInvestments = allFinance.filter(f => f.type === "investment_in").reduce((s, f) => s + Number(f.amount), 0)
        - allFinance.filter(f => f.type === "investment_out").reduce((s, f) => s + Number(f.amount), 0);

      const dayCount = Math.max(1, differenceInDays(to, from) || 1);
      const burnRatePerDay = totalExpense / dayCount;
      const survivalDays = burnRatePerDay > 0 ? Math.round(bankBalance / burnRatePerDay) : 999;
      const cashFlowStability = totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0;

      // === Product Stats ===
      const activeProducts = products.filter(p => p.status === "active").length;
      const outOfStock = products.filter(p => p.stock_quantity <= 0).length;
      const lowStock = products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= 5).length;
      const totalStockValue = products.reduce((s, p) => s + Number(p.purchase_price) * p.stock_quantity, 0);
      const totalSellingValue = products.reduce((s, p) => s + Number(p.selling_price) * p.stock_quantity, 0);
      const potentialProfit = totalSellingValue - totalStockValue;

      // === Customer Insights ===
      const phoneMap: Record<string, { count: number; total: number; name: string }> = {};
      orders.forEach(o => {
        const phone = o.customer_phone || "unknown";
        if (!phoneMap[phone]) phoneMap[phone] = { count: 0, total: 0, name: o.customer_name };
        phoneMap[phone].count++;
        phoneMap[phone].total += Number(o.total_amount);
      });
      const uniqueCustomers = Object.keys(phoneMap).length;
      const repeatCustomers = Object.values(phoneMap).filter(c => c.count > 1).length;
      const repeatRate = uniqueCustomers > 0 ? Math.round((repeatCustomers / uniqueCustomers) * 100) : 0;
      const topCustomers = Object.entries(phoneMap)
        .map(([phone, d]) => ({ phone, ...d }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);

      // === Source Analysis ===
      const sourceMap: Record<string, { count: number; revenue: number }> = {};
      orders.forEach(o => {
        const src = o.source || "Direct";
        if (!sourceMap[src]) sourceMap[src] = { count: 0, revenue: 0 };
        sourceMap[src].count++;
        sourceMap[src].revenue += Number(o.total_amount);
      });
      const sourceBreakdown = Object.entries(sourceMap)
        .map(([name, d]) => ({ name, orders: d.count, revenue: d.revenue }))
        .sort((a, b) => b.orders - a.orders);

      // === Hourly Heatmap ===
      const hourlyOrders = Array(24).fill(0);
      orders.forEach(o => {
        const hour = getHours(new Date(o.created_at));
        hourlyOrders[hour]++;
      });
      const hourlyData = hourlyOrders.map((count, hour) => ({
        hour: `${hour.toString().padStart(2, "0")}:00`,
        orders: count,
      }));
      const peakHour = hourlyOrders.indexOf(Math.max(...hourlyOrders));

      // === Top Products ===
      const productSalesMap: Record<string, { name: string; qty: number; revenue: number }> = {};
      orderItems.forEach(item => {
        const key = item.product_name || item.product_code;
        if (!productSalesMap[key]) productSalesMap[key] = { name: key, qty: 0, revenue: 0 };
        productSalesMap[key].qty += Number(item.quantity);
        productSalesMap[key].revenue += Number(item.total_price);
      });
      const topProducts = Object.values(productSalesMap)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      // === Conversion Funnel ===
      const funnel = [
        { stage: "Processing", count: totalOrders, pct: 100 },
        { stage: "Confirmed", count: confirmed + inCourier + delivered + handDelivery, pct: totalOrders > 0 ? Math.round(((confirmed + inCourier + delivered + handDelivery) / totalOrders) * 100) : 0 },
        { stage: "In Courier", count: inCourier + delivered, pct: totalOrders > 0 ? Math.round(((inCourier + delivered) / totalOrders) * 100) : 0 },
        { stage: "Delivered", count: delivered, pct: totalOrders > 0 ? Math.round((delivered / totalOrders) * 100) : 0 },
      ];

      // === Daily trend data ===
      const dailyOrders: Record<string, number> = {};
      const dailyRevenue: Record<string, number> = {};
      const dailyProfit: Record<string, number> = {};
      orders.forEach(o => {
        const day = format(new Date(o.created_at), "MM/dd");
        dailyOrders[day] = (dailyOrders[day] || 0) + 1;
        dailyRevenue[day] = (dailyRevenue[day] || 0) + Number(o.total_amount);
        dailyProfit[day] = (dailyProfit[day] || 0) + (Number(o.total_amount) - Number(o.product_cost));
      });

      const dailyTrend = Object.entries(dailyOrders)
        .map(([date, count]) => ({
          date,
          orders: count,
          revenue: dailyRevenue[date] || 0,
          profit: dailyProfit[date] || 0,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // === Status breakdown ===
      const statusBreakdown = [
        { name: "Processing", value: processing },
        { name: "Confirmed", value: confirmed },
        { name: "In Courier", value: inCourier },
        { name: "Delivered", value: delivered },
        { name: "Cancelled", value: cancelled },
        { name: "On Hold", value: onHold },
        { name: "Returned", value: returned },
        { name: "Ship Later", value: shipLater },
        { name: "Inquiry", value: inquiry },
        { name: "Hand Delivery", value: handDelivery },
        { name: "Pending Return", value: pendingReturn },
      ].filter(s => s.value > 0);

      // === Expense breakdown ===
      const expenseByLabel: Record<string, number> = {};
      finance.filter(f => f.type === "expense" || f.type === "product_purchase").forEach(f => {
        const label = f.type === "product_purchase" ? `🛒 ${f.label}` : f.label;
        expenseByLabel[label] = (expenseByLabel[label] || 0) + Number(f.amount);
      });
      const expenseBreakdown = Object.entries(expenseByLabel).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

      // === Cash flow chart ===
      const dailyCashIn: Record<string, number> = {};
      const dailyCashOut: Record<string, number> = {};
      finance.forEach(f => {
        const day = format(new Date(f.created_at), "MM/dd");
        if (f.type === "income" || f.type === "loan_in" || f.type === "investment_in") {
          dailyCashIn[day] = (dailyCashIn[day] || 0) + Number(f.amount);
        } else if (f.type === "expense" || f.type === "loan_out" || f.type === "investment_out" || f.type === "product_purchase") {
          dailyCashOut[day] = (dailyCashOut[day] || 0) + Number(f.amount);
        }
      });
      const allDays = [...new Set([...Object.keys(dailyCashIn), ...Object.keys(dailyCashOut)])].sort();
      const cashFlowTrend = allDays.map(date => ({
        date,
        cashIn: dailyCashIn[date] || 0,
        cashOut: dailyCashOut[date] || 0,
      }));

      // === Daily Ad spend data ===
      const dailyAdSpend: Record<string, number> = {};
      adSpends.forEach(a => {
        const day = format(new Date(a.spend_date), "MM/dd");
        dailyAdSpend[day] = (dailyAdSpend[day] || 0) + Number(a.amount_bdt);
      });
      const adSpendTrend = Object.entries(dailyAdSpend)
        .map(([date, spend]) => ({ date, spend, revenue: dailyRevenue[date] || 0 }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return {
        dateRange: { from: format(from, "yyyy-MM-dd"), to: format(to, "yyyy-MM-dd") },
        orders: {
          total: totalOrders, confirmed, cancelled, delivered, processing,
          onHold, inCourier, returned, shipLater, inquiry, handDelivery, pendingReturn,
          confirmRate, cancelRate, deliveryRate, returnRate,
        },
        revenue: {
          total: totalRevenue, productCost: totalProductCost,
          delivery: totalDelivery, discount: totalDiscount,
          adSpendBDT: totalAdSpendBDT, adSpendUSD: totalAdSpendUSD,
          costPerOrder, grossProfit, profitMargin, netProfit, aov, roas,
        },
        growth: {
          orderGrowth, revenueGrowth,
          prevOrders: prevTotalOrders, prevRevenue,
        },
        finance: {
          totalIncome, totalExpense, totalProductPurchase, bankBalance, totalLoans, totalInvestments,
          burnRatePerDay, survivalDays, cashFlowStability,
        },
        products: {
          active: activeProducts, outOfStock, lowStock, totalStockValue, total: products.length,
          totalSellingValue, potentialProfit,
        },
        customers: {
          unique: uniqueCustomers, repeat: repeatCustomers, repeatRate, topCustomers,
        },
        sources: sourceBreakdown,
        hourly: { data: hourlyData, peakHour },
        topProducts,
        funnel,
        charts: {
          dailyTrend, statusBreakdown, expenseBreakdown, cashFlowTrend, adSpendTrend,
        },
      };
    },
  });
}
