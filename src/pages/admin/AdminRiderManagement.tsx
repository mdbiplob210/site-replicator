import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useAllRiderAssignments,
  useDeliveryRiders,
  useRiderSettings,
  useUpdateRiderSettings,
  useAssignRider,
} from "@/hooks/useDeliveryRider";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format, startOfDay, startOfMonth, startOfYear } from "date-fns";
import { Truck, Settings, Users } from "lucide-react";

type TimeFilter = "today" | "month" | "year" | "all";

export default function AdminRiderManagement() {
  const { user } = useAuth();
  const { data: assignments = [] } = useAllRiderAssignments();
  const { data: riders = [] } = useDeliveryRiders();
  const { data: settings } = useRiderSettings();
  const updateSettings = useUpdateRiderSettings();
  const assignRider = useAssignRider();

  const [timeFilter, setTimeFilter] = useState<TimeFilter>("today");
  const [selectedRider, setSelectedRider] = useState<string>("all");
  const [commissionInput, setCommissionInput] = useState("");

  // Hand delivery orders not yet assigned
  const { data: handDeliveryOrders = [] } = useQuery({
    queryKey: ["hand-delivery-unassigned"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, customer_name, customer_phone, customer_address, total_amount")
        .eq("status", "hand_delivery")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Filter out already assigned
      const { data: assigned } = await supabase
        .from("delivery_assignments")
        .select("order_id")
        .in("status", ["assigned"]);

      const assignedIds = new Set((assigned || []).map((a) => a.order_id));
      return (data || []).filter((o) => !assignedIds.has(o.id));
    },
  });

  const [assignRiderId, setAssignRiderId] = useState("");
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());

  const toggleOrder = (id: string) => {
    const next = new Set(selectedOrders);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedOrders(next);
  };

  const handleAssign = () => {
    if (!assignRiderId || selectedOrders.size === 0 || !user?.id) return;
    assignRider.mutate(
      {
        orderIds: Array.from(selectedOrders),
        riderId: assignRiderId,
        assignedBy: user.id,
        commissionPerDelivery: settings?.commission_per_delivery ?? 20,
      },
      { onSuccess: () => setSelectedOrders(new Set()) }
    );
  };

  const getFilterStart = (f: TimeFilter) => {
    const now = new Date();
    if (f === "today") return startOfDay(now);
    if (f === "month") return startOfMonth(now);
    if (f === "year") return startOfYear(now);
    return new Date(0);
  };

  const filterStart = getFilterStart(timeFilter);
  const filtered = assignments
    .filter((a) => new Date(a.assigned_at) >= filterStart)
    .filter((a) => selectedRider === "all" || a.rider_id === selectedRider);

  const delivered = filtered.filter((a) => a.status === "delivered");
  const returned = filtered.filter((a) => a.status === "returned");
  const totalCollected = delivered.reduce((s, a) => s + (a.collected_amount || 0), 0);
  const totalCommission = delivered.reduce((s, a) => s + (a.commission_amount || 0), 0);

  // Day-by-day
  const dayMap = new Map<string, { delivered: number; returned: number; collected: number; commission: number }>();
  filtered.forEach((a) => {
    const day = format(new Date(a.assigned_at), "yyyy-MM-dd");
    const e = dayMap.get(day) || { delivered: 0, returned: 0, collected: 0, commission: 0 };
    if (a.status === "delivered") {
      e.delivered++;
      e.collected += a.collected_amount || 0;
      e.commission += a.commission_amount || 0;
    }
    if (a.status === "returned") e.returned++;
    dayMap.set(day, e);
  });
  const dailyBreakdown = Array.from(dayMap.entries())
    .sort((a, b) => b[0].localeCompare(a[0]));

  return (
    <AdminLayout>
      <div className="p-4 space-y-4">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Truck className="h-5 w-5" /> ডেলিভারি রাইডার ম্যানেজমেন্ট
        </h1>

        {/* Commission Settings */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="h-4 w-4" /> কমিশন সেটিংস
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <span className="text-sm">বর্তমান রেট: ৳{settings?.commission_per_delivery ?? 20}/ডেলিভারি</span>
            <Input
              type="number"
              placeholder="নতুন রেট"
              value={commissionInput}
              onChange={(e) => setCommissionInput(e.target.value)}
              className="w-32"
            />
            <Button
              size="sm"
              onClick={() => {
                const v = parseFloat(commissionInput);
                if (v > 0) updateSettings.mutate({ commission_per_delivery: v });
              }}
              disabled={updateSettings.isPending}
            >
              আপডেট
            </Button>
          </CardContent>
        </Card>

        {/* Assign Riders */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" /> রাইডার অ্যাসাইন করুন ({handDeliveryOrders.length} অর্ডার)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2 items-center flex-wrap">
              <Select value={assignRiderId} onValueChange={setAssignRiderId}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="রাইডার সিলেক্ট" />
                </SelectTrigger>
                <SelectContent>
                  {riders.map((r) => (
                    <SelectItem key={r.user_id} value={r.user_id}>{r.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                onClick={handleAssign}
                disabled={!assignRiderId || selectedOrders.size === 0 || assignRider.isPending}
              >
                অ্যাসাইন ({selectedOrders.size})
              </Button>
            </div>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {handDeliveryOrders.map((o) => (
                <label
                  key={o.id}
                  className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-muted/50"
                >
                  <input
                    type="checkbox"
                    checked={selectedOrders.has(o.id)}
                    onChange={() => toggleOrder(o.id)}
                  />
                  <span className="text-sm">
                    #{o.order_number} - {o.customer_name} - ৳{o.total_amount}
                  </span>
                </label>
              ))}
              {handDeliveryOrders.length === 0 && (
                <p className="text-sm text-muted-foreground p-2">কোনো অ্যাসাইনবিহীন Hand Delivery অর্ডার নেই</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap items-center">
          {(["today", "month", "year", "all"] as TimeFilter[]).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={timeFilter === f ? "default" : "outline"}
              onClick={() => setTimeFilter(f)}
            >
              {f === "today" ? "আজ" : f === "month" ? "এই মাস" : f === "year" ? "এই বছর" : "সব"}
            </Button>
          ))}
          <Select value={selectedRider} onValueChange={setSelectedRider}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="সব রাইডার" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সব রাইডার</SelectItem>
              {riders.map((r) => (
                <SelectItem key={r.user_id} value={r.user_id}>{r.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card><CardContent className="p-3 text-center">
            <p className="text-2xl font-bold">{delivered.length}</p>
            <p className="text-xs text-muted-foreground">ডেলিভারি</p>
          </CardContent></Card>
          <Card><CardContent className="p-3 text-center">
            <p className="text-2xl font-bold">{returned.length}</p>
            <p className="text-xs text-muted-foreground">রিটার্ন</p>
          </CardContent></Card>
          <Card><CardContent className="p-3 text-center">
            <p className="text-2xl font-bold">৳{totalCollected}</p>
            <p className="text-xs text-muted-foreground">সংগ্রহিত</p>
          </CardContent></Card>
          <Card><CardContent className="p-3 text-center">
            <p className="text-2xl font-bold">৳{totalCommission}</p>
            <p className="text-xs text-muted-foreground">কমিশন</p>
          </CardContent></Card>
        </div>

        {/* Day-by-day */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">দিনভিত্তিক রিপোর্ট</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">তারিখ</th>
                    <th className="text-center p-2">ডেলিভারি</th>
                    <th className="text-center p-2">রিটার্ন</th>
                    <th className="text-right p-2">সংগ্রহিত</th>
                    <th className="text-right p-2">কমিশন</th>
                    <th className="text-right p-2">কোম্পানি</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyBreakdown.map(([date, d]) => (
                    <tr key={date} className="border-b">
                      <td className="p-2">{date}</td>
                      <td className="text-center p-2">{d.delivered}</td>
                      <td className="text-center p-2">{d.returned}</td>
                      <td className="text-right p-2">৳{d.collected}</td>
                      <td className="text-right p-2">৳{d.commission}</td>
                      <td className="text-right p-2">৳{d.collected - d.commission}</td>
                    </tr>
                  ))}
                  {dailyBreakdown.length === 0 && (
                    <tr><td colSpan={6} className="text-center p-4 text-muted-foreground">কোনো ডাটা নেই</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Recent assignments */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">সাম্প্রতিক অ্যাসাইনমেন্ট</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {filtered.slice(0, 30).map((a) => {
              const rider = riders.find((r) => r.user_id === a.rider_id);
              return (
                <div key={a.id} className="border rounded p-2 flex justify-between items-center text-sm">
                  <div>
                    <span className="font-medium">#{a.orders?.order_number}</span>
                    <span className="mx-2 text-muted-foreground">→</span>
                    <span>{rider?.full_name || "Unknown"}</span>
                    <span className="ml-2 text-muted-foreground">{a.orders?.customer_name}</span>
                  </div>
                  <Badge variant={a.status === "delivered" ? "default" : a.status === "returned" ? "destructive" : "secondary"}>
                    {a.status === "assigned" ? "পেন্ডিং" : a.status === "delivered" ? "ডেলিভারি" : "রিটার্ন"}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
