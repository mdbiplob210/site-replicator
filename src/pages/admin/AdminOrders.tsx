import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar as CalendarWidget } from "@/components/ui/calendar";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Plus, Search, Calendar, AlertCircle, ShieldAlert, Truck, Key,
  Settings, Download, Printer, RefreshCw, ChevronDown, Wifi, Ban,
  Trash2, Copy, X, ShoppingCart, ArrowLeft, Clock, CheckCircle2,
  GitMerge, PauseCircle, XCircle, Trash, Smartphone, BarChart3,
  MessageSquare, Filter, Loader2, Package, Globe, SlidersHorizontal
} from "lucide-react";
import {
  useOrders, useOrderCounts, useCreateOrder, useUpdateOrderStatus,
  useDeleteOrder, useNextOrderNumber, useOrderItems, getStatusFromTab, getStatusLabel,
  getStatusColor, type OrderStatus, type OrderItemInput, type OrderDateFilter
} from "@/hooks/useOrders";
import {
  useIncompleteOrders, useIncompleteOrderCounts,
  useUpdateIncompleteOrderStatus, useDeleteIncompleteOrder,
  useConvertIncompleteToOrder, type IncompleteDateFilter,
} from "@/hooks/useIncompleteOrders";
import { usePublicProducts } from "@/hooks/usePublicProducts";
import { CourierSettingsView } from "@/components/admin/courier/CourierSettingsView";
import { ApiKeysView } from "@/components/admin/api/ApiKeysView";
import { Constants } from "@/integrations/supabase/types";

