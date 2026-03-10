import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ArrowLeft, Settings, Wifi, Ban, Phone, Clock, Smartphone,
  BarChart3, MessageSquare, ShieldAlert, Plus, Trash2, Loader2, Shield, Search
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface FakeOrderDetectionProps {
  onBack: () => void;
}

export const FakeOrderDetection = ({ onBack }: FakeOrderDetectionProps) => {
  const queryClient = useQueryClient();

  // Fraud settings
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["fraud-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fraud_settings" as any)
        .select("*")
        .limit(1)
        .single();
      if (error) throw error;
      return data as any;
    },
  });

  const [protectionEnabled, setProtectionEnabled] = useState(false);
  const [repeatBlockDuration, setRepeatBlockDuration] = useState("off");
  const [deviceFingerprint, setDeviceFingerprint] = useState(false);
  const [deliveryRatioEnabled, setDeliveryRatioEnabled] = useState(false);
  const [minDeliveryRatio, setMinDeliveryRatio] = useState([0]);
  const [blockMessage, setBlockMessage] = useState("");

  // Blocked IPs
  const [newIp, setNewIp] = useState("");
  const [newIpReason, setNewIpReason] = useState("");
  const [ipSearch, setIpSearch] = useState("");

  // Blocked phones
  const [newPhone, setNewPhone] = useState("");
  const [newPhoneReason, setNewPhoneReason] = useState("");
  const [phoneSearch, setPhoneSearch] = useState("");

  useEffect(() => {
    if (settings) {
      setProtectionEnabled(settings.protection_enabled);
      setRepeatBlockDuration(settings.repeat_block_duration);
      setDeviceFingerprint(settings.device_fingerprint_enabled);
      setDeliveryRatioEnabled(settings.delivery_ratio_enabled);
      setMinDeliveryRatio([settings.min_delivery_ratio]);
      setBlockMessage(settings.block_popup_message || "");
    }
  }, [settings]);

  // Save settings mutation
  const saveSettings = useMutation({
    mutationFn: async (updates: any) => {
      const { error } = await supabase
        .from("fraud_settings" as any)
        .update({ ...updates, updated_at: new Date().toISOString() } as any)
        .eq("id", settings?.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fraud-settings"] });
      toast.success("Settings saved!");
    },
    onError: (e: Error) => toast.error("Save failed: " + e.message),
  });

  const handleSaveAll = () => {
    saveSettings.mutate({
      protection_enabled: protectionEnabled,
      repeat_block_duration: repeatBlockDuration,
      device_fingerprint_enabled: deviceFingerprint,
      delivery_ratio_enabled: deliveryRatioEnabled,
      min_delivery_ratio: minDeliveryRatio[0],
      block_popup_message: blockMessage,
    });
  };

  // Blocked IPs query
  const { data: blockedIps = [], isLoading: ipsLoading } = useQuery({
    queryKey: ["blocked-ips"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blocked_ips" as any)
        .select("*")
        .order("blocked_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const addBlockedIp = useMutation({
    mutationFn: async ({ ip, reason }: { ip: string; reason: string }) => {
      const { error } = await supabase
        .from("blocked_ips" as any)
        .insert({ ip_address: ip, reason: reason || null } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blocked-ips"] });
      setNewIp("");
      setNewIpReason("");
      toast.success("IP blocked!");
    },
    onError: (e: Error) => toast.error(e.message.includes("duplicate") ? "This IP is already blocked" : e.message),
  });

  const removeBlockedIp = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blocked_ips" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blocked-ips"] });
      toast.success("IP unblocked!");
    },
  });

  // Blocked phones query
  const { data: blockedPhones = [], isLoading: phonesLoading } = useQuery({
    queryKey: ["blocked-phones"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blocked_phones" as any)
        .select("*")
        .order("blocked_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const addBlockedPhone = useMutation({
    mutationFn: async ({ phone, reason }: { phone: string; reason: string }) => {
      const { error } = await supabase
        .from("blocked_phones" as any)
        .insert({ phone_number: phone, reason: reason || null } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blocked-phones"] });
      setNewPhone("");
      setNewPhoneReason("");
      toast.success("Number blocked!");
    },
    onError: (e: Error) => toast.error(e.message.includes("duplicate") ? "This number is already blocked" : e.message),
  });

  const removeBlockedPhone = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blocked_phones" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blocked-phones"] });
      toast.success("Number unblocked!");
    },
  });

  const filteredIps = blockedIps.filter((ip: any) =>
    !ipSearch || ip.ip_address.includes(ipSearch) || (ip.reason || "").toLowerCase().includes(ipSearch.toLowerCase())
  );

  const filteredPhones = blockedPhones.filter((p: any) =>
    !phoneSearch || p.phone_number.includes(phoneSearch) || (p.reason || "").toLowerCase().includes(phoneSearch.toLowerCase())
  );

  const getDurationLabel = (d: string) => {
    const map: Record<string, string> = { off: "Off", "1h": "1 Hour", "6h": "6 Hours", "12h": "12 Hours", "24h": "24 Hours" };
    return map[d] || d;
  };

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-xl hover:bg-secondary/80 transition-all">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-100 to-red-50">
            <ShieldAlert className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">Fake Order Detection</h1>
            <p className="text-sm text-muted-foreground">Prevent fake orders and protect your business</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-card rounded-xl border border-border/60 px-4 py-2.5 shadow-sm">
          <span className="text-sm text-muted-foreground font-medium">Protection</span>
          <Switch
            checked={protectionEnabled}
            onCheckedChange={(checked) => {
              setProtectionEnabled(checked);
              saveSettings.mutate({
                protection_enabled: checked,
                repeat_block_duration: repeatBlockDuration,
                device_fingerprint_enabled: deviceFingerprint,
                delivery_ratio_enabled: deliveryRatioEnabled,
                min_delivery_ratio: minDeliveryRatio[0],
                block_popup_message: blockMessage,
              });
            }}
          />
          <Badge
            variant="secondary"
            className={`text-xs font-semibold ${protectionEnabled ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : ""}`}
          >
            {protectionEnabled ? "Active" : "Inactive"}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="settings">
        <TabsList className="mx-auto w-fit bg-card border border-border/60 shadow-sm rounded-xl p-1">
          <TabsTrigger value="settings" className="gap-1.5 rounded-lg"><Settings className="h-3.5 w-3.5" /> Settings</TabsTrigger>
          <TabsTrigger value="ip" className="gap-1.5 rounded-lg"><Wifi className="h-3.5 w-3.5" /> IP Address</TabsTrigger>
          <TabsTrigger value="phones" className="gap-1.5 rounded-lg"><Phone className="h-3.5 w-3.5" /> Block Number</TabsTrigger>
          <TabsTrigger value="blocked" className="gap-1.5 rounded-lg"><Ban className="h-3.5 w-3.5" /> Blocked Orders</TabsTrigger>
        </TabsList>

        {/* Settings Tab */}
        <TabsContent value="settings" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Repeat Order Block */}
            <Card className="p-6 border-border/40 card-hover">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-gradient-to-br from-red-100 to-red-50">
                  <Clock className="h-4 w-4 text-red-500" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-sm">Repeat Order Block</h3>
                  <p className="text-xs text-muted-foreground">Block repeat orders from the same phone/IP within a set time</p>
                </div>
              </div>
              <div className="space-y-3">
                <Label className="font-medium text-xs">Block Duration</Label>
                <Select value={repeatBlockDuration} onValueChange={setRepeatBlockDuration}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="off">Off</SelectItem>
                    <SelectItem value="1h">1 Hour</SelectItem>
                    <SelectItem value="6h">6 Hours</SelectItem>
                    <SelectItem value="12h">12 Hours</SelectItem>
                    <SelectItem value="24h">24 Hours</SelectItem>
                  </SelectContent>
                </Select>
                {repeatBlockDuration !== "off" && (
                  <p className="text-xs text-muted-foreground bg-secondary/40 rounded-lg p-2.5">
                    ✅ After placing an order, the same phone/IP will be blocked from ordering again for <strong>{getDurationLabel(repeatBlockDuration)}</strong>. Blocked orders will be saved in Incomplete Orders.
                  </p>
                )}
              </div>
            </Card>

            {/* Device/VPN Protection */}
            <Card className="p-6 border-border/40 card-hover">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-gradient-to-br from-violet-100 to-violet-50">
                  <Smartphone className="h-4 w-4 text-violet-500" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-sm">Device Block (VPN Protection)</h3>
                  <p className="text-xs text-muted-foreground">Block devices even when IP is changed via VPN</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/40 border border-border/40">
                <div>
                  <Label className="font-medium text-xs">Enable Device Fingerprinting</Label>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Tracks via browser/device signature</p>
                </div>
                <Switch checked={deviceFingerprint} onCheckedChange={setDeviceFingerprint} />
              </div>
              {deviceFingerprint && (
                <p className="text-xs text-muted-foreground bg-secondary/40 rounded-lg p-2.5 mt-3">
                  ✅ Repeat orders from the same device will be blocked even when using a VPN.
                </p>
              )}
            </Card>

            {/* Delivery Ratio Check */}
            <Card className="p-6 border-border/40 card-hover">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50">
                  <BarChart3 className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-sm">Delivery Ratio Check</h3>
                  <p className="text-xs text-muted-foreground">Block orders from customers with low delivery ratio</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/40 border border-border/40 mb-3">
                <div>
                  <Label className="font-medium text-xs">Enable Delivery Ratio Check</Label>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Checks customer's previous delivery history</p>
                </div>
                <Switch checked={deliveryRatioEnabled} onCheckedChange={setDeliveryRatioEnabled} />
              </div>
              {deliveryRatioEnabled && (
                <div className="space-y-4 p-3 rounded-xl bg-secondary/40 border border-border/40">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium text-xs">Minimum Delivery Ratio</Label>
                    <span className="text-sm font-bold text-primary bg-accent px-2 py-0.5 rounded-lg">{minDeliveryRatio[0]}%</span>
                  </div>
                  <Slider value={minDeliveryRatio} onValueChange={setMinDeliveryRatio} max={100} step={5} className="my-2" />
                  <p className="text-xs text-muted-foreground">
                    If customer's delivery success rate is below {minDeliveryRatio[0]}%, the order will go to Incomplete.
                  </p>
                </div>
              )}
            </Card>

            {/* Block Popup Message */}
            <Card className="p-6 border-border/40 card-hover">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-gradient-to-br from-amber-100 to-amber-50">
                  <MessageSquare className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-sm">Block Popup Message</h3>
                  <p className="text-xs text-muted-foreground">Message shown to blocked customers</p>
                </div>
              </div>
              <Textarea
                value={blockMessage}
                onChange={(e) => setBlockMessage(e.target.value)}
                placeholder="Enter block message..."
                rows={4}
                className="resize-none rounded-xl"
              />
              <p className="text-xs text-muted-foreground mt-2">
                This message will be shown to blocked customers on landing pages and the website.
              </p>
            </Card>
          </div>

          {/* Save Button */}
          <div className="flex justify-end mt-4">
            <Button onClick={handleSaveAll} disabled={saveSettings.isPending} className="gap-2 rounded-xl">
              {saveSettings.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              <Shield className="h-4 w-4" />
              Save All Settings
            </Button>
          </div>
        </TabsContent>

        {/* IP Address Tab */}
        <TabsContent value="ip" className="mt-6 space-y-4">
          <Card className="p-6 border-border/40">
            <h3 className="font-bold text-foreground text-sm mb-1">Block IP Address</h3>
            <p className="text-xs text-muted-foreground mb-4">Orders from this IP will be permanently blocked — applies to all landing pages and APIs</p>
            <div className="flex gap-2">
              <Input
                value={newIp}
                onChange={(e) => setNewIp(e.target.value)}
                placeholder="IP Address (e.g. 192.168.1.1)"
                className="rounded-xl flex-1"
              />
              <Input
                value={newIpReason}
                onChange={(e) => setNewIpReason(e.target.value)}
                placeholder="কারণ (ঐচ্ছিক)"
                className="rounded-xl flex-1"
              />
              <Button
                onClick={() => {
                  if (!newIp.trim()) return toast.error("IP দিন");
                  addBlockedIp.mutate({ ip: newIp.trim(), reason: newIpReason.trim() });
                }}
                disabled={addBlockedIp.isPending}
                className="gap-1 rounded-xl"
              >
                <Plus className="h-4 w-4" /> ব্লক করুন
              </Button>
            </div>
          </Card>

          <Card className="border-border/40">
            <div className="p-4 border-b border-border/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-foreground text-sm">ব্লক করা IP ({blockedIps.length})</h3>
              </div>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={ipSearch}
                  onChange={(e) => setIpSearch(e.target.value)}
                  placeholder="IP সার্চ..."
                  className="pl-9 w-[200px] h-8 rounded-lg text-xs"
                />
              </div>
            </div>
            {ipsLoading ? (
              <div className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" /></div>
            ) : filteredIps.length === 0 ? (
              <div className="p-12 text-center">
                <Wifi className="h-10 w-10 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">কোনো ব্লক করা IP নেই</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">IP Address</TableHead>
                    <TableHead className="text-xs">কারণ</TableHead>
                    <TableHead className="text-xs">ব্লক তারিখ</TableHead>
                    <TableHead className="text-xs text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIps.map((ip: any) => (
                    <TableRow key={ip.id}>
                      <TableCell className="font-mono text-sm font-medium">{ip.ip_address}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{ip.reason || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{format(new Date(ip.blocked_at), "dd MMM yyyy, hh:mm a")}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          onClick={() => removeBlockedIp.mutate(ip.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        {/* Block Number Tab */}
        <TabsContent value="phones" className="mt-6 space-y-4">
          <Card className="p-6 border-border/40">
            <h3 className="font-bold text-foreground text-sm mb-1">ফোন নম্বর ব্লক করুন</h3>
            <p className="text-xs text-muted-foreground mb-4">এই নম্বর থেকে কোনোদিন অর্ডার আসবে না — সব ল্যান্ডিং পেজ, ওয়েবসাইট ও API-তে কার্যকর</p>
            <div className="flex gap-2">
              <Input
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="ফোন নম্বর (e.g. 01712345678)"
                className="rounded-xl flex-1"
              />
              <Input
                value={newPhoneReason}
                onChange={(e) => setNewPhoneReason(e.target.value)}
                placeholder="কারণ (ঐচ্ছিক)"
                className="rounded-xl flex-1"
              />
              <Button
                onClick={() => {
                  if (!newPhone.trim()) return toast.error("নম্বর দিন");
                  addBlockedPhone.mutate({ phone: newPhone.trim(), reason: newPhoneReason.trim() });
                }}
                disabled={addBlockedPhone.isPending}
                className="gap-1 rounded-xl"
              >
                <Plus className="h-4 w-4" /> ব্লক করুন
              </Button>
            </div>
          </Card>

          <Card className="border-border/40">
            <div className="p-4 border-b border-border/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-foreground text-sm">ব্লক করা নম্বর ({blockedPhones.length})</h3>
              </div>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={phoneSearch}
                  onChange={(e) => setPhoneSearch(e.target.value)}
                  placeholder="নম্বর সার্চ..."
                  className="pl-9 w-[200px] h-8 rounded-lg text-xs"
                />
              </div>
            </div>
            {phonesLoading ? (
              <div className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" /></div>
            ) : filteredPhones.length === 0 ? (
              <div className="p-12 text-center">
                <Phone className="h-10 w-10 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">কোনো ব্লক করা নম্বর নেই</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">ফোন নম্বর</TableHead>
                    <TableHead className="text-xs">কারণ</TableHead>
                    <TableHead className="text-xs">ব্লক তারিখ</TableHead>
                    <TableHead className="text-xs text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPhones.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-sm font-medium">{p.phone_number}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{p.reason || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{format(new Date(p.blocked_at), "dd MMM yyyy, hh:mm a")}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          onClick={() => removeBlockedPhone.mutate(p.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        {/* Blocked Orders Tab */}
        <TabsContent value="blocked" className="mt-6">
          <BlockedOrdersList />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Blocked Orders List - shows incomplete orders that were blocked by fraud detection
const BlockedOrdersList = () => {
  const { data: blockedOrders = [], isLoading } = useQuery({
    queryKey: ["blocked-orders-fraud"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("incomplete_orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <div className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" /></div>;
  }

  if (blockedOrders.length === 0) {
    return (
      <Card className="p-6 border-border/40">
        <div className="text-center py-12">
          <Ban className="h-10 w-10 text-muted-foreground/20 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground font-medium">কোনো ব্লক হওয়া অর্ডার নেই</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-border/40 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs">কাস্টমার</TableHead>
            <TableHead className="text-xs">ফোন</TableHead>
            <TableHead className="text-xs">IP</TableHead>
            <TableHead className="text-xs">ব্লক কারণ</TableHead>
            <TableHead className="text-xs">তারিখ</TableHead>
            <TableHead className="text-xs">মোট</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {blockedOrders.map((o) => (
            <TableRow key={o.id}>
              <TableCell className="text-sm font-medium">{o.customer_name}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{o.customer_phone || "—"}</TableCell>
              <TableCell className="text-xs font-mono text-muted-foreground">{o.client_ip || "—"}</TableCell>
              <TableCell>
                <Badge variant="destructive" className="text-[10px] font-normal max-w-[200px] truncate">
                  {o.block_reason}
                </Badge>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">{format(new Date(o.created_at), "dd MMM, hh:mm a")}</TableCell>
              <TableCell className="text-xs font-medium">৳{o.total_amount}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
};
