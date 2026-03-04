import { useState, useEffect, useMemo } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  FileText, BarChart3, PlusCircle, History, ShoppingCart,
  Megaphone, Wallet, TrendingUp, Target, DollarSign,
  RotateCcw, Package, Calendar, Save, FileCheck
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type Tab = "auto" | "manual" | "history";
type Period = "today" | "yesterday" | "weekly" | "monthly" | "custom";

interface Product {
  id: string;
  name: string;
  selling_price: number;
  purchase_price: number;
  additional_cost: number;
}

export default function AdminReports() {
  const [tab, setTab] = useState<Tab>("auto");
  const [period, setPeriod] = useState<Period>("today");

  // Manual report state
  const [adsSpendUsd, setAdsSpendUsd] = useState("0");
  const [dollarRate, setDollarRate] = useState("120");
  const [returnPercent, setReturnPercent] = useState("0");
  const [costPerReturn, setCostPerReturn] = useState("0");
  const [products, setProducts] = useState<Product[]>([]);
  const [productQty, setProductQty] = useState<Record<string, number>>({});
  const [reportDate, setReportDate] = useState(() => {
    const d = new Date();
    return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`;
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

  const adsCostBdt = useMemo(() => {
    const usd = parseFloat(adsSpendUsd) || 0;
    const rate = parseFloat(dollarRate) || 0;
    return usd * rate;
  }, [adsSpendUsd, dollarRate]);

  const summary = useMemo(() => {
    let totalSold = 0;
    let totalProductCost = 0;
    let totalSales = 0;

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
          <div className="bg-card rounded-2xl border border-border p-12 text-center">
            <div className="flex justify-center mb-4">
              <div className="h-14 w-14 rounded-xl bg-secondary flex items-center justify-center">
                <FileText className="h-7 w-7 text-muted-foreground/50" />
              </div>
            </div>
            <p className="text-muted-foreground">No auto-generated reports found for this period.</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Reports are generated automatically at 11:59 PM when automation is enabled.</p>
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
