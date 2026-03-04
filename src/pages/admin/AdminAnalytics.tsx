import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  BarChart3, ShoppingCart, Globe, Wallet, Package, Award,
  TrendingUp, Target, DollarSign, Lightbulb, AlertTriangle,
  FlaskConical, ListChecks, Calendar, Plus, User, Zap,
  ArrowUpCircle, ArrowDownCircle, CheckCircle2, Clock,
  Truck, RotateCcw, FileText, XCircle, Pause, Send,
  Activity, Shield, Eye, Flame, RefreshCw, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAnalyticsData } from "@/hooks/useAnalyticsData";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend
} from "recharts";

type AnalyticsTab =
  | "overview" | "orders" | "ai_digest" | "finance" | "product"
  | "ranking" | "profit" | "profit_goals" | "cost_ads" | "planning"
  | "risk" | "decision_lab" | "tasks";

type Period = "today" | "yesterday" | "monthly" | "yearly" | "custom";

const tabConfig: { id: AnalyticsTab; label: string; icon: any }[] = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "orders", label: "Orders", icon: ShoppingCart },
  { id: "finance", label: "Finance", icon: Wallet },
  { id: "product", label: "Product", icon: Package },
  { id: "profit", label: "Profit", icon: TrendingUp },
  { id: "cost_ads", label: "Cost & Ads", icon: DollarSign },
  { id: "risk", label: "Risk", icon: AlertTriangle },
];

const CHART_COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#059669", "#ef4444", "#f59e0b", "#f87171", "#14b8a6"];

const fmt = (n: number) => `৳${n.toLocaleString()}`;

