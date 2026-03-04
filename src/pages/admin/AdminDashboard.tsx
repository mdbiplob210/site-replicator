import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import {
  ShoppingCart, Clock, CheckCircle2, XCircle, PauseCircle,
  CalendarClock, Truck, PhoneOff, TrendingUp, DollarSign,
  Target, Package, AlertTriangle, Landmark, Layers, HandCoins,
  PiggyBank, Receipt, Loader2
} from "lucide-react";
import { useDashboardData } from "@/hooks/useDashboardData";

const timeFilters = ["Today", "Yesterday", "This Week", "This Month"] as const;

const fmt = (n: number) => `৳${n.toLocaleString("en-BD")}`;

const AdminDashboard = () => {
  const [activeFilter, setActiveFilter] = useState<typeof timeFilters[number]>("Today");
  const { isLoading, orderStats, shippingStats, profitStats, financeStats } = useDashboardData(activeFilter);

  const orderCards = [
    { label: "TOTAL ORDERS", value: String(orderStats.totalOrders), sub: "Orders", change: `(${fmt(orderStats.totalAmount)})`, icon: ShoppingCart, color: "text-foreground", bgGradient: "from-slate-100 to-slate-50", iconColor: "text-slate-500" },
    { label: "PROCESSING", value: String(orderStats.processing.count), sub: "New", change: `(${orderStats.processing.pct}%)`, extra: `(${fmt(orderStats.processing.amount)})`, icon: Clock, color: "text-blue-600", bgGradient: "from-blue-100 to-blue-50", iconColor: "text-blue-500" },
    { label: "CONFIRMED", value: String(orderStats.confirmed.count), sub: "Confirmed", change: `(${orderStats.confirmed.pct}%)`, extra: `(${fmt(orderStats.confirmed.amount)})`, icon: CheckCircle2, color: "text-emerald-600", bgGradient: "from-emerald-100 to-emerald-50", iconColor: "text-emerald-500" },
    { label: "CANCELLED", value: String(orderStats.cancelled.count), sub: "Cancelled", change: `(${orderStats.cancelled.pct}%)`, extra: `(${fmt(orderStats.cancelled.amount)})`, icon: XCircle, color: "text-red-500", bgGradient: "from-red-100 to-red-50", iconColor: "text-red-500" },
    { label: "ON HOLD", value: String(orderStats.onHold.count), sub: "On Hold", change: `(${orderStats.onHold.pct}%)`, extra: `(${fmt(orderStats.onHold.amount)})`, icon: PauseCircle, color: "text-amber-600", bgGradient: "from-amber-100 to-amber-50", iconColor: "text-amber-500" },
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
    { label: "ADS COST", value: fmt(profitStats.adsCostBdt), sub: `($${profitStats.adsCostUsd.toFixed(2)})`, icon: Target, iconColor: "text-violet-600", bgGradient: "from-violet-100 to-violet-50" },
    { label: "DELIVERY", value: fmt(profitStats.deliveryCost), icon: Truck, iconColor: "text-cyan-600", bgGradient: "from-cyan-100 to-cyan-50" },
    { label: "RETURNS", value: fmt(profitStats.returnAmount), icon: AlertTriangle, iconColor: "text-red-500", bgGradient: "from-red-100 to-red-50" },
    { label: "EST. PROFIT", value: fmt(profitStats.estProfit), icon: TrendingUp, iconColor: "text-emerald-600", bgGradient: "from-emerald-100 to-emerald-50" },
    { label: "FINAL PROFIT", value: fmt(profitStats.finalProfit), icon: Receipt, iconColor: "text-teal-600", bgGradient: "from-teal-100 to-teal-50" },
  ];

  const finCards = [
    { label: "BANK BALANCE", value: fmt(financeStats.bankBalance), icon: Landmark, iconColor: "text-blue-600", bgGradient: "from-blue-100 to-blue-50" },
    { label: "STOCK VALUE", value: fmt(financeStats.stockValue), icon: Layers, iconColor: "text-emerald-600", bgGradient: "from-emerald-100 to-emerald-50" },
    { label: `LOANS (${financeStats.loanCount})`, value: fmt(financeStats.loanTotal), icon: HandCoins, iconColor: "text-red-500", bgGradient: "from-red-100 to-red-50" },
    { label: "INVESTMENTS", value: fmt(financeStats.investmentTotal), icon: PiggyBank, iconColor: "text-amber-600", bgGradient: "from-amber-100 to-amber-50" },
    { label: "NET VALUE", value: fmt(financeStats.netValue), icon: Receipt, iconColor: "text-emerald-600", bgGradient: "from-emerald-100 to-emerald-50" },
  ];

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
            {/* Order Status Cards */}
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

            {/* Shipping Stats */}
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

            {/* Profit Breakdown */}
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
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
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

            {/* Finance Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {finCards.map((card) => (
                <Card key={card.label} className="p-4 border-border/30 card-hover group overflow-hidden relative">
                  <div className={`absolute inset-0 bg-gradient-to-br ${card.bgGradient} opacity-0 group-hover:opacity-30 transition-opacity duration-300`} />
                  <div className="relative">
                    <div className={`p-2.5 rounded-xl bg-gradient-to-br ${card.bgGradient} w-fit mb-3 transition-transform duration-300 group-hover:scale-110`}>
                      <card.icon className={`h-5 w-5 ${card.iconColor}`} />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground/60">{card.label}</p>
                    <p className="text-2xl font-extrabold text-foreground mt-1">{card.value}</p>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
