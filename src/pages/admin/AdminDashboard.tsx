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
  { label: "TOTAL ORDERS", value: "0", sub: "Orders", change: "(৳0)", icon: ShoppingCart, color: "text-foreground", bgColor: "bg-secondary/60", iconColor: "text-muted-foreground" },
  { label: "PROCESSING", value: "0", sub: "New", change: "(0%)", extra: "(৳0)", icon: Clock, color: "text-blue-600", bgColor: "bg-blue-50", iconColor: "text-blue-500" },
  { label: "CONFIRMED", value: "0", sub: "Confirmed", change: "(0%)", extra: "(৳0)", icon: CheckCircle2, color: "text-green-600", bgColor: "bg-green-50", iconColor: "text-green-500" },
  { label: "CANCELLED", value: "0", sub: "Cancelled", change: "(0%)", extra: "(৳0)", icon: XCircle, color: "text-red-500", bgColor: "bg-red-50", iconColor: "text-red-500" },
  { label: "ON HOLD", value: "0", sub: "On Hold", change: "(0%)", extra: "(৳0)", icon: PauseCircle, color: "text-orange-500", bgColor: "bg-orange-50", iconColor: "text-orange-500" },
];

const shippingStats = [
  { label: "SHIP LATER", value: "0", sub: "Ship Later", change: "(0%)", extra: "(৳0)", icon: CalendarClock, color: "text-teal-600", bgColor: "bg-teal-50", iconColor: "text-teal-500" },
  { label: "IN COURIER", value: "0", sub: "In Courier", change: "(0%)", extra: "(৳0)", icon: Truck, color: "text-purple-600", bgColor: "bg-purple-50", iconColor: "text-purple-500" },
  { label: "INCOMPLETE", value: "0", sub: "Total", icon: PhoneOff, color: "text-foreground", bgColor: "bg-secondary/60", iconColor: "text-muted-foreground",
    badges: [
      { label: "0 Confirmed", color: "text-green-600 border-green-200 bg-green-50" },
      { label: "0 Processing", color: "text-blue-600 border-blue-200 bg-blue-50" },
      { label: "0 Hold", color: "text-orange-500 border-orange-200 bg-orange-50" },
      { label: "0 Cancelled", color: "text-red-500 border-red-200 bg-red-50" },
    ]
  },
];

const profitItems = [
  { label: "REVENUE", value: "৳0", icon: DollarSign, iconColor: "text-blue-600", bgColor: "bg-blue-50" },
  { label: "ADS COST", value: "৳0", sub: "($0.00)", icon: Target, iconColor: "text-purple-600", bgColor: "bg-purple-50" },
  { label: "DELIVERY", value: "৳0", icon: Truck, iconColor: "text-blue-500", bgColor: "bg-blue-50" },
  { label: "RETURNS", value: "৳0", icon: AlertTriangle, iconColor: "text-red-500", bgColor: "bg-red-50" },
  { label: "EST. PROFIT", value: "৳0", icon: TrendingUp, iconColor: "text-green-600", bgColor: "bg-green-50" },
  { label: "FINAL PROFIT", value: "৳0", icon: Receipt, iconColor: "text-teal-600", bgColor: "bg-teal-50" },
];

const financeCards = [
  { label: "BANK BALANCE", value: "৳0", icon: Landmark, iconColor: "text-blue-600", bgColor: "bg-blue-50" },
  { label: "STOCK VALUE", value: "৳0", icon: Layers, iconColor: "text-green-600", bgColor: "bg-green-50" },
  { label: "LOANS (0)", value: "৳0", icon: HandCoins, iconColor: "text-red-500", bgColor: "bg-red-50" },
  { label: "INVESTMENTS", value: "৳0", icon: PiggyBank, iconColor: "text-orange-500", bgColor: "bg-orange-50" },
  { label: "NET VALUE", value: "৳0", icon: Receipt, iconColor: "text-green-600", bgColor: "bg-green-50" },
];

const AdminDashboard = () => {
  const [activeFilter, setActiveFilter] = useState("Today");

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-[1400px]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground text-sm">Your business performance at a glance</p>
          </div>
          <div className="flex items-center gap-1 bg-background rounded-lg border border-border/60 p-1">
            {timeFilters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  activeFilter === filter
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
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
            <Card key={stat.label} className="p-4 border-border/40 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2.5 rounded-xl ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{stat.label}</span>
              </div>
              <p className={`text-2xl font-bold ${stat.color}`}>
                {stat.value} <span className="text-base font-medium">{stat.sub}</span>
                {stat.change && <span className="text-sm font-normal text-muted-foreground ml-1">{stat.change}</span>}
              </p>
              {stat.extra && <p className="text-xs text-muted-foreground mt-1">{stat.extra}</p>}
            </Card>
          ))}
        </div>

        {/* Shipping Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {shippingStats.map((stat) => (
            <Card key={stat.label} className="p-4 border-border/40 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2.5 rounded-xl ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{stat.label}</span>
              </div>
              <p className={`text-2xl font-bold ${stat.color}`}>
                {stat.value} <span className="text-base font-medium">{stat.sub}</span>
                {stat.change && <span className="text-sm font-normal text-muted-foreground ml-1">{stat.change}</span>}
              </p>
              {stat.badges && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {stat.badges.map((b) => (
                    <span key={b.label} className={`text-[11px] px-2 py-0.5 rounded-full border ${b.color}`}>
                      {b.label}
                    </span>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Profit Breakdown */}
        <Card className="p-6 border-border/40">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-full bg-green-500">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Profit Breakdown</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {profitItems.map((item) => (
              <div key={item.label} className="text-center p-4 rounded-xl border border-border/40 hover:shadow-sm transition-shadow">
                <div className={`inline-flex p-2.5 rounded-xl ${item.bgColor} mb-2`}>
                  <item.icon className={`h-5 w-5 ${item.iconColor}`} />
                </div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{item.label}</p>
                <p className={`text-lg font-bold mt-1 ${item.iconColor}`}>{item.value}</p>
                {item.sub && <p className="text-[11px] text-muted-foreground">{item.sub}</p>}
              </div>
            ))}
          </div>
        </Card>

        {/* Finance Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {financeCards.map((card) => (
            <Card key={card.label} className="p-4 border-border/40 hover:shadow-md transition-shadow">
              <div className={`p-2.5 rounded-xl ${card.bgColor} w-fit mb-3`}>
                <card.icon className={`h-5 w-5 ${card.iconColor}`} />
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{card.label}</p>
              <p className="text-2xl font-bold text-foreground mt-1">{card.value}</p>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