export default function AdminAnalytics() {
  const [tab, setTab] = useState<AnalyticsTab>("overview");
  const [period, setPeriod] = useState<Period>("monthly");
  const { data, isLoading } = useAnalyticsData(period);

  const periods: { id: Period; label: string }[] = [
    { id: "today", label: "Today" },
    { id: "yesterday", label: "Yesterday" },
    { id: "monthly", label: "Monthly" },
    { id: "yearly", label: "Yearly" },
  ];

  if (isLoading || !data) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

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
              <button key={p.id} onClick={() => setPeriod(p.id)} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${period === p.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <p className="text-sm text-muted-foreground">Showing: {data.dateRange.from} → {data.dateRange.to}</p>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 bg-card rounded-2xl border border-border p-2">
          {tabConfig.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${tab === t.id ? "border border-primary text-primary bg-primary/5" : "text-muted-foreground hover:bg-secondary"}`}>
              <t.icon className="h-4 w-4" />{t.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {tab === "overview" && (
          <div className="space-y-5">
            <div className="grid grid-cols-4 gap-4">
              {[
                { icon: Target, label: "CONFIRM RATE", value: `${data.orders.confirmRate}%`, iconBg: "bg-rose-500" },
                { icon: TrendingUp, label: "PROFIT MARGIN", value: `${data.revenue.profitMargin}%`, iconBg: "bg-orange-500" },
                { icon: ArrowDownCircle, label: "CANCEL RATE", value: `${data.orders.cancelRate}%`, iconBg: "bg-teal-400" },
                { icon: Zap, label: "COST/ORDER", value: fmt(Math.round(data.revenue.costPerOrder)), iconBg: "bg-purple-500" },
              ].map((s, i) => (
                <div key={i} className="bg-card rounded-2xl border border-border p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`h-10 w-10 rounded-xl ${s.iconBg} flex items-center justify-center`}><s.icon className="h-5 w-5 text-white" /></div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{s.label}</p>
                  </div>
                  <p className="text-3xl font-bold text-foreground">{s.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "TOTAL ORDERS", value: data.orders.total, color: "text-foreground" },
                { label: "CONFIRMED", value: data.orders.confirmed, color: "text-emerald-500" },
                { label: "CANCELLED", value: data.orders.cancelled, color: "text-destructive" },
              ].map((s, i) => (
                <div key={i} className="bg-card rounded-2xl border border-border p-5 text-center">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{s.label}</p>
                  <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Business Health Score */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="h-8 w-8 rounded-lg bg-orange-500 flex items-center justify-center"><Activity className="h-4 w-4 text-white" /></div>
                <h3 className="font-bold text-foreground">Business Health Score</h3>
              </div>
              <div className="grid grid-cols-3 gap-8">
                {[
                  { label: "Confirm Rate", value: `${data.orders.confirmRate}%`, pct: data.orders.confirmRate, color: data.orders.confirmRate > 50 ? "#10b981" : "#9ca3af" },
                  { label: "Profit Margin", value: `${data.revenue.profitMargin}%`, pct: Math.max(0, data.revenue.profitMargin), color: data.revenue.profitMargin > 20 ? "#10b981" : "#f59e0b" },
                  { label: "Cash Stability", value: `${Math.max(0, data.finance.cashFlowStability)}%`, pct: Math.max(0, data.finance.cashFlowStability), color: data.finance.cashFlowStability > 50 ? "#10b981" : "#ef4444" },
                ].map((s, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div className="relative h-24 w-24">
                      <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
                        <circle cx="50" cy="50" r="40" fill="none" stroke={s.color} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${s.pct * 2.51} 251`} />
                      </svg>
                    </div>
                    <p className="text-xl font-bold text-foreground mt-2">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Daily Orders Chart */}
            {data.charts.dailyTrend.length > 0 && (
              <div className="bg-card rounded-2xl border border-border p-6">
                <h3 className="font-bold text-foreground mb-4">Daily Orders Trend</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={data.charts.dailyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" fontSize={12} stroke="hsl(var(--muted-foreground))" />
                    <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip />
                    <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* Orders Tab */}
        {tab === "orders" && (
          <div className="space-y-5">
            <div className="grid grid-cols-5 gap-4">
              {[
                { icon: ShoppingCart, label: "Total Orders", value: data.orders.total, color: "text-primary" },
                { icon: CheckCircle2, label: "Confirmed", value: data.orders.confirmed, color: "text-emerald-500" },
                { icon: XCircle, label: "Cancelled", value: data.orders.cancelled, color: "text-destructive" },
                { icon: Pause, label: "Hold", value: data.orders.onHold, color: "text-orange-500" },
                { icon: Send, label: "In Courier", value: data.orders.inCourier, color: "text-primary" },
              ].map((s, i) => (
                <div key={i} className="bg-card rounded-2xl border border-border p-4">
                  <div className="flex items-center gap-2 mb-2"><s.icon className={`h-4 w-4 ${s.color}`} /><p className="text-xs text-muted-foreground">{s.label}</p></div>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-5 gap-4">
              {[
                { icon: CheckCircle2, label: "Delivered", value: data.orders.delivered, color: "text-emerald-500" },
                { icon: RotateCcw, label: "Returned", value: data.orders.returned, color: "text-destructive" },
                { icon: Clock, label: "Processing", value: data.orders.processing, color: "text-blue-500" },
                { icon: Truck, label: "Ship Later", value: data.orders.shipLater, color: "text-teal-500" },
                { icon: ShoppingCart, label: "Confirm Rate", value: `${data.orders.confirmRate}%`, color: "text-primary" },
              ].map((s, i) => (
                <div key={i} className="bg-card rounded-2xl border border-border p-4">
                  <div className="flex items-center gap-2 mb-2"><s.icon className={`h-4 w-4 ${s.color}`} /><p className="text-xs text-muted-foreground">{s.label}</p></div>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Revenue Breakdown */}
            <div className="grid grid-cols-6 gap-4">
              {[
                { label: "Total Revenue", value: fmt(data.revenue.total), color: "text-primary" },
                { label: "Product Cost", value: fmt(data.revenue.productCost), color: "text-foreground" },
                { label: "Delivery", value: fmt(data.revenue.delivery), color: "text-orange-500" },
                { label: "Ad Spend", value: fmt(data.revenue.adSpendBDT), color: "text-destructive" },
                { label: "Gross Profit", value: fmt(data.revenue.grossProfit), color: data.revenue.grossProfit >= 0 ? "text-emerald-500" : "text-destructive" },
                { label: "Margin", value: `${data.revenue.profitMargin}%`, color: "text-emerald-500" },
              ].map((s, i) => (
                <div key={i} className="bg-card rounded-2xl border border-border p-4">
                  <p className="text-[10px] text-muted-foreground mb-1">{s.label}</p>
                  <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-2 gap-4">
              {data.charts.dailyTrend.length > 0 && (
                <div className="bg-card rounded-2xl border border-border p-6">
                  <h3 className="font-bold text-foreground mb-4">Daily Revenue</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={data.charts.dailyTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" fontSize={11} stroke="hsl(var(--muted-foreground))" />
                      <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip />
                      <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              {data.charts.statusBreakdown.length > 0 && (
                <div className="bg-card rounded-2xl border border-border p-6">
                  <h3 className="font-bold text-foreground mb-4">Status Breakdown</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={data.charts.statusBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                        {data.charts.statusBreakdown.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Finance Tab */}
        {tab === "finance" && (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "TOTAL INCOME", value: fmt(data.finance.totalIncome), color: "text-primary" },
                { label: "TOTAL EXPENSE", value: fmt(data.finance.totalExpense), color: "text-destructive" },
                { label: "BANK BALANCE", value: fmt(data.finance.bankBalance), color: "text-foreground" },
              ].map((s, i) => (
                <div key={i} className="bg-card rounded-2xl border border-border p-5 text-center">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{s.label}</p>
                  <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-4 gap-4">
              {[
                { icon: Wallet, label: "CASH FLOW", value: `${data.finance.cashFlowStability}%`, color: data.finance.cashFlowStability > 30 ? "text-emerald-500" : "text-destructive", iconBg: "bg-rose-500" },
                { icon: Flame, label: "BURN RATE/DAY", value: fmt(Math.round(data.finance.burnRatePerDay)), color: "text-foreground", iconBg: "bg-teal-500" },
                { icon: Shield, label: "SURVIVAL DAYS", value: `${data.finance.survivalDays} days`, color: data.finance.survivalDays > 30 ? "text-emerald-500" : "text-destructive", iconBg: "bg-emerald-500" },
                { icon: ArrowDownCircle, label: "TOTAL LOANS", value: fmt(data.finance.totalLoans), color: "text-foreground", iconBg: "bg-teal-400" },
              ].map((s, i) => (
                <div key={i} className="bg-card rounded-2xl border border-border p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`h-10 w-10 rounded-xl ${s.iconBg} flex items-center justify-center`}><s.icon className="h-5 w-5 text-white" /></div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{s.label}</p>
                  </div>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Cash Flow Chart */}
            {data.charts.cashFlowTrend.length > 0 && (
              <div className="bg-card rounded-2xl border border-border p-6">
                <h3 className="font-bold text-foreground mb-4">Cash In vs Cash Out</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={data.charts.cashFlowTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" fontSize={11} stroke="hsl(var(--muted-foreground))" />
                    <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="cashIn" fill="#10b981" name="Cash In" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="cashOut" fill="#ef4444" name="Cash Out" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Expense Distribution */}
            {data.charts.expenseBreakdown.length > 0 && (
              <div className="bg-card rounded-2xl border border-border p-6">
                <h3 className="font-bold text-foreground mb-4">Expense Distribution</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={data.charts.expenseBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name}: ৳${value}`}>
                      {data.charts.expenseBreakdown.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* Product Tab */}
        {tab === "product" && (
          <div className="space-y-5">
            <div className="grid grid-cols-4 gap-4">
              {[
                { icon: Package, label: "TOTAL PRODUCTS", value: data.products.total, iconBg: "bg-primary" },
                { icon: CheckCircle2, label: "ACTIVE", value: data.products.active, iconBg: "bg-emerald-500" },
                { icon: AlertTriangle, label: "OUT OF STOCK", value: data.products.outOfStock, iconBg: "bg-orange-500" },
                { icon: DollarSign, label: "STOCK VALUE", value: fmt(data.products.totalStockValue), iconBg: "bg-teal-500" },
              ].map((s, i) => (
                <div key={i} className="bg-card rounded-2xl border border-border p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`h-10 w-10 rounded-xl ${s.iconBg} flex items-center justify-center`}><s.icon className="h-5 w-5 text-white" /></div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{s.label}</p>
                  </div>
                  <p className="text-3xl font-bold text-foreground">{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Profit Tab */}
        {tab === "profit" && (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "TOTAL REVENUE", value: fmt(data.revenue.total) },
                { label: "GROSS PROFIT", value: fmt(data.revenue.grossProfit) },
                { label: "ADS COST", value: fmt(data.revenue.adSpendBDT), sub: `($${data.revenue.adSpendUSD.toFixed(2)})` },
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
                { icon: TrendingUp, label: "PROFIT MARGIN", value: `${data.revenue.profitMargin}%`, color: data.revenue.profitMargin > 20 ? "text-emerald-500" : "text-destructive", iconBg: data.revenue.profitMargin > 20 ? "bg-emerald-500/10" : "bg-destructive/10" },
                { icon: Zap, label: "COST/ORDER", value: fmt(Math.round(data.revenue.costPerOrder)), color: "text-foreground", iconBg: "bg-primary/10" },
                { icon: ArrowUpCircle, label: "DELIVERY EARNED", value: fmt(data.revenue.delivery), color: "text-emerald-500", iconBg: "bg-emerald-500/10" },
                { icon: Target, label: "DISCOUNT GIVEN", value: fmt(data.revenue.discount), color: "text-destructive", iconBg: "bg-destructive/10" },
              ].map((s, i) => (
                <div key={i} className="bg-card rounded-2xl border border-border p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`h-8 w-8 rounded-lg ${s.iconBg} flex items-center justify-center`}><s.icon className={`h-4 w-4 ${s.color}`} /></div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{s.label}</p>
                  </div>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>

            {data.charts.dailyTrend.length > 0 && (
              <div className="bg-card rounded-2xl border border-border p-6">
                <h3 className="font-bold text-foreground mb-4">Revenue Trend</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={data.charts.dailyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" fontSize={11} stroke="hsl(var(--muted-foreground))" />
                    <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip />
                    <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* Cost & Ads Tab */}
        {tab === "cost_ads" && (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "TOTAL ADS (BDT)", value: fmt(data.revenue.adSpendBDT) },
                { label: "TOTAL ADS (USD)", value: `$${data.revenue.adSpendUSD.toFixed(2)}` },
                { label: "AVG COST/ORDER", value: fmt(Math.round(data.revenue.costPerOrder)) },
              ].map((s, i) => (
                <div key={i} className="bg-card rounded-2xl border border-border p-5 text-center">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{s.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{s.value}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: AlertTriangle, label: "ADS vs PROFIT", value: data.revenue.grossProfit > 0 ? `${Math.round((data.revenue.adSpendBDT / data.revenue.grossProfit) * 100)}%` : "N/A", color: "text-foreground", iconBg: "bg-destructive/10" },
                { icon: Target, label: "PROFIT AFTER ADS", value: fmt(data.revenue.grossProfit), color: data.revenue.grossProfit >= 0 ? "text-emerald-500" : "text-destructive", iconBg: "bg-emerald-500/10" },
              ].map((s, i) => (
                <div key={i} className="bg-card rounded-2xl border border-border p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`h-8 w-8 rounded-lg ${s.iconBg} flex items-center justify-center`}><s.icon className={`h-4 w-4 ${s.color}`} /></div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{s.label}</p>
                  </div>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Risk Tab */}
        {tab === "risk" && (
          <div className="space-y-3">
            {[
              { icon: Shield, label: "Cash Survival", value: `${data.finance.survivalDays} days`, badge: data.finance.survivalDays > 30 ? "LOW" : data.finance.survivalDays > 7 ? "MEDIUM" : "HIGH", badgeColor: data.finance.survivalDays > 30 ? "bg-emerald-500/10 text-emerald-600" : data.finance.survivalDays > 7 ? "bg-amber-500/10 text-amber-600" : "bg-destructive/10 text-destructive" },
              { icon: XCircle, label: "Cancellation Rate", value: `${data.orders.cancelRate}%`, badge: data.orders.cancelRate < 20 ? "LOW" : data.orders.cancelRate < 40 ? "MEDIUM" : "HIGH", badgeColor: data.orders.cancelRate < 20 ? "bg-emerald-500/10 text-emerald-600" : "bg-destructive/10 text-destructive" },
              { icon: AlertTriangle, label: "Out of Stock Items", value: `${data.products.outOfStock} products`, badge: data.products.outOfStock === 0 ? "LOW" : "MEDIUM", badgeColor: data.products.outOfStock === 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600" },
              { icon: DollarSign, label: "Ads Dependency", value: data.revenue.total > 0 ? `${Math.round((data.revenue.adSpendBDT / data.revenue.total) * 100)}%` : "0%", badge: "LOW", badgeColor: "bg-emerald-500/10 text-emerald-600" },
              { icon: Flame, label: "Daily Burn Rate", value: fmt(Math.round(data.finance.burnRatePerDay)), badge: data.finance.burnRatePerDay > 5000 ? "HIGH" : "LOW", badgeColor: data.finance.burnRatePerDay > 5000 ? "bg-destructive/10 text-destructive" : "bg-emerald-500/10 text-emerald-600" },
            ].map((r, i) => (
              <div key={i} className="bg-card rounded-2xl border border-border p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center"><r.icon className="h-4 w-4 text-muted-foreground" /></div>
                  <p className="font-medium text-foreground">{r.label}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-foreground">{r.value}</span>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${r.badgeColor}`}>{r.badge}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
