import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  BarChart3, ShoppingCart, Wallet, Package, TrendingUp, Target,
  DollarSign, AlertTriangle, Zap, ArrowUpCircle, ArrowDownCircle,
  CheckCircle2, Clock, Truck, RotateCcw, XCircle, Pause, Send,
  Activity, Shield, Eye, Flame, Loader2, Users, Repeat,
  Globe, Award, PieChart as PieChartIcon, ArrowUp, ArrowDown,
  ShoppingBag, Timer, Hash
} from "lucide-react";
import { useAnalyticsData } from "@/hooks/useAnalyticsData";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend,
  AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts";

type AnalyticsTab =
  | "overview" | "orders" | "finance" | "product" | "profit"
  | "cost_ads" | "customers" | "funnel" | "growth" | "risk";

type Period = "today" | "yesterday" | "monthly" | "yearly";

const tabConfig: { id: AnalyticsTab; label: string; icon: any }[] = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "orders", label: "Orders", icon: ShoppingCart },
  { id: "funnel", label: "Funnel", icon: Target },
  { id: "customers", label: "Customers", icon: Users },
  { id: "growth", label: "Growth", icon: TrendingUp },
  { id: "finance", label: "Finance", icon: Wallet },
  { id: "product", label: "Products", icon: Package },
  { id: "profit", label: "Profit", icon: DollarSign },
  { id: "cost_ads", label: "Cost & Ads", icon: Zap },
  { id: "risk", label: "Risk", icon: AlertTriangle },
];

const COLORS = [
  "hsl(var(--primary))", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444",
  "#06b6d4", "#ec4899", "#14b8a6", "#6366f1", "#84cc16"
];

const fmt = (n: number) => `৳${n.toLocaleString()}`;

function GrowthBadge({ value }: { value: number }) {
  if (value === 0) return null;
  const isUp = value > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded-md ${isUp ? "bg-emerald-500/10 text-emerald-600" : "bg-destructive/10 text-destructive"}`}>
      {isUp ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
      {Math.abs(value)}%
    </span>
  );
}

function StatCard({ icon: Icon, label, value, sub, iconBg, valueColor }: {
  icon: any; label: string; value: string | number; sub?: React.ReactNode; iconBg: string; valueColor?: string;
}) {
  return (
    <div className="bg-card rounded-2xl border border-border p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 mb-3">
        <div className={`h-10 w-10 rounded-xl ${iconBg} flex items-center justify-center`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
      </div>
      <p className={`text-2xl font-bold ${valueColor || "text-foreground"}`}>{value}</p>
      {sub && <div className="mt-1">{sub}</div>}
    </div>
  );
}

function MiniCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-4 text-center hover:shadow-sm transition-shadow">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-xl font-bold ${color || "text-foreground"}`}>{value}</p>
    </div>
  );
}

