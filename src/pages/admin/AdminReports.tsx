import { useState, useEffect, useMemo } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  FileText, BarChart3, PlusCircle, History, ShoppingCart,
  Megaphone, Wallet, TrendingUp, Target, DollarSign,
  RotateCcw, Package, Calendar, Save, FileCheck, Loader2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { startOfDay, endOfDay, subDays, startOfWeek, startOfMonth, endOfMonth, subMonths, format } from "date-fns";

type Tab = "auto" | "manual" | "product" | "history";
type Period = "today" | "yesterday" | "weekly" | "monthly" | "custom";

interface Product {
  id: string;
  name: string;
  selling_price: number;
  purchase_price: number;
  additional_cost: number;
}

function getDateRange(period: Period) {
  const now = new Date();
  switch (period) {
    case "yesterday": {
      const y = subDays(now, 1);
      return { from: startOfDay(y).toISOString(), to: endOfDay(y).toISOString(), fromDate: format(y, "yyyy-MM-dd"), toDate: format(y, "yyyy-MM-dd") };
    }
    case "weekly":
      return { from: startOfWeek(now, { weekStartsOn: 6 }).toISOString(), to: endOfDay(now).toISOString(), fromDate: format(startOfWeek(now, { weekStartsOn: 6 }), "yyyy-MM-dd"), toDate: format(now, "yyyy-MM-dd") };
    case "monthly":
      return { from: startOfMonth(now).toISOString(), to: endOfDay(now).toISOString(), fromDate: format(startOfMonth(now), "yyyy-MM-dd"), toDate: format(now, "yyyy-MM-dd") };
    default:
      return { from: startOfDay(now).toISOString(), to: endOfDay(now).toISOString(), fromDate: format(now, "yyyy-MM-dd"), toDate: format(now, "yyyy-MM-dd") };
  }
}