const statusTabs = [
  { label: "All Orders", color: "bg-primary", icon: ShoppingCart },
  { label: "New Orders", color: "bg-blue-500", icon: CheckCircle2 },
  { label: "Confirmed", color: "bg-emerald-600", icon: CheckCircle2 },
  { label: "In Courier", color: "bg-violet-500", icon: Truck },
  { label: "Delivered", color: "bg-emerald-500", icon: CheckCircle2 },
  { label: "Cancelled", color: "bg-red-500", icon: XCircle },
  { label: "Hold", color: "bg-yellow-500", icon: PauseCircle },
  { label: "Ship Later", color: "bg-teal-500", icon: Clock },
  { label: "Return", color: "bg-red-400", icon: ArrowLeft },
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

// Bangladesh Districts, Thanas, Zones
const bdDistrictList = [
  "Dhaka", "Chittagong", "Rajshahi", "Khulna", "Barisal", "Sylhet", "Rangpur", "Mymensingh",
  "Comilla", "Gazipur", "Narayanganj", "Tangail", "Kishoreganj", "Manikganj", "Munshiganj",
  "Narsingdi", "Faridpur", "Gopalganj", "Madaripur", "Shariatpur", "Rajbari",
  "Cox's Bazar", "Bogra", "Jessore", "Dinajpur", "Pabna", "Noakhali", "Brahmanbaria",
  "Habiganj", "Moulvibazar", "Sunamganj", "Feni", "Lakshmipur", "Chandpur",
  "Pirojpur", "Jhalokati", "Barguna", "Patuakhali", "Bhola", "Kushtia", "Meherpur",
  "Chuadanga", "Jhenaidah", "Magura", "Narail", "Satkhira", "Bagerhat",
  "Chapainawabganj", "Naogaon", "Natore", "Nawabganj", "Joypurhat", "Sirajganj",
  "Thakurgaon", "Panchagarh", "Nilphamari", "Lalmonirhat", "Kurigram", "Gaibandha",
  "Sherpur", "Jamalpur", "Netrokona",
];

const bdThanaList = [
  "Dhanmondi", "Gulshan", "Banani", "Uttara", "Mirpur", "Mohammadpur", "Tejgaon", "Motijheel",
  "Ramna", "Lalbagh", "Kotwali", "Pallabi", "Kafrul", "Cantonment", "Turag", "Savar",
  "Keraniganj", "Demra", "Jatrabari", "Sutrapur", "Wari", "Khilgaon", "Badda",
  "Adabor", "Hazaribagh", "Kamrangirchar", "Shyampur", "Kadamtali",
  "Agrabad", "Patenga", "Halishahar", "Double Mooring", "Pahartali", "Bayezid",
];

const bdZoneList = [
  "Dhaka Metro", "Dhaka Sub", "Chittagong Metro", "Chittagong Sub",
  "Rajshahi Metro", "Khulna Metro", "Sylhet Metro", "Rangpur Metro",
  "Barisal Metro", "Mymensingh Metro", "Outside Metro",
];

type View = "orders" | "incomplete" | "fakeOrder" | "courier" | "api";

const AdminOrders = () => {
  const [activeTab, setActiveTab] = useState("All Orders");
  const [currentView, setCurrentView] = useState<View>("orders");
  const [incompleteFilter, setIncompleteFilter] = useState("Today");
  const [activeIncompleteTab, setActiveIncompleteTab] = useState("Processing");
  const [incompleteSourceFilter, setIncompleteSourceFilter] = useState<"all" | "ip_blocked" | "abandoned_form">("all");
  const [incompleteDateFilter, setIncompleteDateFilter] = useState<IncompleteDateFilter>("all");
  const [deliveryRatio, setDeliveryRatio] = useState([0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [orderDateFilter, setOrderDateFilter] = useState<OrderDateFilter>("all");
  const [customDateFrom, setCustomDateFrom] = useState<Date | undefined>();
  const [customDateTo, setCustomDateTo] = useState<Date | undefined>();
  const [newOrderOpen, setNewOrderOpen] = useState(false);
  const [detailOrderId, setDetailOrderId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Modal states for action buttons
  const [orderItemsModalOpen, setOrderItemsModalOpen] = useState(false);
  const [orderSourcesModalOpen, setOrderSourcesModalOpen] = useState(false);
  const [duplicateOrdersModalOpen, setDuplicateOrdersModalOpen] = useState(false);
  const [courierStatusModalOpen, setCourierStatusModalOpen] = useState(false);

  // Advanced filter states
  const [filterSource, setFilterSource] = useState("");
  const [filterPhone, setFilterPhone] = useState("");
  const [filterAmountMin, setFilterAmountMin] = useState("");
  const [filterAmountMax, setFilterAmountMax] = useState("");
  const [filterDeviceType, setFilterDeviceType] = useState("all");
  const [filterAddress, setFilterAddress] = useState("");
  const [filterDistrict, setFilterDistrict] = useState("all");
  const [filterThana, setFilterThana] = useState("all");
  const [filterZone, setFilterZone] = useState("all");
  const [filterPaymentStatus, setFilterPaymentStatus] = useState("all");
  const [filterCourierProvider, setFilterCourierProvider] = useState("all");
  const [filterCourierStatus, setFilterCourierStatus] = useState("all");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterProductSearch, setFilterProductSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterCourierCharged, setFilterCourierCharged] = useState("all");
  const [filterNotes, setFilterNotes] = useState("");
  const [filterUrl, setFilterUrl] = useState("");
  const [filterOrderTag, setFilterOrderTag] = useState("");
  const [filterSalesType, setFilterSalesType] = useState("all");

  // New order form state
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [totalAmount, setTotalAmount] = useState(0);
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [productCost, setProductCost] = useState(0);
  const [notes, setNotes] = useState("");
  const [orderItems, setOrderItems] = useState<OrderItemInput[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const statusFilter = getStatusFromTab(activeTab);
  const { data: orders = [], isLoading } = useOrders(statusFilter, orderDateFilter, customDateFrom, customDateTo);
  const { data: counts = {} } = useOrderCounts(orderDateFilter, customDateFrom, customDateTo);
  const createOrder = useCreateOrder();
  const updateStatus = useUpdateOrderStatus();
  const deleteOrder = useDeleteOrder();
  const { data: nextOrderNumber = "ORD-00001" } = useNextOrderNumber();
  const { data: allProducts = [] } = usePublicProducts();

   // Courier orders for filtering
  const { data: courierOrders = [] } = useQuery({
    queryKey: ["courier-orders-filter"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courier_orders")
        .select("order_id, courier_provider_id, courier_status, submitted_at");
      if (error) throw error;
      return data;
    },
  });
  const { data: courierProviders = [] } = useQuery({
    queryKey: ["courier-providers-filter"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courier_providers")
        .select("id, name, slug");
      if (error) throw error;
      return data;
    },
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["categories-filter"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug");
      if (error) throw error;
      return data;
    },
  });
  const { data: allOrderItems = [] } = useQuery({
    queryKey: ["all-order-items-filter"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_items")
        .select("order_id, product_name, product_code, product_id");
      if (error) throw error;
      return data;
    },
  });

  // Build lookup maps
  const courierByOrderId = useMemo(() => {
    const map: Record<string, { provider_id: string; status: string; submitted_at: string }> = {};
    courierOrders.forEach((co: any) => { map[co.order_id] = { provider_id: co.courier_provider_id, status: co.courier_status, submitted_at: co.submitted_at }; });
    return map;
  }, [courierOrders]);

  const orderItemsByOrderId = useMemo(() => {
    const map: Record<string, any[]> = {};
    allOrderItems.forEach((oi: any) => {
      if (!map[oi.order_id]) map[oi.order_id] = [];
      map[oi.order_id].push(oi);
    });
    return map;
  }, [allOrderItems]);

  // Get unique sources for dropdown
  const uniqueSources = useMemo(() => {
    const sources = new Set<string>();
    orders.forEach((o) => { if (o.source) sources.add(o.source); });
    return Array.from(sources);
  }, [orders]);

  // Incomplete orders hooks
  const incompleteStatusMap: Record<string, string> = {
    "Processing": "processing", "Confirmed": "confirmed", "Converted": "converted",
    "Hold": "on_hold", "Cancelled": "cancelled", "Deleted": "deleted"
  };
  const incompleteStatusFilter = incompleteStatusMap[activeIncompleteTab] || "processing";
  const { data: incompleteOrders = [], isLoading: incompleteLoading } = useIncompleteOrders(incompleteStatusFilter, incompleteSourceFilter, incompleteDateFilter);
  const { data: incompleteCounts = {} } = useIncompleteOrderCounts(incompleteSourceFilter, incompleteDateFilter);
  const updateIncompleteStatus = useUpdateIncompleteOrderStatus();
  const deleteIncomplete = useDeleteIncompleteOrder();
  const convertIncomplete = useConvertIncompleteToOrder();

  // Filter products for search
  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return allProducts.slice(0, 10);
    const q = productSearch.toLowerCase();
    return allProducts.filter((p: any) =>
      p.name.toLowerCase().includes(q) || p.product_code.toLowerCase().includes(q)
    ).slice(0, 10);
  }, [allProducts, productSearch]);

  // Bangladesh districts list removed - using bdDistrictList const above

  // Filtered orders by search + advanced filters
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!(o.customer_name.toLowerCase().includes(q) || o.order_number.toLowerCase().includes(q) || (o.customer_phone && o.customer_phone.toLowerCase().includes(q)))) return false;
      }
      if (filterSource && !(o.source || "প্যানেল").toLowerCase().includes(filterSource.toLowerCase())) return false;
      if (filterPhone && !(o.customer_phone && o.customer_phone.includes(filterPhone))) return false;
      if (filterAmountMin && Number(o.total_amount) < Number(filterAmountMin)) return false;
      if (filterAmountMax && Number(o.total_amount) > Number(filterAmountMax)) return false;
      if (filterDeviceType !== "all") {
        const device = (o.device_info || "").toLowerCase();
        if (filterDeviceType === "mobile" && !device.includes("mobile")) return false;
        if (filterDeviceType === "desktop" && !device.includes("desktop")) return false;
        if (filterDeviceType === "tablet" && !device.includes("tablet")) return false;
      }
      if (filterAddress && !(o.customer_address && o.customer_address.toLowerCase().includes(filterAddress.toLowerCase()))) return false;
      if (filterDistrict !== "all" && !(o.customer_address && o.customer_address.toLowerCase().includes(filterDistrict.toLowerCase()))) return false;
      if (filterThana !== "all" && !(o.customer_address && o.customer_address.toLowerCase().includes(filterThana.toLowerCase()))) return false;
      if (filterZone !== "all" && !(o.customer_address && o.customer_address.toLowerCase().includes(filterZone.toLowerCase()))) return false;
      if (filterPaymentStatus !== "all") {
        if (filterPaymentStatus === "paid" && Number(o.delivery_charge) > 0) return false;
        if (filterPaymentStatus === "cod" && Number(o.delivery_charge) === 0) return false;
        if (filterPaymentStatus === "free_delivery" && Number(o.delivery_charge) > 0) return false;
      }
      if (filterCourierProvider !== "all") {
        const co = courierByOrderId[o.id];
        if (filterCourierProvider === "no_courier") { if (co) return false; }
        else { if (!co || co.provider_id !== filterCourierProvider) return false; }
      }
      if (filterCourierStatus !== "all") {
        const co = courierByOrderId[o.id];
        if (!co || co.status !== filterCourierStatus) return false;
      }
      if (filterStatus) {
        const sl = getStatusLabel(o.status).toLowerCase();
        if (!sl.includes(filterStatus.toLowerCase()) && !o.status.includes(filterStatus.toLowerCase())) return false;
      }
      if (filterProductSearch) {
        const items = orderItemsByOrderId[o.id] || [];
        const q = filterProductSearch.toLowerCase();
        if (!items.some((i: any) => i.product_name.toLowerCase().includes(q) || i.product_code.toLowerCase().includes(q))) return false;
      }
      if (filterCategory !== "all") {
        const items = orderItemsByOrderId[o.id] || [];
        const pids = items.map((i: any) => i.product_id).filter(Boolean);
        if (!allProducts.some((p: any) => pids.includes(p.id) && p.category_id === filterCategory)) return false;
      }
      if (filterCourierCharged !== "all") {
        if (filterCourierCharged === "charged" && Number(o.delivery_charge) === 0) return false;
        if (filterCourierCharged === "free" && Number(o.delivery_charge) > 0) return false;
      }
      if (filterNotes && !(o.notes && o.notes.toLowerCase().includes(filterNotes.toLowerCase()))) return false;
      if (filterUrl && !(o.source && o.source.toLowerCase().includes(filterUrl.toLowerCase()))) return false;
      if (filterOrderTag && !(o.notes && o.notes.toLowerCase().includes(filterOrderTag.toLowerCase()))) return false;
      if (filterSalesType !== "all") {
        if (filterSalesType === "api" && !o.source) return false;
        if (filterSalesType === "manual" && o.source) return false;
      }
      return true;
    });
  }, [orders, searchQuery, filterSource, filterPhone, filterAmountMin, filterAmountMax, filterDeviceType, filterAddress, filterDistrict, filterThana, filterZone, filterPaymentStatus, filterCourierProvider, filterCourierStatus, filterStatus, filterProductSearch, filterCategory, filterCourierCharged, filterNotes, filterUrl, filterOrderTag, filterSalesType, courierByOrderId, orderItemsByOrderId, allProducts]);

  const activeFilterCount = [filterSource, filterPhone, filterAmountMin, filterAmountMax, filterAddress, filterStatus, filterProductSearch, filterNotes, filterUrl, filterOrderTag].filter(Boolean).length
    + [filterDeviceType, filterPaymentStatus, filterCourierProvider, filterCourierStatus, filterCategory, filterCourierCharged, filterSalesType, filterDistrict, filterThana, filterZone].filter(v => v !== "all").length
    + (orderDateFilter !== "all" ? 1 : 0);

  const clearAllFilters = () => {
    setFilterSource(""); setFilterPhone(""); setFilterAmountMin(""); setFilterAmountMax("");
    setFilterDeviceType("all"); setFilterAddress(""); setFilterDistrict("all"); setFilterThana("all"); setFilterZone("all");
    setFilterPaymentStatus("all"); setFilterCourierProvider("all"); setFilterCourierStatus("all");
    setFilterStatus(""); setFilterProductSearch(""); setFilterCategory("all");
    setFilterCourierCharged("all"); setFilterNotes(""); setFilterUrl("");
    setFilterOrderTag(""); setFilterSalesType("all");
    setOrderDateFilter("all"); setCustomDateFrom(undefined); setCustomDateTo(undefined);
  };

  // Order Items Summary data
  const orderItemsSummary = useMemo(() => {
    const productMap: Record<string, { name: string; code: string; orderCount: number; totalQty: number; totalAmount: number }> = {};
    filteredOrders.forEach((o) => {
      const items = orderItemsByOrderId[o.id] || [];
      items.forEach((item: any) => {
        const key = item.product_id || item.product_code || item.product_name;
        if (!productMap[key]) {
          productMap[key] = { name: item.product_name, code: item.product_code, orderCount: 0, totalQty: 0, totalAmount: 0 };
        }
        productMap[key].orderCount += 1;
        productMap[key].totalQty += (item.quantity || 1);
        productMap[key].totalAmount += Number(item.total_price || 0);
      });
    });
    return Object.values(productMap).sort((a, b) => b.orderCount - a.orderCount);
  }, [filteredOrders, orderItemsByOrderId]);

  // Order Sources Summary
  const orderSourcesSummary = useMemo(() => {
    const sourceMap: Record<string, { count: number; totalAmount: number }> = {};
    filteredOrders.forEach((o) => {
      const src = o.source || "প্যানেল (Manual)";
      if (!sourceMap[src]) sourceMap[src] = { count: 0, totalAmount: 0 };
      sourceMap[src].count += 1;
      sourceMap[src].totalAmount += Number(o.total_amount);
    });
    return Object.entries(sourceMap).sort((a, b) => b[1].count - a[1].count);
  }, [filteredOrders]);

  // Duplicate Orders (same phone or same IP)
  const duplicateOrders = useMemo(() => {
    const phoneMap: Record<string, typeof filteredOrders> = {};
    const ipMap: Record<string, typeof filteredOrders> = {};
    filteredOrders.forEach((o) => {
      if (o.customer_phone) {
        if (!phoneMap[o.customer_phone]) phoneMap[o.customer_phone] = [];
        phoneMap[o.customer_phone].push(o);
      }
      if (o.client_ip) {
        if (!ipMap[o.client_ip]) ipMap[o.client_ip] = [];
        ipMap[o.client_ip].push(o);
      }
    });
    const dupes: { key: string; type: string; orders: typeof filteredOrders }[] = [];
    Object.entries(phoneMap).forEach(([phone, ords]) => {
      if (ords.length > 1) dupes.push({ key: phone, type: "📞 Phone", orders: ords });
    });
    Object.entries(ipMap).forEach(([ip, ords]) => {
      if (ords.length > 1) dupes.push({ key: ip, type: "🌐 IP", orders: ords });
    });
    return dupes.sort((a, b) => b.orders.length - a.orders.length);
  }, [filteredOrders]);

  const addProductToOrder = (product: any) => {
    const existing = orderItems.find((i) => i.product_id === product.id);
    if (existing) {
      setOrderItems(orderItems.map((i) =>
        i.product_id === product.id
          ? { ...i, quantity: i.quantity + 1, total_price: (i.quantity + 1) * i.unit_price }
          : i
      ));
    } else {
      setOrderItems([...orderItems, {
        product_id: product.id,
        product_name: product.name,
        product_code: product.product_code,
        quantity: 1,
        unit_price: Number(product.selling_price),
        total_price: Number(product.selling_price),
      }]);
    }
    setProductSearch("");
  };

  const updateItemQuantity = (index: number, qty: number) => {
    if (qty <= 0) {
      setOrderItems(orderItems.filter((_, i) => i !== index));
      return;
    }
    setOrderItems(orderItems.map((item, i) =>
      i === index ? { ...item, quantity: qty, total_price: qty * item.unit_price } : item
    ));
  };

  const removeItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const itemsTotal = orderItems.reduce((sum, i) => sum + i.total_price, 0);

  const handleCreateOrder = () => {
    if (!customerName.trim()) return;
    const computedProductCost = orderItems.length > 0 ? itemsTotal : productCost;
    const computedTotal = totalAmount || (computedProductCost + deliveryCharge - discount);
    createOrder.mutate({
      order: {
        order_number: nextOrderNumber,
        customer_name: customerName,
        customer_phone: customerPhone || null,
        customer_address: customerAddress || null,
        total_amount: computedTotal,
        delivery_charge: deliveryCharge,
        discount,
        product_cost: computedProductCost,
        notes: notes || null,
        status: "processing",
      },
      items: orderItems,
    }, {
      onSuccess: () => {
        setNewOrderOpen(false);
        resetForm();
      }
    });
  };

  const resetForm = () => {
    setCustomerName("");
    setCustomerPhone("");
    setCustomerAddress("");
    setTotalAmount(0);
    setDeliveryCharge(0);
    setDiscount(0);
    setProductCost(0);
    setNotes("");
    setOrderItems([]);
    setProductSearch("");
  };

  if (currentView === "api") {
    return (
      <AdminLayout>
        <ApiKeysView onBack={() => setCurrentView("orders")} />
      </AdminLayout>
    );
  }

  if (currentView === "courier") {
    return (
      <AdminLayout>
        <CourierSettingsView onBack={() => setCurrentView("orders")} />
      </AdminLayout>
    );
  }

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
                <p className="text-sm text-muted-foreground">২৪ ঘণ্টার মধ্যে ব্লক হওয়া ও abandoned অর্ডারসমূহ</p>
              </div>
            </div>
            <Badge variant="secondary" className="ml-auto">{incompleteCounts.total || 0} মোট</Badge>
          </div>

          {/* Source filter: All / IP Blocked / Abandoned Form */}
          <div className="flex items-center gap-1 bg-card rounded-xl border border-border/60 p-1 w-fit">
            {([
              { key: "all" as const, label: "সব", icon: "📋" },
              { key: "ip_blocked" as const, label: "IP ব্লক", icon: "🚫" },
              { key: "abandoned_form" as const, label: "ফর্ম Abandoned", icon: "📝" },
            ]).map((f) => (
              <button
                key={f.key}
                onClick={() => setIncompleteSourceFilter(f.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  incompleteSourceFilter === f.key
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                }`}
              >
                <span>{f.icon}</span> {f.label}
              </button>
            ))}
          </div>

          {/* Date filter */}
          <div className="flex items-center gap-1 bg-card rounded-xl border border-border/60 p-1 w-fit">
            {([
              { key: "all" as IncompleteDateFilter, label: "সব সময়" },
              { key: "today" as IncompleteDateFilter, label: "আজ" },
              { key: "yesterday" as IncompleteDateFilter, label: "গতকাল" },
              { key: "7days" as IncompleteDateFilter, label: "৭ দিন" },
              { key: "30days" as IncompleteDateFilter, label: "৩০ দিন" },
            ]).map((f) => (
              <button
                key={f.key}
                onClick={() => setIncompleteDateFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  incompleteDateFilter === f.key
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Status tabs */}
          <div className="flex items-center gap-6 border-b border-border/40 pb-0">
            {incompleteTabs.map((tab) => (
              <button key={tab.label} onClick={() => setActiveIncompleteTab(tab.label)} className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-all duration-200 ${activeIncompleteTab === tab.label ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                <tab.icon className="h-4 w-4" />{tab.label}
                {incompleteCounts[incompleteStatusMap[tab.label]] > 0 && (
                  <Badge variant="secondary" className="text-xs px-1.5 py-0">{incompleteCounts[incompleteStatusMap[tab.label]]}</Badge>
                )}
              </button>
            ))}
          </div>

          {incompleteLoading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : incompleteOrders.length === 0 ? (
            <Card className="p-16 text-center border-border/40">
              <div className="inline-flex p-4 rounded-2xl bg-secondary/60 mb-4"><ShoppingCart className="h-10 w-10 text-muted-foreground/30" /></div>
              <p className="text-lg font-semibold text-muted-foreground">কোনো incomplete order নেই</p>
              <p className="text-sm text-muted-foreground/70 mt-1">ব্লক হওয়া অর্ডার এখানে দেখা যাবে</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {incompleteOrders.map((io) => (
                <Card key={io.id} className="p-4 border-border/40">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-foreground">{io.customer_name}</span>
                        {io.block_reason === "abandoned_form" ? (
                          <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">📝 Abandoned</Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs">🚫 IP Blocked</Badge>
                        )}
                        {io.landing_page_slug && <Badge variant="outline" className="text-xs">LP: {io.landing_page_slug}</Badge>}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
                        <div><span className="font-medium">ফোন:</span> {io.customer_phone || "N/A"}</div>
                        <div><span className="font-medium">IP:</span> {io.client_ip || "N/A"}</div>
                        <div><span className="font-medium">ডিভাইস:</span> {io.device_info || "N/A"}</div>
                        <div><span className="font-medium">মোট:</span> ৳{io.total_amount}</div>
                      </div>
                      {io.product_name && (
                        <p className="text-xs text-muted-foreground">
                          <span className="font-medium">প্রোডাক্ট:</span> {io.product_name} {io.product_code ? `(${io.product_code})` : ""} × {io.quantity}
                        </p>
                      )}
                      <p className="text-xs text-destructive/80 bg-destructive/5 rounded px-2 py-1 inline-block">
                        🚫 {io.block_reason}
                      </p>
                      <p className="text-xs text-muted-foreground">{format(new Date(io.created_at), "dd MMM yyyy, hh:mm a")}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {activeIncompleteTab !== "Converted" && (
                        <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => convertIncomplete.mutate(io)}>
                          <GitMerge className="h-3 w-3" /> অর্ডারে কনভার্ট
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => {
                        if (confirm("ডিলিট করতে চান?")) deleteIncomplete.mutate(io.id);
                      }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
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
              <button onClick={() => setCurrentView("orders")} className="p-2 rounded-xl hover:bg-secondary/80 transition-all"><ArrowLeft className="h-5 w-5 text-foreground" /></button>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-100 to-red-50"><ShieldAlert className="h-5 w-5 text-red-500" /></div>
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
            <TabsContent value="settings" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <Card className="p-6 border-border/40 card-hover">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-red-100 to-red-50"><Clock className="h-4 w-4 text-red-500" /></div>
                    <div><h3 className="font-bold text-foreground text-sm">Repeat Order Block</h3><p className="text-xs text-muted-foreground">Block repeat orders from same phone/IP</p></div>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-medium text-xs">Block Duration</Label>
                    <Select defaultValue="off"><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="off">Off</SelectItem><SelectItem value="1h">1 Hour</SelectItem><SelectItem value="6h">6 Hours</SelectItem><SelectItem value="12h">12 Hours</SelectItem><SelectItem value="24h">24 Hours</SelectItem></SelectContent></Select>
                  </div>
                </Card>
                <Card className="p-6 border-border/40 card-hover">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-violet-100 to-violet-50"><Smartphone className="h-4 w-4 text-violet-500" /></div>
                    <div><h3 className="font-bold text-foreground text-sm">Device Block (VPN Protection)</h3><p className="text-xs text-muted-foreground">Block by device even with VPN</p></div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/40 border border-border/40">
                    <div><Label className="font-medium text-xs">Enable Device Fingerprinting</Label><p className="text-[11px] text-muted-foreground mt-0.5">Detects same browser/device</p></div>
                    <Switch />
                  </div>
                </Card>
                <Card className="p-6 border-border/40 card-hover">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50"><BarChart3 className="h-4 w-4 text-blue-500" /></div>
                    <div><h3 className="font-bold text-foreground text-sm">Delivery Ratio Check</h3><p className="text-xs text-muted-foreground">Block orders with low delivery ratio</p></div>
                  </div>
                  <div className="space-y-4 p-3 rounded-xl bg-secondary/40 border border-border/40">
                    <div className="flex items-center justify-between"><Label className="font-medium text-xs">Minimum Delivery Ratio</Label><span className="text-sm font-bold text-primary bg-accent px-2 py-0.5 rounded-lg">{deliveryRatio[0]}%</span></div>
                    <Slider value={deliveryRatio} onValueChange={setDeliveryRatio} max={100} step={1} className="my-2" />
                  </div>
                </Card>
                <Card className="p-6 border-border/40 card-hover">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-amber-100 to-amber-50"><MessageSquare className="h-4 w-4 text-amber-600" /></div>
                    <div><h3 className="font-bold text-foreground text-sm">Block Popup Message</h3><p className="text-xs text-muted-foreground">Message shown to blocked customers</p></div>
                  </div>
                  <Textarea placeholder="Enter the message..." rows={4} className="resize-none rounded-xl" />
                </Card>
              </div>
            </TabsContent>
            <TabsContent value="ip" className="mt-6">
              <Card className="p-6 border-border/40">
                <div className="text-center py-12"><div className="inline-flex p-4 rounded-2xl bg-secondary/60 mb-3"><Wifi className="h-10 w-10 text-muted-foreground/20" /></div><p className="text-sm text-muted-foreground font-medium">No suspicious IP addresses detected</p></div>
              </Card>
            </TabsContent>
            <TabsContent value="blocked" className="mt-6">
              <Card className="p-6 border-border/40">
                <div className="text-center py-12"><div className="inline-flex p-4 rounded-2xl bg-secondary/60 mb-3"><Ban className="h-10 w-10 text-muted-foreground/20" /></div><p className="text-sm text-muted-foreground font-medium">No blocked orders yet</p></div>
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
            {/* Date Filter removed - moved to advanced filter panel */}

            <a href="/admin/orders/backfill-items">
              <Button variant="outline" size="sm" className="gap-2 rounded-xl border-border/60 shadow-sm hover:shadow">
                <Package className="h-4 w-4 text-primary" /> Backfill Items
              </Button>
            </a>
            <Button variant="outline" size="sm" className="gap-2 rounded-xl border-border/60 shadow-sm hover:shadow" onClick={() => setCurrentView("incomplete")}>
              <AlertCircle className="h-4 w-4 text-amber-500" /> Incomplete
            </Button>
            <Button variant="outline" size="sm" className="gap-2 rounded-xl border-border/60 shadow-sm hover:shadow" onClick={() => setCurrentView("fakeOrder")}>
              <ShieldAlert className="h-4 w-4 text-red-500" /> Fake Order
            </Button>

            {/* Courier Button */}
            <Button variant="outline" size="sm" className="gap-2 rounded-xl border-border/60 shadow-sm hover:shadow" onClick={() => setCurrentView("courier")}>
              <Truck className="h-4 w-4 text-violet-500" /> Courier
            </Button>

            <Button variant="outline" size="sm" className="gap-2 rounded-xl border-border/60 shadow-sm hover:shadow" onClick={() => setCurrentView("api")}>
              <Key className="h-4 w-4 text-amber-500" /> API Keys
            </Button>

            {/* Settings Dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 rounded-xl border-border/60 shadow-sm hover:shadow"><Settings className="h-4 w-4" /> Settings</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg rounded-2xl">
                <DialogHeader><DialogTitle className="flex items-center gap-2 text-lg"><div className="p-2 rounded-xl bg-secondary"><Settings className="h-5 w-5 text-muted-foreground" /></div>Order Status Settings</DialogTitle></DialogHeader>
                <div className="grid grid-cols-2 gap-2.5">
                  {orderStatusSettings.map((s) => (
                    <label key={s.label} className="flex items-center gap-3 p-3 rounded-xl border border-border/40 hover:bg-secondary/30 cursor-pointer transition-all">
                      <Checkbox defaultChecked /><span className={`h-2.5 w-2.5 rounded-full ${s.color}`} /><span className="text-sm font-medium">{s.label}</span>
                    </label>
                  ))}
                </div>
                <Button className="w-full mt-4 rounded-xl shadow-sm">Save Settings</Button>
              </DialogContent>
            </Dialog>

            {/* New Order Dialog */}
            <Dialog open={newOrderOpen} onOpenChange={setNewOrderOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 rounded-xl shadow-md shadow-primary/20"><Plus className="h-4 w-4" /> New Order</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-lg">
                    <div className="p-2 rounded-xl bg-primary/10"><ShoppingCart className="h-5 w-5 text-primary" /></div>
                    Create New Order
                    <Badge variant="secondary" className="ml-2 text-xs">{nextOrderNumber}</Badge>
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Customer Name *</Label>
                      <Input placeholder="Enter name" className="rounded-xl" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Phone</Label>
                      <Input placeholder="Enter phone" className="rounded-xl" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Address</Label>
                    <Textarea placeholder="Enter address" rows={2} className="rounded-xl" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} />
                  </div>

                  {/* Product Items */}
                  <div className="space-y-3">
                    <Label className="text-xs font-semibold">প্রোডাক্ট যোগ করুন</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="প্রোডাক্ট সার্চ করুন (নাম বা কোড)..."
                        className="pl-10 rounded-xl"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                      />
                    </div>
                    {productSearch && filteredProducts.length > 0 && (
                      <div className="border border-border rounded-xl max-h-40 overflow-y-auto bg-card shadow-md">
                        {filteredProducts.map((p: any) => (
                          <button
                            key={p.id}
                            onClick={() => addProductToOrder(p)}
                            className="w-full text-left px-3 py-2 hover:bg-secondary/60 transition-colors flex items-center justify-between text-sm border-b border-border/30 last:border-0"
                          >
                            <div>
                              <span className="font-medium text-foreground">{p.name}</span>
                              <span className="text-xs text-muted-foreground ml-2">({p.product_code})</span>
                            </div>
                            <span className="text-xs font-semibold text-primary">৳{Number(p.selling_price).toLocaleString()}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {orderItems.length > 0 && (
                      <div className="space-y-2">
                        {orderItems.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-2.5 rounded-xl bg-secondary/30 border border-border/40">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{item.product_name}</p>
                              <p className="text-xs text-muted-foreground">{item.product_code} · ৳{item.unit_price}</p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button onClick={() => updateItemQuantity(idx, item.quantity - 1)} className="h-7 w-7 rounded-lg border border-border flex items-center justify-center hover:bg-secondary text-foreground">−</button>
                              <span className="w-8 text-center text-sm font-semibold text-foreground">{item.quantity}</span>
                              <button onClick={() => updateItemQuantity(idx, item.quantity + 1)} className="h-7 w-7 rounded-lg border border-border flex items-center justify-center hover:bg-secondary text-foreground">+</button>
                            </div>
                            <span className="text-sm font-semibold text-foreground w-20 text-right">৳{item.total_price.toLocaleString()}</span>
                            <button onClick={() => removeItem(idx)} className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                        <div className="flex justify-between items-center pt-2 border-t border-border/40">
                          <span className="text-xs font-semibold text-muted-foreground">{orderItems.length}টি আইটেম</span>
                          <span className="text-sm font-bold text-primary">সাবটোটাল: ৳{itemsTotal.toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-4 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Product Cost (৳)</Label>
                      <Input type="number" className="rounded-xl" value={orderItems.length > 0 ? itemsTotal : productCost} onChange={(e) => setProductCost(Number(e.target.value))} disabled={orderItems.length > 0} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Delivery (৳)</Label>
                      <Input type="number" className="rounded-xl" value={deliveryCharge} onChange={(e) => setDeliveryCharge(Number(e.target.value))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Discount (৳)</Label>
                      <Input type="number" className="rounded-xl" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} />
                    </div>
                    <div className="text-right p-3 rounded-xl bg-primary/5 border border-primary/20">
                      <p className="text-xs text-primary font-semibold">Total</p>
                      <p className="text-2xl font-bold text-primary">৳{(orderItems.length > 0 ? itemsTotal : productCost) + deliveryCharge - discount}</p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Notes</Label>
                    <Textarea placeholder="Add order notes..." rows={2} className="rounded-xl" value={notes} onChange={(e) => setNotes(e.target.value)} />
                  </div>
                  <Button className="w-full rounded-xl shadow-sm" onClick={handleCreateOrder} disabled={createOrder.isPending || !customerName.trim()}>
                    {createOrder.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</> : <><Plus className="h-4 w-4" /> Create Order</>}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Status Tabs */}
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
              <span className={`text-xs font-bold ${activeTab === tab.label ? "text-white/80" : "text-muted-foreground/50"}`}>
                {counts[tab.label] || 0}
              </span>
            </button>
          ))}
        </div>

        {/* Search & Filters */}
        <Card className="p-3 border-border/40 flex items-center gap-3 flex-wrap shadow-sm">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search order, phone, name..."
              className="pl-10 border-0 bg-transparent shadow-none focus-visible:ring-0 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-border/60"><RefreshCw className="h-4 w-4" /></Button>
            <Button variant="outline" size="sm" className="gap-1.5 h-9 rounded-xl border-border/60"><Download className="h-4 w-4" /> Export</Button>
            <Button variant="outline" size="sm" className="gap-1.5 h-9 rounded-xl border-border/60"><Printer className="h-4 w-4" /> Print</Button>
          </div>
        </Card>

        {/* Advanced Filter Panel */}
        <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 rounded-xl border-border/60 shadow-sm hover:shadow w-full justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-primary" />
                <span className="font-semibold">ফিল্টারিং</span>
                {activeFilterCount > 0 && (
                  <Badge className="h-5 min-w-[20px] px-1.5 text-[10px] font-bold">{activeFilterCount}</Badge>
                )}
              </div>
              <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", filtersOpen && "rotate-180")} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <Card className="p-4 border-border/40 shadow-sm space-y-4">
              {/* Row 1: Order Created At, Courier Submitted At, Status Added At, Note Added At */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Order Created At</Label>
                  <Select value={orderDateFilter} onValueChange={(v) => setOrderDateFilter(v as OrderDateFilter)}>
                    <SelectTrigger className="rounded-xl h-9 text-sm">
                      <SelectValue placeholder="All Time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="yesterday">Yesterday</SelectItem>
                      <SelectItem value="7days">Last 7 Days</SelectItem>
                      <SelectItem value="30days">Last 30 Days</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                  {orderDateFilter === "custom" && (
                    <div className="flex gap-1.5 mt-1">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className={cn("flex-1 justify-start text-[10px] rounded-lg h-7 px-2", !customDateFrom && "text-muted-foreground")}>
                            {customDateFrom ? format(customDateFrom, "dd/MM/yy") : "From"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarWidget mode="single" selected={customDateFrom} onSelect={setCustomDateFrom} initialFocus className={cn("p-3 pointer-events-auto")} />
                        </PopoverContent>
                      </Popover>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className={cn("flex-1 justify-start text-[10px] rounded-lg h-7 px-2", !customDateTo && "text-muted-foreground")}>
                            {customDateTo ? format(customDateTo, "dd/MM/yy") : "To"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarWidget mode="single" selected={customDateTo} onSelect={setCustomDateTo} initialFocus className={cn("p-3 pointer-events-auto")} />
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Courier Submitted At</Label>
                  <Select defaultValue="all">
                    <SelectTrigger className="rounded-xl h-9 text-sm"><SelectValue placeholder="All Time" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="7days">Last 7 Days</SelectItem>
                      <SelectItem value="30days">Last 30 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Status Added At</Label>
                  <Select defaultValue="all">
                    <SelectTrigger className="rounded-xl h-9 text-sm"><SelectValue placeholder="All Time" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="7days">Last 7 Days</SelectItem>
                      <SelectItem value="30days">Last 30 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Note Added At</Label>
                  <Select defaultValue="all">
                    <SelectTrigger className="rounded-xl h-9 text-sm"><SelectValue placeholder="All Time" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="7days">Last 7 Days</SelectItem>
                      <SelectItem value="30days">Last 30 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 2: Status, Order Source, Order Tag, Device */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Status</Label>
                  <Input placeholder="Search status..." className="rounded-xl h-9 text-sm" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Order Source</Label>
                  <Input placeholder="Search source..." className="rounded-xl h-9 text-sm" value={filterSource} onChange={(e) => setFilterSource(e.target.value)} list="source-suggestions" />
                  <datalist id="source-suggestions">
                    {uniqueSources.map((s) => <option key={s} value={s} />)}
                  </datalist>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Order Tag</Label>
                  <Input placeholder="Search tag..." className="rounded-xl h-9 text-sm" value={filterOrderTag} onChange={(e) => setFilterOrderTag(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">📱 Device</Label>
                  <Select value={filterDeviceType} onValueChange={setFilterDeviceType}>
                    <SelectTrigger className="rounded-xl h-9 text-sm"><SelectValue placeholder="All" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="mobile">📱 Mobile</SelectItem>
                      <SelectItem value="desktop">💻 Desktop</SelectItem>
                      <SelectItem value="tablet">📟 Tablet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 3: Courier, Courier Status, Phone, Address */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Courier</Label>
                  <Select value={filterCourierProvider} onValueChange={setFilterCourierProvider}>
                    <SelectTrigger className="rounded-xl h-9 text-sm"><SelectValue placeholder="All" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="no_courier">📦 Not in Courier</SelectItem>
                      {courierProviders.map((cp: any) => (
                        <SelectItem key={cp.id} value={cp.id}>{cp.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Courier Status</Label>
                  <Select value={filterCourierStatus} onValueChange={setFilterCourierStatus}>
                    <SelectTrigger className="rounded-xl h-9 text-sm"><SelectValue placeholder="All" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="picked_up">Picked Up</SelectItem>
                      <SelectItem value="in_transit">In Transit</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="returned">Returned</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">📞 Phone</Label>
                  <Input placeholder="Search phone..." className="rounded-xl h-9 text-sm" value={filterPhone} onChange={(e) => setFilterPhone(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">📍 Address</Label>
                  <Input placeholder="Search address..." className="rounded-xl h-9 text-sm" value={filterAddress} onChange={(e) => setFilterAddress(e.target.value)} />
                </div>
              </div>

              {/* Row 4: Courier Charged, Select Product, Product Category, District */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Courier Charged</Label>
                  <Select value={filterCourierCharged} onValueChange={setFilterCourierCharged}>
                    <SelectTrigger className="rounded-xl h-9 text-sm"><SelectValue placeholder="All" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="charged">Charged</SelectItem>
                      <SelectItem value="free">Free</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Select Product</Label>
                  <Input placeholder="Search product..." className="rounded-xl h-9 text-sm" value={filterProductSearch} onChange={(e) => setFilterProductSearch(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Product Category</Label>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="rounded-xl h-9 text-sm"><SelectValue placeholder="All" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((cat: any) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">District</Label>
                  <Input placeholder="Search district..." className="rounded-xl h-9 text-sm" value={filterDistrict} onChange={(e) => setFilterDistrict(e.target.value)} list="district-suggestions" />
                  <datalist id="district-suggestions">
                    {bdDistricts.map((d) => <option key={d} value={d} />)}
                  </datalist>
                </div>
              </div>

              {/* Row 5: Payment Status, Website/URL, Sales Type, Notes */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Payment Status</Label>
                  <Select value={filterPaymentStatus} onValueChange={setFilterPaymentStatus}>
                    <SelectTrigger className="rounded-xl h-9 text-sm"><SelectValue placeholder="All" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="cod">💵 Cash on Delivery</SelectItem>
                      <SelectItem value="paid">✅ Paid / Prepaid</SelectItem>
                      <SelectItem value="free_delivery">🎁 Free Delivery</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Website / URL</Label>
                  <Input placeholder="Search URL..." className="rounded-xl h-9 text-sm" value={filterUrl} onChange={(e) => setFilterUrl(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Sales Type</Label>
                  <Select value={filterSalesType} onValueChange={setFilterSalesType}>
                    <SelectTrigger className="rounded-xl h-9 text-sm"><SelectValue placeholder="All" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="api">🌐 API / Website</SelectItem>
                      <SelectItem value="manual">📝 Manual / Panel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">🔍 Notes</Label>
                  <Input placeholder="Search notes..." className="rounded-xl h-9 text-sm" value={filterNotes} onChange={(e) => setFilterNotes(e.target.value)} />
                </div>
              </div>

              {/* Row 6: Amount Range */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Product Amount Min</Label>
                  <Input type="number" placeholder="0" className="rounded-xl h-9 text-sm" value={filterAmountMin} onChange={(e) => setFilterAmountMin(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Product Amount Max</Label>
                  <Input type="number" placeholder="∞" className="rounded-xl h-9 text-sm" value={filterAmountMax} onChange={(e) => setFilterAmountMax(e.target.value)} />
                </div>
              </div>

              {/* Bottom Action Bar */}
              <div className="flex items-center gap-2 flex-wrap pt-3 border-t border-border/30">
                {activeFilterCount > 0 && (
                  <Button size="sm" variant="destructive" className="gap-1.5 text-xs rounded-full h-8 px-3" onClick={clearAllFilters}>
                    <X className="h-3 w-3" /> Clear Filter
                  </Button>
                )}
                <Button size="sm" variant="outline" className="gap-1.5 text-xs rounded-full h-8 px-3 bg-emerald-500/10 text-emerald-700 border-emerald-200 hover:bg-emerald-500/20">
                  <Package className="h-3 w-3" /> Order Items
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5 text-xs rounded-full h-8 px-3 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                  <Globe className="h-3 w-3" /> Order Sources
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5 text-xs rounded-full h-8 px-3 bg-amber-500/10 text-amber-700 border-amber-200 hover:bg-amber-500/20" onClick={() => setCurrentView("incomplete")}>
                  <AlertCircle className="h-3 w-3" /> Duplicate Orders
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5 text-xs rounded-full h-8 px-3 bg-violet-500/10 text-violet-700 border-violet-200 hover:bg-violet-500/20">
                  <Truck className="h-3 w-3" /> Courier Statuses
                </Button>
                <Badge variant="secondary" className="text-xs ml-auto">
                  {filteredOrders.length} অর্ডার পাওয়া গেছে
                </Badge>
              </div>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {isLoading ? (
          <Card className="p-16 text-center border-border/40">
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Loading orders...</p>
          </Card>
        ) : filteredOrders.length === 0 ? (
          <Card className="p-16 text-center border-border/40">
            <div className="inline-flex p-5 rounded-2xl bg-secondary/60 mb-4">
              <ShoppingCart className="h-12 w-12 text-muted-foreground/20" />
            </div>
            <p className="text-lg font-semibold text-muted-foreground">No orders found</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Try adjusting your filters or create a new order</p>
          </Card>
        ) : (
          <Card className="border-border/40 overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/30">
                  <TableHead className="font-bold text-xs">Order #</TableHead>
                  <TableHead className="font-bold text-xs">Customer</TableHead>
                  <TableHead className="font-bold text-xs">Phone</TableHead>
                  <TableHead className="font-bold text-xs">Amount</TableHead>
                  <TableHead className="font-bold text-xs">Source</TableHead>
                  <TableHead className="font-bold text-xs">Status</TableHead>
                  <TableHead className="font-bold text-xs">Date</TableHead>
                  <TableHead className="font-bold text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-secondary/20 cursor-pointer" onClick={() => setDetailOrderId(order.id)}>
                    <TableCell className="font-mono text-sm font-semibold">{order.order_number}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{order.customer_name}</p>
                        {order.customer_address && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{order.customer_address}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{order.customer_phone || "—"}</TableCell>
                    <TableCell className="font-semibold text-sm">৳{Number(order.total_amount).toLocaleString()}</TableCell>
                    <TableCell>
                      {order.source ? (
                        <Badge variant="outline" className="text-xs gap-1">
                          <Globe className="h-3 w-3" />
                          {order.source}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">প্যানেল</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={order.status}
                        onValueChange={(value) => { updateStatus.mutate({ id: order.id, status: value as OrderStatus }); }}
                      >
                        <SelectTrigger className="w-[130px] h-8 rounded-lg text-xs border-0 bg-secondary/40" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${getStatusColor(order.status)}`} />
                            <SelectValue />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {Constants.public.Enums.order_status.map((s) => (
                            <SelectItem key={s} value={s}>
                              <div className="flex items-center gap-2">
                                <span className={`h-2 w-2 rounded-full ${getStatusColor(s as OrderStatus)}`} />
                                {getStatusLabel(s as OrderStatus)}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{format(new Date(order.created_at), "dd MMM yyyy")}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); deleteOrder.mutate(order.id); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
        {/* Order Detail Dialog */}
        <OrderDetailDialog
          orderId={detailOrderId}
          order={filteredOrders.find((o) => o.id === detailOrderId) || null}
          onClose={() => setDetailOrderId(null)}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;

function OrderDetailDialog({ orderId, order, onClose }: { orderId: string | null; order: any; onClose: () => void }) {
  const { data: items = [], isLoading } = useOrderItems(orderId);
  const itemsTotal = items.reduce((s: number, i: any) => s + Number(i.total_price), 0);

  return (
    <Dialog open={!!orderId} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 rounded-xl bg-primary/10"><ShoppingCart className="h-5 w-5 text-primary" /></div>
            Order Details
            {order && <Badge variant="secondary" className="ml-2 text-xs">{order.order_number}</Badge>}
          </DialogTitle>
        </DialogHeader>

        {order && (
          <div className="space-y-5">
            {/* Customer Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Customer</p>
                <p className="font-medium text-foreground text-sm">{order.customer_name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="font-medium text-foreground text-sm">{order.customer_phone || "—"}</p>
              </div>
              {order.customer_address && (
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Address</p>
                  <p className="text-sm text-foreground">{order.customer_address}</p>
                </div>
              )}
              {order.source && (
                <div>
                  <p className="text-xs text-muted-foreground">Source</p>
                  <Badge variant="outline" className="text-xs gap-1 mt-0.5">
                    <Globe className="h-3 w-3" />
                    {order.source}
                  </Badge>
                </div>
              )}
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-secondary/30 border border-border/40">
                <p className="text-[10px] text-muted-foreground">Product Cost</p>
                <p className="font-bold text-foreground text-sm">৳{Number(order.product_cost).toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-xl bg-secondary/30 border border-border/40">
                <p className="text-[10px] text-muted-foreground">Delivery</p>
                <p className="font-bold text-foreground text-sm">৳{Number(order.delivery_charge).toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-xl bg-secondary/30 border border-border/40">
                <p className="text-[10px] text-muted-foreground">Discount</p>
                <p className="font-bold text-foreground text-sm">৳{Number(order.discount).toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
                <p className="text-[10px] text-primary font-semibold">Total</p>
                <p className="font-bold text-primary text-sm">৳{Number(order.total_amount).toLocaleString()}</p>
              </div>
            </div>

            {/* Order Items */}
            <div>
              <h4 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                <Package className="h-3.5 w-3.5 text-primary" /> Order Items
              </h4>

              {isLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading items...
                </div>
              ) : items.length === 0 ? (
                <div className="text-center py-6 bg-secondary/20 rounded-xl border border-border/30">
                  <Package className="h-6 w-6 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">কোনো আইটেম ম্যাপ করা হয়নি</p>
                  <a href="/admin/orders/backfill-items" className="text-xs text-primary hover:underline mt-1 inline-block">
                    Backfill Items →
                  </a>
                </div>
              ) : (
                <div className="space-y-2">
                  {items.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/40">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{item.product_name}</p>
                        <p className="text-xs text-muted-foreground">{item.product_code}</p>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">×{item.quantity}</span>
                        <span className="text-muted-foreground">৳{Number(item.unit_price).toLocaleString()}</span>
                        <span className="font-semibold text-foreground w-20 text-right">৳{Number(item.total_price).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-2 border-t border-border/40">
                    <span className="text-xs text-muted-foreground">{items.length}টি আইটেম</span>
                    <span className="text-sm font-bold text-primary">৳{itemsTotal.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            {order.notes && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Notes</p>
                <p className="text-sm text-foreground bg-secondary/20 rounded-xl p-3 border border-border/30">{order.notes}</p>
              </div>
            )}

            {/* Meta */}
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/30">
              <span>Created: {format(new Date(order.created_at), "dd MMM yyyy, hh:mm a")}</span>
              <span className={`px-2 py-0.5 rounded-full font-medium ${getStatusColor(order.status)} text-white`}>
                {getStatusLabel(order.status)}
              </span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
