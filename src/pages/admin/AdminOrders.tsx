import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Plus, Search, Calendar, AlertCircle, ShieldAlert, Truck, Key,
  Settings, Download, Printer, RefreshCw, ChevronDown, Wifi, Ban,
  Trash2, Copy, X, ShoppingCart, ArrowLeft, Clock, CheckCircle2,
  GitMerge, PauseCircle, XCircle, Trash, Smartphone, BarChart3,
  MessageSquare, Filter
} from "lucide-react";

const statusTabs = [
  { label: "All Orders", count: 0, color: "bg-primary", icon: ShoppingCart },
  { label: "New Orders", count: 0, color: "bg-emerald-500", icon: CheckCircle2 },
  { label: "Confirmed", count: 0, color: "bg-emerald-600", icon: CheckCircle2 },
  { label: "In Courier", count: 0, color: "bg-violet-500", icon: Truck },
  { label: "Delivered", count: 0, color: "bg-emerald-500", icon: CheckCircle2 },
  { label: "Partial Delivery", count: 0, color: "bg-amber-400", icon: AlertCircle },
  { label: "Cancelled", count: 0, color: "bg-red-500", icon: XCircle },
  { label: "Hold", count: 0, color: "bg-yellow-500", icon: PauseCircle },
  { label: "Ship Later", count: 0, color: "bg-teal-500", icon: Clock },
  { label: "Incomplete", count: 0, color: "bg-orange-500", icon: AlertCircle },
  { label: "Return", count: 0, color: "bg-red-400", icon: ArrowLeft },
];

const orderStatusSettings = [
  { label: "New Orders", color: "bg-blue-500" },
  { label: "Confirmed", color: "bg-emerald-500" },
  { label: "Ready", color: "bg-amber-400" },
  { label: "In Courier", color: "bg-violet-500" },
  { label: "Delivered", color: "bg-emerald-600" },
  { label: "Partial Delivery", color: "bg-amber-400" },
  { label: "Cancelled", color: "bg-red-500" },
  { label: "Hold", color: "bg-yellow-500" },
  { label: "Ship Later", color: "bg-teal-500" },
  { label: "Paid", color: "bg-emerald-500" },
  { label: "Return", color: "bg-orange-500" },
  { label: "Lost", color: "bg-violet-700" },
  { label: "Delete", color: "bg-red-600" },
  { label: "Incomplete", color: "bg-amber-400" },
];

const courierProviders = [
  { name: "Steadfast", description: "Steadfast Courier Ltd." },
  { name: "Pathao", description: "Pathao Courier Service" },
  { name: "RedX", description: "RedX Logistics" },
];

const dateFilterOptions = [
  "Today", "Yesterday", "Last 7 Days", "Last 14 Days", "Last 30 Days", "Last Year", "Custom Range"
];

const incompleteFilters = ["Today", "Yesterday", "Last 7 Days", "Monthly", "Yearly", "Custom"];
const incompleteTabs = [
  { label: "Processing", icon: Clock },
  { label: "Confirmed", icon: CheckCircle2 },
  { label: "Converted", icon: GitMerge },
  { label: "Hold", icon: PauseCircle },
  { label: "Cancelled", icon: XCircle },
  { label: "Deleted", icon: Trash },
];

type View = "orders" | "incomplete" | "fakeOrder";

