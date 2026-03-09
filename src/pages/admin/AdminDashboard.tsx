import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import {
  ShoppingCart, Clock, CheckCircle2, XCircle, PauseCircle,
  CalendarClock, Truck, PhoneOff, TrendingUp, DollarSign,
  Target, Package, AlertTriangle, Landmark, Layers, HandCoins,
  PiggyBank, Receipt, Loader2, BarChart3, CreditCard, Undo2,
  Hand, ShoppingBag, Hash, ArrowDownCircle, ArrowUpCircle
} from "lucide-react";
import { useDashboardData, useSalesTrend } from "@/hooks/useDashboardData";
import { useAuth } from "@/contexts/AuthContext";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";

const timeFilters = ["Today", "Yesterday", "This Week", "This Month"] as const;

const fmt = (n: number) => `৳${n.toLocaleString("en-BD")}`;

const AdminDashboard = () => {
  const [activeFilter, setActiveFilter] = useState<typeof timeFilters[number]>("Today");
  const { isLoading, orderStats, shippingStats, profitStats, financeStats, salesDetails } = useDashboardData(activeFilter);
  const { data: salesTrend } = useSalesTrend();
  const { isAdmin, userRoles } = useAuth();

  const hasRole = (role: string) => userRoles.includes(role as any);
  const canSeeOrders = isAdmin || hasRole("manager") || hasRole("moderator") || hasRole("user");
  const canSeeFinance = isAdmin || hasRole("accounting");
  const canSeeProfit = isAdmin || hasRole("accounting");
  const canSeeAdAnalytics = isAdmin || hasRole("ad_analytics");

  const orderCards = [
    { label: "TOTAL ORDERS", value: String(orderStats.totalOrders), sub: "Orders", change: `(${fmt(orderStats.totalAmount)})`, icon: ShoppingCart, color: "text-foreground", bgGradient: "from-slate-100 to-slate-50", iconColor: "text-slate-500" },
    { label: "PROCESSING", value: String(orderStats.processing.count), sub: "New", change: `(${orderStats.processing.pct}%)`, extra: `(${fmt(orderStats.processing.amount)})`, icon: Clock, color: "text-blue-600", bgGradient: "from-blue-100 to-blue-50", iconColor: "text-blue-500" },
    { label: "CONFIRMED", value: String(orderStats.confirmed.count), sub: "Confirmed", change: `(${orderStats.confirmed.pct}%)`, extra: `(${fmt(orderStats.confirmed.amount)})`, icon: CheckCircle2, color: "text-emerald-600", bgGradient: "from-emerald-100 to-emerald-50", iconColor: "text-emerald-500" },
    { label: "CANCELLED", value: String(orderStats.cancelled.count), sub: "Cancelled", change: `(${orderStats.cancelled.pct}%)`, extra: `(${fmt(orderStats.cancelled.amount)})`, icon: XCircle, color: "text-red-500", bgGradient: "from-red-100 to-red-50", iconColor: "text-red-500" },
    { label: "ON HOLD", value: String(orderStats.onHold.count), sub: "On Hold", change: `(${orderStats.onHold.pct}%)`, extra: `(${fmt(orderStats.onHold.amount)})`, icon: PauseCircle, color: "text-amber-600", bgGradient: "from-amber-100 to-amber-50", iconColor: "text-amber-500" },
  ];

  const deliveryCards = [
    { label: "DELIVERED", value: String(orderStats.delivered.count), sub: `(${orderStats.delivered.pct}%)`, extra: fmt(orderStats.delivered.amount), icon: CheckCircle2, color: "text-emerald-600", bgGradient: "from-emerald-100 to-emerald-50", iconColor: "text-emerald-500" },
    { label: "HAND DELIVERY", value: String(orderStats.handDelivery.count), sub: `(${orderStats.handDelivery.pct}%)`, extra: fmt(orderStats.handDelivery.amount), icon: Hand, color: "text-indigo-600", bgGradient: "from-indigo-100 to-indigo-50", iconColor: "text-indigo-500" },
    { label: "RETURNED", value: String(orderStats.returned.count), sub: `(${orderStats.returned.pct}%)`, extra: fmt(orderStats.returned.amount), icon: Undo2, color: "text-red-500", bgGradient: "from-red-100 to-red-50", iconColor: "text-red-500" },
    { label: "PENDING RETURN", value: String(orderStats.pendingReturn.count), sub: `(${orderStats.pendingReturn.pct}%)`, extra: fmt(orderStats.pendingReturn.amount), icon: AlertTriangle, color: "text-orange-500", bgGradient: "from-orange-100 to-orange-50", iconColor: "text-orange-500" },
  ];

  const shipCards = [
    { label: "SHIP LATER", value: String(shippingStats.shipLater.count), sub: "Ship Later", change: `(${shippingStats.shipLater.pct}%)`, extra: `(${fmt(shippingStats.shipLater.amount)})`, icon: CalendarClock, color: "text-teal-600", bgGradient: "from-teal-100 to-teal-50", iconColor: "text-teal-500" },
    { label: "IN COURIER", value: String(shippingStats.inCourier.count), sub: "In Courier", change: `(${shippingStats.inCourier.pct}%)`, extra: `(${fmt(shippingStats.inCourier.amount)})`, icon: Truck, color: "text-violet-600", bgGradient: "from-violet-100 to-violet-50", iconColor: "text-violet-500" },
    { label: "INCOMPLETE", value: String(shippingStats.incompleteTotal), sub: "Total", icon: PhoneOff, color: "text-foreground", bgGradient: "from-slate-100 to-slate-50", iconColor: "text-slate-500",
      badges: [
        { label: `${shippingStats.incompleteBadges.confirmed} Confirmed`, color: "text-emerald-600 border-emerald-200/60 bg-emerald-50" },
        { label: `${shippingStats.incompleteBadges.processing} Processing`, color: "text-blue-600 border-blue-200/60 bg-blue-50" },
        { label: `${shippingStats.incompleteBadges.hold} Hold`, color: "text-amber-600 border-amber-200/60 bg-amber-50" },
        { label: `${shippingStats.incompleteBadges.cancelled} Cancelled`, color: "text-red-500 border-red-200/60 bg-red-50" },
      ]
    },
  ];

  const profitItems = [
    { label: "REVENUE", value: fmt(profitStats.revenue), icon: DollarSign, iconColor: "text-blue-600", bgGradient: "from-blue-100 to-blue-50" },
    { label: "PRODUCT COST", value: fmt(profitStats.productCost), icon: Package, iconColor: "text-slate-600", bgGradient: "from-slate-100 to-slate-50" },
    { label: "ADS COST", value: fmt(profitStats.adsCostBdt), sub: `($${profitStats.adsCostUsd.toFixed(2)})`, icon: Target, iconColor: "text-violet-600", bgGradient: "from-violet-100 to-violet-50" },
    { label: "DELIVERY", value: fmt(profitStats.deliveryCost), icon: Truck, iconColor: "text-cyan-600", bgGradient: "from-cyan-100 to-cyan-50" },
    { label: "RETURNS", value: fmt(profitStats.returnAmount), icon: AlertTriangle, iconColor: "text-red-500", bgGradient: "from-red-100 to-red-50" },
    { label: "EST. PROFIT", value: fmt(profitStats.estProfit), icon: TrendingUp, iconColor: "text-emerald-600", bgGradient: "from-emerald-100 to-emerald-50" },
    { label: "FINAL PROFIT", value: fmt(profitStats.finalProfit), icon: Receipt, iconColor: "text-teal-600", bgGradient: "from-teal-100 to-teal-50" },
  ];

  const finCards = [
    { label: "MONEY IN", value: fmt(financeStats.moneyIn), icon: ArrowDownCircle, iconColor: "text-emerald-600", bgGradient: "from-emerald-100 to-emerald-50" },
    { label: "MONEY OUT", value: fmt(financeStats.moneyOut), icon: ArrowUpCircle, iconColor: "text-red-500", bgGradient: "from-red-100 to-red-50" },
    { label: "BANK BALANCE", value: fmt(financeStats.bankBalance), icon: Landmark, iconColor: "text-blue-600", bgGradient: "from-blue-100 to-blue-50" },
    { label: "STOCK VALUE", value: fmt(financeStats.stockValue), icon: Layers, iconColor: "text-emerald-600", bgGradient: "from-emerald-100 to-emerald-50" },
    { label: `COURIER BALANCE (${financeStats.courierCount})`, value: fmt(financeStats.courierBalance), icon: Truck, iconColor: "text-violet-600", bgGradient: "from-violet-100 to-violet-50" },
    { label: "PRODUCT PURCHASE", value: fmt(financeStats.totalProductPurchase), icon: ShoppingBag, iconColor: "text-orange-600", bgGradient: "from-orange-100 to-orange-50" },
    { label: `LOANS (${financeStats.loanCount})`, value: fmt(financeStats.loanTotal), icon: HandCoins, iconColor: "text-red-500", bgGradient: "from-red-100 to-red-50" },
    { label: "INVESTMENTS", value: fmt(financeStats.investmentTotal), icon: PiggyBank, iconColor: "text-amber-600", bgGradient: "from-amber-100 to-amber-50" },
    { label: "NET VALUE", value: fmt(financeStats.netValue), icon: Receipt, iconColor: "text-emerald-600", bgGradient: "from-emerald-100 to-emerald-50" },
  ];

  const maxHourly = Math.max(...salesDetails.hourlyOrders, 1);

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-[1400px]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Your business performance at a glance</p>
          </div>
          <div className="flex items-center gap-0.5 bg-card rounded-xl border border-border/50 p-1 shadow-sm">
            {timeFilters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeFilter === filter
                    ? "bg-gradient-to-r from-primary to-[hsl(187,85%,53%)] text-white shadow-md"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/70"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {!isLoading && (
          <>
            {/* Quick Summary Bar - orders visible to order roles */}
            {canSeeOrders && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="p-3 border-border/30 bg-gradient-to-br from-blue-50 to-blue-100/50">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">AVG ORDER VALUE</p>
                <p className="text-xl font-extrabold text-blue-600 mt-0.5">{fmt(orderStats.avgOrderValue)}</p>
              </Card>
              <Card className="p-3 border-border/30 bg-gradient-to-br from-emerald-50 to-emerald-100/50">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">PAID ORDERS</p>
                <p className="text-xl font-extrabold text-emerald-600 mt-0.5">{salesDetails.paymentStats.paid.count} <span className="text-xs font-medium text-muted-foreground">({fmt(salesDetails.paymentStats.paid.amount)})</span></p>
              </Card>
              <Card className="p-3 border-border/30 bg-gradient-to-br from-amber-50 to-amber-100/50">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">UNPAID ORDERS</p>
                <p className="text-xl font-extrabold text-amber-600 mt-0.5">{salesDetails.paymentStats.unpaid.count} <span className="text-xs font-medium text-muted-foreground">({fmt(salesDetails.paymentStats.unpaid.amount)})</span></p>
              </Card>
              <Card className="p-3 border-border/30 bg-gradient-to-br from-violet-50 to-violet-100/50">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">PARTIAL PAID</p>
                <p className="text-xl font-extrabold text-violet-600 mt-0.5">{salesDetails.paymentStats.partial.count} <span className="text-xs font-medium text-muted-foreground">({fmt(salesDetails.paymentStats.partial.amount)})</span></p>
              </Card>
            </div>
            )}

            {/* Order Status Cards */}
            {canSeeOrders && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {orderCards.map((stat) => (
                <Card key={stat.label} className="p-4 border-border/30 card-hover group overflow-hidden relative">
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-0 group-hover:opacity-30 transition-opacity duration-300`} />
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-2.5 rounded-xl bg-gradient-to-br ${stat.bgGradient} transition-transform duration-300 group-hover:scale-110 group-hover:shadow-md`}>
                        <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground/60">{stat.label}</span>
                    </div>
                    <p className={`text-2xl font-extrabold ${stat.color}`}>
                      {stat.value} <span className="text-sm font-medium text-muted-foreground">{stat.sub}</span>
                      {stat.change && <span className="text-xs font-normal text-muted-foreground ml-1">{stat.change}</span>}
                    </p>
                    {stat.extra && <p className="text-xs text-muted-foreground mt-1">{stat.extra}</p>}
                  </div>
                </Card>
              ))}
            </div>
            )}

            {/* Delivery Status Cards */}
            {canSeeOrders && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {deliveryCards.map((stat) => (
                <Card key={stat.label} className="p-4 border-border/30 card-hover group overflow-hidden relative">
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-0 group-hover:opacity-30 transition-opacity duration-300`} />
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-2.5 rounded-xl bg-gradient-to-br ${stat.bgGradient} transition-transform duration-300 group-hover:scale-110`}>
                        <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground/60">{stat.label}</span>
                    </div>
                    <p className={`text-2xl font-extrabold ${stat.color}`}>
                      {stat.value} <span className="text-xs font-normal text-muted-foreground ml-1">{stat.sub}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.extra}</p>
                  </div>
                </Card>
              ))}
            </div>
            )}

            {/* Shipping Stats */}
            {canSeeOrders && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {shipCards.map((stat) => (
                <Card key={stat.label} className="p-4 border-border/30 card-hover group overflow-hidden relative">
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-0 group-hover:opacity-30 transition-opacity duration-300`} />
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-2.5 rounded-xl bg-gradient-to-br ${stat.bgGradient} transition-transform duration-300 group-hover:scale-110`}>
                        <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground/60">{stat.label}</span>
                    </div>
                    <p className={`text-2xl font-extrabold ${stat.color}`}>
                      {stat.value} <span className="text-sm font-medium text-muted-foreground">{stat.sub}</span>
                      {stat.change && <span className="text-xs font-normal text-muted-foreground ml-1">{stat.change}</span>}
                    </p>
                    {stat.badges && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {stat.badges.map((b) => (
                          <span key={b.label} className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${b.color}`}>
                            {b.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
            )}

            {/* Sales Trend Chart */}
            {canSeeOrders && salesTrend && salesTrend.length > 0 && (
              <Card className="p-5 border-border/30">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-lg shadow-emerald-500/20">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-foreground">Sales Trend (Last 30 Days)</h2>
                    <p className="text-xs text-muted-foreground">Daily orders & revenue</p>
                  </div>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={salesTrend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(187, 85%, 53%)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(187, 85%, 53%)" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(210, 100%, 50%)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(210, 100%, 50%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} className="text-muted-foreground" interval="preserveStartEnd" />
                      <YAxis yAxisId="left" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "12px",
                          fontSize: "12px",
                          boxShadow: "0 8px 30px -10px rgba(0,0,0,0.15)",
                        }}
                        formatter={(value: number, name: string) => [
                          name === "revenue" ? `৳${value.toLocaleString("en-BD")}` : value,
                          name === "revenue" ? "Revenue" : "Orders",
                        ]}
                      />
                      <Area yAxisId="right" type="monotone" dataKey="revenue" stroke="hsl(187, 85%, 53%)" fill="url(#colorRevenue)" strokeWidth={2} dot={false} />
                      <Area yAxisId="left" type="monotone" dataKey="orders" stroke="hsl(210, 100%, 50%)" fill="url(#colorOrders)" strokeWidth={2} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-center gap-6 mt-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-[hsl(210,100%,50%)]" />
                    <span className="text-xs text-muted-foreground font-medium">Orders</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-[hsl(187,85%,53%)]" />
                    <span className="text-xs text-muted-foreground font-medium">Revenue</span>
                  </div>
                </div>
              </Card>
            )}

            {/* Top Products & Hourly Orders */}
            {canSeeOrders && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Top Products */}
              <Card className="p-5 border-border/30">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 shadow-lg shadow-violet-500/20">
                    <ShoppingBag className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-foreground">Top Selling Products</h2>
                    <p className="text-xs text-muted-foreground">By quantity sold</p>
                  </div>
                </div>
                {salesDetails.topProducts.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">No product data available</p>
                ) : (
                  <div className="space-y-2.5">
                    {salesDetails.topProducts.map((p, i) => (
                      <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg border border-border/30 hover:bg-secondary/30 transition-colors">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-100 to-purple-100 text-violet-600 font-bold text-sm shrink-0">
                          #{i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{p.name}</p>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Hash className="h-3 w-3" />{p.qty} sold
                            </span>
                            <span className="text-xs font-medium text-emerald-600">{fmt(p.revenue)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Hourly Orders Chart */}
              <Card className="p-5 border-border/30">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/20">
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-foreground">Hourly Orders</h2>
                    <p className="text-xs text-muted-foreground">Order distribution by hour</p>
                  </div>
                </div>
                <div className="flex items-end gap-[3px] h-32 mt-2">
                  {salesDetails.hourlyOrders.map((count, hour) => (
                    <div key={hour} className="flex-1 flex flex-col items-center gap-1 group/bar">
                      <span className="text-[9px] font-medium text-muted-foreground opacity-0 group-hover/bar:opacity-100 transition-opacity">
                        {count}
                      </span>
                      <div
                        className="w-full rounded-t bg-gradient-to-t from-blue-500 to-cyan-400 transition-all duration-200 group-hover/bar:from-blue-600 group-hover/bar:to-cyan-500 min-h-[2px]"
                        style={{ height: `${Math.max((count / maxHourly) * 100, 2)}%` }}
                        title={`${hour}:00 - ${count} orders`}
                      />
                      {hour % 3 === 0 && (
                        <span className="text-[9px] text-muted-foreground/60 font-medium">{hour}</span>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
            )}

            {/* Source Breakdown */}
            {canSeeOrders && salesDetails.sourceBreakdown.length > 0 && (
              <Card className="p-5 border-border/30">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/20">
                    <Target className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-foreground">Order Sources</h2>
                    <p className="text-xs text-muted-foreground">Where orders are coming from</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {salesDetails.sourceBreakdown.map((src) => (
                    <div key={src.name} className="text-center p-3 rounded-xl border border-border/30 hover:bg-secondary/30 transition-colors">
                      <p className="text-lg font-extrabold text-foreground">{src.count}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mt-0.5 truncate">{src.name}</p>
                      <p className="text-xs font-medium text-emerald-600 mt-1">{fmt(src.amount)}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Profit Breakdown */}
            {canSeeProfit && (
            <Card className="p-6 border-border/30 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[hsl(187,85%,53%)]/5 to-transparent rounded-full -mr-32 -mt-32" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/20">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">Profit Breakdown</h2>
                    <p className="text-xs text-muted-foreground">Revenue, costs and profit analysis</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
                  {profitItems.map((item) => (
                    <div key={item.label} className="text-center p-4 rounded-xl border border-border/30 card-hover bg-card group overflow-hidden relative">
                      <div className={`absolute inset-0 bg-gradient-to-br ${item.bgGradient} opacity-0 group-hover:opacity-40 transition-opacity duration-300`} />
                      <div className="relative">
                        <div className={`inline-flex p-2.5 rounded-xl bg-gradient-to-br ${item.bgGradient} mb-3 transition-transform duration-300 group-hover:scale-110`}>
                          <item.icon className={`h-5 w-5 ${item.iconColor}`} />
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground/60">{item.label}</p>
                        <p className={`text-lg font-extrabold mt-1 ${item.iconColor}`}>{item.value}</p>
                        {item.sub && <p className="text-[11px] text-muted-foreground">{item.sub}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
            )}

            {/* Finance Summary */}
            {canSeeFinance && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {finCards.map((card) => (
                <Card key={card.label} className="p-5 border-border/30 card-hover">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl bg-gradient-to-br ${card.bgGradient} shrink-0 shadow-sm`}>
                      <card.icon className={`h-6 w-6 ${card.iconColor}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70 leading-none">{card.label}</p>
                      <p className="text-xl font-extrabold text-foreground leading-tight mt-1">{card.value}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            )}

            {/* Role-specific empty state */}
            {!canSeeOrders && !canSeeFinance && !canSeeProfit && (
              <Card className="p-12 text-center border-border/30">
                <p className="text-lg font-bold text-foreground mb-2">স্বাগতম! 👋</p>
                <p className="text-sm text-muted-foreground">
                  আপনার রোল অনুযায়ী সংশ্লিষ্ট সেকশনে যান — সাইডবার থেকে নেভিগেট করুন।
                </p>
              </Card>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
