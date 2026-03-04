import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  BarChart3, ShoppingCart, Globe, Wallet, Package, Award,
  TrendingUp, Target, DollarSign, Lightbulb, AlertTriangle,
  FlaskConical, ListChecks, Calendar, Plus, User, Zap,
  ArrowUpCircle, ArrowDownCircle, CheckCircle2, Clock,
  Truck, RotateCcw, FileText, XCircle, Pause, Send,
  Activity, Shield, Eye, Flame, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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

        {/* Overview Tab */}
        {tab === "overview" && <OverviewTab />}

        {/* Orders Tab */}
        {tab === "orders" && <OrdersTab />}

        {/* AI Digest Tab */}
        {tab === "ai_digest" && <AIDigestTab />}

        {/* Finance Tab */}
        {tab === "finance" && <FinanceTab />}

        {/* Product Tab */}
        {tab === "product" && <ProductTab />}

        {/* Ranking Tab */}
        {tab === "ranking" && <RankingTab />}

        {/* Profit Tab */}
        {tab === "profit" && <ProfitTab />}

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
        {tab === "cost_ads" && <CostAdsTab />}

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
      </div>
    </AdminLayout>
  );
}

/* ===================== Overview Tab ===================== */
function OverviewTab() {
  return (
    <div className="space-y-5">
      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { icon: Target, label: "CONFIRM RATE", value: "0%", iconBg: "bg-rose-500", iconColor: "text-white" },
          { icon: TrendingUp, label: "PROFIT CONSISTENCY", value: "0%", iconBg: "bg-orange-500", iconColor: "text-white" },
          { icon: ArrowDownCircle, label: "EXPENSE PRESSURE", value: "0%", iconBg: "bg-teal-400", iconColor: "text-white" },
          { icon: Zap, label: "ADS DEPENDENCY", value: "0%", iconBg: "bg-purple-500", iconColor: "text-white" },
        ].map((s, i) => (
          <div key={i} className="bg-card rounded-2xl border border-border p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className={`h-10 w-10 rounded-xl ${s.iconBg} flex items-center justify-center`}>
                <s.icon className={`h-5 w-5 ${s.iconColor}`} />
              </div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{s.label}</p>
            </div>
            <p className="text-3xl font-bold text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Orders Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "TOTAL ORDERS", value: "0", color: "text-foreground" },
          { label: "CONFIRMED", value: "0", color: "text-emerald-500" },
          { label: "CANCELLED", value: "0", color: "text-destructive" },
        ].map((s, i) => (
          <div key={i} className="bg-card rounded-2xl border border-border p-5 text-center">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Business Insight */}
      <div className="bg-orange-50 dark:bg-orange-950/20 rounded-2xl border border-orange-200 dark:border-orange-800 p-5">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-orange-500 flex items-center justify-center flex-shrink-0">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">Business Insight</h3>
            <p className="text-sm text-muted-foreground mt-1">Order confirmation rate is low — improve product quality or customer targeting.</p>
          </div>
        </div>
      </div>

      {/* Business Health Score */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="h-8 w-8 rounded-lg bg-orange-500 flex items-center justify-center">
            <Activity className="h-4 w-4 text-white" />
          </div>
          <h3 className="font-bold text-foreground">Business Health Score</h3>
        </div>
        <div className="grid grid-cols-3 gap-8">
          {[
            { label: "Confirm Rate", value: "0%", color: "#9ca3af" },
            { label: "Consistency", value: "0%", color: "#9ca3af" },
            { label: "Efficiency", value: "100%", color: "#f59e0b" },
          ].map((s, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="relative h-24 w-24">
                <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
                  <circle
                    cx="50" cy="50" r="40" fill="none"
                    stroke={s.color}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${parseFloat(s.value) * 2.51} 251`}
                  />
                </svg>
              </div>
              <p className="text-xl font-bold text-foreground mt-2">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ===================== Orders Tab ===================== */
function OrdersTab() {
  const orderStats = [
    { icon: ShoppingCart, label: "Total Orders", value: "0", color: "text-primary" },
    { icon: CheckCircle2, label: "Confirmed", value: "0", color: "text-emerald-500" },
    { icon: XCircle, label: "Cancelled", value: "0", color: "text-destructive" },
    { icon: Pause, label: "Hold", value: "0", color: "text-orange-500" },
    { icon: Send, label: "Shipped", value: "0", color: "text-primary" },
  ];
  const orderStats2 = [
    { icon: CheckCircle2, label: "Delivered", value: "0", color: "text-emerald-500" },
    { icon: RotateCcw, label: "Returned", value: "0", color: "text-destructive" },
    { icon: FileText, label: "From Incomplete", value: "0", color: "text-orange-500" },
    { icon: Truck, label: "Courier Pending", value: "0", color: "text-primary" },
    { icon: ShoppingCart, label: "New / Pending", value: "0", color: "text-primary" },
  ];

  return (
    <div className="space-y-5">
      {/* Order Status Grid */}
      <div className="grid grid-cols-5 gap-4">
        {orderStats.map((s, i) => (
          <div key={i} className="bg-card rounded-2xl border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <s.icon className={`h-4 w-4 ${s.color}`} />
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-5 gap-4">
        {orderStats2.map((s, i) => (
          <div key={i} className="bg-card rounded-2xl border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <s.icon className={`h-4 w-4 ${s.color}`} />
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Ad Spend & Cost */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: DollarSign, label: "Total Ad Spend", value: "$0.00", sub: "৳0", color: "text-primary" },
          { icon: TrendingUp, label: "Cost / Order", value: "$0.00", sub: "৳0", color: "text-destructive" },
          { icon: DollarSign, label: "Dollar Rate", value: "৳120", color: "text-foreground" },
        ].map((s, i) => (
          <div key={i} className="bg-card rounded-2xl border border-border p-5">
            <div className="flex items-center gap-2 mb-2">
              <s.icon className={`h-4 w-4 ${s.color}`} />
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            {s.sub && <p className="text-xs text-muted-foreground">{s.sub}</p>}
          </div>
        ))}
      </div>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-6 gap-4">
        {[
          { icon: DollarSign, label: "Total Revenue", value: "৳0", color: "text-primary" },
          { icon: Package, label: "Product Cost", value: "৳0", color: "text-emerald-500" },
          { icon: Truck, label: "Shipping Cost", value: "৳0", color: "text-orange-500" },
          { icon: BarChart3, label: "Ad Spend", value: "৳0", color: "text-destructive" },
          { icon: TrendingUp, label: "Gross Profit", value: "+৳0", color: "text-emerald-500" },
          { icon: TrendingUp, label: "Profit Margin", value: "0.0%", color: "text-emerald-500" },
        ].map((s, i) => (
          <div key={i} className="bg-card rounded-2xl border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <s.icon className={`h-4 w-4 ${s.color}`} />
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Source Breakdown */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="font-bold text-foreground mb-4">Source Breakdown</h3>
        <div className="h-8 border border-dashed border-border rounded-xl" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-bold text-foreground mb-4">Daily Orders Trend</h3>
          <div className="h-48 border border-dashed border-border rounded-xl" />
        </div>
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-bold text-foreground mb-4">Source Distribution</h3>
          <div className="h-48 border border-dashed border-border rounded-xl" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-bold text-foreground mb-4">Status Breakdown</h3>
          <div className="h-48 border border-dashed border-border rounded-xl" />
        </div>
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-bold text-foreground mb-4">Ad Cost Per Order (৳ BDT)</h3>
          <div className="h-48 border border-dashed border-border rounded-xl" />
        </div>
      </div>

      {/* Hourly Order Heatmap */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="font-bold text-foreground mb-4">Hourly Order Heatmap</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left py-2 pr-4 text-muted-foreground font-medium"></th>
                {["12AM", "3AM", "6AM", "9AM", "12PM", "3PM", "6PM", "9PM"].map(h => (
                  <th key={h} className="text-center py-2 px-3 text-muted-foreground font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"].map(day => (
                <tr key={day}>
                  <td className="py-3 pr-4 text-muted-foreground font-medium">{day}</td>
                  {Array(8).fill(0).map((_, i) => (
                    <td key={i} className="py-3 px-3">
                      <div className="h-6 w-full rounded bg-secondary/50" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
            <span>Less</span>
            <span className="h-3 w-3 rounded-sm bg-emerald-100" />
            <span className="h-3 w-3 rounded-sm bg-emerald-300" />
            <span className="h-3 w-3 rounded-sm bg-emerald-500" />
            <span className="h-3 w-3 rounded-sm bg-emerald-700" />
            <span>More</span>
          </div>
        </div>
      </div>

      {/* Payment & Shipping */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-bold text-foreground mb-4">Payment Method Breakdown</h3>
          <p className="text-sm text-muted-foreground text-center py-8">No payment data available</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-bold text-foreground mb-4">Shipping & COD Summary</h3>
          <div className="space-y-4">
            {[
              { icon: Truck, label: "Total Shipping Charged", value: "৳0" },
              { icon: DollarSign, label: "COD Collected", value: "৳0", sub: "Expected: ৳0" },
              { icon: FileText, label: "COD Collection Rate", value: "0.0%", color: "text-primary" },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                  <s.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className={`text-lg font-bold ${s.color || "text-foreground"}`}>{s.value}</p>
                  {s.sub && <p className="text-[10px] text-muted-foreground">{s.sub}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===================== AI Digest Tab ===================== */
function AIDigestTab() {
  return (
    <div className="space-y-5">
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center">
              <Globe className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">AI Daily Digest</h3>
            </div>
            <span className="text-xs bg-secondary px-2.5 py-1 rounded-full text-muted-foreground">2026-03-04</span>
          </div>
          <button className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80">
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: "অর্ডার", value: "0", icon: ShoppingCart, bg: "bg-blue-50 dark:bg-blue-950/30" },
            { label: "Confirmed", value: "0", icon: TrendingUp, bg: "bg-emerald-50 dark:bg-emerald-950/30" },
            { label: "Return Rate", value: "0%", icon: AlertTriangle, bg: "bg-orange-50 dark:bg-orange-950/30" },
            { label: "Low Stock", value: "0", icon: Shield, bg: "bg-emerald-50 dark:bg-emerald-950/30" },
          ].map((s, i) => (
            <div key={i} className={`${s.bg} rounded-xl p-3`}>
              <div className="flex items-center gap-1.5 mb-1">
                <s.icon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">{s.label}</span>
              </div>
              <p className="text-xl font-bold text-foreground">{s.value}</p>
            </div>
          ))}
        </div>

        {/* AI Summary */}
        <div className="space-y-3 text-sm text-foreground">
          <h4 className="font-bold">বিজনেস ডাইজেস্ট: ২০২৬-০৩-০৪</h4>
          <p><strong>সামারি:</strong> আজকের ব্যবসায়িক কার্যক্রম সম্পূর্ণ স্থবির অবস্থায় রয়েছে। গতকালের মতো আজকেও কোনো অর্ডার বা রেভিনিউ জেনারেট হয়নি এবং কোনো অ্যাড ক্যাম্পেইনও চালু নেই।
          ⚠️ ব্যবসায়িক গতি বাড়াতে দ্রুত পদক্ষেপ নেওয়া প্রয়োজন।</p>

          <h4 className="font-bold mt-4">অ্যাকশনেবল সাজেশন:</h4>
          <ul className="space-y-2 text-muted-foreground">
            <li><strong>মার্কেটিং শুরু করুন:</strong> যেহেতু সেলস 0, তাই অবিলম্বে ফেসবুক বা গুগল অ্যাডস শুরু করা প্রয়োজন। অ্যাড স্পেন্ড না থাকলে নতুন কাস্টমার আসা সম্ভব নয়।</li>
            <li><strong>অফার বা ডিসকাউন্ট:</strong> কাস্টমারদের আকৃষ্ট করতে 'ফ্ল্যাশ সেল' বা 'স্পেশাল ডিসকাউন্ট' অফার চালু করুন যাতে অর্ডারের খাতা খোলা যায়।</li>
            <li><strong>অর্গানিক বুস্ট:</strong> পেইড অ্যাডস না থাকলে সোশ্যাল মিডিয়া পেজে নিয়মিত পোস্ট ও রিলস শেয়ার করে এনগেজমেন্ট বাড়ান।</li>
            <li><strong>প্রোডাক্ট লিস্টিং চেক:</strong> আপনার ওয়েবসাইট বা পেজে প্রোডাক্টের স্টক আছে কিনা এবং পেমেন্ট গেটওয়ে কাজ করছে কি না তা নিশ্চিত করুন।</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ===================== Finance Tab ===================== */
function FinanceTab() {
  return (
    <div className="space-y-5">
      {/* Top Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "TOTAL INCOME", value: "৳0", color: "text-primary" },
          { label: "TOTAL EXPENSE", value: "৳0", color: "text-destructive" },
          { label: "BANK BALANCE", value: "৳0", color: "text-foreground" },
        ].map((s, i) => (
          <div key={i} className="bg-card rounded-2xl border border-border p-5 text-center">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Financial Health */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { icon: Wallet, label: "CASH FLOW STABILITY", value: "0%", color: "text-destructive", iconBg: "bg-rose-500" },
          { icon: Flame, label: "BURN RATE / DAY", value: "৳0", color: "text-emerald-500", iconBg: "bg-teal-500" },
          { icon: Shield, label: "SURVIVAL DAYS", value: "999 days", color: "text-emerald-500", iconBg: "bg-emerald-500" },
          { icon: ArrowDownCircle, label: "LIQUIDITY SAFETY", value: "100%", color: "text-emerald-500", iconBg: "bg-teal-400" },
        ].map((s, i) => (
          <div key={i} className="bg-card rounded-2xl border border-border p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className={`h-10 w-10 rounded-xl ${s.iconBg} flex items-center justify-center`}>
                <s.icon className="h-5 w-5 text-white" />
              </div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{s.label}</p>
            </div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-bold text-foreground mb-4">Cash In vs Cash Out</h3>
          <div className="h-48 border border-dashed border-border rounded-xl" />
        </div>
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-bold text-foreground mb-4">Expense Distribution</h3>
          <div className="h-48 border border-dashed border-border rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/* ===================== Product Tab ===================== */
function ProductTab() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-4">
        {[
          { icon: Package, label: "PRODUCTS", value: "0", color: "text-foreground", iconBg: "bg-primary" },
          { icon: AlertTriangle, label: "FALSE BESTSELLERS", value: "0", color: "text-orange-500", iconBg: "bg-orange-500" },
          { icon: Eye, label: "SILENT HIGH MARGIN", value: "0", color: "text-emerald-500", iconBg: "bg-emerald-500" },
          { icon: TrendingUp, label: "TOP CONCENTRATION", value: "0%", color: "text-destructive", iconBg: "bg-destructive" },
        ].map((s, i) => (
          <div key={i} className="bg-card rounded-2xl border border-border p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className={`h-10 w-10 rounded-xl ${s.iconBg} flex items-center justify-center`}>
                <s.icon className="h-5 w-5 text-white" />
              </div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{s.label}</p>
            </div>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Product Details Table */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="font-bold text-foreground mb-4">Product Details</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Product", "Sold", "Revenue", "Profit", "Margin", "Stock", "Tags"].map(h => (
                  <th key={h} className="text-left py-3 px-3 text-muted-foreground font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={7} className="text-center py-8 text-muted-foreground">No product data available</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ===================== Ranking Tab ===================== */
function RankingTab() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: Award, label: "Top by Sales Quantity", color: "text-amber-500" },
          { icon: TrendingUp, label: "Top by Profit", color: "text-primary" },
          { icon: TrendingUp, label: "Top by Revenue", color: "text-primary" },
        ].map((s, i) => (
          <div key={i} className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <s.icon className={`h-5 w-5 ${s.color}`} />
              <h3 className="font-bold text-foreground">{s.label}</h3>
            </div>
            <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ===================== Profit Tab ===================== */
function ProfitTab() {
  return (
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
  );
}

/* ===================== Cost & Ads Tab ===================== */
function CostAdsTab() {
  return (
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
  );
}