export default function AdminReports() {
  const [tab, setTab] = useState<Tab>("auto");
  const [period, setPeriod] = useState<Period>("today");
  const [useDemo, setUseDemo] = useState(false);

  // Manual report state
  const [adsSpendUsd, setAdsSpendUsd] = useState("0");
  const [dollarRate, setDollarRate] = useState("121");
  const [returnPercent, setReturnPercent] = useState("0");
  const [costPerReturn, setCostPerReturn] = useState("0");
  const [products, setProducts] = useState<Product[]>([]);
  const [productQty, setProductQty] = useState<Record<string, number>>({});
  const [reportDate, setReportDate] = useState(() => format(new Date(), "MM/dd/yyyy"));

  const { from, to, fromDate, toDate } = getDateRange(period);

  // Cross-connect: Orders data for auto reports
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["reports-orders", period],
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

  // Cross-connect: Ad spends for auto reports
  const { data: adSpends = [] } = useQuery({
    queryKey: ["reports-adspends", period],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ad_spends")
        .select("*")
        .gte("spend_date", fromDate)
        .lte("spend_date", toDate);
      if (error) throw error;
      return data || [];
    },
  });

  // Cross-connect: Finance records
  const { data: financeRecords = [] } = useQuery({
    queryKey: ["reports-finance", period],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("finance_records")
        .select("*")
        .gte("created_at", from)
        .lte("created_at", to);
      if (error) throw error;
      return data || [];
    },
  });

  // Cross-connect: Order items for product-wise report
  const { data: orderItems = [] } = useQuery({
    queryKey: ["reports-order-items", period],
    queryFn: async () => {
      const orderIds = orders.map((o: any) => o.id);
      if (orderIds.length === 0) return [] as any[];
      const { data, error } = await supabase
        .from("order_items")
        .select("*")
        .in("order_id", orderIds);
      if (error) throw error;
      return data || [];
    },
    enabled: orders.length > 0,
  });

  // Cross-connect: Product purchase items (expense per product)
  const { data: purchaseItems = [] } = useQuery({
    queryKey: ["reports-purchase-items", period],
    queryFn: async () => {
      const { data: financeIds } = await supabase
        .from("finance_records")
        .select("id")
        .eq("type", "product_purchase")
        .gte("created_at", from)
        .lte("created_at", to);
      const ids = (financeIds || []).map((f: any) => f.id);
      if (ids.length === 0) return [] as any[];
      const { data, error } = await supabase
        .from("product_purchase_items")
        .select("*")
        .in("finance_record_id", ids);
      if (error) throw error;
      return data || [];
    },
  });

  useEffect(() => {
    supabase
      .from("products")
      .select("id, name, selling_price, purchase_price, additional_cost")
      .eq("status", "active")
      .then(({ data }) => {
        if (data) setProducts(data);
      });
  }, []);

  // Auto report calculations from real data
  const autoReport = useMemo(() => {
    const totalOrders = orders.length;
    const confirmedOrders = orders.filter(o => !["cancelled", "returned"].includes(o.status));
    const cancelledOrders = orders.filter(o => o.status === "cancelled");
    const deliveredOrders = orders.filter(o => o.status === "delivered");
    const returnedOrders = orders.filter(o => o.status === "returned");

    const totalRevenue = confirmedOrders.reduce((s, o) => s + Number(o.total_amount), 0);
    const totalProductCost = confirmedOrders.reduce((s, o) => s + Number(o.product_cost), 0);
    const totalDelivery = confirmedOrders.reduce((s, o) => s + Number(o.delivery_charge), 0);
    const totalDiscount = confirmedOrders.reduce((s, o) => s + Number(o.discount), 0);
    const returnAmount = returnedOrders.reduce((s, o) => s + Number(o.total_amount), 0);

    const adsCostUsd = adSpends.reduce((s, a) => s + Number(a.amount_usd), 0);
    const adsCostBdt = adSpends.reduce((s, a) => s + Number(a.amount_bdt), 0);

    const moneyIn = financeRecords.filter(f => ["income", "loan_in", "investment_in"].includes(f.type)).reduce((s, f) => s + Number(f.amount), 0);
    const moneyOut = financeRecords.filter(f => ["expense", "loan_out", "investment_out"].includes(f.type)).reduce((s, f) => s + Number(f.amount), 0);

    const grossProfit = totalRevenue - totalProductCost - adsCostBdt - totalDelivery;
    const netProfit = grossProfit - returnAmount;
    const confirmRate = totalOrders > 0 ? ((confirmedOrders.length / totalOrders) * 100).toFixed(1) : "0";
    const cancelRate = totalOrders > 0 ? ((cancelledOrders.length / totalOrders) * 100).toFixed(1) : "0";
    const cps = confirmedOrders.length > 0 ? adsCostBdt / confirmedOrders.length : 0;
    const cpsDollar = confirmedOrders.length > 0 ? adsCostUsd / confirmedOrders.length : 0;

    return {
      totalOrders, confirmedCount: confirmedOrders.length, cancelledCount: cancelledOrders.length,
      deliveredCount: deliveredOrders.length, returnedCount: returnedOrders.length,
      totalRevenue, totalProductCost, totalDelivery, totalDiscount, returnAmount,
      adsCostUsd, adsCostBdt, moneyIn, moneyOut,
      grossProfit, netProfit, confirmRate, cancelRate, cps, cpsDollar,
    };
  }, [orders, adSpends, financeRecords]);

  const adsCostBdt = useMemo(() => {
    const usd = parseFloat(adsSpendUsd) || 0;
    const rate = parseFloat(dollarRate) || 0;
    return usd * rate;
  }, [adsSpendUsd, dollarRate]);

  const summary = useMemo(() => {
    let totalSold = 0, totalProductCost = 0, totalSales = 0;
    products.forEach((p) => {
      const qty = productQty[p.id] || 0;
      totalSold += qty;
      totalProductCost += qty * (p.purchase_price + p.additional_cost);
      totalSales += qty * p.selling_price;
    });
    const grossProfit = totalSales - totalProductCost - adsCostBdt;
    const returnAdj = totalSales * ((parseFloat(returnPercent) || 0) / 100);
    const returnCostAdj = totalSold * (parseFloat(costPerReturn) || 0) * ((parseFloat(returnPercent) || 0) / 100);
    const finalProfit = grossProfit - returnAdj - returnCostAdj;
    const cps = totalSold > 0 ? adsCostBdt / totalSold : 0;
    const cpsDollar = totalSold > 0 ? (parseFloat(adsSpendUsd) || 0) / totalSold : 0;
    return { totalSold, totalProductCost, totalSales, adsCostBdt, cps, cpsDollar, grossProfit, finalProfit };
  }, [products, productQty, adsCostBdt, returnPercent, costPerReturn, adsSpendUsd]);

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "auto", label: "Auto Reports", icon: BarChart3 },
    { id: "product", label: "Product Wise", icon: Package },
    { id: "manual", label: "Manual Report", icon: PlusCircle },
    { id: "history", label: "History", icon: FileCheck },
  ];

  // Demo dataset for preview/learning
  const demoReport = useMemo(() => {
    const rows = [
      { product_name: "Premium T-Shirt",   product_code: "TSH-001", orderCount: 18, qty: 22, unitCost: 280, revenue: 13200, purchaseQty: 30, purchaseCost: 8400 },
      { product_name: "Smart Watch X1",    product_code: "WCH-101", orderCount: 9,  qty: 11, unitCost: 1450, revenue: 24750, purchaseQty: 15, purchaseCost: 21750 },
      { product_name: "Wireless Earbuds",  product_code: "EAR-220", orderCount: 14, qty: 16, unitCost: 620, revenue: 19200, purchaseQty: 20, purchaseCost: 12400 },
      { product_name: "Leather Wallet",    product_code: "WAL-050", orderCount: 7,  qty: 9,  unitCost: 340, revenue: 6750,  purchaseQty: 12, purchaseCost: 4080 },
      { product_name: "Sports Cap",        product_code: "CAP-007", orderCount: 5,  qty: 6,  unitCost: 150, revenue: 2400,  purchaseQty: 10, purchaseCost: 1500 },
    ].map(r => {
      const soldCogs = r.unitCost * r.qty;
      return { ...r, product_id: null, orders: new Set<string>(), soldCogs, profit: r.revenue - soldCogs };
    });
    const totals = rows.reduce((a, r) => ({
      orders: a.orders + r.orderCount, qty: a.qty + r.qty, revenue: a.revenue + r.revenue,
      cogs: a.cogs + r.soldCogs, purchase: a.purchase + r.purchaseCost, profit: a.profit + r.profit,
    }), { orders: 0, qty: 0, revenue: 0, cogs: 0, purchase: 0, profit: 0 });
    return { rows, totals, adsCostBdt: 4800, adsCostUsd: 40, deliveryCost: 3120, otherExpense: 800 };
  }, []);

  // Product-wise aggregation
  const productReport = useMemo(() => {
    const map = new Map<string, {
      product_id: string | null;
      product_name: string;
      product_code: string;
      orders: Set<string>;
      qty: number;
      revenue: number;
      purchaseQty: number;
      purchaseCost: number;
    }>();
    const keyOf = (id: string | null, name: string) => id || `name:${name}`;

    for (const it of orderItems as any[]) {
      const order = (orders as any[]).find(o => o.id === it.order_id);
      if (!order) continue;
      if (["cancelled", "returned"].includes(order.status)) continue;
      const k = keyOf(it.product_id, it.product_name);
      const existing = map.get(k) || {
        product_id: it.product_id, product_name: it.product_name, product_code: it.product_code || "",
        orders: new Set<string>(), qty: 0, revenue: 0, purchaseQty: 0, purchaseCost: 0,
      };
      existing.orders.add(it.order_id);
      existing.qty += Number(it.quantity);
      existing.revenue += Number(it.total_price);
      map.set(k, existing);
    }

    for (const pi of purchaseItems as any[]) {
      const k = keyOf(pi.product_id, pi.product_name);
      const existing = map.get(k) || {
        product_id: pi.product_id, product_name: pi.product_name, product_code: pi.product_code || "",
        orders: new Set<string>(), qty: 0, revenue: 0, purchaseQty: 0, purchaseCost: 0,
      };
      existing.purchaseQty += Number(pi.quantity);
      existing.purchaseCost += Number(pi.total_amount);
      map.set(k, existing);
    }

    const rows = Array.from(map.values()).map(r => {
      const product = products.find(p => p.id === r.product_id);
      const unitCost = product ? (product.purchase_price + product.additional_cost) : (r.purchaseQty > 0 ? r.purchaseCost / r.purchaseQty : 0);
      const soldCogs = unitCost * r.qty;
      const profit = r.revenue - soldCogs;
      return {
        ...r,
        orderCount: r.orders.size,
        unitCost,
        soldCogs,
        profit,
      };
    }).sort((a, b) => b.revenue - a.revenue);

    const totals = rows.reduce((acc, r) => {
      acc.orders += r.orderCount;
      acc.qty += r.qty;
      acc.revenue += r.revenue;
      acc.cogs += r.soldCogs;
      acc.purchase += r.purchaseCost;
      acc.profit += r.profit;
      return acc;
    }, { orders: 0, qty: 0, revenue: 0, cogs: 0, purchase: 0, profit: 0 });

    return { rows, totals };
  }, [orderItems, orders, purchaseItems, products]);

  // Active dataset (real or demo)
  const activeReport = useDemo
    ? { rows: demoReport.rows, totals: demoReport.totals, adsCostBdt: demoReport.adsCostBdt, adsCostUsd: demoReport.adsCostUsd, deliveryCost: demoReport.deliveryCost, otherExpense: demoReport.otherExpense }
    : { rows: productReport.rows, totals: productReport.totals, adsCostBdt: autoReport.adsCostBdt, adsCostUsd: autoReport.adsCostUsd, deliveryCost: autoReport.totalDelivery, otherExpense: autoReport.moneyOut };

  const totalExpense = activeReport.totals.cogs + activeReport.adsCostBdt + activeReport.deliveryCost + activeReport.otherExpense;
  const netProfit = activeReport.totals.revenue - totalExpense;
  const profitMargin = activeReport.totals.revenue > 0 ? (netProfit / activeReport.totals.revenue) * 100 : 0;
  const aov = activeReport.totals.orders > 0 ? activeReport.totals.revenue / activeReport.totals.orders : 0;



  const fmt = (n: number) => `৳${n.toLocaleString()}`;

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Daily Reports</h1>
            <p className="text-sm text-muted-foreground">Track daily sales, advertising spend, and profit analytics</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                tab === t.id
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Period Filter */}
        <div className="flex gap-2">
          {(["today", "yesterday", "weekly", "monthly", "custom"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                period === p
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>

        {/* Auto Reports Tab */}
        {tab === "auto" && (
          <div className="space-y-5">
            {ordersLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { icon: ShoppingCart, value: autoReport.totalOrders, label: "Total Orders", color: "text-primary" },
                    { icon: DollarSign, value: fmt(autoReport.totalRevenue), label: "Revenue", color: "text-emerald-600" },
                    { icon: Megaphone, value: fmt(autoReport.adsCostBdt), label: `Ad Spend ($${autoReport.adsCostUsd.toFixed(2)})`, color: "text-violet-600" },
                    { icon: TrendingUp, value: fmt(autoReport.netProfit), label: "Net Profit", color: autoReport.netProfit >= 0 ? "text-emerald-600" : "text-destructive" },
                  ].map((s, i) => (
                    <div key={i} className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-xl bg-secondary flex items-center justify-center ${s.color}`}>
                        <s.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xl font-bold text-foreground">{s.value}</p>
                        <p className="text-xs text-muted-foreground">{s.label}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* CPS & Rates */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-card rounded-2xl border border-border p-4">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase">CPS (৳)</p>
                    <p className="text-lg font-bold text-foreground mt-1">৳{autoReport.cps.toFixed(0)}</p>
                  </div>
                  <div className="bg-card rounded-2xl border border-border p-4">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase">CPS ($)</p>
                    <p className="text-lg font-bold text-foreground mt-1">${autoReport.cpsDollar.toFixed(2)}</p>
                  </div>
                  <div className="bg-card rounded-2xl border border-border p-4">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase">Confirm Rate</p>
                    <p className="text-lg font-bold text-emerald-600 mt-1">{autoReport.confirmRate}%</p>
                  </div>
                  <div className="bg-card rounded-2xl border border-border p-4">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase">Cancel Rate</p>
                    <p className="text-lg font-bold text-destructive mt-1">{autoReport.cancelRate}%</p>
                  </div>
                </div>

                {/* Detailed Breakdown */}
                <div className="bg-card rounded-2xl border border-border p-5">
                  <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" /> Detailed Breakdown
                  </h3>
                  <div className="bg-secondary/30 rounded-xl p-5 space-y-2 font-mono text-sm text-foreground">
                    <p>📅 Period: {period.charAt(0).toUpperCase() + period.slice(1)}</p>
                    <br />
                    <p>📦 Order Status:</p>
                    <p className="ml-4">Confirmed: {autoReport.confirmedCount} | Cancelled: {autoReport.cancelledCount}</p>
                    <p className="ml-4">Delivered: {autoReport.deliveredCount} | Returned: {autoReport.returnedCount}</p>
                    <br />
                    <p>💰 Financial:</p>
                    <p className="ml-4">Revenue: {fmt(autoReport.totalRevenue)}</p>
                    <p className="ml-4">Product Cost: {fmt(autoReport.totalProductCost)}</p>
                    <p className="ml-4">Delivery Cost: {fmt(autoReport.totalDelivery)}</p>
                    <p className="ml-4">Discount Given: {fmt(autoReport.totalDiscount)}</p>
                    <p className="ml-4">Ad Spend: ${autoReport.adsCostUsd.toFixed(2)} ({fmt(autoReport.adsCostBdt)})</p>
                    <p className="ml-4">Returns: {fmt(autoReport.returnAmount)}</p>
                    <br />
                    <p className="ml-4">Gross Profit: {fmt(autoReport.grossProfit)}</p>
                    <p className="ml-4 font-bold">✅ Net Profit: {fmt(autoReport.netProfit)}</p>
                    {autoReport.moneyIn > 0 && (
                      <>
                        <br />
                        <p>🏦 Cash Flow:</p>
                        <p className="ml-4">Money In: {fmt(autoReport.moneyIn)} | Money Out: {fmt(autoReport.moneyOut)}</p>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Product Wise Report Tab */}
        {tab === "product" && (
          <div className="space-y-5">
            {ordersLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (
              <>
                {/* Demo toggle */}
                <div className="flex items-center justify-between bg-card rounded-2xl border border-border p-4">
                  <div>
                    <p className="font-semibold text-foreground">Demo Mode</p>
                    <p className="text-xs text-muted-foreground">{useDemo ? "Sample data দেখাচ্ছে — কীভাবে report কাজ করে বোঝার জন্য" : "Real (live) data দেখাচ্ছে এই period-এর জন্য"}</p>
                  </div>
                  <Button variant={useDemo ? "default" : "outline"} onClick={() => setUseDemo(v => !v)} className="rounded-xl">
                    {useDemo ? "Demo: ON" : "Demo Data দেখুন"}
                  </Button>
                </div>

                {/* Top KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { icon: ShoppingCart, value: activeReport.totals.orders, label: "Total Orders", color: "text-primary" },
                    { icon: Package, value: activeReport.totals.qty, label: "Units Sold", color: "text-blue-600" },
                    { icon: DollarSign, value: fmt(activeReport.totals.revenue), label: "Total Add (Revenue)", color: "text-emerald-600" },
                    { icon: Wallet, value: fmt(totalExpense), label: "Total Expense", color: "text-orange-500" },
                  ].map((s, i) => (
                    <div key={i} className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-xl bg-secondary flex items-center justify-center ${s.color}`}>
                        <s.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xl font-bold text-foreground">{s.value}</p>
                        <p className="text-xs text-muted-foreground">{s.label}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Profit Hero */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 rounded-2xl border border-emerald-500/20 p-5">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Sales Profit (Revenue − COGS)</p>
                    <p className={`text-2xl font-bold mt-2 ${activeReport.totals.profit >= 0 ? "text-emerald-600" : "text-destructive"}`}>{fmt(activeReport.totals.profit)}</p>
                    <p className="text-xs text-muted-foreground mt-1">শুধু পণ্য বিক্রির লাভ</p>
                  </div>
                  <div className="bg-gradient-to-br from-primary/15 to-primary/5 rounded-2xl border border-primary/20 p-5">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Net Profit (All Expenses)</p>
                    <p className={`text-2xl font-bold mt-2 ${netProfit >= 0 ? "text-emerald-600" : "text-destructive"}`}>{fmt(netProfit)}</p>
                    <p className="text-xs text-muted-foreground mt-1">Margin: {profitMargin.toFixed(1)}%</p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-500/15 to-blue-500/5 rounded-2xl border border-blue-500/20 p-5">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Average Order Value</p>
                    <p className="text-2xl font-bold mt-2 text-blue-600">{fmt(aov)}</p>
                    <p className="text-xs text-muted-foreground mt-1">প্রতি order-এ গড় বিক্রয়</p>
                  </div>
                </div>

                {/* Expense Breakdown */}
                <div className="bg-card rounded-2xl border border-border p-5">
                  <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-orange-500" /> Total Expense Breakdown
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: "COGS (Product Cost)", value: activeReport.totals.cogs, color: "bg-orange-500/10 text-orange-600" },
                      { label: "Ad Spend", value: activeReport.adsCostBdt, color: "bg-violet-500/10 text-violet-600", sub: `$${activeReport.adsCostUsd.toFixed(2)}` },
                      { label: "Delivery Cost", value: activeReport.deliveryCost, color: "bg-blue-500/10 text-blue-600" },
                      { label: "Other Expense", value: activeReport.otherExpense, color: "bg-rose-500/10 text-rose-600" },
                    ].map((e, i) => (
                      <div key={i} className={`rounded-xl p-3 ${e.color.split(" ")[0]}`}>
                        <p className="text-[10px] font-semibold uppercase text-muted-foreground">{e.label}</p>
                        <p className={`text-lg font-bold mt-1 ${e.color.split(" ")[1]}`}>{fmt(e.value)}</p>
                        {e.sub && <p className="text-[10px] text-muted-foreground">{e.sub}</p>}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">আজকের মোট খরচ</p>
                    <p className="text-xl font-bold text-orange-600">{fmt(totalExpense)}</p>
                  </div>
                </div>

                {/* Best & Worst */}
                {activeReport.rows.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(() => {
                      const sorted = [...activeReport.rows].sort((a, b) => b.profit - a.profit);
                      const best = sorted[0];
                      const worst = sorted[sorted.length - 1];
                      return (
                        <>
                          <div className="bg-card rounded-2xl border border-emerald-500/30 p-4">
                            <p className="text-xs font-semibold text-emerald-600 uppercase">🏆 সবচেয়ে লাভজনক Product</p>
                            <p className="text-lg font-bold text-foreground mt-2">{best.product_name}</p>
                            <p className="text-sm text-muted-foreground">Profit: <span className="text-emerald-600 font-semibold">{fmt(best.profit)}</span> · Units: {best.qty}</p>
                          </div>
                          <div className="bg-card rounded-2xl border border-destructive/30 p-4">
                            <p className="text-xs font-semibold text-destructive uppercase">⚠️ সবচেয়ে কম লাভ Product</p>
                            <p className="text-lg font-bold text-foreground mt-2">{worst.product_name}</p>
                            <p className="text-sm text-muted-foreground">Profit: <span className={worst.profit >= 0 ? "text-emerald-600 font-semibold" : "text-destructive font-semibold"}>{fmt(worst.profit)}</span> · Units: {worst.qty}</p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}

                {/* Per Product Table */}
                <div className="bg-card rounded-2xl border border-border overflow-hidden">
                  <div className="p-4 border-b border-border flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-bold text-foreground">Per Product Breakdown</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-secondary/50">
                        <tr className="text-left">
                          <th className="px-4 py-3 font-semibold">Product</th>
                          <th className="px-4 py-3 font-semibold text-right">Orders</th>
                          <th className="px-4 py-3 font-semibold text-right">Units</th>
                          <th className="px-4 py-3 font-semibold text-right">Revenue</th>
                          <th className="px-4 py-3 font-semibold text-right">Unit Cost</th>
                          <th className="px-4 py-3 font-semibold text-right">COGS (খরচ)</th>
                          <th className="px-4 py-3 font-semibold text-right">Purchase</th>
                          <th className="px-4 py-3 font-semibold text-right">Profit (লাভ)</th>
                          <th className="px-4 py-3 font-semibold text-right">Margin</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeReport.rows.length === 0 ? (
                          <tr><td colSpan={9} className="text-center text-muted-foreground py-8">কোনো ডেটা নেই। উপরে "Demo Data দেখুন" বাটন চাপুন।</td></tr>
                        ) : activeReport.rows.map((r, i) => {
                          const margin = r.revenue > 0 ? (r.profit / r.revenue) * 100 : 0;
                          return (
                            <tr key={i} className="border-t border-border hover:bg-secondary/30">
                              <td className="px-4 py-3">
                                <p className="font-medium text-foreground">{r.product_name}</p>
                                {r.product_code && <p className="text-xs text-muted-foreground">{r.product_code}</p>}
                              </td>
                              <td className="px-4 py-3 text-right">{r.orderCount}</td>
                              <td className="px-4 py-3 text-right">{r.qty}</td>
                              <td className="px-4 py-3 text-right text-emerald-600 font-semibold">{fmt(r.revenue)}</td>
                              <td className="px-4 py-3 text-right">{fmt(r.unitCost)}</td>
                              <td className="px-4 py-3 text-right text-orange-600">{fmt(r.soldCogs)}</td>
                              <td className="px-4 py-3 text-right text-violet-600">{fmt(r.purchaseCost)}</td>
                              <td className={`px-4 py-3 text-right font-bold ${r.profit >= 0 ? "text-emerald-600" : "text-destructive"}`}>{fmt(r.profit)}</td>
                              <td className={`px-4 py-3 text-right ${margin >= 0 ? "text-emerald-600" : "text-destructive"}`}>{margin.toFixed(1)}%</td>
                            </tr>
                          );
                        })}
                      </tbody>
                      {activeReport.rows.length > 0 && (
                        <tfoot className="bg-secondary/50 font-bold">
                          <tr>
                            <td className="px-4 py-3">Total</td>
                            <td className="px-4 py-3 text-right">{activeReport.totals.orders}</td>
                            <td className="px-4 py-3 text-right">{activeReport.totals.qty}</td>
                            <td className="px-4 py-3 text-right text-emerald-600">{fmt(activeReport.totals.revenue)}</td>
                            <td className="px-4 py-3 text-right">—</td>
                            <td className="px-4 py-3 text-right text-orange-600">{fmt(activeReport.totals.cogs)}</td>
                            <td className="px-4 py-3 text-right text-violet-600">{fmt(activeReport.totals.purchase)}</td>
                            <td className={`px-4 py-3 text-right ${activeReport.totals.profit >= 0 ? "text-emerald-600" : "text-destructive"}`}>{fmt(activeReport.totals.profit)}</td>
                            <td className="px-4 py-3 text-right">—</td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>

                {/* Daily Accounting Summary */}
                <div className="bg-card rounded-2xl border border-border p-5">
                  <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" /> আজকের দিনের পূর্ণ Accounting
                  </h3>
                  <div className="bg-secondary/30 rounded-xl p-5 space-y-2 font-mono text-sm">
                    <p>📅 Period: <strong>{period.toUpperCase()}</strong> {useDemo && <span className="text-primary">[DEMO]</span>}</p>
                    <p>📦 Total Orders: <strong>{activeReport.totals.orders}</strong> · Units Sold: <strong>{activeReport.totals.qty}</strong></p>
                    <br />
                    <p className="text-emerald-600">➕ ADD (Income):</p>
                    <p className="ml-4">Revenue (Sales): {fmt(activeReport.totals.revenue)}</p>
                    <br />
                    <p className="text-orange-600">➖ EXPENSE (Khoroch):</p>
                    <p className="ml-4">COGS (Product Cost): {fmt(activeReport.totals.cogs)}</p>
                    <p className="ml-4">Ad Spend: {fmt(activeReport.adsCostBdt)} (${activeReport.adsCostUsd.toFixed(2)})</p>
                    <p className="ml-4">Delivery Cost: {fmt(activeReport.deliveryCost)}</p>
                    <p className="ml-4">Other Expense: {fmt(activeReport.otherExpense)}</p>
                    <p className="ml-4 font-bold">Total Expense: {fmt(totalExpense)}</p>
                    <br />
                    <p className="text-primary">📊 PROFIT:</p>
                    <p className="ml-4">Sales Profit (Revenue − COGS): {fmt(activeReport.totals.profit)}</p>
                    <p className={`ml-4 font-bold text-base ${netProfit >= 0 ? "text-emerald-600" : "text-destructive"}`}>✅ Net Profit (after all expense): {fmt(netProfit)}</p>
                    <p className="ml-4 text-xs text-muted-foreground">Margin: {profitMargin.toFixed(2)}%</p>
                  </div>
                </div>

                {/* Accounting System Breakdown */}
                <div className="bg-card rounded-2xl border border-border p-5">
                  <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" /> Accounting System কীভাবে কাজ করে
                  </h3>
                  <div className="space-y-3 text-sm text-foreground">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                      <p className="font-semibold text-emerald-700 dark:text-emerald-400">💰 Revenue (Add / Money In)</p>
                      <p className="text-muted-foreground mt-1">প্রতিটি product-এর জন্য confirmed/in-courier/delivered orders থেকে <code className="text-xs bg-secondary px-1 rounded">order_items.total_price</code> যোগ করা হয়। Cancelled ও Returned orders বাদ দেওয়া হয়।</p>
                    </div>
                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3">
                      <p className="font-semibold text-orange-700 dark:text-orange-400">📦 COGS (Cost of Goods Sold)</p>
                      <p className="text-muted-foreground mt-1">Unit Cost = <code className="text-xs bg-secondary px-1 rounded">products.purchase_price + additional_cost</code>। COGS = Unit Cost × বিক্রিত quantity।</p>
                    </div>
                    <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-3">
                      <p className="font-semibold text-violet-700 dark:text-violet-400">📢 Ad Spend</p>
                      <p className="text-muted-foreground mt-1"><code className="text-xs bg-secondary px-1 rounded">ad_spends</code> table থেকে এই date range-এর সব Meta Ads খরচ (USD ও BDT)।</p>
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
                      <p className="font-semibold text-blue-700 dark:text-blue-400">🚚 Delivery Cost</p>
                      <p className="text-muted-foreground mt-1">Confirmed orders-এর <code className="text-xs bg-secondary px-1 rounded">orders.delivery_charge</code> যোগ করে Delivery খরচ হিসাব হয়।</p>
                    </div>
                    <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">
                      <p className="font-semibold text-rose-700 dark:text-rose-400">💸 Other Expense</p>
                      <p className="text-muted-foreground mt-1">Finance module-এর সব <code className="text-xs bg-secondary px-1 rounded">expense</code>, <code className="text-xs bg-secondary px-1 rounded">loan_out</code>, <code className="text-xs bg-secondary px-1 rounded">investment_out</code> type record।</p>
                    </div>
                    <div className="bg-primary/10 border border-primary/20 rounded-xl p-3">
                      <p className="font-semibold text-primary">📊 Profit Formula (Two Way)</p>
                      <p className="text-muted-foreground mt-1">
                        <strong>1) Sales Profit</strong> = Revenue − COGS (শুধু পণ্যের লাভ)<br />
                        <strong>2) Net Profit</strong> = Revenue − (COGS + Ad Spend + Delivery + Other Expense)<br />
                        <strong>3) Profit Margin</strong> = (Net Profit ÷ Revenue) × 100%
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Manual Report Tab */}
        {tab === "manual" && (
          <div className="space-y-5">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: ShoppingCart, value: summary.totalSold, label: "Products Sold", color: "text-primary" },
                { icon: Megaphone, value: `৳${adsCostBdt}`, label: "Ad Spend", color: "text-destructive" },
                { icon: Wallet, value: `৳${summary.totalProductCost}`, label: "Total Spend", color: "text-orange-500" },
                { icon: TrendingUp, value: `৳${summary.finalProfit}`, label: "Total Profit", color: "text-primary" },
              ].map((s, i) => (
                <div key={i} className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl bg-secondary flex items-center justify-center ${s.color}`}>
                    <s.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-foreground">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CPS cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Target className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">৳{summary.cps.toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">Cost Per Sale (৳)</p>
                </div>
              </div>
              <div className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Target className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">${summary.cpsDollar.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Cost Per Sale ($)</p>
                </div>
              </div>
            </div>

            {/* Create New Report */}
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Create New Report
            </h2>

            {/* Date & Advertising */}
            <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Date & Advertising</p>
                  <p className="text-xs text-muted-foreground">Set report date and ad spend details</p>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Date</label>
                  <div className="relative mt-1">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input value={reportDate} onChange={(e) => setReportDate(e.target.value)} className="pl-10" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Ads Spend ($)</label>
                  <Input className="mt-1" type="number" value={adsSpendUsd} onChange={(e) => setAdsSpendUsd(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Dollar Rate (৳)</label>
                  <Input className="mt-1" type="number" value={dollarRate} onChange={(e) => setDollarRate(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Ads Cost</label>
                  <Input className="mt-1" readOnly value={`$${adsSpendUsd} → ৳${adsCostBdt}`} />
                </div>
              </div>
            </div>

            {/* Return Adjustments */}
            <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <RotateCcw className="h-4 w-4 text-destructive" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Return Adjustments</p>
                  <p className="text-xs text-muted-foreground">Estimate return rate and handling cost</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Return %</label>
                  <Input className="mt-1" type="number" value={returnPercent} onChange={(e) => setReturnPercent(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Cost Per Return (৳)</label>
                  <Input className="mt-1" type="number" value={costPerReturn} onChange={(e) => setCostPerReturn(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Products Sold */}
            <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Package className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Products Sold</p>
                  <p className="text-xs text-muted-foreground">Enter quantity sold for each product</p>
                </div>
              </div>
              {products.length === 0 ? (
                <p className="text-center text-muted-foreground py-6">No active products found.</p>
              ) : (
                <div className="space-y-3">
                  {products.map((p) => (
                    <div key={p.id} className="flex items-center justify-between gap-4 bg-secondary/30 rounded-xl px-4 py-3">
                      <span className="text-sm font-medium text-foreground">{p.name}</span>
                      <Input
                        type="number"
                        className="w-24"
                        value={productQty[p.id] || 0}
                        onChange={(e) => setProductQty((prev) => ({ ...prev, [p.id]: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Report Summary */}
            <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Report Summary</p>
                  <p className="text-xs text-muted-foreground">Auto-generated profit & loss overview</p>
                </div>
              </div>
              <div className="bg-secondary/30 rounded-xl p-5 space-y-2 font-mono text-sm text-foreground">
                <p>📅 Date: {reportDate}</p>
                <p>💰 Ads Spend: ${adsSpendUsd} × ৳{dollarRate} = ৳{adsCostBdt}</p>
                <br />
                <p>📦 Products Sold:</p>
                {summary.totalSold === 0 ? (
                  <p className="ml-4">No products sold yet.</p>
                ) : (
                  products.filter((p) => (productQty[p.id] || 0) > 0).map((p) => (
                    <p key={p.id} className="ml-4">• {p.name} × {productQty[p.id]}</p>
                  ))
                )}
                <br />
                <p>📊 Summary:</p>
                <p className="ml-4">Total Products Sold: {summary.totalSold}</p>
                <p className="ml-4">Total Product Cost: ৳{summary.totalProductCost}</p>
                <p className="ml-4">Total Sales: ৳{summary.totalSales}</p>
                <p className="ml-4">Ads Cost: ${adsSpendUsd} (৳{adsCostBdt})</p>
                <p className="ml-4">Cost Per Sale: ${summary.cpsDollar.toFixed(2)} (৳{summary.cps.toFixed(0)})</p>
                <p className="ml-4">Gross Profit (before adjustments): ৳{summary.grossProfit}</p>
                <p className="ml-4 font-bold">✅ Final Profit: ৳{summary.finalProfit}</p>
              </div>
            </div>

            {/* Save Button */}
            <Button className="w-full h-14 rounded-2xl text-base font-semibold gap-2">
              <Save className="h-5 w-5" />
              Save Daily Report
            </Button>
          </div>
        )}

        {/* History Tab */}
        {tab === "history" && (
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileCheck className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold text-foreground">Report History (0)</h3>
            </div>
            <p className="text-center text-muted-foreground py-8">No reports yet</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
