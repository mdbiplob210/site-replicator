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
  { label: "New Orders", count: 0, color: "bg-green-500", icon: CheckCircle2 },
  { label: "Confirmed", count: 0, color: "bg-green-600", icon: CheckCircle2 },
  { label: "In Courier", count: 0, color: "bg-purple-500", icon: Truck },
  { label: "Delivered", count: 0, color: "bg-green-500", icon: CheckCircle2 },
  { label: "Partial Delivery", count: 0, color: "bg-orange-400", icon: AlertCircle },
  { label: "Cancelled", count: 0, color: "bg-red-500", icon: XCircle },
  { label: "Hold", count: 0, color: "bg-yellow-500", icon: PauseCircle },
  { label: "Ship Later", count: 0, color: "bg-teal-500", icon: Clock },
  { label: "Incomplete", count: 0, color: "bg-orange-500", icon: AlertCircle },
  { label: "Return", count: 0, color: "bg-red-400", icon: ArrowLeft },
];

const orderStatusSettings = [
  { label: "New Orders", color: "bg-blue-500" },
  { label: "Confirmed", color: "bg-green-500" },
  { label: "Ready", color: "bg-orange-400" },
  { label: "In Courier", color: "bg-purple-500" },
  { label: "Delivered", color: "bg-green-600" },
  { label: "Partial Delivery", color: "bg-orange-400" },
  { label: "Cancelled", color: "bg-red-500" },
  { label: "Hold", color: "bg-yellow-500" },
  { label: "Ship Later", color: "bg-teal-500" },
  { label: "Paid", color: "bg-green-500" },
  { label: "Return", color: "bg-orange-500" },
  { label: "Lost", color: "bg-purple-700" },
  { label: "Delete", color: "bg-red-600" },
  { label: "Incomplete", color: "bg-orange-400" },
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
            <button onClick={() => setCurrentView("orders")} className="p-2 rounded-lg hover:bg-secondary/60">
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-orange-100">
                <Clock className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Incomplete Orders</h1>
                <p className="text-sm text-muted-foreground">Abandoned checkouts awaiting recovery</p>
              </div>
            </div>
          </div>

          {/* Time Filters */}
          <div className="flex items-center gap-1 bg-background rounded-lg border border-border/60 p-1 w-fit">
            {incompleteFilters.map((f) => (
              <button
                key={f}
                onClick={() => setIncompleteFilter(f)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  incompleteFilter === f
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
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
                className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-all ${
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
            <ShoppingCart className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-lg font-medium text-muted-foreground">No incomplete orders</p>
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
              <button onClick={() => setCurrentView("orders")} className="p-2 rounded-lg hover:bg-secondary/60">
                <ArrowLeft className="h-5 w-5 text-foreground" />
              </button>
              <div className="p-2 rounded-full bg-red-100">
                <ShieldAlert className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Fake Order Detection</h1>
                <p className="text-sm text-muted-foreground">Prevent fraud and protect your business</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Protection</span>
              <Switch />
              <span className="text-sm font-semibold text-muted-foreground">Inactive</span>
            </div>
          </div>

          <Tabs defaultValue="settings">
            <TabsList className="mx-auto w-fit">
              <TabsTrigger value="settings" className="gap-1.5"><Settings className="h-3.5 w-3.5" /> Settings</TabsTrigger>
              <TabsTrigger value="ip" className="gap-1.5"><Wifi className="h-3.5 w-3.5" /> IP Address</TabsTrigger>
              <TabsTrigger value="blocked" className="gap-1.5"><Ban className="h-3.5 w-3.5" /> Blocked Orders</TabsTrigger>
            </TabsList>

            {/* Settings Tab */}
            <TabsContent value="settings" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Repeat Order Block */}
                <Card className="p-6 border-border/40">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 rounded-lg bg-red-50">
                      <Clock className="h-4 w-4 text-red-500" />
                    </div>
                    <h3 className="font-bold text-foreground">Repeat Order Block</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">Block repeat orders from the same phone number and IP within a time window</p>
                  <div className="space-y-2">
                    <Label className="font-medium">Block Duration</Label>
                    <Select defaultValue="off">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="off">Off</SelectItem>
                        <SelectItem value="1h">1 Hour</SelectItem>
                        <SelectItem value="6h">6 Hours</SelectItem>
                        <SelectItem value="12h">12 Hours</SelectItem>
                        <SelectItem value="24h">24 Hours</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">If set, customers can't place another order from the same phone/IP within this time</p>
                  </div>
                </Card>

                {/* Device Block */}
                <Card className="p-6 border-border/40">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 rounded-lg bg-purple-50">
                      <Smartphone className="h-4 w-4 text-purple-500" />
                    </div>
                    <h3 className="font-bold text-foreground">Device Block (VPN Protection)</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">Block repeat orders from the same device even if they change IP using VPN</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Enable Device Fingerprinting</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">Detects the same browser/device using screen size, language, timezone and other signals</p>
                    </div>
                    <Switch />
                  </div>
                </Card>

                {/* Delivery Ratio Check */}
                <Card className="p-6 border-border/40">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 rounded-lg bg-blue-50">
                      <BarChart3 className="h-4 w-4 text-blue-500" />
                    </div>
                    <h3 className="font-bold text-foreground">Delivery Ratio Check</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">Automatically block orders from customers with low delivery success ratio</p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="font-medium">Minimum Delivery Ratio</Label>
                      <span className="text-sm font-bold text-primary">{deliveryRatio[0]}%</span>
                    </div>
                    <Slider value={deliveryRatio} onValueChange={setDeliveryRatio} max={100} step={1} />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0% (Disabled)</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Orders from customers with delivery ratio below this threshold will be blocked automatically</p>
                  </div>
                </Card>

                {/* Block Popup Message */}
                <Card className="p-6 border-border/40">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 rounded-lg bg-orange-50">
                      <MessageSquare className="h-4 w-4 text-orange-500" />
                    </div>
                    <h3 className="font-bold text-foreground">Block Popup Message</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">This message will be shown to blocked customers with a WhatsApp contact button</p>
                  <Textarea
                    placeholder="Enter the message to show to blocked customers..."
                    rows={4}
                    className="resize-none"
                  />
                </Card>
              </div>
            </TabsContent>

            {/* IP Address Tab */}
            <TabsContent value="ip" className="mt-6">
              <Card className="p-6 border-border/40">
                <div className="flex items-center gap-2 mb-1">
                  <Wifi className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold">Suspicious IP Addresses</h3>
                  <Badge variant="secondary">0 flagged</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-6">IP addresses with 3+ orders. Click to see details.</p>
                <div className="text-center py-12">
                  <Wifi className="h-12 w-12 text-muted-foreground/15 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No suspicious IP addresses detected</p>
                </div>
              </Card>
            </TabsContent>

            {/* Blocked Orders Tab */}
            <TabsContent value="blocked" className="mt-6">
              <Card className="p-6 border-border/40">
                <div className="flex items-center gap-2 mb-1">
                  <Ban className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold">Blocked Orders</h3>
                  <Badge variant="secondary">0</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-6">Orders that were automatically blocked by the fraud detection system</p>
                <div className="text-center py-12">
                  <Ban className="h-12 w-12 text-muted-foreground/15 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No blocked orders yet</p>
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Orders</h1>
            <p className="text-muted-foreground text-sm">Manage and track all orders across channels</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Date Filter with Popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Calendar className="h-4 w-4" /> Date Filter <ChevronDown className="h-3 w-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-48 p-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1.5">Quick Select</p>
                {dateFilterOptions.map((opt) => (
                  <button
                    key={opt}
                    className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-secondary/60 transition-colors text-foreground"
                  >
                    {opt}
                  </button>
                ))}
              </PopoverContent>
            </Popover>

            <Button variant="outline" size="sm" className="gap-2" onClick={() => setCurrentView("incomplete")}>
              <AlertCircle className="h-4 w-4" /> Incomplete
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setCurrentView("fakeOrder")}>
              <ShieldAlert className="h-4 w-4" /> Fake Order
            </Button>

            {/* Courier Dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Truck className="h-4 w-4" /> Courier
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" /> Courier Management
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <p className="font-semibold text-foreground">0 Connected</p>
                    <p className="text-sm text-muted-foreground">0 active couriers</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Courier Providers</p>
                    <div className="space-y-2">
                      {courierProviders.map((c) => (
                        <div key={c.name} className="flex items-center justify-between p-3 rounded-lg border border-border/60 hover:bg-secondary/30">
                          <div className="flex items-center gap-3">
                            <Truck className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium text-foreground">{c.name}</p>
                              <p className="text-xs text-muted-foreground">{c.description}</p>
                            </div>
                          </div>
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-xs text-amber-800">💡 একসাথে একাধিক কুরিয়ার কানেক্ট রাখুন। যখন দেটা দরকার অন/অফ করুন। ডেলিভারি ট্র্যাক করতে একটির পরিবর্তি শেষ হলে অটোমেটিক পরবর্তী কুরিয়ারের API ব্যবহার হবে।</p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* API Keys Dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Key className="h-4 w-4" /> API Keys
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" /> Order API Keys
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">Webhook Endpoint:</p>
                    <div className="flex items-center gap-2 bg-secondary/40 rounded-lg p-3">
                      <code className="text-sm text-muted-foreground flex-1 truncate">https://app.sohozpro.com/api/orders-webhook</code>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Send POST requests with header x-api-key: YOUR_KEY</p>
                  </div>
                  <div className="flex gap-2">
                    <Input placeholder="Key label (e.g. WordPress)" className="flex-1" />
                    <Button className="gap-1">
                      <Plus className="h-4 w-4" /> Create
                    </Button>
                  </div>
                  <div className="text-center py-8">
                    <Key className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No API keys yet</p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Settings Dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Settings className="h-4 w-4" /> Settings
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" /> Order Status Settings
                  </DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground mb-4">কোন কোন স্ট্যাটাস Orders পেজে দেখাতে চান সেটা সিলেক্ট করুন।</p>
                <div className="grid grid-cols-2 gap-3">
                  {orderStatusSettings.map((s) => (
                    <label key={s.label} className="flex items-center gap-3 p-2.5 rounded-lg border border-border/60 hover:bg-secondary/30 cursor-pointer">
                      <Checkbox defaultChecked />
                      <span className={`h-3 w-3 rounded-full ${s.color}`} />
                      <span className="text-sm font-medium">{s.label}</span>
                    </label>
                  ))}
                </div>
                <Button className="w-full mt-4">Save Settings</Button>
              </DialogContent>
            </Dialog>

            {/* New Order Dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" /> New Order
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Order</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Customer Name *</Label>
                      <Input placeholder="" />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input placeholder="" />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input placeholder="" />
                    </div>
                    <div>
                      <Label>Payment Method</Label>
                      <Select defaultValue="COD">
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="COD">COD</SelectItem>
                          <SelectItem value="bKash">bKash</SelectItem>
                          <SelectItem value="Nagad">Nagad</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Address</Label>
                    <Textarea placeholder="" rows={3} />
                  </div>
                  
                  {/* Order Items */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">Order Items</h3>
                      <Button variant="outline" size="sm" className="gap-1">
                        <Plus className="h-3 w-3" /> Add Item
                      </Button>
                    </div>
                    <div className="grid grid-cols-[1.5fr_1.5fr_0.7fr_0.7fr_auto] gap-2 items-center text-sm">
                      <span className="font-medium text-muted-foreground">Product</span>
                      <span className="font-medium text-muted-foreground">Name</span>
                      <span className="font-medium text-muted-foreground">Qty</span>
                      <span className="font-medium text-muted-foreground">Price</span>
                      <span />
                      <Select defaultValue="custom">
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="custom">Custom Item</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input placeholder="" />
                      <Input type="number" defaultValue={1} />
                      <Input type="number" defaultValue={0} />
                      <Button variant="ghost" size="icon" className="text-destructive h-8 w-8">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-3 items-end">
                    <div>
                      <Label>Shipping Cost</Label>
                      <Input type="number" defaultValue={0} />
                    </div>
                    <div>
                      <Label>Discount</Label>
                      <Input type="number" defaultValue={0} />
                    </div>
                    <div>
                      <Label>Payment Status</Label>
                      <Select defaultValue="UNPAID">
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UNPAID">UNPAID</SelectItem>
                          <SelectItem value="PAID">PAID</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-primary">Total</p>
                      <p className="text-2xl font-bold">৳0</p>
                    </div>
                  </div>

                  <div>
                    <Label>Notes</Label>
                    <Textarea placeholder="" rows={3} />
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
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.label
                  ? `${tab.color} text-white shadow-md`
                  : "bg-secondary/60 text-muted-foreground hover:bg-secondary"
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
              <span className={`text-xs ${activeTab === tab.label ? "text-white/80" : ""}`}>{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Search & Filters Bar */}
        <Card className="p-3 border-border/40 flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search order, phone, name..." className="pl-10 border-0 bg-transparent shadow-none focus-visible:ring-0" />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 rounded-lg">
              <Filter className="h-3.5 w-3.5" />
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              New Orders
              <ChevronDown className="h-3 w-3" />
            </Button>
            <Select>
              <SelectTrigger className="w-[130px] h-9"><SelectValue placeholder="All Sources" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="website">Website</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-[130px] h-9"><SelectValue placeholder="All Payments" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" className="h-9 w-9"><RefreshCw className="h-4 w-4" /></Button>
            <Button variant="outline" size="sm" className="gap-1.5 h-9"><Download className="h-4 w-4" /> Export</Button>
            <Button variant="outline" size="sm" className="gap-1.5 h-9"><Printer className="h-4 w-4" /> Print</Button>
          </div>
        </Card>

        {/* Empty State */}
        <Card className="p-16 text-center border-border/40">
          <ShoppingCart className="h-14 w-14 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-lg font-semibold text-muted-foreground">No orders found</p>
          <p className="text-sm text-muted-foreground/70 mt-1">Try adjusting your filters or create a new order</p>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;
