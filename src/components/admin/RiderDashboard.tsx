import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  useRiderAssignments,
  useRiderSettings,
  useMarkDelivered,
  useMarkReturned,
} from "@/hooks/useDeliveryRider";
import { AdminLayout } from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Package, CheckCircle, RotateCcw, TrendingUp, Wallet } from "lucide-react";
import { format, startOfDay, startOfWeek, startOfMonth, startOfYear } from "date-fns";

type TimeFilter = "today" | "week" | "month" | "year";

export default function RiderDashboard() {
  const { user } = useAuth();
  const { data: assignments = [], isLoading } = useRiderAssignments(user?.id);
  const { data: settings } = useRiderSettings();
  const markDelivered = useMarkDelivered();
  const markReturned = useMarkReturned();

  const [timeFilter, setTimeFilter] = useState<TimeFilter>("today");
  const [deliverDialog, setDeliverDialog] = useState<string | null>(null);
  const [returnDialog, setReturnDialog] = useState<string | null>(null);
  const [collectedAmount, setCollectedAmount] = useState("");
  const [returnReason, setReturnReason] = useState("");

  const commissionRate = settings?.commission_per_delivery ?? 20;

  const getFilterStart = (f: TimeFilter) => {
    const now = new Date();
    if (f === "today") return startOfDay(now);
    if (f === "week") return startOfWeek(now, { weekStartsOn: 6 });
    if (f === "month") return startOfMonth(now);
    return startOfYear(now);
  };

  const filterStart = getFilterStart(timeFilter);
  const filtered = assignments.filter(
    (a) => new Date(a.assigned_at) >= filterStart
  );

  const pending = filtered.filter((a) => a.status === "assigned");
  const delivered = filtered.filter((a) => a.status === "delivered");
  const returned = filtered.filter((a) => a.status === "returned");
  const totalCommission = delivered.reduce((s, a) => s + (a.commission_amount || 0), 0);
  const totalCollected = delivered.reduce((s, a) => s + (a.collected_amount || 0), 0);
  const companyAmount = totalCollected - totalCommission;

  const handleDeliver = () => {
    if (!deliverDialog) return;
    const amt = parseFloat(collectedAmount) || 0;
    markDelivered.mutate(
      { assignmentId: deliverDialog, collectedAmount: amt, commissionAmount: commissionRate },
      {
        onSuccess: () => {
          setDeliverDialog(null);
          setCollectedAmount("");
        },
      }
    );
  };

  const handleReturn = () => {
    if (!returnDialog || !returnReason.trim()) return;
    markReturned.mutate(
      { assignmentId: returnDialog, returnReason: returnReason.trim() },
      {
        onSuccess: () => {
          setReturnDialog(null);
          setReturnReason("");
        },
      }
    );
  };

  // Day-by-day breakdown
  const dayMap = new Map<string, { delivered: number; collected: number; commission: number; returned: number }>();
  filtered.forEach((a) => {
    const day = format(new Date(a.assigned_at), "yyyy-MM-dd");
    const entry = dayMap.get(day) || { delivered: 0, collected: 0, commission: 0, returned: 0 };
    if (a.status === "delivered") {
      entry.delivered++;
      entry.collected += a.collected_amount || 0;
      entry.commission += a.commission_amount || 0;
    }
    if (a.status === "returned") entry.returned++;
    dayMap.set(day, entry);
  });
  const dailyBreakdown = Array.from(dayMap.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, stats]) => ({ date, ...stats }));

  return (
    <AdminLayout>
      <div className="p-4 space-y-4">
        <h1 className="text-xl font-bold">ডেলিভারি রাইডার ড্যাশবোর্ড</h1>

        {/* Time Filter */}
        <div className="flex gap-2 flex-wrap">
          {(["today", "week", "month", "year"] as TimeFilter[]).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={timeFilter === f ? "default" : "outline"}
              onClick={() => setTimeFilter(f)}
            >
              {f === "today" ? "আজ" : f === "week" ? "এই সপ্তাহ" : f === "month" ? "এই মাস" : "এই বছর"}
            </Button>
          ))}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <Package className="h-5 w-5 mx-auto text-muted-foreground" />
              <p className="text-2xl font-bold">{pending.length}</p>
              <p className="text-xs text-muted-foreground">পেন্ডিং</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <CheckCircle className="h-5 w-5 mx-auto text-green-600" />
              <p className="text-2xl font-bold">{delivered.length}</p>
              <p className="text-xs text-muted-foreground">ডেলিভারি</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <RotateCcw className="h-5 w-5 mx-auto text-red-600" />
              <p className="text-2xl font-bold">{returned.length}</p>
              <p className="text-xs text-muted-foreground">রিটার্ন</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <TrendingUp className="h-5 w-5 mx-auto text-blue-600" />
              <p className="text-2xl font-bold">৳{totalCommission}</p>
              <p className="text-xs text-muted-foreground">কমিশন</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <Wallet className="h-5 w-5 mx-auto text-purple-600" />
              <p className="text-2xl font-bold">৳{companyAmount}</p>
              <p className="text-xs text-muted-foreground">কোম্পানিকে দেওয়া</p>
            </CardContent>
          </Card>
        </div>

        {/* Pending Orders */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">অ্যাসাইনড অর্ডার ({pending.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading && <p className="text-sm text-muted-foreground">লোড হচ্ছে...</p>}
            {pending.length === 0 && !isLoading && (
              <p className="text-sm text-muted-foreground">কোনো পেন্ডিং অর্ডার নেই</p>
            )}
            {pending.map((a) => (
              <div key={a.id} className="border rounded-lg p-3 space-y-1">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-sm">#{a.orders?.order_number} - {a.orders?.customer_name}</p>
                    <p className="text-xs text-muted-foreground">{a.orders?.customer_phone}</p>
                    <p className="text-xs text-muted-foreground">{a.orders?.customer_address}</p>
                    <p className="text-sm font-medium mt-1">৳{a.orders?.total_amount}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="default"
                      className="bg-green-600 hover:bg-green-700 text-xs"
                      onClick={() => { setDeliverDialog(a.id); setCollectedAmount(String(a.orders?.total_amount || 0)); }}
                    >
                      Delivered
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="text-xs"
                      onClick={() => setReturnDialog(a.id)}
                    >
                      Return
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Day-by-Day Breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">দিনভিত্তিক হিসাব</CardTitle>
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
                  {dailyBreakdown.map((d) => (
                    <tr key={d.date} className="border-b">
                      <td className="p-2">{d.date}</td>
                      <td className="text-center p-2">{d.delivered}</td>
                      <td className="text-center p-2">{d.returned}</td>
                      <td className="text-right p-2">৳{d.collected}</td>
                      <td className="text-right p-2">৳{d.commission}</td>
                      <td className="text-right p-2">৳{d.collected - d.commission}</td>
                    </tr>
                  ))}
                  {dailyBreakdown.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center p-4 text-muted-foreground">কোনো ডাটা নেই</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Completed History */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">সম্পন্ন অর্ডার</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[...delivered, ...returned].slice(0, 20).map((a) => (
              <div key={a.id} className="border rounded-lg p-3 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">#{a.orders?.order_number} - {a.orders?.customer_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.status === "delivered" && `সংগ্রহিত: ৳${a.collected_amount} | কমিশন: ৳${a.commission_amount}`}
                    {a.status === "returned" && `কারণ: ${a.return_reason}`}
                  </p>
                </div>
                <Badge variant={a.status === "delivered" ? "default" : "destructive"}>
                  {a.status === "delivered" ? "ডেলিভারি" : "রিটার্ন"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Deliver Dialog */}
      <Dialog open={!!deliverDialog} onOpenChange={() => setDeliverDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ডেলিভারি কনফার্ম</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">সংগ্রহিত টাকা (৳)</label>
              <Input
                type="number"
                value={collectedAmount}
                onChange={(e) => setCollectedAmount(e.target.value)}
                placeholder="0"
              />
            </div>
            <p className="text-sm text-muted-foreground">কমিশন: ৳{commissionRate}/ডেলিভারি</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeliverDialog(null)}>বাতিল</Button>
            <Button onClick={handleDeliver} disabled={markDelivered.isPending} className="bg-green-600 hover:bg-green-700">
              কনফার্ম
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Return Dialog */}
      <Dialog open={!!returnDialog} onOpenChange={() => setReturnDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>রিটার্ন কারণ</DialogTitle>
          </DialogHeader>
          <div>
            <label className="text-sm font-medium">কারণ লিখুন *</label>
            <Textarea
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              placeholder="কেন রিটার্ন করা হচ্ছে..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReturnDialog(null)}>বাতিল</Button>
            <Button
              variant="destructive"
              onClick={handleReturn}
              disabled={!returnReason.trim() || markReturned.isPending}
            >
              রিটার্ন কনফার্ম
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
