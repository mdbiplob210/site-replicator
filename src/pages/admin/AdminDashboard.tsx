import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import {
  ShoppingCart, Clock, CheckCircle2, XCircle, PauseCircle,
  CalendarClock, Truck, PhoneOff, TrendingUp, DollarSign,
  Target, Package, AlertTriangle, Landmark, Layers, HandCoins,
  PiggyBank, Receipt
} from "lucide-react";

const timeFilters = ["Today", "Yesterday", "This Week", "This Month"];

const orderStats = [
  { label: "TOTAL ORDERS", value: "0", sub: "Orders", change: "(৳0)", icon: ShoppingCart, color: "text-foreground", bgGradient: "from-slate-100 to-slate-50", iconColor: "text-slate-500" },
  { label: "PROCESSING", value: "0", sub: "New", change: "(0%)", extra: "(৳0)", icon: Clock, color: "text-blue-600", bgGradient: "from-blue-100 to-blue-50", iconColor: "text-blue-500" },
  { label: "CONFIRMED", value: "0", sub: "Confirmed", change: "(0%)", extra: "(৳0)", icon: CheckCircle2, color: "text-emerald-600", bgGradient: "from-emerald-100 to-emerald-50", iconColor: "text-emerald-500" },
  { label: "CANCELLED", value: "0", sub: "Cancelled", change: "(0%)", extra: "(৳0)", icon: XCircle, color: "text-red-500", bgGradient: "from-red-100 to-red-50", iconColor: "text-red-500" },
  { label: "ON HOLD", value: "0", sub: "On Hold", change: "(0%)", extra: "(৳0)", icon: PauseCircle, color: "text-amber-600", bgGradient: "from-amber-100 to-amber-50", iconColor: "text-amber-500" },
];

const shippingStats = [
  { label: "SHIP LATER", value: "0", sub: "Ship Later", change: "(0%)", extra: "(৳0)", icon: CalendarClock, color: "text-teal-600", bgGradient: "from-teal-100 to-teal-50", iconColor: "text-teal-500" },
  { label: "IN COURIER", value: "0", sub: "In Courier", change: "(0%)", extra: "(৳0)", icon: Truck, color: "text-violet-600", bgGradient: "from-violet-100 to-violet-50", iconColor: "text-violet-500" },
  { label: "INCOMPLETE", value: "0", sub: "Total", icon: PhoneOff, color: "text-foreground", bgGradient: "from-slate-100 to-slate-50", iconColor: "text-slate-500",
    badges: [
      { label: "0 Confirmed", color: "text-emerald-600 border-emerald-200/60 bg-emerald-50" },
      { label: "0 Processing", color: "text-blue-600 border-blue-200/60 bg-blue-50" },
      { label: "0 Hold", color: "text-amber-600 border-amber-200/60 bg-amber-50" },
      { label: "0 Cancelled", color: "text-red-500 border-red-200/60 bg-red-50" },
    ]
  },
];

const profitItems = [
  { label: "REVENUE", value: "৳0", icon: DollarSign, iconColor: "text-blue-600", bgGradient: "from-blue-100 to-blue-50" },
  { label: "ADS COST", value: "৳0", sub: "($0.00)", icon: Target, iconColor: "text-violet-600", bgGradient: "from-violet-100 to-violet-50" },
  { label: "DELIVERY", value: "৳0", icon: Truck, iconColor: "text-cyan-600", bgGradient: "from-cyan-100 to-cyan-50" },
  { label: "RETURNS", value: "৳0", icon: AlertTriangle, iconColor: "text-red-500", bgGradient: "from-red-100 to-red-50" },
  { label: "EST. PROFIT", value: "৳0", icon: TrendingUp, iconColor: "text-emerald-600", bgGradient: "from-emerald-100 to-emerald-50" },
  { label: "FINAL PROFIT", value: "৳0", icon: Receipt, iconColor: "text-teal-600", bgGradient: "from-teal-100 to-teal-50" },
];

const financeCards = [
  { label: "BANK BALANCE", value: "৳0", icon: Landmark, iconColor: "text-blue-600", bgGradient: "from-blue-100 to-blue-50" },
  { label: "STOCK VALUE", value: "৳0", icon: Layers, iconColor: "text-emerald-600", bgGradient: "from-emerald-100 to-emerald-50" },
  { label: "LOANS (0)", value: "৳0", icon: HandCoins, iconColor: "text-red-500", bgGradient: "from-red-100 to-red-50" },
  { label: "INVESTMENTS", value: "৳0", icon: PiggyBank, iconColor: "text-amber-600", bgGradient: "from-amber-100 to-amber-50" },
  { label: "NET VALUE", value: "৳0", icon: Receipt, iconColor: "text-emerald-600", bgGradient: "from-emerald-100 to-emerald-50" },
];

const AdminDashboard = () => {
  const [activeFilter, setActiveFilter] = useState("Today");

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

        {/* Order Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {orderStats.map((stat) => (
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
          {shippingStats.map((stat) => (
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
          {financeCards.map((card) => (
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
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
