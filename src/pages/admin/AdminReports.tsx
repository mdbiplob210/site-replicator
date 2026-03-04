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

type Tab = "auto" | "manual" | "history";
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
    { id: "manual", label: "Manual Report", icon: PlusCircle },
    { id: "history", label: "History", icon: FileCheck },
  ];

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
