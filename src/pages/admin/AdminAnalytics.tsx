import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  BarChart3, ShoppingCart, Globe, Wallet, Package, Award,
  TrendingUp, Target, DollarSign, Lightbulb, AlertTriangle,
  FlaskConical, ListChecks, Calendar, Plus, User, Zap,
  ArrowUpCircle, ArrowDownCircle, CheckCircle2, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";

type AnalyticsTab =
  | "overview" | "orders" | "ai_digest" | "finance" | "product"
  | "ranking" | "profit" | "profit_goals" | "cost_ads" | "planning"
  | "risk" | "decision_lab" | "tasks";

type Period = "today" | "yesterday" | "monthly" | "yearly" | "custom";

const tabConfig: { id: AnalyticsTab; label: string; icon: any }[] = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "orders", label: "Orders", icon: ShoppingCart },
  { id: "ai_digest", label: "AI Digest", icon: Globe },
  { id: "finance", label: "Finance", icon: Wallet },
  { id: "product", label: "Product", icon: Package },
  { id: "ranking", label: "Ranking", icon: Award },
  { id: "profit", label: "Profit", icon: TrendingUp },
  { id: "profit_goals", label: "Profit Goals", icon: Target },
  { id: "cost_ads", label: "Cost & Ads", icon: DollarSign },
  { id: "planning", label: "Planning", icon: Lightbulb },
  { id: "risk", label: "Risk", icon: AlertTriangle },
  { id: "decision_lab", label: "Decision Lab", icon: FlaskConical },
  { id: "tasks", label: "Tasks", icon: ListChecks },
];

