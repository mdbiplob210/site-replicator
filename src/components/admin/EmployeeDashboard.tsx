import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingCart, CheckCircle2, XCircle, Truck, Clock,
  PauseCircle, RotateCcw, Hand, Loader2, Package
} from "lucide-react";
import { format } from "date-fns";

const fmt = (n: number) => `৳${n.toLocaleString("en-BD")}`;

const EmployeeDashboard = () => {
  const { user } = useAuth();

  // Fetch assigned orders for this employee
  const { data: assignedOrders = [], isLoading } = useQuery({
    queryKey: ["employee-dashboard-orders", user?.id],
    queryFn: async () => {
      // Get assigned order IDs
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
          .select("id, order_number, customer_name, customer_phone, status, total_amount, delivery_charge, created_at")
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

  const statusCounts = assignedOrders.reduce((acc: Record<string, { count: number; amount: number }>, o: any) => {
    if (!acc[o.status]) acc[o.status] = { count: 0, amount: 0 };
    acc[o.status].count++;
    acc[o.status].amount += Number(o.total_amount || 0);
    return acc;
  }, {});

  const totalOrders = assignedOrders.length;
  const totalAmount = assignedOrders.reduce((sum: number, o: any) => sum + Number(o.total_amount || 0), 0);

  const statCards = [
    { label: "TOTAL ASSIGNED", value: totalOrders, amount: totalAmount, icon: ShoppingCart, color: "text-foreground", bgGradient: "from-slate-100 to-slate-50", iconColor: "text-slate-500" },
    { label: "PROCESSING", value: statusCounts.processing?.count || 0, amount: statusCounts.processing?.amount || 0, icon: Clock, color: "text-blue-600", bgGradient: "from-blue-100 to-blue-50", iconColor: "text-blue-500" },
    { label: "CONFIRMED", value: statusCounts.confirmed?.count || 0, amount: statusCounts.confirmed?.amount || 0, icon: CheckCircle2, color: "text-emerald-600", bgGradient: "from-emerald-100 to-emerald-50", iconColor: "text-emerald-500" },
    { label: "IN COURIER", value: statusCounts.in_courier?.count || 0, amount: statusCounts.in_courier?.amount || 0, icon: Truck, color: "text-violet-600", bgGradient: "from-violet-100 to-violet-50", iconColor: "text-violet-500" },
    { label: "DELIVERED", value: statusCounts.delivered?.count || 0, amount: statusCounts.delivered?.amount || 0, icon: CheckCircle2, color: "text-emerald-600", bgGradient: "from-emerald-100 to-emerald-50", iconColor: "text-emerald-500" },
    { label: "CANCELLED", value: statusCounts.cancelled?.count || 0, amount: statusCounts.cancelled?.amount || 0, icon: XCircle, color: "text-red-500", bgGradient: "from-red-100 to-red-50", iconColor: "text-red-500" },
    { label: "ON HOLD", value: statusCounts.on_hold?.count || 0, amount: statusCounts.on_hold?.amount || 0, icon: PauseCircle, color: "text-amber-600", bgGradient: "from-amber-100 to-amber-50", iconColor: "text-amber-500" },
    { label: "RETURNED", value: statusCounts.returned?.count || 0, amount: statusCounts.returned?.amount || 0, icon: RotateCcw, color: "text-red-500", bgGradient: "from-red-100 to-red-50", iconColor: "text-red-500" },
  ];

  // Recent orders (last 10)
  const recentOrders = assignedOrders.slice(0, 10);

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
      <div className="space-y-5 max-w-[1400px]">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">My Dashboard</h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">আপনার অ্যাসাইন করা অর্ডারের সারসংক্ষেপ</p>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {!isLoading && (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              {statCards.map((stat) => (
                <Card key={stat.label} className="p-3 sm:p-4 border-border/30 card-hover group overflow-hidden relative">
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-0 group-hover:opacity-30 transition-opacity duration-300`} />
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`p-2 rounded-xl bg-gradient-to-br ${stat.bgGradient}`}>
                        <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
                      </div>
                      <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 truncate">{stat.label}</span>
                    </div>
                    <p className={`text-xl sm:text-2xl font-extrabold ${stat.color}`}>{stat.value}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{fmt(stat.amount)}</p>
                  </div>
                </Card>
              ))}
            </div>

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