function ChartCard({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-card rounded-2xl border border-border p-6 ${className || ""}`}>
      <h3 className="font-bold text-foreground mb-4">{title}</h3>
      {children}
    </div>
  );
}

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
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
            <p className="text-sm text-muted-foreground">{data.dateRange.from} → {data.dateRange.to}</p>
          </div>
          <div className="flex gap-1 bg-secondary/50 rounded-full p-1">
            {periods.map((p) => (
              <button key={p.id} onClick={() => setPeriod(p.id)} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${period === p.id ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 bg-card rounded-2xl border border-border p-2">
          {tabConfig.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === t.id ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
              <t.icon className="h-4 w-4" />{t.label}
            </button>
          ))}
        </div>

        {/* =================== OVERVIEW =================== */}
        {tab === "overview" && (
          <div className="space-y-5">
            {/* Top KPI Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={ShoppingCart} label="Total Orders" value={data.orders.total} iconBg="bg-blue-500" sub={<GrowthBadge value={data.growth.orderGrowth} />} />
              <StatCard icon={DollarSign} label="Revenue" value={fmt(data.revenue.total)} iconBg="bg-emerald-500" sub={<GrowthBadge value={data.growth.revenueGrowth} />} />
              <StatCard icon={TrendingUp} label="Profit Margin" value={`${data.revenue.profitMargin}%`} iconBg="bg-orange-500" valueColor={data.revenue.profitMargin > 20 ? "text-emerald-500" : "text-destructive"} />
              <StatCard icon={Target} label="Confirm Rate" value={`${data.orders.confirmRate}%`} iconBg="bg-violet-500" valueColor={data.orders.confirmRate > 50 ? "text-emerald-500" : "text-destructive"} />
            </div>

            {/* Secondary stats */}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              <MiniCard label="AOV" value={fmt(data.revenue.aov)} color="text-primary" />
              <MiniCard label="Confirmed" value={data.orders.confirmed} color="text-emerald-500" />
              <MiniCard label="Cancelled" value={data.orders.cancelled} color="text-destructive" />
              <MiniCard label="Delivered" value={data.orders.delivered} color="text-emerald-600" />
              <MiniCard label="Returned" value={data.orders.returned} color="text-destructive" />
              <MiniCard label="Cost/Order" value={fmt(Math.round(data.revenue.costPerOrder))} />
            </div>

            {/* Business Health Score */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="h-8 w-8 rounded-lg bg-orange-500 flex items-center justify-center"><Activity className="h-4 w-4 text-white" /></div>
                <h3 className="font-bold text-foreground">Business Health Score</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { label: "Confirm Rate", value: data.orders.confirmRate, color: data.orders.confirmRate > 50 ? "#10b981" : "#9ca3af" },
                  { label: "Profit Margin", value: Math.max(0, data.revenue.profitMargin), color: data.revenue.profitMargin > 20 ? "#10b981" : "#f59e0b" },
                  { label: "Cash Stability", value: Math.max(0, data.finance.cashFlowStability), color: data.finance.cashFlowStability > 50 ? "#10b981" : "#ef4444" },
                  { label: "Delivery Rate", value: data.orders.deliveryRate, color: data.orders.deliveryRate > 70 ? "#10b981" : "#f59e0b" },
                ].map((s, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div className="relative h-20 w-20">
                      <svg className="h-20 w-20 -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
                        <circle cx="50" cy="50" r="40" fill="none" stroke={s.color} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${s.value * 2.51} 251`} />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-lg font-bold text-foreground">{s.value}%</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Revenue + Orders Chart */}
            {data.charts.dailyTrend.length > 0 && (
              <ChartCard title="Revenue & Orders Trend">
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={data.charts.dailyTrend}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" fontSize={11} stroke="hsl(var(--muted-foreground))" />
                    <YAxis yAxisId="left" fontSize={11} stroke="hsl(var(--muted-foreground))" />
                    <YAxis yAxisId="right" orientation="right" fontSize={11} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip />
                    <Legend />
                    <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#colorRevenue)" strokeWidth={2} name="Revenue (৳)" />
                    <Line yAxisId="right" type="monotone" dataKey="orders" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Orders" />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>
            )}

            {/* Hourly Heatmap */}
            <ChartCard title={`Hourly Order Pattern (Peak: ${data.hourly.peakHour}:00)`}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.hourly.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="hour" fontSize={10} stroke="hsl(var(--muted-foreground))" interval={1} />
                  <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip />
                  <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        )}

        {/* =================== ORDERS =================== */}
        {tab === "orders" && (
          <div className="space-y-5">
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {[
                { icon: ShoppingCart, label: "Total", value: data.orders.total, color: "text-primary" },
                { icon: CheckCircle2, label: "Confirmed", value: data.orders.confirmed, color: "text-emerald-500" },
                { icon: XCircle, label: "Cancelled", value: data.orders.cancelled, color: "text-destructive" },
                { icon: Send, label: "In Courier", value: data.orders.inCourier, color: "text-violet-500" },
                { icon: Truck, label: "Delivered", value: data.orders.delivered, color: "text-emerald-600" },
                { icon: RotateCcw, label: "Returned", value: data.orders.returned, color: "text-destructive" },
              ].map((s, i) => (
                <div key={i} className="bg-card rounded-2xl border border-border p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-center gap-2 mb-2"><s.icon className={`h-4 w-4 ${s.color}`} /><p className="text-[10px] text-muted-foreground uppercase">{s.label}</p></div>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { label: "Processing", value: data.orders.processing },
                { label: "On Hold", value: data.orders.onHold },
                { label: "Ship Later", value: data.orders.shipLater },
                { label: "Inquiry", value: data.orders.inquiry },
                { label: "Hand Delivery", value: data.orders.handDelivery },
              ].map((s, i) => (
                <MiniCard key={i} label={s.label} value={s.value} />
              ))}
            </div>

            {/* Rates */}
            <div className="grid grid-cols-4 gap-3">
              <MiniCard label="Confirm Rate" value={`${data.orders.confirmRate}%`} color="text-emerald-500" />
              <MiniCard label="Cancel Rate" value={`${data.orders.cancelRate}%`} color="text-destructive" />
              <MiniCard label="Delivery Rate" value={`${data.orders.deliveryRate}%`} color="text-emerald-600" />
              <MiniCard label="Return Rate" value={`${data.orders.returnRate}%`} color="text-destructive" />
            </div>

            {/* Revenue row */}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {[
                { label: "Revenue", value: fmt(data.revenue.total), color: "text-primary" },
                { label: "Product Cost", value: fmt(data.revenue.productCost) },
                { label: "Delivery", value: fmt(data.revenue.delivery), color: "text-orange-500" },
                { label: "Ad Spend", value: fmt(data.revenue.adSpendBDT), color: "text-destructive" },
                { label: "Gross Profit", value: fmt(data.revenue.grossProfit), color: data.revenue.grossProfit >= 0 ? "text-emerald-500" : "text-destructive" },
                { label: "AOV", value: fmt(data.revenue.aov), color: "text-primary" },
              ].map((s, i) => (
                <MiniCard key={i} label={s.label} value={s.value} color={s.color} />
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.charts.dailyTrend.length > 0 && (
                <ChartCard title="Daily Orders">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={data.charts.dailyTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" fontSize={10} stroke="hsl(var(--muted-foreground))" />
                      <YAxis fontSize={10} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip />
                      <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}
              {data.charts.statusBreakdown.length > 0 && (
                <ChartCard title="Status Distribution">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={data.charts.statusBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40} label={({ name, value }) => `${name}: ${value}`}>
                        {data.charts.statusBreakdown.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}
            </div>

            {/* Source breakdown */}
            {data.sources.length > 0 && (
              <ChartCard title="Order Sources">
                <div className="space-y-2">
                  {data.sources.map((s, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                      <div className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="font-medium text-sm text-foreground">{s.name}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">{s.orders} orders</span>
                        <span className="font-semibold text-foreground">{fmt(s.revenue)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </ChartCard>
            )}
          </div>
        )}

        {/* =================== FUNNEL =================== */}
        {tab === "funnel" && (
          <div className="space-y-5">
            <div className="bg-card rounded-2xl border border-border p-6">
              <h3 className="font-bold text-foreground mb-6">Conversion Funnel</h3>
              <div className="space-y-3">
                {data.funnel.map((stage, i) => {
                  const maxWidth = 100;
                  const width = Math.max(8, stage.pct);
                  const dropOff = i > 0 ? data.funnel[i - 1].pct - stage.pct : 0;
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-foreground">{stage.stage}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-foreground">{stage.count}</span>
                          <span className="text-xs text-muted-foreground">({stage.pct}%)</span>
                          {dropOff > 0 && <span className="text-[10px] text-destructive font-medium">-{dropOff}%</span>}
                        </div>
                      </div>
                      <div className="h-8 bg-secondary rounded-lg overflow-hidden">
                        <div
                          className="h-full rounded-lg transition-all duration-500"
                          style={{
                            width: `${width}%`,
                            background: `linear-gradient(90deg, ${COLORS[i]}, ${COLORS[i]}dd)`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Hourly Pattern */}
            <ChartCard title={`Hourly Order Pattern (Peak Hour: ${data.hourly.peakHour}:00)`}>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={data.hourly.data}>
                  <defs>
                    <linearGradient id="colorHourly" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="hour" fontSize={10} stroke="hsl(var(--muted-foreground))" interval={1} />
                  <YAxis fontSize={10} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip />
                  <Area type="monotone" dataKey="orders" stroke="hsl(var(--primary))" fill="url(#colorHourly)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        )}

        {/* =================== CUSTOMERS =================== */}
        {tab === "customers" && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={Users} label="Unique Customers" value={data.customers.unique} iconBg="bg-blue-500" />
              <StatCard icon={Repeat} label="Repeat Customers" value={data.customers.repeat} iconBg="bg-emerald-500" />
              <StatCard icon={Target} label="Repeat Rate" value={`${data.customers.repeatRate}%`} iconBg="bg-violet-500" valueColor={data.customers.repeatRate > 10 ? "text-emerald-500" : "text-foreground"} />
              <StatCard icon={DollarSign} label="AOV" value={fmt(data.revenue.aov)} iconBg="bg-orange-500" />
            </div>

            {/* Top Customers */}
            {data.customers.topCustomers.length > 0 && (
              <div className="bg-card rounded-2xl border border-border p-6">
                <h3 className="font-bold text-foreground mb-4">Top Customers</h3>
                <div className="space-y-2">
                  {data.customers.topCustomers.map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          #{i + 1}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-foreground">{c.name}</p>
                          <p className="text-xs text-muted-foreground">{c.phone}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm text-foreground">{fmt(c.total)}</p>
                        <p className="text-xs text-muted-foreground">{c.count} orders</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* =================== GROWTH =================== */}
        {tab === "growth" && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={ShoppingCart} label="Current Orders" value={data.orders.total} iconBg="bg-blue-500" sub={<GrowthBadge value={data.growth.orderGrowth} />} />
              <StatCard icon={ShoppingCart} label="Previous Orders" value={data.growth.prevOrders} iconBg="bg-muted-foreground" />
              <StatCard icon={DollarSign} label="Current Revenue" value={fmt(data.revenue.total)} iconBg="bg-emerald-500" sub={<GrowthBadge value={data.growth.revenueGrowth} />} />
              <StatCard icon={DollarSign} label="Previous Revenue" value={fmt(data.growth.prevRevenue)} iconBg="bg-muted-foreground" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card rounded-2xl border border-border p-6 text-center">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Order Growth</p>
                <p className={`text-5xl font-bold ${data.growth.orderGrowth >= 0 ? "text-emerald-500" : "text-destructive"}`}>
                  {data.growth.orderGrowth >= 0 ? "+" : ""}{data.growth.orderGrowth}%
                </p>
                <p className="text-sm text-muted-foreground mt-2">vs previous period</p>
              </div>
              <div className="bg-card rounded-2xl border border-border p-6 text-center">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Revenue Growth</p>
                <p className={`text-5xl font-bold ${data.growth.revenueGrowth >= 0 ? "text-emerald-500" : "text-destructive"}`}>
                  {data.growth.revenueGrowth >= 0 ? "+" : ""}{data.growth.revenueGrowth}%
                </p>
                <p className="text-sm text-muted-foreground mt-2">vs previous period</p>
              </div>
            </div>

            {data.charts.dailyTrend.length > 0 && (
              <ChartCard title="Revenue & Profit Trend">
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={data.charts.dailyTrend}>
                    <defs>
                      <linearGradient id="colorRev2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" fontSize={11} stroke="hsl(var(--muted-foreground))" />
                    <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#colorRev2)" strokeWidth={2} name="Revenue" />
                    <Area type="monotone" dataKey="profit" stroke="#8b5cf6" fill="url(#colorProfit)" strokeWidth={2} name="Profit" />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>
            )}
          </div>
        )}

        {/* =================== FINANCE =================== */}
        {tab === "finance" && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={ArrowUpCircle} label="Total Income" value={fmt(data.finance.totalIncome)} iconBg="bg-emerald-500" valueColor="text-emerald-500" />
              <StatCard icon={ArrowDownCircle} label="Total Expense" value={fmt(data.finance.totalExpense)} iconBg="bg-destructive" valueColor="text-destructive" />
              <StatCard icon={ShoppingBag} label="Product Purchase" value={fmt(data.finance.totalProductPurchase)} iconBg="bg-orange-500" />
              <StatCard icon={Wallet} label="Bank Balance" value={fmt(data.finance.bankBalance)} iconBg="bg-blue-500" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={Activity} label="Cash Flow" value={`${data.finance.cashFlowStability}%`} iconBg="bg-rose-500" valueColor={data.finance.cashFlowStability > 30 ? "text-emerald-500" : "text-destructive"} />
              <StatCard icon={Flame} label="Burn Rate/Day" value={fmt(Math.round(data.finance.burnRatePerDay))} iconBg="bg-teal-500" />
              <StatCard icon={Shield} label="Survival Days" value={`${data.finance.survivalDays} days`} iconBg="bg-emerald-500" valueColor={data.finance.survivalDays > 30 ? "text-emerald-500" : "text-destructive"} />
              <StatCard icon={ArrowDownCircle} label="Net Loans" value={fmt(data.finance.totalLoans)} iconBg="bg-amber-500" />
            </div>

            {data.charts.cashFlowTrend.length > 0 && (
              <ChartCard title="Cash In vs Cash Out">
                <ResponsiveContainer width="100%" height={260}>
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
              </ChartCard>
            )}

            {data.charts.expenseBreakdown.length > 0 && (
              <ChartCard title="Expense Breakdown">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={data.charts.expenseBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} label={({ name, value }) => `৳${value.toLocaleString()}`}>
                        {data.charts.expenseBreakdown.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 flex flex-col justify-center">
                    {data.charts.expenseBreakdown.slice(0, 8).map((e, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className="text-sm text-foreground truncate max-w-[180px]">{e.name}</span>
                        </div>
                        <span className="text-sm font-semibold text-foreground">{fmt(e.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </ChartCard>
            )}
          </div>
        )}

        {/* =================== PRODUCT =================== */}
        {tab === "product" && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={Package} label="Total Products" value={data.products.total} iconBg="bg-blue-500" />
              <StatCard icon={CheckCircle2} label="Active" value={data.products.active} iconBg="bg-emerald-500" />
              <StatCard icon={AlertTriangle} label="Out of Stock" value={data.products.outOfStock} iconBg="bg-destructive" valueColor={data.products.outOfStock > 0 ? "text-destructive" : "text-foreground"} />
              <StatCard icon={Clock} label="Low Stock (≤5)" value={data.products.lowStock} iconBg="bg-orange-500" valueColor={data.products.lowStock > 0 ? "text-orange-500" : "text-foreground"} />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <MiniCard label="Stock Value (Purchase)" value={fmt(data.products.totalStockValue)} />
              <MiniCard label="Stock Value (Selling)" value={fmt(data.products.totalSellingValue)} color="text-primary" />
              <MiniCard label="Potential Profit" value={fmt(data.products.potentialProfit)} color="text-emerald-500" />
            </div>

            {/* Top Selling Products */}
            {data.topProducts.length > 0 && (
              <div className="bg-card rounded-2xl border border-border p-6">
                <h3 className="font-bold text-foreground mb-4">Top Selling Products</h3>
                <div className="space-y-2">
                  {data.topProducts.map((p, i) => {
                    const maxRev = data.topProducts[0]?.revenue || 1;
                    return (
                      <div key={i} className="relative p-3 rounded-xl overflow-hidden">
                        <div className="absolute inset-0 bg-primary/5 rounded-xl" style={{ width: `${(p.revenue / maxRev) * 100}%` }} />
                        <div className="relative flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-muted-foreground w-5">#{i + 1}</span>
                            <span className="font-medium text-sm text-foreground">{p.name}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-muted-foreground">{p.qty} sold</span>
                            <span className="font-bold text-foreground">{fmt(p.revenue)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* =================== PROFIT =================== */}
        {tab === "profit" && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={DollarSign} label="Total Revenue" value={fmt(data.revenue.total)} iconBg="bg-blue-500" />
              <StatCard icon={TrendingUp} label="Gross Profit" value={fmt(data.revenue.grossProfit)} iconBg="bg-emerald-500" valueColor={data.revenue.grossProfit >= 0 ? "text-emerald-500" : "text-destructive"} />
              <StatCard icon={TrendingUp} label="Profit Margin" value={`${data.revenue.profitMargin}%`} iconBg={data.revenue.profitMargin > 20 ? "bg-emerald-500" : "bg-destructive"} valueColor={data.revenue.profitMargin > 20 ? "text-emerald-500" : "text-destructive"} />
              <StatCard icon={Zap} label="Cost/Order" value={fmt(Math.round(data.revenue.costPerOrder))} iconBg="bg-orange-500" />
            </div>

            <div className="grid grid-cols-4 gap-3">
              <MiniCard label="Product Cost" value={fmt(data.revenue.productCost)} />
              <MiniCard label="Delivery Earned" value={fmt(data.revenue.delivery)} color="text-emerald-500" />
              <MiniCard label="Discount Given" value={fmt(data.revenue.discount)} color="text-destructive" />
              <MiniCard label="Ad Spend" value={fmt(data.revenue.adSpendBDT)} color="text-destructive" />
            </div>

            {data.charts.dailyTrend.length > 0 && (
              <ChartCard title="Daily Profit Trend">
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={data.charts.dailyTrend}>
                    <defs>
                      <linearGradient id="colorProfitArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" fontSize={11} stroke="hsl(var(--muted-foreground))" />
                    <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip />
                    <Area type="monotone" dataKey="profit" stroke="#10b981" fill="url(#colorProfitArea)" strokeWidth={2} name="Profit" />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>
            )}
          </div>
        )}

        {/* =================== COST & ADS =================== */}
        {tab === "cost_ads" && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={Zap} label="Total Ads (BDT)" value={fmt(data.revenue.adSpendBDT)} iconBg="bg-blue-500" />
              <StatCard icon={DollarSign} label="Total Ads (USD)" value={`$${data.revenue.adSpendUSD.toFixed(2)}`} iconBg="bg-emerald-500" />
              <StatCard icon={Target} label="ROAS" value={`${data.revenue.roas.toFixed(1)}x`} iconBg="bg-violet-500" valueColor={data.revenue.roas >= 2 ? "text-emerald-500" : "text-destructive"} />
              <StatCard icon={Hash} label="Cost/Order" value={fmt(Math.round(data.revenue.costPerOrder))} iconBg="bg-orange-500" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card rounded-2xl border border-border p-5">
                <p className="text-xs text-muted-foreground uppercase font-semibold mb-2">Ads vs Revenue</p>
                <p className="text-lg font-bold text-foreground">{data.revenue.total > 0 ? `${Math.round((data.revenue.adSpendBDT / data.revenue.total) * 100)}%` : "0%"} of revenue</p>
                <div className="h-3 bg-secondary rounded-full mt-3 overflow-hidden">
                  <div className="h-full bg-destructive rounded-full" style={{ width: `${Math.min(100, data.revenue.total > 0 ? (data.revenue.adSpendBDT / data.revenue.total) * 100 : 0)}%` }} />
                </div>
              </div>
              <div className="bg-card rounded-2xl border border-border p-5">
                <p className="text-xs text-muted-foreground uppercase font-semibold mb-2">Profit After Ads</p>
                <p className={`text-2xl font-bold ${data.revenue.grossProfit >= 0 ? "text-emerald-500" : "text-destructive"}`}>{fmt(data.revenue.grossProfit)}</p>
              </div>
            </div>

            {data.charts.adSpendTrend.length > 0 && (
              <ChartCard title="Ad Spend vs Revenue">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={data.charts.adSpendTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" fontSize={11} stroke="hsl(var(--muted-foreground))" />
                    <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="spend" fill="#ef4444" name="Ad Spend" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="revenue" fill="#10b981" name="Revenue" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            )}
          </div>
        )}

        {/* =================== RISK =================== */}
        {tab === "risk" && (
          <div className="space-y-3">
            {[
              { icon: Shield, label: "Cash Survival", value: `${data.finance.survivalDays} days`, badge: data.finance.survivalDays > 30 ? "LOW" : data.finance.survivalDays > 7 ? "MEDIUM" : "HIGH", badgeColor: data.finance.survivalDays > 30 ? "bg-emerald-500/10 text-emerald-600" : data.finance.survivalDays > 7 ? "bg-amber-500/10 text-amber-600" : "bg-destructive/10 text-destructive", desc: "ব্যাংক ব্যালেন্স দিয়ে কতদিন চলতে পারবে" },
              { icon: XCircle, label: "Cancellation Rate", value: `${data.orders.cancelRate}%`, badge: data.orders.cancelRate < 20 ? "LOW" : data.orders.cancelRate < 40 ? "MEDIUM" : "HIGH", badgeColor: data.orders.cancelRate < 20 ? "bg-emerald-500/10 text-emerald-600" : data.orders.cancelRate < 40 ? "bg-amber-500/10 text-amber-600" : "bg-destructive/10 text-destructive", desc: "অর্ডার ক্যান্সেল হওয়ার হার" },
              { icon: RotateCcw, label: "Return Rate", value: `${data.orders.returnRate}%`, badge: data.orders.returnRate < 10 ? "LOW" : data.orders.returnRate < 25 ? "MEDIUM" : "HIGH", badgeColor: data.orders.returnRate < 10 ? "bg-emerald-500/10 text-emerald-600" : data.orders.returnRate < 25 ? "bg-amber-500/10 text-amber-600" : "bg-destructive/10 text-destructive", desc: "ডেলিভারি হওয়া অর্ডারের মধ্যে রিটার্নের হার" },
              { icon: AlertTriangle, label: "Out of Stock", value: `${data.products.outOfStock} items`, badge: data.products.outOfStock === 0 ? "LOW" : data.products.outOfStock > 3 ? "HIGH" : "MEDIUM", badgeColor: data.products.outOfStock === 0 ? "bg-emerald-500/10 text-emerald-600" : data.products.outOfStock > 3 ? "bg-destructive/10 text-destructive" : "bg-amber-500/10 text-amber-600", desc: "স্টকে না থাকা প্রোডাক্ট" },
              { icon: Zap, label: "Ads Dependency", value: data.revenue.total > 0 ? `${Math.round((data.revenue.adSpendBDT / data.revenue.total) * 100)}%` : "0%", badge: data.revenue.total > 0 && (data.revenue.adSpendBDT / data.revenue.total) > 0.3 ? "HIGH" : "LOW", badgeColor: data.revenue.total > 0 && (data.revenue.adSpendBDT / data.revenue.total) > 0.3 ? "bg-destructive/10 text-destructive" : "bg-emerald-500/10 text-emerald-600", desc: "রেভেনিউর কত % অ্যাডে যাচ্ছে" },
              { icon: Flame, label: "Daily Burn Rate", value: fmt(Math.round(data.finance.burnRatePerDay)), badge: data.finance.burnRatePerDay > 5000 ? "HIGH" : "LOW", badgeColor: data.finance.burnRatePerDay > 5000 ? "bg-destructive/10 text-destructive" : "bg-emerald-500/10 text-emerald-600", desc: "প্রতিদিন গড় খরচ" },
              { icon: TrendingUp, label: "Profit Margin", value: `${data.revenue.profitMargin}%`, badge: data.revenue.profitMargin > 20 ? "LOW" : data.revenue.profitMargin > 0 ? "MEDIUM" : "HIGH", badgeColor: data.revenue.profitMargin > 20 ? "bg-emerald-500/10 text-emerald-600" : data.revenue.profitMargin > 0 ? "bg-amber-500/10 text-amber-600" : "bg-destructive/10 text-destructive", desc: "লাভের মার্জিন কতটুকু" },
            ].map((r, i) => (
              <div key={i} className="bg-card rounded-2xl border border-border p-5 flex items-center justify-between hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center"><r.icon className="h-5 w-5 text-muted-foreground" /></div>
                  <div>
                    <p className="font-medium text-foreground">{r.label}</p>
                    <p className="text-xs text-muted-foreground">{r.desc}</p>
                  </div>
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