const AdminOrders = () => {
  const [activeTab, setActiveTab] = useState("All Orders");
  const [currentView, setCurrentView] = useState<View>("orders");
  const [incompleteFilter, setIncompleteFilter] = useState("Today");
  const [activeIncompleteTab, setActiveIncompleteTab] = useState("Processing");
  const [deliveryRatio, setDeliveryRatio] = useState([0]);

  if (currentView === "incomplete") {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setCurrentView("orders")} className="p-2 rounded-xl hover:bg-secondary/80 transition-all">
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-100 to-amber-50">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground tracking-tight">Incomplete Orders</h1>
                <p className="text-sm text-muted-foreground">Abandoned checkouts awaiting recovery</p>
              </div>
            </div>
          </div>

          {/* Time Filters */}
          <div className="flex items-center gap-0.5 bg-card rounded-xl border border-border/60 p-1 w-fit shadow-sm">
            {incompleteFilters.map((f) => (
              <button
                key={f}
                onClick={() => setIncompleteFilter(f)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  incompleteFilter === f
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-6 border-b border-border/40 pb-0">
            {incompleteTabs.map((tab) => (
              <button
                key={tab.label}
                onClick={() => setActiveIncompleteTab(tab.label)}
                className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-all duration-200 ${
                  activeIncompleteTab === tab.label
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Empty State */}
          <Card className="p-16 text-center border-border/40">
            <div className="inline-flex p-4 rounded-2xl bg-secondary/60 mb-4">
              <ShoppingCart className="h-10 w-10 text-muted-foreground/30" />
            </div>
            <p className="text-lg font-semibold text-muted-foreground">No incomplete orders</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Orders will appear here when customers abandon checkout</p>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  if (currentView === "fakeOrder") {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setCurrentView("orders")} className="p-2 rounded-xl hover:bg-secondary/80 transition-all">
                <ArrowLeft className="h-5 w-5 text-foreground" />
              </button>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-100 to-red-50">
                <ShieldAlert className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground tracking-tight">Fake Order Detection</h1>
                <p className="text-sm text-muted-foreground">Prevent fraud and protect your business</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-card rounded-xl border border-border/60 px-4 py-2.5 shadow-sm">
              <span className="text-sm text-muted-foreground font-medium">Protection</span>
              <Switch />
              <Badge variant="secondary" className="text-xs font-semibold">Inactive</Badge>
            </div>
          </div>

          <Tabs defaultValue="settings">
            <TabsList className="mx-auto w-fit bg-card border border-border/60 shadow-sm rounded-xl p-1">
              <TabsTrigger value="settings" className="gap-1.5 rounded-lg"><Settings className="h-3.5 w-3.5" /> Settings</TabsTrigger>
              <TabsTrigger value="ip" className="gap-1.5 rounded-lg"><Wifi className="h-3.5 w-3.5" /> IP Address</TabsTrigger>
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
                      <p className="text-xs text-muted-foreground">Block repeat orders from same phone/IP</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-medium text-xs">Block Duration</Label>
                    <Select defaultValue="off">
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="off">Off</SelectItem>
                        <SelectItem value="1h">1 Hour</SelectItem>
                        <SelectItem value="6h">6 Hours</SelectItem>
                        <SelectItem value="12h">12 Hours</SelectItem>
                        <SelectItem value="24h">24 Hours</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-muted-foreground">Customers can't place another order within this time</p>
                  </div>
                </Card>

                {/* Device Block */}
                <Card className="p-6 border-border/40 card-hover">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-violet-100 to-violet-50">
                      <Smartphone className="h-4 w-4 text-violet-500" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-sm">Device Block (VPN Protection)</h3>
                      <p className="text-xs text-muted-foreground">Block by device even with VPN</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/40 border border-border/40">
                    <div>
                      <Label className="font-medium text-xs">Enable Device Fingerprinting</Label>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Detects same browser/device using multiple signals</p>
                    </div>
                    <Switch />
                  </div>
                </Card>

                {/* Delivery Ratio Check */}
                <Card className="p-6 border-border/40 card-hover">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50">
                      <BarChart3 className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-sm">Delivery Ratio Check</h3>
                      <p className="text-xs text-muted-foreground">Block orders with low delivery ratio</p>
                    </div>
                  </div>
                  <div className="space-y-4 p-3 rounded-xl bg-secondary/40 border border-border/40">
                    <div className="flex items-center justify-between">
                      <Label className="font-medium text-xs">Minimum Delivery Ratio</Label>
                      <span className="text-sm font-bold text-primary bg-accent px-2 py-0.5 rounded-lg">{deliveryRatio[0]}%</span>
                    </div>
                    <Slider value={deliveryRatio} onValueChange={setDeliveryRatio} max={100} step={1} className="my-2" />
                    <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                      <span>0% (Disabled)</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                  </div>
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
                    placeholder="Enter the message to show to blocked customers..."
                    rows={4}
                    className="resize-none rounded-xl"
                  />
                </Card>
              </div>
            </TabsContent>

            {/* IP Address Tab */}
            <TabsContent value="ip" className="mt-6">
              <Card className="p-6 border-border/40">
                <div className="flex items-center gap-3 mb-1">
                  <div className="p-2 rounded-xl bg-secondary">
                    <Wifi className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-sm">Suspicious IP Addresses</h3>
                  <Badge variant="secondary" className="text-[10px] font-bold">0 flagged</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-6 ml-12">IP addresses with 3+ orders</p>
                <div className="text-center py-12">
                  <div className="inline-flex p-4 rounded-2xl bg-secondary/60 mb-3">
                    <Wifi className="h-10 w-10 text-muted-foreground/20" />
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">No suspicious IP addresses detected</p>
                </div>
              </Card>
            </TabsContent>

            {/* Blocked Orders Tab */}
            <TabsContent value="blocked" className="mt-6">
              <Card className="p-6 border-border/40">
                <div className="flex items-center gap-3 mb-1">
                  <div className="p-2 rounded-xl bg-secondary">
                    <Ban className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-sm">Blocked Orders</h3>
                  <Badge variant="secondary" className="text-[10px] font-bold">0</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-6 ml-12">Orders blocked by fraud detection</p>
                <div className="text-center py-12">
                  <div className="inline-flex p-4 rounded-2xl bg-secondary/60 mb-3">
                    <Ban className="h-10 w-10 text-muted-foreground/20" />
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">No blocked orders yet</p>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Orders</h1>
            <p className="text-muted-foreground text-sm">Manage and track all orders across channels</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Date Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 rounded-xl border-border/60 shadow-sm hover:shadow">
                  <Calendar className="h-4 w-4" /> Date Filter <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-48 p-2 rounded-xl">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground/60 px-2 py-1.5">Quick Select</p>
                {dateFilterOptions.map((opt) => (
                  <button
                    key={opt}
                    className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-secondary/80 transition-colors text-foreground"
                  >
                    {opt}
                  </button>
                ))}
              </PopoverContent>
            </Popover>

            <Button variant="outline" size="sm" className="gap-2 rounded-xl border-border/60 shadow-sm hover:shadow" onClick={() => setCurrentView("incomplete")}>
              <AlertCircle className="h-4 w-4 text-amber-500" /> Incomplete
            </Button>
            <Button variant="outline" size="sm" className="gap-2 rounded-xl border-border/60 shadow-sm hover:shadow" onClick={() => setCurrentView("fakeOrder")}>
              <ShieldAlert className="h-4 w-4 text-red-500" /> Fake Order
            </Button>

            {/* Courier Dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 rounded-xl border-border/60 shadow-sm hover:shadow">
                  <Truck className="h-4 w-4 text-violet-500" /> Courier
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-lg">
                    <div className="p-2 rounded-xl bg-violet-50">
                      <Truck className="h-5 w-5 text-violet-500" />
                    </div>
                    Courier Management
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-3 rounded-xl bg-secondary/40">
                    <div>
                      <p className="font-bold text-foreground text-lg">0</p>
                      <p className="text-xs text-muted-foreground">Connected Couriers</p>
                    </div>
                    <div className="border-l border-border/60 pl-4">
                      <p className="font-bold text-foreground text-lg">0</p>
                      <p className="text-xs text-muted-foreground">Active</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground/60 mb-3">Courier Providers</p>
                    <div className="space-y-2">
                      {courierProviders.map((c) => (
                        <div key={c.name} className="flex items-center justify-between p-3 rounded-xl border border-border/40 hover:bg-secondary/30 hover:shadow-sm transition-all cursor-pointer group">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-secondary/60">
                              <Truck className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                            </div>
                            <div>
                              <p className="font-semibold text-foreground text-sm">{c.name}</p>
                              <p className="text-[11px] text-muted-foreground">{c.description}</p>
                            </div>
                          </div>
                          <ChevronDown className="h-4 w-4 text-muted-foreground/50 -rotate-90" />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-3">
                    <p className="text-xs text-amber-800 leading-relaxed">💡 একসাথে একাধিক কুরিয়ার কানেক্ট রাখুন। ডেলিভারি ট্র্যাক করতে অটোমেটিক পরবর্তী কুরিয়ারের API ব্যবহার হবে।</p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* API Keys Dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 rounded-xl border-border/60 shadow-sm hover:shadow">
                  <Key className="h-4 w-4 text-amber-500" /> API Keys
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-lg">
                    <div className="p-2 rounded-xl bg-amber-50">
                      <Key className="h-5 w-5 text-amber-500" />
                    </div>
                    Order API Keys
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-foreground mb-2">Webhook Endpoint</p>
                    <div className="flex items-center gap-2 bg-secondary/60 rounded-xl p-3 border border-border/40">
                      <code className="text-xs text-muted-foreground flex-1 truncate font-mono">https://app.sohozpro.com/api/orders-webhook</code>
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg">
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1.5">POST with header x-api-key: YOUR_KEY</p>
                  </div>
                  <div className="flex gap-2">
                    <Input placeholder="Key label (e.g. WordPress)" className="flex-1 rounded-xl" />
                    <Button className="gap-1.5 rounded-xl shadow-sm">
                      <Plus className="h-4 w-4" /> Create
                    </Button>
                  </div>
                  <div className="text-center py-8">
                    <div className="inline-flex p-3 rounded-2xl bg-secondary/60 mb-3">
                      <Key className="h-7 w-7 text-muted-foreground/30" />
                    </div>
                    <p className="text-sm text-muted-foreground font-medium">No API keys yet</p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Settings Dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 rounded-xl border-border/60 shadow-sm hover:shadow">
                  <Settings className="h-4 w-4" /> Settings
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-lg">
                    <div className="p-2 rounded-xl bg-secondary">
                      <Settings className="h-5 w-5 text-muted-foreground" />
                    </div>
                    Order Status Settings
                  </DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground mb-4">কোন কোন স্ট্যাটাস Orders পেজে দেখাতে চান সেটা সিলেক্ট করুন।</p>
                <div className="grid grid-cols-2 gap-2.5">
                  {orderStatusSettings.map((s) => (
                    <label key={s.label} className="flex items-center gap-3 p-3 rounded-xl border border-border/40 hover:bg-secondary/30 hover:shadow-sm cursor-pointer transition-all">
                      <Checkbox defaultChecked />
                      <span className={`h-2.5 w-2.5 rounded-full ${s.color}`} />
                      <span className="text-sm font-medium">{s.label}</span>
                    </label>
                  ))}
                </div>
                <Button className="w-full mt-4 rounded-xl shadow-sm">Save Settings</Button>
              </DialogContent>
            </Dialog>

            {/* New Order Dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button className="gap-2 rounded-xl shadow-md shadow-primary/20">
                  <Plus className="h-4 w-4" /> New Order
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-lg">
                    <div className="p-2 rounded-xl bg-primary/10">
                      <ShoppingCart className="h-5 w-5 text-primary" />
                    </div>
                    Create New Order
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Customer Name *</Label>
                      <Input placeholder="Enter name" className="rounded-xl" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Phone</Label>
                      <Input placeholder="Enter phone" className="rounded-xl" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Email</Label>
                      <Input placeholder="Enter email" className="rounded-xl" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Payment Method</Label>
                      <Select defaultValue="COD">
                        <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="COD">COD</SelectItem>
                          <SelectItem value="bKash">bKash</SelectItem>
                          <SelectItem value="Nagad">Nagad</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Address</Label>
                    <Textarea placeholder="Enter address" rows={3} className="rounded-xl" />
                  </div>

                  {/* Order Items */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-sm">Order Items</h3>
                      <Button variant="outline" size="sm" className="gap-1 rounded-xl text-xs">
                        <Plus className="h-3 w-3" /> Add Item
                      </Button>
                    </div>
                    <div className="grid grid-cols-[1.5fr_1.5fr_0.7fr_0.7fr_auto] gap-2 items-center text-xs p-3 rounded-xl bg-secondary/40 border border-border/40">
                      <span className="font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Product</span>
                      <span className="font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Name</span>
                      <span className="font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Qty</span>
                      <span className="font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Price</span>
                      <span />
                      <Select defaultValue="custom">
                        <SelectTrigger className="rounded-lg h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="custom">Custom Item</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input placeholder="" className="rounded-lg h-8 text-xs" />
                      <Input type="number" defaultValue={1} className="rounded-lg h-8 text-xs" />
                      <Input type="number" defaultValue={0} className="rounded-lg h-8 text-xs" />
                      <Button variant="ghost" size="icon" className="text-destructive h-8 w-8 rounded-lg">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-3 items-end">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Shipping Cost</Label>
                      <Input type="number" defaultValue={0} className="rounded-xl" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Discount</Label>
                      <Input type="number" defaultValue={0} className="rounded-xl" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Payment Status</Label>
                      <Select defaultValue="UNPAID">
                        <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UNPAID">UNPAID</SelectItem>
                          <SelectItem value="PAID">PAID</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="text-right p-3 rounded-xl bg-primary/5 border border-primary/20">
                      <p className="text-xs text-primary font-semibold">Total</p>
                      <p className="text-2xl font-bold text-primary">৳0</p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Notes</Label>
                    <Textarea placeholder="Add order notes..." rows={3} className="rounded-xl" />
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Status Tabs - scrollable horizontal */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {statusTabs.map((tab) => (
            <button
              key={tab.label}
              onClick={() => setActiveTab(tab.label)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                activeTab === tab.label
                  ? `${tab.color} text-white shadow-lg`
                  : "bg-card text-muted-foreground hover:bg-secondary border border-border/40"
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
              <span className={`text-xs font-bold ${activeTab === tab.label ? "text-white/80" : "text-muted-foreground/50"}`}>{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Search & Filters Bar */}
        <Card className="p-3 border-border/40 flex items-center gap-3 flex-wrap shadow-sm">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search order, phone, name..." className="pl-10 border-0 bg-transparent shadow-none focus-visible:ring-0 text-sm" />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 rounded-xl border-border/60">
              <Filter className="h-3.5 w-3.5" />
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              New Orders
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
            <Select>
              <SelectTrigger className="w-[130px] h-9 rounded-xl border-border/60 text-xs"><SelectValue placeholder="All Sources" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="website">Website</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-[130px] h-9 rounded-xl border-border/60 text-xs"><SelectValue placeholder="All Payments" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-border/60"><RefreshCw className="h-4 w-4" /></Button>
            <Button variant="outline" size="sm" className="gap-1.5 h-9 rounded-xl border-border/60"><Download className="h-4 w-4" /> Export</Button>
            <Button variant="outline" size="sm" className="gap-1.5 h-9 rounded-xl border-border/60"><Printer className="h-4 w-4" /> Print</Button>
          </div>
        </Card>

        {/* Empty State */}
        <Card className="p-16 text-center border-border/40">
          <div className="inline-flex p-5 rounded-2xl bg-secondary/60 mb-4">
            <ShoppingCart className="h-12 w-12 text-muted-foreground/20" />
          </div>
          <p className="text-lg font-semibold text-muted-foreground">No orders found</p>
          <p className="text-sm text-muted-foreground/70 mt-1">Try adjusting your filters or create a new order</p>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;
