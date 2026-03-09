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

// Minimal columns needed for analytics
const ORDER_ANALYTICS_COLS = "id, status, total_amount, delivery_charge, product_cost, discount, payment_status, source, customer_phone, customer_name, created_at, cancel_reason";

export function useAnalyticsData(period: Period) {
  const { from, to } = getDateRange(period);

  return useQuery({
    queryKey: ["analytics", period],
    queryFn: async () => {
      // Fetch orders with only needed columns
      const { data: orders = [] } = await supabase
        .from("orders")
        .select(ORDER_ANALYTICS_COLS)
        .gte("created_at", from.toISOString())
        .lte("created_at", to.toISOString());

      // Previous period - minimal columns
      const prev = getPrevDateRange(from, to);
      const { data: prevOrders = [] } = await supabase
        .from("orders")
        .select("id, total_amount, status")
        .gte("created_at", prev.from.toISOString())
        .lte("created_at", prev.to.toISOString());

      // Order items - only needed columns
      const orderIds = orders.map(o => o.id);
      let orderItems: any[] = [];
      if (orderIds.length > 0) {
        for (let i = 0; i < orderIds.length; i += 200) {
          const batch = orderIds.slice(i, i + 200);
          const { data } = await supabase
            .from("order_items")
            .select("order_id, product_name, product_code, quantity, total_price")
            .in("order_id", batch);
          if (data) orderItems = orderItems.concat(data);
        }
      }

      // Finance in range - minimal columns
      const { data: finance = [] } = await supabase
        .from("finance_records")
        .select("type, amount, label, created_at")
        .gte("created_at", from.toISOString())
        .lte("created_at", to.toISOString());

      // All finance for totals - minimal
      const { data: allFinance = [] } = await supabase
        .from("finance_records")
        .select("type, amount");

      // Ad spends - minimal
      const { data: adSpends = [] } = await supabase
        .from("ad_spends")
        .select("amount_bdt, amount_usd, spend_date")
        .gte("spend_date", format(from, "yyyy-MM-dd"))
        .lte("spend_date", format(to, "yyyy-MM-dd"));

      // Products - only needed columns
      const { data: products = [] } = await supabase
        .from("products")
        .select("status, stock_quantity, purchase_price, selling_price");

      // === Order Stats ===
      const totalOrders = orders.length;
      const statusCounts: Record<string, number> = {};
      for (const o of orders) {
        statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
      }
      const confirmed = statusCounts["confirmed"] || 0;
      const cancelled = statusCounts["cancelled"] || 0;
      const delivered = statusCounts["delivered"] || 0;
      const processing = statusCounts["processing"] || 0;
      const onHold = statusCounts["on_hold"] || 0;
      const inCourier = statusCounts["in_courier"] || 0;
      const returned = statusCounts["returned"] || 0;
      const shipLater = statusCounts["ship_later"] || 0;
      const inquiry = statusCounts["inquiry"] || 0;
      const handDelivery = statusCounts["hand_delivery"] || 0;
      const pendingReturn = statusCounts["pending_return"] || 0;

      const confirmRate = totalOrders > 0 ? Math.round((confirmed / totalOrders) * 100) : 0;
      const cancelRate = totalOrders > 0 ? Math.round((cancelled / totalOrders) * 100) : 0;
      const deliveryRate = (delivered + inCourier) > 0 ? Math.round((delivered / (delivered + inCourier + returned)) * 100) : 0;
      const returnRate = (delivered + returned) > 0 ? Math.round((returned / (delivered + returned)) * 100) : 0;

      let totalRevenue = 0, totalProductCost = 0, totalDelivery = 0, totalDiscount = 0;
      for (const o of orders) {
        totalRevenue += Number(o.total_amount);
        totalProductCost += Number(o.product_cost);
        totalDelivery += Number(o.delivery_charge);
        totalDiscount += Number(o.discount);
      }
      const aov = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

      // === Growth ===
      const prevTotalOrders = prevOrders.length;
      const prevRevenue = prevOrders.reduce((s, o) => s + Number(o.total_amount), 0);
      const orderGrowth = prevTotalOrders > 0 ? Math.round(((totalOrders - prevTotalOrders) / prevTotalOrders) * 100) : 0;
      const revenueGrowth = prevRevenue > 0 ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100) : 0;

      // === Ad Spend ===
      let totalAdSpendBDT = 0, totalAdSpendUSD = 0;
      for (const a of adSpends) {
        totalAdSpendBDT += Number(a.amount_bdt);
        totalAdSpendUSD += Number(a.amount_usd);
      }
      const costPerOrder = totalOrders > 0 ? totalAdSpendBDT / totalOrders : 0;
      const roas = totalAdSpendBDT > 0 ? (totalRevenue / totalAdSpendBDT) : 0;

      // === Profit ===
      const expenseTotal = finance.filter(f => f.type === "expense").reduce((s, f) => s + Number(f.amount), 0);
      const grossProfit = totalRevenue - totalProductCost - totalAdSpendBDT;
      const profitMargin = totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 100) : 0;
      const netProfit = grossProfit - expenseTotal;

      // === Finance Stats (single pass) ===
      let totalIncome = 0, totalExpense = 0, totalProductPurchase = 0;
      for (const f of finance) {
        const amt = Number(f.amount);
        if (f.type === "income") totalIncome += amt;
        else if (f.type === "expense") totalExpense += amt;
        else if (f.type === "product_purchase") totalProductPurchase += amt;
      }

      let bankBalance = 0, totalLoans = 0, totalInvestments = 0;
      for (const f of allFinance) {
        const amt = Number(f.amount);
        if (f.type === "bank") bankBalance += amt;
        else if (f.type === "loan_in") totalLoans += amt;
        else if (f.type === "loan_out") totalLoans -= amt;
        else if (f.type === "investment_in") totalInvestments += amt;
        else if (f.type === "investment_out") totalInvestments -= amt;
      }

      const dayCount = Math.max(1, differenceInDays(to, from) || 1);
      const allExpense = totalExpense + totalProductPurchase;
      const burnRatePerDay = allExpense / dayCount;
      const survivalDays = burnRatePerDay > 0 ? Math.round(bankBalance / burnRatePerDay) : 999;
      const cashFlowStability = totalIncome > 0 ? Math.round(((totalIncome - allExpense) / totalIncome) * 100) : 0;

      // === Product Stats ===
      let activeProducts = 0, outOfStock = 0, lowStock = 0, totalStockValue = 0, totalSellingValue = 0;
      for (const p of products) {
        if (p.status === "active") activeProducts++;
        if (p.stock_quantity <= 0) outOfStock++;
        else if (p.stock_quantity <= 5) lowStock++;
        totalStockValue += Number(p.purchase_price) * p.stock_quantity;
        totalSellingValue += Number(p.selling_price) * p.stock_quantity;
      }
      const potentialProfit = totalSellingValue - totalStockValue;

      // === Customer Insights ===
      const phoneMap = new Map<string, { count: number; total: number; name: string }>();
      for (const o of orders) {
        const phone = o.customer_phone || "unknown";
        const existing = phoneMap.get(phone);
        if (existing) {
          existing.count++;
          existing.total += Number(o.total_amount);
        } else {
          phoneMap.set(phone, { count: 1, total: Number(o.total_amount), name: o.customer_name });
        }
      }
      const uniqueCustomers = phoneMap.size;
      let repeatCustomers = 0;
      for (const c of phoneMap.values()) {
        if (c.count > 1) repeatCustomers++;
      }
      const repeatRate = uniqueCustomers > 0 ? Math.round((repeatCustomers / uniqueCustomers) * 100) : 0;
      const topCustomers = Array.from(phoneMap.entries())
        .map(([phone, d]) => ({ phone, ...d }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);

      // === Source Analysis ===
      const sourceMap = new Map<string, { count: number; revenue: number }>();
      for (const o of orders) {
        const src = o.source || "Direct";
        const existing = sourceMap.get(src);
        if (existing) {
          existing.count++;
          existing.revenue += Number(o.total_amount);
        } else {
          sourceMap.set(src, { count: 1, revenue: Number(o.total_amount) });
        }
      }
      const sourceBreakdown = Array.from(sourceMap.entries())
        .map(([name, d]) => ({ name, orders: d.count, revenue: d.revenue }))
        .sort((a, b) => b.orders - a.orders);

      // === Hourly Heatmap ===
      const hourlyOrders = new Int32Array(24);
      for (const o of orders) {
        hourlyOrders[getHours(new Date(o.created_at))]++;
      }
      const hourlyData = Array.from(hourlyOrders).map((count, hour) => ({
        hour: `${hour.toString().padStart(2, "0")}:00`,
        orders: count,
      }));
      let peakHour = 0, maxOrders = 0;
      for (let i = 0; i < 24; i++) {
        if (hourlyOrders[i] > maxOrders) { maxOrders = hourlyOrders[i]; peakHour = i; }
      }

      // === Top Products ===
      const productSalesMap = new Map<string, { name: string; qty: number; revenue: number }>();
      for (const item of orderItems) {
        const key = item.product_name || item.product_code;
        const existing = productSalesMap.get(key);
        if (existing) {
          existing.qty += Number(item.quantity);
          existing.revenue += Number(item.total_price);
        } else {
          productSalesMap.set(key, { name: key, qty: Number(item.quantity), revenue: Number(item.total_price) });
        }
      }
      const topProducts = Array.from(productSalesMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      // === Conversion Funnel ===
      const funnel = [
        { stage: "Processing", count: totalOrders, pct: 100 },
        { stage: "Confirmed", count: confirmed + inCourier + delivered + handDelivery, pct: totalOrders > 0 ? Math.round(((confirmed + inCourier + delivered + handDelivery) / totalOrders) * 100) : 0 },
        { stage: "In Courier", count: inCourier + delivered, pct: totalOrders > 0 ? Math.round(((inCourier + delivered) / totalOrders) * 100) : 0 },
        { stage: "Delivered", count: delivered, pct: totalOrders > 0 ? Math.round((delivered / totalOrders) * 100) : 0 },
      ];

      // === Daily trend (single pass) ===
      const dailyMap = new Map<string, { orders: number; revenue: number; profit: number }>();
      for (const o of orders) {
        const day = format(new Date(o.created_at), "MM/dd");
        const existing = dailyMap.get(day);
        const amt = Number(o.total_amount);
        const cost = Number(o.product_cost);
        if (existing) {
          existing.orders++;
          existing.revenue += amt;
          existing.profit += (amt - cost);
        } else {
          dailyMap.set(day, { orders: 1, revenue: amt, profit: amt - cost });
        }
      }
      const dailyTrend = Array.from(dailyMap.entries())
        .map(([date, d]) => ({ date, ...d }))
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
      const expenseByLabel = new Map<string, number>();
      for (const f of finance) {
        if (f.type === "expense" || f.type === "product_purchase") {
          const label = f.type === "product_purchase" ? `🛒 ${f.label}` : f.label;
          expenseByLabel.set(label, (expenseByLabel.get(label) || 0) + Number(f.amount));
        }
      }
      const expenseBreakdown = Array.from(expenseByLabel.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      // === Cash flow chart ===
      const cashFlowMap = new Map<string, { cashIn: number; cashOut: number }>();
      for (const f of finance) {
        const day = format(new Date(f.created_at), "MM/dd");
        const existing = cashFlowMap.get(day) || { cashIn: 0, cashOut: 0 };
        const amt = Number(f.amount);
        if (f.type === "income" || f.type === "loan_in" || f.type === "investment_in") {
          existing.cashIn += amt;
        } else if (f.type === "expense" || f.type === "loan_out" || f.type === "investment_out" || f.type === "product_purchase") {
          existing.cashOut += amt;
        }
        cashFlowMap.set(day, existing);
      }
      const cashFlowTrend = Array.from(cashFlowMap.entries())
        .map(([date, d]) => ({ date, ...d }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // === Ad spend trend ===
      const dailyAdSpendMap = new Map<string, number>();
      for (const a of adSpends) {
        const day = format(new Date(a.spend_date), "MM/dd");
        dailyAdSpendMap.set(day, (dailyAdSpendMap.get(day) || 0) + Number(a.amount_bdt));
      }
      const adSpendTrend = Array.from(dailyAdSpendMap.entries())
        .map(([date, spend]) => ({ date, spend, revenue: dailyMap.get(date)?.revenue || 0 }))
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
        growth: { orderGrowth, revenueGrowth, prevOrders: prevTotalOrders, prevRevenue },
        finance: {
          totalIncome, totalExpense: allExpense, totalProductPurchase, bankBalance, totalLoans, totalInvestments,
          burnRatePerDay, survivalDays, cashFlowStability,
        },
        products: {
          active: activeProducts, outOfStock, lowStock, totalStockValue, total: products.length,
          totalSellingValue, potentialProfit,
        },
        customers: { unique: uniqueCustomers, repeat: repeatCustomers, repeatRate, topCustomers },
        sources: sourceBreakdown,
        hourly: { data: hourlyData, peakHour },
        topProducts,
        funnel,
        charts: { dailyTrend, statusBreakdown, expenseBreakdown, cashFlowTrend, adSpendTrend },
      };
    },
    staleTime: 2 * 60 * 1000, // 2 min cache
  });
}
