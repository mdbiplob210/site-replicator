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
import {
  Plus, Search, Calendar, AlertCircle, ShieldAlert, Truck, Key,
  Settings, Download, Printer, RefreshCw, ChevronDown, Wifi, Ban,
  Trash2, Copy, X, ShoppingCart
} from "lucide-react";

const statusTabs = [
  { label: "All Orders", count: 0, color: "bg-primary" },
  { label: "New Orders", count: 0, color: "bg-green-500" },
  { label: "Confirmed", count: 0, color: "bg-green-600" },
  { label: "In Courier", count: 0, color: "bg-purple-500" },
  { label: "Delivered", count: 0, color: "bg-green-500" },
  { label: "Partial Delivery", count: 0, color: "bg-orange-400" },
  { label: "Cancelled", count: 0, color: "bg-red-500" },
  { label: "Hold", count: 0, color: "bg-yellow-500" },
  { label: "Ship Later", count: 0, color: "bg-teal-500" },
  { label: "Incomplete", count: 0, color: "bg-orange-500" },
  { label: "Return", count: 0, color: "bg-red-400" },
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

const AdminOrders = () => {
  const [activeTab, setActiveTab] = useState("All Orders");

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
            <Button variant="outline" size="sm" className="gap-2">
              <Calendar className="h-4 w-4" /> Date Filter <ChevronDown className="h-3 w-3" />
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <AlertCircle className="h-4 w-4" /> Incomplete
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
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

        {/* Status Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
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
              {tab.label}
              <span className={`text-xs ${activeTab === tab.label ? "text-white/80" : ""}`}>{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Search & Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search order, phone, name..." className="pl-10" />
          </div>
          <Select>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="All Sources" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="website">Website</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="All Payments" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon"><RefreshCw className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" className="gap-1"><Download className="h-4 w-4" /> Export</Button>
          <Button variant="outline" size="sm" className="gap-1"><Printer className="h-4 w-4" /> Print</Button>
        </div>

        {/* Empty State */}
        <Card className="p-12 text-center border-border/40">
          <ShoppingCart className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-lg font-medium text-muted-foreground">No orders found</p>
          <p className="text-sm text-muted-foreground/70 mt-1">Create your first order to get started</p>
        </Card>

        {/* Fake Order Detection - as a separate section */}
        <Card className="p-6 border-border/40">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-red-100">
                <ShieldAlert className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Fake Order Detection</h2>
                <p className="text-sm text-muted-foreground">Prevent fraud and protect your business</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Protection</span>
              <Switch />
              <span className="text-sm font-medium text-muted-foreground">Inactive</span>
            </div>
          </div>
          
          <Tabs defaultValue="ip">
            <TabsList>
              <TabsTrigger value="settings" className="gap-1"><Settings className="h-3.5 w-3.5" /> Settings</TabsTrigger>
              <TabsTrigger value="ip" className="gap-1"><Wifi className="h-3.5 w-3.5" /> IP Address</TabsTrigger>
              <TabsTrigger value="blocked" className="gap-1"><Ban className="h-3.5 w-3.5" /> Blocked Orders</TabsTrigger>
            </TabsList>
            <TabsContent value="ip" className="mt-4">
              <Card className="p-4 border-border/40">
                <div className="flex items-center gap-2 mb-1">
                  <Wifi className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold">Suspicious IP Addresses</h3>
                  <Badge variant="secondary">0 flagged</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-6">IP addresses with 3+ orders. Click to see details.</p>
                <div className="text-center py-8">
                  <Wifi className="h-10 w-10 text-muted-foreground/20 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No suspicious IP addresses detected</p>
                </div>
              </Card>
            </TabsContent>
            <TabsContent value="blocked" className="mt-4">
              <Card className="p-4 border-border/40">
                <div className="flex items-center gap-2 mb-1">
                  <Ban className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold">Blocked Orders</h3>
                  <Badge variant="secondary">0</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-6">Orders that were automatically blocked by the fraud detection system</p>
                <div className="text-center py-8">
                  <Ban className="h-10 w-10 text-muted-foreground/20 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No blocked orders yet</p>
                </div>
              </Card>
            </TabsContent>
            <TabsContent value="settings" className="mt-4">
              <Card className="p-4 border-border/40">
                <p className="text-sm text-muted-foreground text-center py-8">Configure fraud detection settings here</p>
              </Card>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;
