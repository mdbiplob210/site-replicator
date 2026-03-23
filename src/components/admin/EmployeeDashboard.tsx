import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingCart, CheckCircle2, XCircle, Truck, Clock,
  PauseCircle, RotateCcw, Hand, Loader2, Package,
  CalendarClock, PhoneOff, TrendingUp, AlertTriangle,
  Target, BarChart3, ShoppingBag, Hash
} from "lucide-react";
import { format, startOfDay, endOfDay, subDays, startOfWeek, startOfMonth, eachDayOfInterval, parseISO } from "date-fns";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

const timeFilters = ["Today", "Yesterday", "This Week", "This Month"] as const;
type TimeFilter = typeof timeFilters[number];

const fmt = (n: number) => `৳${n.toLocaleString("en-BD")}`;

function getDateRange(filter: TimeFilter) {
  const now = new Date();
  switch (filter) {
    case "Today":
      return { from: startOfDay(now), to: endOfDay(now) };
    case "Yesterday": {
      const y = subDays(now, 1);
      return { from: startOfDay(y), to: endOfDay(y) };
    }
    case "This Week":
      return { from: startOfWeek(now, { weekStartsOn: 6 }), to: endOfDay(now) };
    case "This Month":
      return { from: startOfMonth(now), to: endOfDay(now) };
  }
}

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<TimeFilter>("Today");
  const { from, to } = getDateRange(activeFilter);

  // Fetch ALL assigned orders for this employee (for trend/stats)
  const { data: allAssignedOrders = [], isLoading } = useQuery({
    queryKey: ["employee-dashboard-all", user?.id],
    queryFn: async () => {
      const { data: assignments, error: aErr } = await supabase
        .from("order_assignments")
        .select("order_id")
        .eq("assigned_to", user!.id);
      if (aErr) throw aErr;
      if (!assignments || assignments.length === 0) return [];

      const orderIds = assignments.map((a) => a.order_id);
      let allOrders: any[] = [];
      for (let i = 0; i < orderIds.length; i += 200) {
        const batch = orderIds.slice(i, i + 200);
        const { data, error } = await supabase
          .from("orders")
          .select("id, order_number, customer_name, customer_phone, status, total_amount, delivery_charge, product_cost, payment_status, source, created_at")
          .in("id", batch)
          .is("deleted_at", null)
          .order("created_at", { ascending: false });
        if (error) throw error;
        if (data) allOrders = allOrders.concat(data);
      }
      return allOrders;
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000,
  });

  // Fetch order items for assigned orders
  const { data: allOrderItems = [] } = useQuery({
    queryKey: ["employee-dashboard-items", user?.id, allAssignedOrders.length],
    queryFn: async () => {
      const orderIds = allAssignedOrders.map((o: any) => o.id);
      if (orderIds.length === 0) return [];
      let allItems: any[] = [];
      for (let i = 0; i < orderIds.length; i += 200) {
        const batch = orderIds.slice(i, i + 200);
        const { data, error } = await supabase
          .from("order_items")
          .select("order_id, product_name, product_code, product_id, quantity, unit_price, total_price")
          .in("order_id", batch);
        if (error) throw error;
        if (data) allItems = allItems.concat(data);
      }
      return allItems;
    },
    enabled: allAssignedOrders.length > 0,
    staleTime: 60 * 1000,
  });

  // Filter orders by time
  const filteredOrders = allAssignedOrders.filter((o: any) => {
    const d = new Date(o.created_at);
    return d >= from && d <= to;
  });

  // Incomplete orders assigned
  const { data: incompleteOrders = [] } = useQuery({
    queryKey: ["employee-incomplete"],
    queryFn: async () => {
      // Employees typically don't have incomplete orders, but show count if they exist
      return [];
    },
  });

  const totalOrders = filteredOrders.length;
  const totalAmount = filteredOrders.reduce((s: number, o: any) => s + Number(o.total_amount || 0), 0);

  const countByStatus = (status: string) => {
    const matching = filteredOrders.filter((o: any) => o.status === status);
    const count = matching.length;
    const amount = matching.reduce((s: number, o: any) => s + Number(o.total_amount || 0), 0);
    const pct = totalOrders > 0 ? Math.round((count / totalOrders) * 100) : 0;
    return { count, amount, pct };
  };

  const processing = countByStatus("processing");
  const confirmed = countByStatus("confirmed");
  const cancelled = countByStatus("cancelled");
  const onHold = countByStatus("on_hold");
  const delivered = countByStatus("delivered");
  const handDelivery = countByStatus("hand_delivery");
  const returned = countByStatus("returned");
  const pendingReturn = countByStatus("pending_return");
  const shipLater = countByStatus("ship_later");
  const inCourier = countByStatus("in_courier");

  const avgOrderValue = totalOrders > 0 ? Math.round(totalAmount / totalOrders) : 0;
  const paidOrders = filteredOrders.filter((o: any) => o.payment_status === "paid");
  const unpaidOrders = filteredOrders.filter((o: any) => o.payment_status === "unpaid");
  const partialOrders = filteredOrders.filter((o: any) => o.payment_status === "partial");

  const orderCards = [
    { label: "TOTAL ORDERS", value: String(totalOrders), sub: "Orders", change: `(${fmt(totalAmount)})`, icon: ShoppingCart, color: "text-foreground", bgGradient: "from-slate-100 to-slate-50", iconColor: "text-slate-500" },
    { label: "PROCESSING", value: String(processing.count), sub: "New", change: `(${processing.pct}%)`, extra: `(${fmt(processing.amount)})`, icon: Clock, color: "text-blue-600", bgGradient: "from-blue-100 to-blue-50", iconColor: "text-blue-500" },
    { label: "CONFIRMED", value: String(confirmed.count), sub: "Confirmed", change: `(${confirmed.pct}%)`, extra: `(${fmt(confirmed.amount)})`, icon: CheckCircle2, color: "text-emerald-600", bgGradient: "from-emerald-100 to-emerald-50", iconColor: "text-emerald-500" },
    { label: "CANCELLED", value: String(cancelled.count), sub: "Cancelled", change: `(${cancelled.pct}%)`, extra: `(${fmt(cancelled.amount)})`, icon: XCircle, color: "text-red-500", bgGradient: "from-red-100 to-red-50", iconColor: "text-red-500" },
    { label: "ON HOLD", value: String(onHold.count), sub: "On Hold", change: `(${onHold.pct}%)`, extra: `(${fmt(onHold.amount)})`, icon: PauseCircle, color: "text-amber-600", bgGradient: "from-amber-100 to-amber-50", iconColor: "text-amber-500" },
  ];

  const deliveryCards = [
    { label: "DELIVERED", value: String(delivered.count), sub: `(${delivered.pct}%)`, extra: fmt(delivered.amount), icon: CheckCircle2, color: "text-emerald-600", bgGradient: "from-emerald-100 to-emerald-50", iconColor: "text-emerald-500" },
    { label: "HAND DELIVERY", value: String(handDelivery.count), sub: `(${handDelivery.pct}%)`, extra: fmt(handDelivery.amount), icon: Hand, color: "text-indigo-600", bgGradient: "from-indigo-100 to-indigo-50", iconColor: "text-indigo-500" },
    { label: "RETURNED", value: String(returned.count), sub: `(${returned.pct}%)`, extra: fmt(returned.amount), icon: RotateCcw, color: "text-red-500", bgGradient: "from-red-100 to-red-50", iconColor: "text-red-500" },
    { label: "PENDING RETURN", value: String(pendingReturn.count), sub: `(${pendingReturn.pct}%)`, extra: fmt(pendingReturn.amount), icon: AlertTriangle, color: "text-orange-500", bgGradient: "from-orange-100 to-orange-50", iconColor: "text-orange-500" },
  ];

  const shipCards = [
    { label: "SHIP LATER", value: String(shipLater.count), sub: "Ship Later", change: `(${shipLater.pct}%)`, extra: `(${fmt(shipLater.amount)})`, icon: CalendarClock, color: "text-teal-600", bgGradient: "from-teal-100 to-teal-50", iconColor: "text-teal-500" },
    { label: "IN COURIER", value: String(inCourier.count), sub: "In Courier", change: `(${inCourier.pct}%)`, extra: `(${fmt(inCourier.amount)})`, icon: Truck, color: "text-violet-600", bgGradient: "from-violet-100 to-violet-50", iconColor: "text-violet-500" },
  ];

  // Sales trend (last 30 days from all assigned orders)
  const salesTrend = (() => {
    const now = new Date();
    const thirtyDaysAgo = subDays(now, 29);
    const days = eachDayOfInterval({ start: thirtyDaysAgo, end: now });
    return days.map(day => {
      const dayStr = format(day, "yyyy-MM-dd");
      const dayOrders = allAssignedOrders.filter((o: any) => format(new Date(o.created_at), "yyyy-MM-dd") === dayStr);
      return {
        date: format(day, "dd MMM"),
        orders: dayOrders.length,
        revenue: dayOrders.reduce((s: number, o: any) => s + Number(o.total_amount || 0), 0),
      };
    });
  })();

  // Top products from filtered orders
  const topProducts = (() => {
    const filteredIds = new Set(filteredOrders.map((o: any) => o.id));
    const items = allOrderItems.filter((i: any) => filteredIds.has(i.order_id));
    const map: Record<string, { name: string; qty: number; revenue: number }> = {};
    items.forEach((item: any) => {
      const key = item.product_name || item.product_code;
      if (!map[key]) map[key] = { name: key, qty: 0, revenue: 0 };
      map[key].qty += item.quantity;
      map[key].revenue += Number(item.total_price || 0);
    });
    return Object.values(map).sort((a, b) => b.qty - a.qty).slice(0, 5);
  })();

  // Hourly orders
  const hourlyOrders = (() => {
    const hours = new Array(24).fill(0);
    filteredOrders.forEach((o: any) => {
      const h = new Date(o.created_at).getHours();
      hours[h]++;
    });
    return hours;
  })();
  const maxHourly = Math.max(...hourlyOrders, 1);

  // Source breakdown
  const sourceBreakdown = (() => {
    const map: Record<string, { name: string; count: number; amount: number }> = {};
    filteredOrders.forEach((o: any) => {
      const src = o.source || "Direct";
      if (!map[src]) map[src] = { name: src, count: 0, amount: 0 };
      map[src].count++;
      map[src].amount += Number(o.total_amount || 0);
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  })();

  const recentOrders = filteredOrders.slice(0, 10);

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; className: string }> = {
      processing: { label: "New", className: "bg-blue-100 text-blue-700 border-blue-200" },
      confirmed: { label: "Confirmed", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
      in_courier: { label: "In Courier", className: "bg-violet-100 text-violet-700 border-violet-200" },
      delivered: { label: "Delivered", className: "bg-green-100 text-green-700 border-green-200" },
      cancelled: { label: "Cancelled", className: "bg-red-100 text-red-700 border-red-200" },
      on_hold: { label: "Hold", className: "bg-amber-100 text-amber-700 border-amber-200" },
      returned: { label: "Returned", className: "bg-red-100 text-red-600 border-red-200" },
      pending_return: { label: "Pending Return", className: "bg-orange-100 text-orange-700 border-orange-200" },
      hand_delivery: { label: "Hand Delivery", className: "bg-cyan-100 text-cyan-700 border-cyan-200" },
      ship_later: { label: "Ship Later", className: "bg-teal-100 text-teal-700 border-teal-200" },
    };
    const info = map[status] || { label: status, className: "bg-muted text-muted-foreground" };
    return <Badge variant="outline" className={`text-[10px] ${info.className}`}>{info.label}</Badge>;
  };

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6 max-w-[1400px]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">My Dashboard</h1>
            <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">আপনার অ্যাসাইন করা অর্ডারের সারসংক্ষেপ</p>
          </div>
          <div className="flex items-center gap-0.5 bg-card rounded-xl border border-border/50 p-0.5 sm:p-1 shadow-sm overflow-x-auto no-scrollbar">
            {timeFilters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-2.5 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap ${
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
            {/* Quick Summary Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              <Card className="p-2.5 sm:p-3 border-border/30 bg-gradient-to-br from-blue-50 to-blue-100/50">
                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">AVG ORDER</p>
                <p className="text-lg sm:text-xl font-extrabold text-blue-600 mt-0.5">{fmt(avgOrderValue)}</p>
              </Card>
              <Card className="p-2.5 sm:p-3 border-border/30 bg-gradient-to-br from-emerald-50 to-emerald-100/50">
                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">PAID</p>
                <p className="text-lg sm:text-xl font-extrabold text-emerald-600 mt-0.5">{paidOrders.length} <span className="text-[10px] sm:text-xs font-medium text-muted-foreground">({fmt(paidOrders.reduce((s: number, o: any) => s + Number(o.total_amount || 0), 0))})</span></p>
              </Card>
              <Card className="p-2.5 sm:p-3 border-border/30 bg-gradient-to-br from-amber-50 to-amber-100/50">
                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">UNPAID</p>
                <p className="text-lg sm:text-xl font-extrabold text-amber-600 mt-0.5">{unpaidOrders.length} <span className="text-[10px] sm:text-xs font-medium text-muted-foreground">({fmt(unpaidOrders.reduce((s: number, o: any) => s + Number(o.total_amount || 0), 0))})</span></p>
              </Card>
              <Card className="p-2.5 sm:p-3 border-border/30 bg-gradient-to-br from-violet-50 to-violet-100/50">
                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">PARTIAL</p>
                <p className="text-lg sm:text-xl font-extrabold text-violet-600 mt-0.5">{partialOrders.length} <span className="text-[10px] sm:text-xs font-medium text-muted-foreground">({fmt(partialOrders.reduce((s: number, o: any) => s + Number(o.total_amount || 0), 0))})</span></p>
              </Card>
            </div>

            {/* Order Status Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-4">
              {orderCards.map((stat) => (
                <Card key={stat.label} className="p-3 sm:p-4 border-border/30 card-hover group overflow-hidden relative">
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-0 group-hover:opacity-30 transition-opacity duration-300`} />
                  <div className="relative">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                      <div className={`p-2 sm:p-2.5 rounded-xl bg-gradient-to-br ${stat.bgGradient} transition-transform duration-300 group-hover:scale-110 group-hover:shadow-md`}>
                        <stat.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${stat.iconColor}`} />
                      </div>
                      <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.1em] sm:tracking-[0.14em] text-muted-foreground/60 truncate">{stat.label}</span>
                    </div>
                    <p className={`text-xl sm:text-2xl font-extrabold ${stat.color}`}>
                      {stat.value} <span className="text-xs sm:text-sm font-medium text-muted-foreground">{stat.sub}</span>
                      {stat.change && <span className="text-[10px] sm:text-xs font-normal text-muted-foreground ml-1">{stat.change}</span>}
                    </p>
                    {stat.extra && <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">{stat.extra}</p>}
                  </div>
                </Card>
              ))}
            </div>

            {/* Delivery Status Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
              {deliveryCards.map((stat) => (
                <Card key={stat.label} className="p-3 sm:p-4 border-border/30 card-hover group overflow-hidden relative">
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-0 group-hover:opacity-30 transition-opacity duration-300`} />
                  <div className="relative">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                      <div className={`p-2 sm:p-2.5 rounded-xl bg-gradient-to-br ${stat.bgGradient} transition-transform duration-300 group-hover:scale-110`}>
                        <stat.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${stat.iconColor}`} />
                      </div>
                      <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.1em] sm:tracking-[0.14em] text-muted-foreground/60 truncate">{stat.label}</span>
                    </div>
                    <p className={`text-xl sm:text-2xl font-extrabold ${stat.color}`}>
                      {stat.value} <span className="text-[10px] sm:text-xs font-normal text-muted-foreground ml-1">{stat.sub}</span>
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">{stat.extra}</p>
                  </div>
                </Card>
              ))}
            </div>

            {/* Shipping Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    {stat.extra && <p className="text-xs text-muted-foreground mt-1">{stat.extra}</p>}
                  </div>
                </Card>
              ))}
            </div>

            {/* Sales Trend Chart */}
            {salesTrend.length > 0 && (
              <Card className="p-5 border-border/30">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-lg shadow-emerald-500/20">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-foreground">Sales Trend (Last 30 Days)</h2>
                    <p className="text-xs text-muted-foreground">আপনার অ্যাসাইন করা অর্ডার ও রেভিনিউ</p>
                  </div>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={salesTrend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="empColorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(187, 85%, 53%)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(187, 85%, 53%)" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="empColorOrders" x1="0" y1="0" x2="0" y2="1">
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
                      <Area yAxisId="right" type="monotone" dataKey="revenue" stroke="hsl(187, 85%, 53%)" fill="url(#empColorRevenue)" strokeWidth={2} dot={false} />
                      <Area yAxisId="left" type="monotone" dataKey="orders" stroke="hsl(210, 100%, 50%)" fill="url(#empColorOrders)" strokeWidth={2} dot={false} />
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
                {topProducts.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">No product data available</p>
                ) : (
                  <div className="space-y-2.5">
                    {topProducts.map((p, i) => (
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
                  {hourlyOrders.map((count, hour) => (
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

            {/* Source Breakdown */}
            {sourceBreakdown.length > 0 && (
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
                  {sourceBreakdown.map((src) => (
                    <div key={src.name} className="text-center p-3 rounded-xl border border-border/30 hover:bg-secondary/30 transition-colors">
                      <p className="text-lg font-extrabold text-foreground">{src.count}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mt-0.5 truncate">{src.name}</p>
                      <p className="text-xs font-medium text-emerald-600 mt-1">{fmt(src.amount)}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Recent Assigned Orders */}
            <Card className="border-border/30 overflow-hidden">
              <div className="p-4 border-b border-border/30">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50">
                    <Package className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-foreground">সাম্প্রতিক অর্ডার</h2>
                    <p className="text-xs text-muted-foreground">আপনার অ্যাসাইন করা সর্বশেষ অর্ডারগুলো</p>
                  </div>
                </div>
              </div>

              {recentOrders.length === 0 ? (
                <div className="p-8 text-center">
                  <ShoppingCart className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">কোনো অ্যাসাইন করা অর্ডার নেই</p>
                </div>
              ) : (
                <div className="divide-y divide-border/30">
                  {recentOrders.map((order: any) => (
                    <div key={order.id} className="flex items-center justify-between px-4 py-3 hover:bg-secondary/20 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 text-primary font-bold text-sm shrink-0">
                          #{order.order_number}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{order.customer_name}</p>
                          <p className="text-xs text-muted-foreground">{order.customer_phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {getStatusBadge(order.status)}
                        <div className="text-right">
                          <p className="text-sm font-bold text-foreground">{fmt(Number(order.total_amount))}</p>
                          <p className="text-[10px] text-muted-foreground">{format(new Date(order.created_at), "dd MMM, hh:mm a")}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default EmployeeDashboard;