export default function AdminAnalytics() {
  const [tab, setTab] = useState<AnalyticsTab>("overview");
  const [period, setPeriod] = useState<Period>("monthly");

  const periods: { id: Period; label: string }[] = [
    { id: "today", label: "Today" },
    { id: "yesterday", label: "Yesterday" },
    { id: "monthly", label: "Monthly" },
    { id: "yearly", label: "Yearly" },
    { id: "custom", label: "Custom" },
  ];

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
            <p className="text-sm text-muted-foreground">Your business brain — insights, risks, and decisions</p>
          </div>
          <div className="flex gap-1">
            {periods.map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  period === p.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary"
                }`}
              >
                {p.id === "custom" && <Calendar className="h-3.5 w-3.5" />}
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <p className="text-sm text-muted-foreground">Showing: 2026-02-03 → 2026-03-04</p>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 bg-card rounded-2xl border border-border p-2">
          {tabConfig.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                tab === t.id
                  ? "border border-primary text-primary bg-primary/5"
                  : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Profit Tab */}
        {tab === "profit" && (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "TOTAL REVENUE", value: "৳0" },
                { label: "TOTAL PROFIT", value: "৳0" },
                { label: "ADS COST", value: "৳0", sub: "($0.00)" },
              ].map((s, i) => (
                <div key={i} className="bg-card rounded-2xl border border-border p-5 text-center">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{s.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{s.value}</p>
                  {s.sub && <p className="text-xs text-muted-foreground">{s.sub}</p>}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-4">
              {[
                { icon: TrendingUp, label: "PROFIT STABILITY", value: "0%", color: "text-destructive", iconBg: "bg-destructive/10" },
                { icon: Zap, label: "PROFIT VOLATILITY", value: "0%", color: "text-emerald-500", iconBg: "bg-emerald-500/10" },
                { icon: ArrowUpCircle, label: "PROFIT LEAKAGE", value: "0%", color: "text-emerald-500", iconBg: "bg-emerald-500/10" },
                { icon: Target, label: "EFFICIENCY INDEX", value: "0%", color: "text-destructive", iconBg: "bg-destructive/10" },
              ].map((s, i) => (
                <div key={i} className="bg-card rounded-2xl border border-border p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`h-8 w-8 rounded-lg ${s.iconBg} flex items-center justify-center`}>
                      <s.icon className={`h-4 w-4 ${s.color}`} />
                    </div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{s.label}</p>
                  </div>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>
            <div className="bg-card rounded-2xl border border-border p-6">
              <h3 className="font-bold text-foreground mb-4">Profit vs Cost Trend</h3>
              <div className="h-48 border border-dashed border-border rounded-xl" />
            </div>
            <div className="bg-card rounded-2xl border border-border p-6">
              <h3 className="font-bold text-foreground mb-3">Profit Heat Map</h3>
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-emerald-400" /> Good</span>
                <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-muted" /> Neutral</span>
                <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-pink-400" /> Bad</span>
              </div>
            </div>
          </div>
        )}

        {/* Profit Goals Tab */}
        {tab === "profit_goals" && (
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-foreground">Profit Goal Tracker</h3>
              </div>
              <Button className="gap-2 rounded-xl"><Plus className="h-4 w-4" /> Add Goal</Button>
            </div>
            <p className="text-center text-muted-foreground py-8">No profit goals set yet. Click "Add Goal" to set your first target.</p>
          </div>
        )}

        {/* Cost & Ads Tab */}
        {tab === "cost_ads" && (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "TOTAL ADS (BDT)", value: "৳0" },
                { label: "TOTAL ADS (USD)", value: "$0.00" },
                { label: "AVG COST/PRODUCT", value: "৳0" },
              ].map((s, i) => (
                <div key={i} className="bg-card rounded-2xl border border-border p-5 text-center">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{s.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{s.value}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-4">
              {[
                { icon: AlertTriangle, label: "ADS WASTE DAYS", value: "0%", color: "text-destructive", iconBg: "bg-destructive/10" },
                { icon: Target, label: "BREAK-EVEN PRESSURE", value: "0%", color: "text-emerald-500", iconBg: "bg-emerald-500/10" },
                { icon: ArrowDownCircle, label: "COST ELASTICITY", value: "0.00x", color: "text-destructive", iconBg: "bg-destructive/10" },
                { icon: DollarSign, label: "AVG DAILY ADS", value: "৳0", color: "text-emerald-500", iconBg: "bg-emerald-500/10" },
              ].map((s, i) => (
                <div key={i} className="bg-card rounded-2xl border border-border p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`h-8 w-8 rounded-lg ${s.iconBg} flex items-center justify-center`}>
                      <s.icon className={`h-4 w-4 ${s.color}`} />
                    </div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{s.label}</p>
                  </div>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card rounded-2xl border border-border p-6">
                <h3 className="font-bold text-foreground mb-4">Ads Spend vs Profit</h3>
                <div className="h-48 border border-dashed border-border rounded-xl" />
              </div>
              <div className="bg-card rounded-2xl border border-border p-6">
                <h3 className="font-bold text-foreground mb-4">Cost Spike Radar</h3>
                <div className="h-48 border border-dashed border-border rounded-xl" />
              </div>
            </div>
          </div>
        )}

        {/* Planning Tab */}
        {tab === "planning" && (
          <div className="space-y-5">
            <div className="grid grid-cols-4 gap-4">
              {[
                { icon: TrendingUp, label: "ACTIVE SALES PLANS", value: "0", color: "text-destructive", iconBg: "bg-destructive/10" },
                { icon: Target, label: "PROFIT PLANS", value: "0", color: "text-emerald-500", iconBg: "bg-emerald-500/10" },
                { icon: Lightbulb, label: "CONTENT COMPLETION", value: "0%", color: "text-destructive", iconBg: "bg-destructive/10" },
                { icon: CheckCircle2, label: "BUSINESS PLANS", value: "0", color: "text-emerald-500", iconBg: "bg-emerald-500/10" },
              ].map((s, i) => (
                <div key={i} className="bg-card rounded-2xl border border-border p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`h-8 w-8 rounded-lg ${s.iconBg} flex items-center justify-center`}>
                      <s.icon className={`h-4 w-4 ${s.color}`} />
                    </div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{s.label}</p>
                  </div>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>
            <div className="bg-card rounded-2xl border border-border p-6">
              <h3 className="font-bold text-foreground mb-4">Plans Overview</h3>
              <div className="h-48 border border-dashed border-border rounded-xl" />
            </div>
          </div>
        )}

        {/* Risk Tab */}
        {tab === "risk" && (
          <div className="space-y-3">
            {[
              { icon: Package, label: "Single Product Dependency", value: "0%", badge: "LOW" },
              { icon: DollarSign, label: "Ads Dependency", value: "0%", badge: "LOW" },
              { icon: AlertTriangle, label: "Cash Fragility", value: "999 days", badge: "LOW" },
              { icon: AlertTriangle, label: "Inventory Risk", value: "0 out / 0 low", badge: "LOW" },
              { icon: ArrowDownCircle, label: "Loss Streak", value: "0 days", badge: "LOW" },
              { icon: AlertTriangle, label: "Cancellation Rate", value: "0%", badge: "LOW" },
            ].map((r, i) => (
              <div key={i} className="bg-card rounded-2xl border border-border p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <r.icon className="h-4 w-4 text-emerald-500" />
                  </div>
                  <p className="font-medium text-foreground">{r.label}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-foreground">{r.value}</span>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600">{r.badge}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Decision Lab Tab */}
        {tab === "decision_lab" && (
          <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <FlaskConical className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Decision Lab</p>
                <p className="text-xs text-muted-foreground">Run "what-if" simulations to predict business impact before making decisions.</p>
              </div>
            </div>
            <div className="grid grid-cols-5 gap-3">
              {[
                { icon: DollarSign, label: "If Ads Stop" },
                { icon: TrendingUp, label: "If Price Increase" },
                { icon: Package, label: "If Stock Increase" },
                { icon: TrendingUp, label: "Best Product to Focus" },
                { icon: AlertTriangle, label: "Worst to Continue" },
              ].map((s, i) => (
                <button key={i} className="bg-secondary/50 rounded-xl p-5 text-center hover:bg-secondary transition-all">
                  <s.icon className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">{s.label}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tasks Tab */}
        {tab === "tasks" && (
          <div className="space-y-5">
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="h-5 w-5 text-foreground" />
                <h3 className="font-bold text-foreground">Task Analysis</h3>
              </div>
              <div className="flex items-center gap-4 mb-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Time Range</p>
                  <div className="flex gap-1">
                    {["Today", "Weekly", "Monthly", "Yearly", "Custom"].map((t) => (
                      <button key={t} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${t === "Today" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>{t}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">User</p>
                  <select className="h-9 rounded-md border border-input bg-background px-3 text-sm">
                    <option>All Users</option>
                  </select>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">Showing data from 2026-03-04 to 2026-03-04</p>
            </div>

            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center gap-2 mb-4">
                <User className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-bold text-foreground uppercase">User</h3>
              </div>
              <div className="grid grid-cols-5 gap-3">
                {[
                  { label: "Assigned Tasks", value: "0", sub: "0 done · 0 pending" },
                  { label: "Own Assigned", value: "0", sub: "0 done · 0 pending" },
                  { label: "Common Tasks", value: "0", sub: "0 done · 0 pending" },
                  { label: "Personal", value: "0", sub: "0 done · 0 pending" },
                  { label: "Total Completed", value: "0", sub: "in this period" },
                ].map((s, i) => (
                  <div key={i} className="text-center p-4 bg-secondary/30 rounded-xl">
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="text-2xl font-bold text-foreground my-1">{s.value}</p>
                    <p className="text-[10px] text-muted-foreground">{s.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Default empty for other tabs */}
        {!["profit", "profit_goals", "cost_ads", "planning", "risk", "decision_lab", "tasks"].includes(tab) && (
          <div className="bg-card rounded-2xl border border-border p-12 text-center">
            <p className="text-muted-foreground">No data available for this period.</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
