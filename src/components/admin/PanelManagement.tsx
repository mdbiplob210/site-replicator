import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  Monitor, ShoppingCart, CheckCircle2, Clock, Package,
  Loader2, Power, PowerOff
} from "lucide-react";
import { usePanelStats, useTogglePanel } from "@/hooks/useEmployeePermissions";

export function PanelManagement() {
  const { data: panels = [], isLoading } = usePanelStats();
  const togglePanel = useTogglePanel();

  const activePanels = panels.filter(p => p.is_active);
  const totalPending = panels.reduce((sum, p) => sum + p.pending_orders, 0);
  const totalCompleted = panels.reduce((sum, p) => sum + p.completed_orders, 0);
  const totalOrders = panels.reduce((sum, p) => sum + p.total_orders, 0);

  const handleToggle = (userId: string, name: string, isActive: boolean) => {
    togglePanel.mutate({ userId, panelName: name, isActive });
  };

  if (isLoading) {
    return (
      <Card className="border-border/40 p-10 text-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" />
        <p className="text-sm text-muted-foreground mt-2">প্যানেল লোড হচ্ছে...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {/* Panel Overview Header */}
      <Card className="border-border/40 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10 mt-0.5">
              <Monitor className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-bold text-foreground text-sm">অর্ডার প্যানেল ডিস্ট্রিবিউশন</p>
              <p className="text-xs text-muted-foreground mt-1">
                যে প্যানেলগুলো <strong>ON</strong> আছে, নতুন অর্ডার আসলে শুধু সেগুলোতে সমানভাবে ভাগ হবে। 
                যে প্যানেল <strong>OFF</strong>, সেখানে নতুন অর্ডার যাবে না।
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-background/80 rounded-lg p-3 border border-border/30">
              <div className="flex items-center gap-2 mb-1">
                <Power className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">এক্টিভ</span>
              </div>
              <p className="text-xl font-bold text-foreground">{activePanels.length}<span className="text-sm text-muted-foreground font-normal">/{panels.length}</span></p>
            </div>
            <div className="bg-background/80 rounded-lg p-3 border border-border/30">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">পেন্ডিং</span>
              </div>
              <p className="text-xl font-bold text-foreground">{totalPending}</p>
            </div>
            <div className="bg-background/80 rounded-lg p-3 border border-border/30">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">সম্পন্ন</span>
              </div>
              <p className="text-xl font-bold text-foreground">{totalCompleted}</p>
            </div>
            <div className="bg-background/80 rounded-lg p-3 border border-border/30">
              <div className="flex items-center gap-2 mb-1">
                <Package className="h-3.5 w-3.5 text-blue-500" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">মোট অর্ডার</span>
              </div>
              <p className="text-xl font-bold text-foreground">{totalOrders}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Panel Cards Grid */}
      {panels.length === 0 ? (
        <Card className="border-border/40 p-10 text-center">
          <Monitor className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-sm font-semibold text-muted-foreground">কোনো প্যানেল নেই</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            এমপ্লয়িদের "অর্ডার প্যানেল" সুইচ ON করলে প্যানেল তৈরি হবে
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {panels.map((panel) => {
            const progressPercent = panel.total_orders > 0
              ? Math.round((panel.completed_orders / panel.total_orders) * 100)
              : 0;

            return (
              <Card
                key={panel.id}
                className={`border-border/40 overflow-hidden transition-all duration-300 ${
                  panel.is_active
                    ? "ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-500/5"
                    : "opacity-60"
                }`}
              >
                {/* Status Bar */}
                <div className={`h-1.5 ${panel.is_active ? "bg-gradient-to-r from-emerald-400 to-emerald-500" : "bg-muted"}`} />

                <CardContent className="p-4">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-lg ${
                        panel.is_active
                          ? "bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 text-emerald-600"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {(panel.full_name || "P")[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-foreground text-sm truncate max-w-[120px]">
                          {panel.full_name}
                        </p>
                        <Badge
                          variant={panel.is_active ? "default" : "secondary"}
                          className={`text-[9px] ${panel.is_active ? "bg-emerald-100 text-emerald-700 border-emerald-200" : ""}`}
                        >
                          {panel.is_active ? "🟢 ON" : "🔴 OFF"}
                        </Badge>
                      </div>
                    </div>
                    <Switch
                      checked={panel.is_active}
                      onCheckedChange={(checked) => handleToggle(panel.user_id, panel.panel_name, checked)}
                    />
                  </div>

                  {/* Order Stats */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center bg-amber-50 rounded-lg p-2">
                        <p className="text-lg font-bold text-amber-600">{panel.pending_orders}</p>
                        <p className="text-[9px] text-amber-600/70 font-medium">পেন্ডিং</p>
                      </div>
                      <div className="text-center bg-emerald-50 rounded-lg p-2">
                        <p className="text-lg font-bold text-emerald-600">{panel.completed_orders}</p>
                        <p className="text-[9px] text-emerald-600/70 font-medium">সম্পন্ন</p>
                      </div>
                      <div className="text-center bg-blue-50 rounded-lg p-2">
                        <p className="text-lg font-bold text-blue-600">{panel.total_orders}</p>
                        <p className="text-[9px] text-blue-600/70 font-medium">মোট</p>
                      </div>
                    </div>

                    {/* Progress */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] text-muted-foreground font-medium">কমপ্লিশন রেট</span>
                        <span className="text-[10px] font-bold text-foreground">{progressPercent}%</span>
                      </div>
                      <Progress value={progressPercent} className="h-2" />
                    </div>
                  </div>

                  {/* Distribution info */}
                  {panel.is_active && (
                    <div className="mt-3 flex items-center gap-1.5 text-[10px] text-emerald-600 bg-emerald-50 rounded-md px-2 py-1.5">
                      <ShoppingCart className="h-3 w-3" />
                      <span>নতুন অর্ডার এই প্যানেলে আসবে</span>
                    </div>
                  )}
                  {!panel.is_active && (
                    <div className="mt-3 flex items-center gap-1.5 text-[10px] text-muted-foreground bg-muted/50 rounded-md px-2 py-1.5">
                      <PowerOff className="h-3 w-3" />
                      <span>নতুন অর্ডার এই প্যানেলে আসবে না</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* How it works */}
      <Card className="border-border/40 border-dashed">
        <CardContent className="p-4">
          <p className="text-xs font-bold text-foreground mb-2">🔄 কিভাবে কাজ করে?</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex gap-2">
              <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-[10px] font-bold shrink-0">১</div>
              <p className="text-[11px] text-muted-foreground">নতুন অর্ডার আসলে সিস্টেম চেক করে কোন প্যানেল গুলো <strong>ON</strong> আছে</p>
            </div>
            <div className="flex gap-2">
              <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-[10px] font-bold shrink-0">২</div>
              <p className="text-[11px] text-muted-foreground">যার কাছে কম পেন্ডিং অর্ডার আছে, সেই প্যানেলে <strong>আগে</strong> অর্ডার যায়</p>
            </div>
            <div className="flex gap-2">
              <div className="h-6 w-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-[10px] font-bold shrink-0">৩</div>
              <p className="text-[11px] text-muted-foreground">এভাবে সব এক্টিভ প্যানেলে <strong>সমানভাবে</strong> অর্ডার ভাগ হয়ে যায়</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
