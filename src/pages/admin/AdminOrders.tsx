import { useState, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
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
  MessageSquare, Filter, Loader2, Package, Globe, SlidersHorizontal, AlertTriangle, History,
  Hand, RotateCcw, CalendarClock, Phone, Pencil, Activity
} from "lucide-react";
import {
  useOrders, useOrderCounts, useCreateOrder, useUpdateOrderStatus,
  useDeleteOrder, useNextOrderNumber, useOrderItems, getStatusFromTab, getStatusLabel,
  getStatusColor, type Order, type OrderStatus, type OrderItemInput, type OrderDateFilter
} from "@/hooks/useOrders";
import {
  useIncompleteOrders, useIncompleteOrderCounts,
  useUpdateIncompleteOrderStatus, useDeleteIncompleteOrder,
  useConvertIncompleteToOrder, type IncompleteDateFilter,
} from "@/hooks/useIncompleteOrders";
import { usePublicProducts } from "@/hooks/usePublicProducts";
import { CourierSettingsView } from "@/components/admin/courier/CourierSettingsView";
import { FakeOrderDetection } from "@/components/admin/fraud/FakeOrderDetection";
import { useCourierCities, useCourierZones, useCourierAreas } from "@/hooks/useCourierLocations";
import { ApiKeysView } from "@/components/admin/api/ApiKeysView";
import { Constants } from "@/integrations/supabase/types";
import * as XLSX from "xlsx";
import { toast } from "sonner";

const statusTabs = [
  { label: "All Orders", color: "bg-primary", icon: ShoppingCart },
  { label: "New Orders", color: "bg-blue-500", icon: CheckCircle2 },
  { label: "Confirmed", color: "bg-emerald-600", icon: CheckCircle2 },
  { label: "In Courier", color: "bg-violet-500", icon: Truck },
  { label: "Delivered", color: "bg-emerald-500", icon: CheckCircle2 },
  { label: "Hold", color: "bg-yellow-500", icon: PauseCircle },
  { label: "Ship Later", color: "bg-teal-500", icon: Clock },
  { label: "Pending Return", color: "bg-orange-500", icon: RotateCcw },
  { label: "Return", color: "bg-red-400", icon: ArrowLeft },
  { label: "Cancelled", color: "bg-red-500", icon: XCircle },
  { label: "Hand Delivery", color: "bg-cyan-500", icon: Hand },
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
const CANCEL_REASONS = [
  "কাস্টমারের কাছে টাকা নাই",
  "কাস্টমারের পছন্দ হচ্ছে না",
  "কাস্টমার নিতে চাচ্ছে না",
  "ডেলিভারি এরিয়ার বাইরে",
  "ভুল অর্ডার / ডুপ্লিকেট",
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
  
  const [searchQuery, setSearchQuery] = useState("");
  const [orderDateFilter, setOrderDateFilter] = useState<OrderDateFilter>("all");
  const [customDateFrom, setCustomDateFrom] = useState<Date | undefined>();
  const [customDateTo, setCustomDateTo] = useState<Date | undefined>();
  const [newOrderOpen, setNewOrderOpen] = useState(false);
  const [detailOrderId, setDetailOrderId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [productSearchFocused, setProductSearchFocused] = useState(false);
  
  // Cancel reason dialog
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelCustomReason, setCancelCustomReason] = useState("");
  
  // Hold date dialog
  const [holdDialogOpen, setHoldDialogOpen] = useState(false);
  const [holdOrderId, setHoldOrderId] = useState<string | null>(null);
  const [holdUntilDate, setHoldUntilDate] = useState<Date | undefined>();

  // Hand delivery confirmation dialog
  const [handDeliveryDialogOpen, setHandDeliveryDialogOpen] = useState(false);
  const [handDeliveryOrderId, setHandDeliveryOrderId] = useState<string | null>(null);

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
  const [courierNote, setCourierNote] = useState("");
  
  // Courier selection for order
  const [selectedCourierId, setSelectedCourierId] = useState<string | null>(null);
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const { user } = useAuth();
  const statusFilter = getStatusFromTab(activeTab);
  const queryClient = useQueryClient();
  const { data: orders = [], isLoading } = useOrders(statusFilter, orderDateFilter, customDateFrom, customDateTo);
  const { data: counts = {} } = useOrderCounts(orderDateFilter, customDateFrom, customDateTo);
  const createOrder = useCreateOrder();
  const updateStatus = useUpdateOrderStatus();
  const deleteOrder = useDeleteOrder();
  const { data: nextOrderNumber = "ORD-00001" } = useNextOrderNumber();
  const { data: allProducts = [] } = usePublicProducts();

  // Courier location hooks for new order form
  const { data: courierCities = [], isLoading: citiesLoading } = useCourierCities(selectedCourierId);
  const { data: courierZones = [], isLoading: zonesLoading } = useCourierZones(selectedCourierId, selectedCityId);
  const { data: courierAreas = [], isLoading: areasLoading } = useCourierAreas(selectedCourierId, selectedZoneId);

  // Refresh all order data
  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["orders"] });
    queryClient.invalidateQueries({ queryKey: ["order-counts"] });
    queryClient.invalidateQueries({ queryKey: ["order-items"] });
    queryClient.invalidateQueries({ queryKey: ["courier-orders-filter"] });
    queryClient.invalidateQueries({ queryKey: ["all-order-items-filter"] });
    queryClient.invalidateQueries({ queryKey: ["next-order-number"] });
    toast.success("ডেটা রিফ্রেশ হচ্ছে...");
  }, [queryClient]);

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

  // Filter products for search — show top selling (by order count) when empty
  const filteredProducts = useMemo(() => {
    // Build a sales count map from allOrderItems
    const salesMap: Record<string, number> = {};
    allOrderItems.forEach((oi: any) => {
      const key = oi.product_id || oi.product_name;
      salesMap[key] = (salesMap[key] || 0) + 1;
    });
    const sorted = [...allProducts].sort((a: any, b: any) => (salesMap[b.id] || 0) - (salesMap[a.id] || 0));
    if (!productSearch.trim()) return sorted.slice(0, 15);
    const q = productSearch.toLowerCase();
    return sorted.filter((p: any) =>
      p.name.toLowerCase().includes(q) || p.product_code.toLowerCase().includes(q)
    ).slice(0, 15);
  }, [allProducts, productSearch, allOrderItems]);

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

  // Export filtered orders to Excel
  const handleExport = useCallback(() => {
    if (filteredOrders.length === 0) {
      toast.error("এক্সপোর্ট করার জন্য কোনো অর্ডার নেই!");
      return;
    }
    const exportData = filteredOrders.map((o) => ({
      "Order #": o.order_number,
      "Customer": o.customer_name,
      "Phone": o.customer_phone || "",
      "Address": o.customer_address || "",
      "Product Cost": Number(o.product_cost),
      "Delivery": Number(o.delivery_charge),
      "Discount": Number(o.discount),
      "Total": Number(o.total_amount),
      "Status": getStatusLabel(o.status),
      "Source": o.source || "প্যানেল",
      "Notes": o.notes || "",
      "Date": format(new Date(o.created_at), "dd MMM yyyy, hh:mm a"),
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orders");
    XLSX.writeFile(wb, `orders-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    toast.success(`${filteredOrders.length}টি অর্ডার এক্সপোর্ট হয়েছে!`);
  }, [filteredOrders]);

  // Print filtered orders
  const handlePrint = useCallback(() => {
    if (filteredOrders.length === 0) {
      toast.error("প্রিন্ট করার জন্য কোনো অর্ডার নেই!");
      return;
    }
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const rows = filteredOrders.map((o) => `
      <tr>
        <td style="padding:6px 10px;border:1px solid #ddd;font-family:monospace;font-weight:600">${o.order_number}</td>
        <td style="padding:6px 10px;border:1px solid #ddd">${o.customer_name}</td>
        <td style="padding:6px 10px;border:1px solid #ddd">${o.customer_phone || "—"}</td>
        <td style="padding:6px 10px;border:1px solid #ddd">${o.customer_address || "—"}</td>
        <td style="padding:6px 10px;border:1px solid #ddd;text-align:right">৳${Number(o.total_amount).toLocaleString()}</td>
        <td style="padding:6px 10px;border:1px solid #ddd">${getStatusLabel(o.status)}</td>
        <td style="padding:6px 10px;border:1px solid #ddd">${format(new Date(o.created_at), "dd MMM yyyy")}</td>
      </tr>
    `).join("");
    printWindow.document.write(`
      <html><head><title>Orders Print</title></head>
      <body style="font-family:Arial,sans-serif;padding:20px">
        <h2 style="margin-bottom:10px">Orders Report — ${format(new Date(), "dd MMM yyyy")}</h2>
        <p style="color:#666;margin-bottom:15px">${filteredOrders.length}টি অর্ডার</p>
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead><tr style="background:#f5f5f5">
            <th style="padding:8px 10px;border:1px solid #ddd;text-align:left">Order #</th>
            <th style="padding:8px 10px;border:1px solid #ddd;text-align:left">Customer</th>
            <th style="padding:8px 10px;border:1px solid #ddd;text-align:left">Phone</th>
            <th style="padding:8px 10px;border:1px solid #ddd;text-align:left">Address</th>
            <th style="padding:8px 10px;border:1px solid #ddd;text-align:right">Total</th>
            <th style="padding:8px 10px;border:1px solid #ddd;text-align:left">Status</th>
            <th style="padding:8px 10px;border:1px solid #ddd;text-align:left">Date</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
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

  const logActivity = async (orderId: string, action: string, fieldName?: string, oldValue?: string, newValue?: string, details?: string) => {
    try {
      await supabase.from("order_activity_logs" as any).insert({
        order_id: orderId,
        user_id: user?.id || null,
        user_name: user?.email || "System",
        action,
        field_name: fieldName || null,
        old_value: oldValue || null,
        new_value: newValue || null,
        details: details || null,
      } as any);
    } catch (e) { console.error("Activity log error:", e); }
  };

  // Handle status change with cancel/hold interception
  const handleStatusChange = (orderId: string, newStatus: string, oldStatus: string) => {
    if (newStatus === "cancelled") {
      setCancelOrderId(orderId);
      setCancelReason("");
      setCancelCustomReason("");
      setCancelDialogOpen(true);
      return;
    }
    if (newStatus === "on_hold") {
      setHoldOrderId(orderId);
      setHoldUntilDate(undefined);
      setHoldDialogOpen(true);
      return;
    }
    // Hand delivery → delivered confirmation
    if (oldStatus === "hand_delivery" && newStatus === "delivered") {
      setHandDeliveryOrderId(orderId);
      setHandDeliveryDialogOpen(true);
      return;
    }
    updateStatus.mutate({ id: orderId, status: newStatus as OrderStatus });
    logActivity(orderId, "status_changed", "status", getStatusLabel(oldStatus as OrderStatus), getStatusLabel(newStatus as OrderStatus));
  };

  const confirmHandDelivery = () => {
    if (!handDeliveryOrderId) return;
    updateStatus.mutate({ id: handDeliveryOrderId, status: "delivered" as OrderStatus });
    logActivity(handDeliveryOrderId, "status_changed", "status", "Hand Delivery", "Delivered", "হ্যান্ড ডেলিভারি সম্পন্ন");
    setHandDeliveryDialogOpen(false);
    setHandDeliveryOrderId(null);
  };

  const confirmCancel = async () => {
    if (!cancelOrderId) return;
    const reason = cancelReason === "others" ? cancelCustomReason : cancelReason;
    await supabase.from("orders").update({ cancel_reason: reason } as any).eq("id", cancelOrderId);
    updateStatus.mutate({ id: cancelOrderId, status: "cancelled" as OrderStatus });
    const order = orders.find(o => o.id === cancelOrderId);
    logActivity(cancelOrderId, "status_changed", "status", order ? getStatusLabel(order.status) : "", "Cancelled", `কারণ: ${reason}`);
    setCancelDialogOpen(false);
    setCancelOrderId(null);
  };

  const confirmHold = async () => {
    if (!holdOrderId) return;
    if (holdUntilDate) {
      await supabase.from("orders").update({ hold_until: holdUntilDate.toISOString() } as any).eq("id", holdOrderId);
    }
    updateStatus.mutate({ id: holdOrderId, status: "on_hold" as OrderStatus });
    const order = orders.find(o => o.id === holdOrderId);
    logActivity(holdOrderId, "status_changed", "status", order ? getStatusLabel(order.status) : "", "Hold", holdUntilDate ? `Hold until: ${format(holdUntilDate, "dd MMM yyyy")}` : "");
    setHoldDialogOpen(false);
    setHoldOrderId(null);
  };

  // Move confirmed orders with courier to in_courier
  const handleBulkInCourier = () => {
    const confirmedWithCourier = filteredOrders.filter(o => o.status === "confirmed" && courierByOrderId[o.id]);
    if (confirmedWithCourier.length === 0) {
      toast.error("কুরিয়ার সিলেক্ট করা কোনো confirmed অর্ডার নেই!");
      return;
    }
    confirmedWithCourier.forEach(o => {
      updateStatus.mutate({ id: o.id, status: "in_courier" as OrderStatus });
      logActivity(o.id, "status_changed", "status", "Confirmed", "In Courier");
    });
    toast.success(`${confirmedWithCourier.length}টি অর্ডার In Courier-এ পাঠানো হয়েছে!`);
  };

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
        courier_note: courierNote || null,
        status: "processing",
      } as any,
      items: orderItems,
    }, {
      onSuccess: async (data: any) => {
        if (data?.id) {
          logActivity(data.id, "created", undefined, undefined, undefined, `Order ${nextOrderNumber} created by ${user?.email || "Admin"}`);
          // Create courier_orders entry if courier selected
          if (selectedCourierId) {
            await supabase.from("courier_orders").insert({
              order_id: data.id,
              courier_provider_id: selectedCourierId,
              courier_status: "pending",
            } as any);
          }
        }
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
    setCourierNote("");
    setOrderItems([]);
    setProductSearch("");
    setSelectedCourierId(null);
    setSelectedCityId(null);
    setSelectedZoneId(null);
    setSelectedAreaId(null);
  };

  // Old orders lookup by phone
  const { data: oldOrdersByPhone = [] } = useQuery({
    queryKey: ["old-orders-phone", customerPhone],
    queryFn: async () => {
      if (!customerPhone || customerPhone.length < 6) return [];
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("customer_phone", customerPhone)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as Order[];
    },
    enabled: !!customerPhone && customerPhone.length >= 6,
  });

  // Fraud check - courier delivery history by phone
  const { data: fraudCheckData } = useQuery({
    queryKey: ["fraud-check", customerPhone],
    queryFn: async () => {
      if (!customerPhone || customerPhone.length < 6) return null;
      // Get all orders for this phone
      const { data: phoneOrders, error } = await supabase
        .from("orders")
        .select("id, status, total_amount")
        .eq("customer_phone", customerPhone);
      if (error) throw error;
      if (!phoneOrders || phoneOrders.length === 0) return null;

      const orderIds = phoneOrders.map(o => o.id);
      // Get courier orders for these
      const { data: courierData } = await supabase
        .from("courier_orders")
        .select("order_id, courier_status, courier_provider_id")
        .in("order_id", orderIds);

      // Get provider names
      const { data: providers } = await supabase
        .from("courier_providers")
        .select("id, name");

      const providerMap: Record<string, string> = {};
      (providers || []).forEach((p: any) => { providerMap[p.id] = p.name; });

      // Aggregate by provider
      const stats: Record<string, { total: number; delivered: number; returned: number; cancelled: number }> = {};
      (courierData || []).forEach((co: any) => {
        const name = providerMap[co.courier_provider_id] || "Unknown";
        if (!stats[name]) stats[name] = { total: 0, delivered: 0, returned: 0, cancelled: 0 };
        stats[name].total++;
        if (co.courier_status === "delivered") stats[name].delivered++;
        if (co.courier_status === "returned" || co.courier_status === "return") stats[name].returned++;
        if (co.courier_status === "cancelled") stats[name].cancelled++;
      });

      const totalOrders = phoneOrders.length;
      const deliveredCount = phoneOrders.filter(o => o.status === "delivered").length;
      const cancelledCount = phoneOrders.filter(o => o.status === "cancelled").length;
      const returnedCount = phoneOrders.filter(o => o.status === "returned").length;
      const totalSpent = phoneOrders.filter(o => o.status === "delivered").reduce((s, o) => s + Number(o.total_amount), 0);

      return { totalOrders, deliveredCount, cancelledCount, returnedCount, totalSpent, courierStats: stats };
    },
    enabled: !!customerPhone && customerPhone.length >= 6,
  });

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
                        <div className="flex items-center gap-1.5">
                          <span><span className="font-medium">ফোন:</span> {io.customer_phone || "N/A"}</span>
                          {io.customer_phone && (
                            <a href={`tel:${io.customer_phone}`} onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-5 w-5 rounded text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 p-0">
                                <Phone className="h-3 w-3" />
                              </Button>
                            </a>
                          )}
                        </div>
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
        <FakeOrderDetection onBack={() => setCurrentView("orders")} />
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
              <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()} onCloseAutoFocus={(e) => e.preventDefault()}>
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
                      <Input placeholder="01XXXXXXXXX" className="rounded-xl" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
                    </div>
                  </div>

                  {/* Fraud Check & Old Orders by Phone */}
                  {customerPhone && customerPhone.length >= 6 && (
                    <div className="space-y-2">
                      {fraudCheckData && (
                        <div className="p-3 rounded-xl border border-border/60 bg-secondary/20">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                            <span className="text-xs font-bold text-foreground">Customer History</span>
                            <Badge variant={fraudCheckData.cancelledCount + fraudCheckData.returnedCount > 2 ? "destructive" : "secondary"} className="text-[10px] ml-auto">
                              {fraudCheckData.cancelledCount + fraudCheckData.returnedCount > 2 ? "⚠ High Risk" : "Normal"}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-5 gap-2 text-center">
                            <div className="p-1.5 rounded-lg bg-background border border-border/40">
                              <p className="text-lg font-bold text-foreground">{fraudCheckData.totalOrders}</p>
                              <p className="text-[10px] text-muted-foreground">Total</p>
                            </div>
                            <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                              <p className="text-lg font-bold text-emerald-600">{fraudCheckData.deliveredCount}</p>
                              <p className="text-[10px] text-muted-foreground">Delivered</p>
                            </div>
                            <div className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
                              <p className="text-lg font-bold text-red-500">{fraudCheckData.cancelledCount}</p>
                              <p className="text-[10px] text-muted-foreground">Cancelled</p>
                            </div>
                            <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                              <p className="text-lg font-bold text-amber-600">{fraudCheckData.returnedCount}</p>
                              <p className="text-[10px] text-muted-foreground">Returned</p>
                            </div>
                            <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
                              <p className="text-lg font-bold text-primary">৳{fraudCheckData.totalSpent.toLocaleString()}</p>
                              <p className="text-[10px] text-muted-foreground">Spent</p>
                            </div>
                          </div>
                          {Object.keys(fraudCheckData.courierStats).length > 0 && (
                            <div className="mt-2 space-y-1">
                              <p className="text-[10px] font-semibold text-muted-foreground">Courier History:</p>
                              <div className="flex flex-wrap gap-1.5">
                                {Object.entries(fraudCheckData.courierStats).map(([name, s]: [string, any]) => (
                                  <Badge key={name} variant="outline" className="text-[10px] gap-1">
                                    {name}: {s.total} ({s.delivered}✓ {s.returned > 0 ? `${s.returned}↩` : ""})
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {oldOrdersByPhone.length > 0 && (
                        <div className="p-3 rounded-xl border border-border/60 bg-secondary/20">
                          <p className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
                            <History className="h-3.5 w-3.5" /> পুরনো অর্ডার ({oldOrdersByPhone.length}টি)
                          </p>
                          <div className="max-h-32 overflow-y-auto space-y-1">
                            {oldOrdersByPhone.slice(0, 5).map((o) => (
                              <div key={o.id} className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-background/50">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-semibold text-foreground">{o.order_number}</span>
                                  <Badge className={cn("text-[9px] h-4", getStatusColor(o.status))}>{getStatusLabel(o.status)}</Badge>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <span>৳{Number(o.total_amount).toLocaleString()}</span>
                                  <span>{format(new Date(o.created_at), "dd MMM yy")}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Address</Label>
                    <Textarea placeholder="Enter address" rows={2} className="rounded-xl" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} />
                  </div>

                  {/* Courier Selection */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold flex items-center gap-1.5">
                      <Truck className="h-3.5 w-3.5 text-violet-500" /> কুরিয়ার সিলেক্ট করুন
                    </Label>
                    <Select value={selectedCourierId || ""} onValueChange={(v) => {
                      setSelectedCourierId(v || null);
                      setSelectedCityId(null);
                      setSelectedZoneId(null);
                      setSelectedAreaId(null);
                    }}>
                      <SelectTrigger className="rounded-xl h-9 text-sm">
                        <SelectValue placeholder="কুরিয়ার সিলেক্ট করুন" />
                      </SelectTrigger>
                      <SelectContent>
                        {courierProviders.filter((cp: any) => cp.is_active !== false).map((cp: any) => (
                          <SelectItem key={cp.id} value={cp.id}>
                            <div className="flex items-center gap-2">
                              <Truck className="h-3.5 w-3.5" /> {cp.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedCourierId && (
                      <Badge variant="outline" className="text-xs gap-1">
                        <Truck className="h-3 w-3" />
                        {courierProviders.find((cp: any) => cp.id === selectedCourierId)?.name || ""}
                      </Badge>
                    )}
                  </div>

                  {/* City/Zone/Area from Courier API */}
                  {selectedCourierId && (
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-semibold text-muted-foreground">City</Label>
                        <Select value={selectedCityId || ""} onValueChange={(v) => {
                          setSelectedCityId(v || null);
                          setSelectedZoneId(null);
                          setSelectedAreaId(null);
                        }}>
                          <SelectTrigger className="rounded-lg h-8 text-xs">
                            <SelectValue placeholder={citiesLoading ? "লোড হচ্ছে..." : "City সিলেক্ট করুন"} />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {courierCities.map((c: any) => (
                              <SelectItem key={String(c.id)} value={String(c.id)}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-semibold text-muted-foreground">Zone</Label>
                        <Select value={selectedZoneId || ""} onValueChange={(v) => {
                          setSelectedZoneId(v || null);
                          setSelectedAreaId(null);
                        }} disabled={!selectedCityId}>
                          <SelectTrigger className="rounded-lg h-8 text-xs">
                            <SelectValue placeholder={zonesLoading ? "লোড হচ্ছে..." : "Zone সিলেক্ট করুন"} />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {courierZones.map((z: any) => (
                              <SelectItem key={String(z.id)} value={String(z.id)}>{z.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-semibold text-muted-foreground">Area/Thana</Label>
                        <Select value={selectedAreaId || ""} onValueChange={setSelectedAreaId} disabled={!selectedZoneId}>
                          <SelectTrigger className="rounded-lg h-8 text-xs">
                            <SelectValue placeholder={areasLoading ? "লোড হচ্ছে..." : "Area সিলেক্ট করুন"} />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {courierAreas.map((a: any) => (
                              <SelectItem key={String(a.id)} value={String(a.id)}>{a.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

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
                        onFocus={() => setProductSearchFocused(true)}
                        onBlur={() => setTimeout(() => setProductSearchFocused(false), 200)}
                      />
                    </div>
                    {productSearchFocused && filteredProducts.length > 0 && (
                      <div className="border border-border rounded-xl max-h-48 overflow-y-auto bg-card shadow-md">
                        {!productSearch.trim() && (
                          <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground bg-secondary/30 border-b border-border/30">🔥 Top Selling Products</div>
                        )}
                        {filteredProducts.map((p: any) => (
                          <button
                            key={p.id}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => { addProductToOrder(p); setProductSearchFocused(true); }}
                            className="w-full text-left px-3 py-2 hover:bg-secondary/60 transition-colors flex items-center justify-between text-sm border-b border-border/30 last:border-0"
                          >
                            <div>
                              <span className="font-medium text-foreground">{p.name}</span>
                              <span className="text-xs text-muted-foreground ml-2">({p.product_code})</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-primary">৳{Number(p.selling_price).toLocaleString()}</span>
                              {Number(p.stock_quantity) > 0 && <span className="text-[10px] text-muted-foreground">({p.stock_quantity})</span>}
                            </div>
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
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold flex items-center gap-1"><MessageSquare className="h-3 w-3" /> Staff Note</Label>
                      <Textarea placeholder="Internal staff note..." rows={2} className="rounded-xl text-xs" value={notes} onChange={(e) => setNotes(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold flex items-center gap-1"><Truck className="h-3 w-3" /> Courier Note</Label>
                      <Textarea placeholder="Courier/packing note (memo তে প্রিন্ট হবে)..." rows={2} className="rounded-xl text-xs" value={courierNote} onChange={(e) => setCourierNote(e.target.value)} />
                    </div>
                  </div>
                  <Button className="w-full rounded-xl shadow-sm" onClick={handleCreateOrder} disabled={createOrder.isPending || !customerName.trim()}>
                    {createOrder.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</> : <><Plus className="h-4 w-4" /> Create Order</>}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Status Tabs - Two equal rows */}
        <div className="grid grid-cols-6 gap-2 pb-2">
          {statusTabs.map((tab) => (
            <button
              key={tab.label}
              onClick={() => setActiveTab(tab.label)}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                activeTab === tab.label
                  ? `${tab.color} text-white shadow-lg`
                  : "bg-card text-muted-foreground hover:bg-secondary border border-border/40"
              }`}
            >
              <tab.icon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{tab.label}</span>
              <span className={`text-[10px] font-bold shrink-0 ${activeTab === tab.label ? "text-white/80" : "text-muted-foreground/50"}`}>
                {counts[tab.label] || 0}
              </span>
            </button>
          ))}
        </div>

        {/* In Courier button for Confirmed tab */}
        {activeTab === "Confirmed" && (
          <div className="flex items-center gap-2">
            <Button size="sm" className="gap-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white shadow-sm" onClick={handleBulkInCourier}>
              <Truck className="h-4 w-4" /> In Courier-এ পাঠান
            </Button>
            <span className="text-xs text-muted-foreground">
              (কুরিয়ার সিলেক্ট করা {filteredOrders.filter(o => o.status === "confirmed" && courierByOrderId[o.id]).length}টি অর্ডার)
            </span>
          </div>
        )}

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
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-border/60" onClick={handleRefresh} title="রিফ্রেশ"><RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} /></Button>
            <Button variant="outline" size="sm" className="gap-1.5 h-9 rounded-xl border-border/60" onClick={handleExport}><Download className="h-4 w-4" /> Export</Button>
            <Button variant="outline" size="sm" className="gap-1.5 h-9 rounded-xl border-border/60" onClick={handlePrint}><Printer className="h-4 w-4" /> Print</Button>
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
          <CollapsibleContent className="mt-2">
            <Card className="p-3 border-border/40 shadow-sm space-y-2.5">
              {/* Row 1: Date filters compact */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold text-muted-foreground">Order Date</Label>
                  <Select value={orderDateFilter} onValueChange={(v) => setOrderDateFilter(v as OrderDateFilter)}>
                    <SelectTrigger className="rounded-lg h-7 text-xs"><SelectValue placeholder="All Time" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="yesterday">Yesterday</SelectItem>
                      <SelectItem value="7days">Last 7 Days</SelectItem>
                      <SelectItem value="30days">Last 30 Days</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                  {orderDateFilter === "custom" && (
                    <div className="flex gap-1 mt-0.5">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className={cn("flex-1 justify-start text-[9px] rounded-md h-6 px-1.5", !customDateFrom && "text-muted-foreground")}>
                            {customDateFrom ? format(customDateFrom, "dd/MM/yy") : "From"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarWidget mode="single" selected={customDateFrom} onSelect={setCustomDateFrom} initialFocus className={cn("p-3 pointer-events-auto")} />
                        </PopoverContent>
                      </Popover>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className={cn("flex-1 justify-start text-[9px] rounded-md h-6 px-1.5", !customDateTo && "text-muted-foreground")}>
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
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold text-muted-foreground">Courier Date</Label>
                  <Select defaultValue="all">
                    <SelectTrigger className="rounded-lg h-7 text-xs"><SelectValue placeholder="All" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="7days">7 Days</SelectItem>
                      <SelectItem value="30days">30 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold text-muted-foreground">Order Tag</Label>
                  <Input placeholder="Tag..." className="rounded-lg h-7 text-xs" value={filterOrderTag} onChange={(e) => setFilterOrderTag(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold text-muted-foreground">URL / Website</Label>
                  <Input placeholder="URL..." className="rounded-lg h-7 text-xs" value={filterUrl} onChange={(e) => setFilterUrl(e.target.value)} />
                </div>
              </div>

              {/* Row 2: Compact grid */}
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold text-muted-foreground">Status</Label>
                  <Input placeholder="Status..." className="rounded-lg h-7 text-xs" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold text-muted-foreground">Source</Label>
                  <Input placeholder="Source..." className="rounded-lg h-7 text-xs" value={filterSource} onChange={(e) => setFilterSource(e.target.value)} list="source-suggestions" />
                  <datalist id="source-suggestions">{uniqueSources.map((s) => <option key={s} value={s} />)}</datalist>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold text-muted-foreground">Phone</Label>
                  <Input placeholder="Phone..." className="rounded-lg h-7 text-xs" value={filterPhone} onChange={(e) => setFilterPhone(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold text-muted-foreground">Address</Label>
                  <Input placeholder="Address..." className="rounded-lg h-7 text-xs" value={filterAddress} onChange={(e) => setFilterAddress(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold text-muted-foreground">Product</Label>
                  <Input placeholder="Product..." className="rounded-lg h-7 text-xs" value={filterProductSearch} onChange={(e) => setFilterProductSearch(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold text-muted-foreground">Notes</Label>
                  <Input placeholder="Notes..." className="rounded-lg h-7 text-xs" value={filterNotes} onChange={(e) => setFilterNotes(e.target.value)} />
                </div>
              </div>

              {/* Row 3: Select dropdowns compact */}
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold text-muted-foreground">Courier</Label>
                  <Select value={filterCourierProvider} onValueChange={setFilterCourierProvider}>
                    <SelectTrigger className="rounded-lg h-7 text-xs"><SelectValue placeholder="All" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="no_courier">No Courier</SelectItem>
                      {courierProviders.map((cp: any) => <SelectItem key={cp.id} value={cp.id}>{cp.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold text-muted-foreground">Courier Status</Label>
                  <Select value={filterCourierStatus} onValueChange={setFilterCourierStatus}>
                    <SelectTrigger className="rounded-lg h-7 text-xs"><SelectValue placeholder="All" /></SelectTrigger>
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
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold text-muted-foreground">Category</Label>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="rounded-lg h-7 text-xs"><SelectValue placeholder="All" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {categories.map((cat: any) => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold text-muted-foreground">Payment</Label>
                  <Select value={filterPaymentStatus} onValueChange={setFilterPaymentStatus}>
                    <SelectTrigger className="rounded-lg h-7 text-xs"><SelectValue placeholder="All" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="cod">COD</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="free_delivery">Free</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold text-muted-foreground">Device</Label>
                  <Select value={filterDeviceType} onValueChange={setFilterDeviceType}>
                    <SelectTrigger className="rounded-lg h-7 text-xs"><SelectValue placeholder="All" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="mobile">Mobile</SelectItem>
                      <SelectItem value="desktop">Desktop</SelectItem>
                      <SelectItem value="tablet">Tablet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold text-muted-foreground">Sales Type</Label>
                  <Select value={filterSalesType} onValueChange={setFilterSalesType}>
                    <SelectTrigger className="rounded-lg h-7 text-xs"><SelectValue placeholder="All" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="api">API / Website</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 4: District, Thana, Zone, Courier Charged, Amount range */}
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold text-muted-foreground">District</Label>
                  <Select value={filterDistrict} onValueChange={setFilterDistrict}>
                    <SelectTrigger className="rounded-lg h-7 text-xs"><SelectValue placeholder="All" /></SelectTrigger>
                    <SelectContent className="max-h-60">
                      <SelectItem value="all">All Districts</SelectItem>
                      {bdDistrictList.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold text-muted-foreground">Thana</Label>
                  <Select value={filterThana} onValueChange={setFilterThana}>
                    <SelectTrigger className="rounded-lg h-7 text-xs"><SelectValue placeholder="All" /></SelectTrigger>
                    <SelectContent className="max-h-60">
                      <SelectItem value="all">All Thanas</SelectItem>
                      {bdThanaList.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold text-muted-foreground">Zone</Label>
                  <Select value={filterZone} onValueChange={setFilterZone}>
                    <SelectTrigger className="rounded-lg h-7 text-xs"><SelectValue placeholder="All" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Zones</SelectItem>
                      {bdZoneList.map((z) => <SelectItem key={z} value={z}>{z}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold text-muted-foreground">Delivery Charge</Label>
                  <Select value={filterCourierCharged} onValueChange={setFilterCourierCharged}>
                    <SelectTrigger className="rounded-lg h-7 text-xs"><SelectValue placeholder="All" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="charged">Charged</SelectItem>
                      <SelectItem value="free">Free</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold text-muted-foreground">Amount Min</Label>
                  <Input type="number" placeholder="0" className="rounded-lg h-7 text-xs" value={filterAmountMin} onChange={(e) => setFilterAmountMin(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold text-muted-foreground">Amount Max</Label>
                  <Input type="number" placeholder="∞" className="rounded-lg h-7 text-xs" value={filterAmountMax} onChange={(e) => setFilterAmountMax(e.target.value)} />
                </div>
              </div>

              {/* Bottom Action Bar */}
              <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-border/30">
                {activeFilterCount > 0 && (
                  <Button size="sm" variant="destructive" className="gap-1 text-[10px] rounded-full h-6 px-2.5" onClick={clearAllFilters}>
                    <X className="h-2.5 w-2.5" /> Clear
                  </Button>
                )}
                <Button size="sm" variant="outline" className="gap-1 text-[10px] rounded-full h-6 px-2.5 bg-emerald-500/10 text-emerald-700 border-emerald-200 hover:bg-emerald-500/20" onClick={() => setOrderItemsModalOpen(true)}>
                  <Package className="h-2.5 w-2.5" /> Order Items
                </Button>
                <Button size="sm" variant="outline" className="gap-1 text-[10px] rounded-full h-6 px-2.5 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20" onClick={() => setOrderSourcesModalOpen(true)}>
                  <Globe className="h-2.5 w-2.5" /> Order Sources
                </Button>
                <Button size="sm" variant="outline" className="gap-1 text-[10px] rounded-full h-6 px-2.5 bg-amber-500/10 text-amber-700 border-amber-200 hover:bg-amber-500/20" onClick={() => setDuplicateOrdersModalOpen(true)}>
                  <Copy className="h-2.5 w-2.5" /> Duplicate Orders
                </Button>
                <Button size="sm" variant="outline" className="gap-1 text-[10px] rounded-full h-6 px-2.5 bg-violet-500/10 text-violet-700 border-violet-200 hover:bg-violet-500/20" onClick={() => setCourierStatusModalOpen(true)}>
                  <Truck className="h-2.5 w-2.5" /> Courier Statuses
                </Button>
                <Badge variant="secondary" className="text-[10px] ml-auto h-5">
                  {filteredOrders.length} অর্ডার
                </Badge>
              </div>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* Order Items Modal */}
        <Dialog open={orderItemsModalOpen} onOpenChange={setOrderItemsModalOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-emerald-600" /> Order Items Summary
                <Badge variant="secondary" className="ml-2">{orderItemsSummary.length} প্রোডাক্ট</Badge>
              </DialogTitle>
            </DialogHeader>
            {orderItemsSummary.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">কোনো আইটেম ডেটা পাওয়া যায়নি</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/30">
                    <TableHead className="text-xs font-bold">Product</TableHead>
                    <TableHead className="text-xs font-bold text-center">Orders</TableHead>
                    <TableHead className="text-xs font-bold text-center">Qty</TableHead>
                    <TableHead className="text-xs font-bold text-right">Total (৳)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderItemsSummary.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <p className="text-sm font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.code}</p>
                      </TableCell>
                      <TableCell className="text-center text-sm font-semibold">{item.orderCount}</TableCell>
                      <TableCell className="text-center text-sm">{item.totalQty}</TableCell>
                      <TableCell className="text-right text-sm font-semibold text-primary">৳{item.totalAmount.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            <div className="flex justify-between items-center pt-2 border-t border-border/40 text-sm">
              <span className="text-muted-foreground">মোট প্রোডাক্ট: {orderItemsSummary.length}</span>
              <span className="font-bold text-primary">মোট: ৳{orderItemsSummary.reduce((s, i) => s + i.totalAmount, 0).toLocaleString()}</span>
            </div>
          </DialogContent>
        </Dialog>

        {/* Order Sources Modal */}
        <Dialog open={orderSourcesModalOpen} onOpenChange={setOrderSourcesModalOpen}>
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" /> Order Sources
              </DialogTitle>
            </DialogHeader>
            {orderSourcesSummary.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">কোনো সোর্স পাওয়া যায়নি</div>
            ) : (
              <div className="space-y-2">
                {orderSourcesSummary.map(([source, data]) => (
                  <div key={source} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/40">
                    <div>
                      <p className="text-sm font-medium">{source}</p>
                      <p className="text-xs text-muted-foreground">৳{data.totalAmount.toLocaleString()}</p>
                    </div>
                    <Badge variant="secondary" className="text-sm font-bold">{data.count}</Badge>
                  </div>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Duplicate Orders Modal */}
        <Dialog open={duplicateOrdersModalOpen} onOpenChange={setDuplicateOrdersModalOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Copy className="h-5 w-5 text-amber-600" /> Duplicate Orders
                <Badge variant="secondary" className="ml-2">{duplicateOrders.length} ডুপ্লিকেট গ্রুপ</Badge>
              </DialogTitle>
            </DialogHeader>
            {duplicateOrders.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">কোনো ডুপ্লিকেট অর্ডার পাওয়া যায়নি! 🎉</p>
              </div>
            ) : (
              <div className="space-y-3">
                {duplicateOrders.map((group, idx) => (
                  <Card key={idx} className="p-3 border-border/40">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">{group.type}</Badge>
                      <span className="text-sm font-semibold">{group.key}</span>
                      <Badge variant="destructive" className="text-xs ml-auto">{group.orders.length} অর্ডার</Badge>
                    </div>
                    <div className="space-y-1">
                      {group.orders.map((o) => (
                        <div key={o.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-secondary/20">
                          <span className="font-mono font-semibold">{o.order_number}</span>
                          <span>{o.customer_name}</span>
                          <span className="font-semibold">৳{Number(o.total_amount).toLocaleString()}</span>
                          <span className={`px-1.5 py-0.5 rounded-full text-white text-[10px] ${getStatusColor(o.status)}`}>{getStatusLabel(o.status)}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Courier Status Update Modal */}
        <CourierStatusModal
          open={courierStatusModalOpen}
          onOpenChange={setCourierStatusModalOpen}
          filteredOrders={filteredOrders}
          courierByOrderId={courierByOrderId}
          courierProviders={courierProviders}
          updateStatus={updateStatus}
        />

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
                  <TableHead className="font-bold text-xs">Product</TableHead>
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
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{order.customer_phone || "—"}</span>
                        {order.customer_phone && (
                          <div className="flex items-center gap-0.5">
                            <a href={`tel:${order.customer_phone}`} onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30">
                                <Phone className="h-3 w-3" />
                              </Button>
                            </a>
                            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md text-muted-foreground hover:bg-secondary" onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(order.customer_phone!);
                              toast.success("নম্বর কপি হয়েছে!");
                            }}>
                              <Copy className="h-3 w-3" />
                            </Button>
                            <a href={`https://wa.me/${order.customer_phone.replace(/^0/, "88")}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30">
                                <MessageSquare className="h-3 w-3" />
                              </Button>
                            </a>
                          </div>
                        )}
                      </div>
                    </TableCell>
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
                        onValueChange={(value) => handleStatusChange(order.id, value, order.status)}
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
                      <div className="flex items-center gap-1 justify-end">
                        {order.status === "hand_delivery" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 rounded-lg text-xs gap-1 text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-900/30"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusChange(order.id, "delivered", order.status);
                            }}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            ডেলিভারি সম্পন্ন
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-primary hover:bg-primary/10" title="Activity Log" onClick={(e) => { e.stopPropagation(); setDetailOrderId(order.id); }}>
                          <Activity className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-secondary" title="Edit" onClick={(e) => { e.stopPropagation(); setDetailOrderId(order.id); }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); deleteOrder.mutate(order.id); }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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

        {/* Cancel Reason Dialog */}
        <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-destructive" /> ক্যান্সেল কারণ সিলেক্ট করুন
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {CANCEL_REASONS.map((reason) => (
                <label key={reason} className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                  cancelReason === reason ? "border-primary bg-primary/5" : "border-border/40 hover:bg-secondary/30"
                )}>
                  <input type="radio" name="cancel_reason" className="accent-primary" checked={cancelReason === reason} onChange={() => setCancelReason(reason)} />
                  <span className="text-sm font-medium">{reason}</span>
                </label>
              ))}
              <label className={cn(
                "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                cancelReason === "others" ? "border-primary bg-primary/5" : "border-border/40 hover:bg-secondary/30"
              )}>
                <input type="radio" name="cancel_reason" className="accent-primary" checked={cancelReason === "others"} onChange={() => setCancelReason("others")} />
                <span className="text-sm font-medium">Others (নিজে লিখুন)</span>
              </label>
              {cancelReason === "others" && (
                <Textarea placeholder="ক্যান্সেলের কারণ লিখুন..." className="rounded-xl" value={cancelCustomReason} onChange={(e) => setCancelCustomReason(e.target.value)} rows={2} />
              )}
              <Button className="w-full rounded-xl" variant="destructive" onClick={confirmCancel} disabled={!cancelReason || (cancelReason === "others" && !cancelCustomReason.trim())}>
                ক্যান্সেল নিশ্চিত করুন
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Hold Date Dialog */}
        <Dialog open={holdDialogOpen} onOpenChange={setHoldDialogOpen}>
          <DialogContent className="max-w-sm rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CalendarClock className="h-5 w-5 text-yellow-500" /> Hold Date সিলেক্ট করুন
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">কত তারিখ পর্যন্ত Hold রাখতে চান?</p>
              <CalendarWidget mode="single" selected={holdUntilDate} onSelect={setHoldUntilDate} className="rounded-xl border border-border/40 p-3 mx-auto" disabled={(date) => date < new Date()} />
              {holdUntilDate && (
                <p className="text-sm text-center font-medium text-primary">Hold until: {format(holdUntilDate, "dd MMM yyyy")}</p>
              )}
              <Button className="w-full rounded-xl bg-yellow-500 hover:bg-yellow-600 text-white" onClick={confirmHold}>
                Hold নিশ্চিত করুন
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Hand Delivery Confirmation Dialog */}
        <Dialog open={handDeliveryDialogOpen} onOpenChange={setHandDeliveryDialogOpen}>
          <DialogContent className="max-w-sm rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" /> হ্যান্ড ডেলিভারি সম্পন্ন
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                আপনি কি নিশ্চিত যে এই অর্ডারটি হ্যান্ড ডেলিভারি সম্পন্ন হয়েছে? এটি <strong>Delivered</strong> স্ট্যাটাসে চলে যাবে।
              </p>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setHandDeliveryDialogOpen(false)}>
                  বাতিল
                </Button>
                <Button className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5" onClick={confirmHandDelivery}>
                  <CheckCircle2 className="h-4 w-4" /> নিশ্চিত করুন
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;

function OrderDetailDialog({ orderId, order, onClose }: { orderId: string | null; order: any; onClose: () => void }) {
  const { data: items = [], isLoading } = useOrderItems(orderId);
  const { data: allProducts = [] } = usePublicProducts();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const itemsTotal = items.reduce((s: number, i: any) => s + Number(i.total_price), 0);
  
  // Editable fields
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editCourierNote, setEditCourierNote] = useState("");
  const [editDelivery, setEditDelivery] = useState(0);
  const [editDiscount, setEditDiscount] = useState(0);
  const [editCity, setEditCity] = useState("");
  const [editZone, setEditZone] = useState("");
  const [editArea, setEditArea] = useState("");
  const [detailProductSearch, setDetailProductSearch] = useState("");
  const [detailProductFocused, setDetailProductFocused] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [logFilterUser, setLogFilterUser] = useState("all");
  const [logFilterAction, setLogFilterAction] = useState("all");
  const [logFilterDate, setLogFilterDate] = useState<Date | undefined>();

  // Populate fields when order changes
  const orderRef = order?.id;
  useMemo(() => {
    if (order) {
      setEditName(order.customer_name || "");
      setEditPhone(order.customer_phone || "");
      setEditAddress(order.customer_address || "");
      setEditNotes(order.notes || "");
      setEditCourierNote(order.courier_note || "");
      setEditDelivery(Number(order.delivery_charge));
      setEditDiscount(Number(order.discount));
    }
  }, [orderRef]);

  // Auto-detect location from address
  const detectedLoc = useMemo(() => {
    const addr = editAddress.toLowerCase();
    if (!addr) return { city: "", zone: "", area: "" };
    const city = bdDistrictList.find(d => addr.includes(d.toLowerCase())) || "";
    const zone = bdZoneList.find(z => addr.includes(z.toLowerCase().replace(" metro", "").replace(" sub", ""))) || 
      (city ? (["Dhaka", "Chittagong", "Rajshahi", "Khulna", "Sylhet", "Rangpur"].includes(city) ? `${city} Metro` : "") : "");
    const area = bdThanaList.find(t => addr.includes(t.toLowerCase())) || "";
    return { city, zone, area };
  }, [editAddress]);

  // Product search for detail dialog
  const { data: allOrderItemsForSales = [] } = useQuery({
    queryKey: ["all-order-items-filter"],
    queryFn: async () => {
      const { data, error } = await supabase.from("order_items").select("order_id, product_name, product_code, product_id");
      if (error) throw error;
      return data;
    },
  });
  const detailFilteredProducts = useMemo(() => {
    const salesMap: Record<string, number> = {};
    allOrderItemsForSales.forEach((oi: any) => { salesMap[oi.product_id || oi.product_name] = (salesMap[oi.product_id || oi.product_name] || 0) + 1; });
    const sorted = [...allProducts].sort((a: any, b: any) => (salesMap[b.id] || 0) - (salesMap[a.id] || 0));
    if (!detailProductSearch.trim()) return sorted.slice(0, 15);
    const q = detailProductSearch.toLowerCase();
    return sorted.filter((p: any) => p.name.toLowerCase().includes(q) || p.product_code.toLowerCase().includes(q)).slice(0, 15);
  }, [allProducts, detailProductSearch, allOrderItemsForSales]);

  // Activity logs
  const { data: activityLogs = [] } = useQuery({
    queryKey: ["order-activity-logs", orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_activity_logs" as any)
        .select("*")
        .eq("order_id", orderId!)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as any[];
    },
    enabled: !!orderId,
  });

  // Old orders by phone
  const { data: detailOldOrders = [] } = useQuery({
    queryKey: ["old-orders-phone-detail", editPhone],
    queryFn: async () => {
      if (!editPhone || editPhone.length < 6) return [];
      const { data, error } = await supabase.from("orders").select("*").eq("customer_phone", editPhone).neq("id", orderId!).order("created_at", { ascending: false }).limit(10);
      if (error) throw error;
      return data as any[];
    },
    enabled: !!editPhone && editPhone.length >= 6 && !!orderId,
  });

  const logActivity = async (action: string, fieldName?: string, oldValue?: string, newValue?: string, details?: string) => {
    if (!orderId) return;
    try {
      await supabase.from("order_activity_logs" as any).insert({
        order_id: orderId, user_id: user?.id || null, user_name: user?.email || "System",
        action, field_name: fieldName || null, old_value: oldValue || null, new_value: newValue || null, details: details || null,
      } as any);
    } catch (e) { console.error(e); }
  };

  const handleSaveChanges = async () => {
    if (!order || !orderId) return;
    setIsSaving(true);
    try {
      const changes: Record<string, any> = {};
      if (editName !== order.customer_name) { changes.customer_name = editName; await logActivity("field_edited", "customer_name", order.customer_name, editName); }
      if (editPhone !== (order.customer_phone || "")) { changes.customer_phone = editPhone || null; await logActivity("field_edited", "customer_phone", order.customer_phone, editPhone); }
      if (editAddress !== (order.customer_address || "")) { changes.customer_address = editAddress || null; await logActivity("field_edited", "customer_address", order.customer_address, editAddress); }
      if (editNotes !== (order.notes || "")) { changes.notes = editNotes || null; await logActivity("note_added", "notes", order.notes, editNotes); }
      if (editCourierNote !== (order.courier_note || "")) { changes.courier_note = editCourierNote || null; await logActivity("field_edited", "courier_note", order.courier_note, editCourierNote); }
      if (editDelivery !== Number(order.delivery_charge)) { changes.delivery_charge = editDelivery; await logActivity("field_edited", "delivery_charge", String(order.delivery_charge), String(editDelivery)); }
      if (editDiscount !== Number(order.discount)) { changes.discount = editDiscount; await logActivity("field_edited", "discount", String(order.discount), String(editDiscount)); }

      if (Object.keys(changes).length > 0) {
        // Recalculate total if delivery/discount changed
        if (changes.delivery_charge !== undefined || changes.discount !== undefined) {
          const newTotal = Number(order.product_cost) + (changes.delivery_charge ?? Number(order.delivery_charge)) - (changes.discount ?? Number(order.discount));
          changes.total_amount = newTotal;
        }
        const { error } = await supabase.from("orders").update(changes).eq("id", orderId);
        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: ["orders"] });
        queryClient.invalidateQueries({ queryKey: ["order-counts"] });
        queryClient.invalidateQueries({ queryKey: ["order-activity-logs", orderId] });
        toast.success("অর্ডার আপডেট হয়েছে!");
      }
    } catch (e: any) {
      toast.error("আপডেট ব্যর্থ: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const addProductToDetailOrder = async (product: any) => {
    if (!orderId) return;
    try {
      const { error } = await supabase.from("order_items").insert({
        order_id: orderId, product_id: product.id, product_name: product.name,
        product_code: product.product_code, quantity: 1, unit_price: Number(product.selling_price), total_price: Number(product.selling_price),
      });
      if (error) throw error;
      await logActivity("field_edited", "order_items", undefined, undefined, `প্রোডাক্ট যোগ করা হয়েছে: ${product.name}`);
      queryClient.invalidateQueries({ queryKey: ["order-items", orderId] });
      queryClient.invalidateQueries({ queryKey: ["all-order-items-filter"] });
      setDetailProductSearch("");
      toast.success("প্রোডাক্ট যোগ হয়েছে!");
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <Dialog open={!!orderId} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 rounded-xl bg-primary/10"><ShoppingCart className="h-5 w-5 text-primary" /></div>
            Order Details
            {order && <Badge variant="secondary" className="ml-2 text-xs">{order.order_number}</Badge>}
            {order && <Badge className={cn("ml-1 text-[10px]", getStatusColor(order.status))}>{getStatusLabel(order.status)}</Badge>}
          </DialogTitle>
        </DialogHeader>

        {order && (
          <div className="space-y-5">
            {/* Customer Info - Editable */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Customer Name</Label>
                <Input className="rounded-xl" value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Phone</Label>
                <Input className="rounded-xl" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
              </div>
            </div>

            {/* Old orders by phone */}
            {detailOldOrders.length > 0 && (
              <div className="p-3 rounded-xl border border-border/60 bg-secondary/20">
                <p className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
                  <History className="h-3.5 w-3.5" /> পুরনো অর্ডার ({detailOldOrders.length}টি)
                </p>
                <div className="max-h-28 overflow-y-auto space-y-1">
                  {detailOldOrders.slice(0, 5).map((o: any) => (
                    <div key={o.id} className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-background/50">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-foreground">{o.order_number}</span>
                        <Badge className={cn("text-[9px] h-4", getStatusColor(o.status))}>{getStatusLabel(o.status)}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span>৳{Number(o.total_amount).toLocaleString()}</span>
                        <span>{format(new Date(o.created_at), "dd MMM yy")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Address */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Address</Label>
              <Textarea className="rounded-xl" rows={2} value={editAddress} onChange={(e) => setEditAddress(e.target.value)} />
            </div>

            {/* City/Zone/Area Manual Select */}
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px] font-semibold text-muted-foreground">City</Label>
                <Select value={editCity || detectedLoc.city || ""} onValueChange={setEditCity}>
                  <SelectTrigger className="rounded-lg h-8 text-xs"><SelectValue placeholder="City সিলেক্ট করুন" /></SelectTrigger>
                  <SelectContent className="max-h-60">
                    {bdDistrictList.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-semibold text-muted-foreground">Zone</Label>
                <Select value={editZone || detectedLoc.zone || ""} onValueChange={setEditZone}>
                  <SelectTrigger className="rounded-lg h-8 text-xs"><SelectValue placeholder="Zone সিলেক্ট করুন" /></SelectTrigger>
                  <SelectContent>
                    {bdZoneList.map((z) => <SelectItem key={z} value={z}>{z}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-semibold text-muted-foreground">Area/Thana</Label>
                <Select value={editArea || detectedLoc.area || ""} onValueChange={setEditArea}>
                  <SelectTrigger className="rounded-lg h-8 text-xs"><SelectValue placeholder="Area সিলেক্ট করুন" /></SelectTrigger>
                  <SelectContent className="max-h-60">
                    {bdThanaList.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Order Items + Add Product */}
            <div className="space-y-3">
              <Label className="text-xs font-semibold">প্রোডাক্ট যোগ করুন</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="প্রোডাক্ট সার্চ করুন..."
                  className="pl-10 rounded-xl"
                  value={detailProductSearch}
                  onChange={(e) => setDetailProductSearch(e.target.value)}
                  onFocus={() => setDetailProductFocused(true)}
                  onBlur={() => setTimeout(() => setDetailProductFocused(false), 200)}
                />
              </div>
              {detailProductFocused && detailFilteredProducts.length > 0 && (
                <div className="border border-border rounded-xl max-h-48 overflow-y-auto bg-card shadow-md">
                  {!detailProductSearch.trim() && (
                    <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground bg-secondary/30 border-b border-border/30">🔥 Top Selling Products</div>
                  )}
                  {detailFilteredProducts.map((p: any) => (
                    <button
                      key={p.id}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => { addProductToDetailOrder(p); setDetailProductFocused(true); }}
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

              {isLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-4"><Loader2 className="h-4 w-4 animate-spin" /> Loading items...</div>
              ) : items.length === 0 ? (
                <div className="text-center py-4 bg-secondary/20 rounded-xl border border-border/30">
                  <Package className="h-6 w-6 text-muted-foreground/30 mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">কোনো আইটেম নেই</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {items.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/30 border border-border/40">
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

            {/* Financial */}
            <div className="grid grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Product Cost (৳)</Label>
                <Input type="number" className="rounded-xl" value={Number(order.product_cost)} disabled />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Delivery (৳)</Label>
                <Input type="number" className="rounded-xl" value={editDelivery} onChange={(e) => setEditDelivery(Number(e.target.value))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Discount (৳)</Label>
                <Input type="number" className="rounded-xl" value={editDiscount} onChange={(e) => setEditDiscount(Number(e.target.value))} />
              </div>
              <div className="text-right p-3 rounded-xl bg-primary/5 border border-primary/20">
                <p className="text-xs text-primary font-semibold">Total</p>
                <p className="text-2xl font-bold text-primary">৳{(Number(order.product_cost) + editDelivery - editDiscount).toLocaleString()}</p>
              </div>
            </div>

            {/* Dual Notes */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold flex items-center gap-1"><MessageSquare className="h-3 w-3" /> Staff Note</Label>
                <Textarea rows={2} className="rounded-xl text-xs" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold flex items-center gap-1"><Truck className="h-3 w-3" /> Courier Note</Label>
                <Textarea rows={2} className="rounded-xl text-xs" value={editCourierNote} onChange={(e) => setEditCourierNote(e.target.value)} />
              </div>
            </div>

            {/* Save Button */}
            <Button className="w-full rounded-xl shadow-sm" onClick={handleSaveChanges} disabled={isSaving}>
              {isSaving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : "পরিবর্তন সেভ করুন"}
            </Button>

            {/* Activity Log */}
            {activityLogs.length > 0 && (() => {
              const uniqueUsers = Array.from(new Set(activityLogs.map((l: any) => l.user_name || "System")));
              const uniqueActions = Array.from(new Set(activityLogs.map((l: any) => l.action)));
              const filtered = activityLogs.filter((log: any) => {
                if (logFilterUser !== "all" && (log.user_name || "System") !== logFilterUser) return false;
                if (logFilterAction !== "all" && log.action !== logFilterAction) return false;
                if (logFilterDate) {
                  const logDate = new Date(log.created_at);
                  if (logDate.toDateString() !== logFilterDate.toDateString()) return false;
                }
                return true;
              });
              return (
                <div>
                  <h4 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-primary" /> Activity Log
                    <Badge variant="secondary" className="text-[9px] ml-1">{filtered.length}/{activityLogs.length}</Badge>
                  </h4>
                  <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                    <Select value={logFilterUser} onValueChange={setLogFilterUser}>
                      <SelectTrigger className="rounded-lg h-6 text-[10px] w-auto min-w-[80px]"><SelectValue placeholder="User" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">সব User</SelectItem>
                        {uniqueUsers.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={logFilterAction} onValueChange={setLogFilterAction}>
                      <SelectTrigger className="rounded-lg h-6 text-[10px] w-auto min-w-[90px]"><SelectValue placeholder="Action" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">সব Action</SelectItem>
                        {uniqueActions.map((a) => <SelectItem key={a} value={a}>{a === "created" ? "তৈরি" : a === "status_changed" ? "স্ট্যাটাস" : a === "field_edited" ? "এডিট" : a === "note_added" ? "নোট" : a}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className={cn("h-6 text-[10px] rounded-lg px-2", !logFilterDate && "text-muted-foreground")}>
                          <Calendar className="h-3 w-3 mr-1" />
                          {logFilterDate ? format(logFilterDate, "dd MMM") : "তারিখ"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarWidget mode="single" selected={logFilterDate} onSelect={setLogFilterDate} initialFocus className={cn("p-3 pointer-events-auto")} />
                      </PopoverContent>
                    </Popover>
                    {(logFilterUser !== "all" || logFilterAction !== "all" || logFilterDate) && (
                      <Button variant="ghost" size="sm" className="h-6 text-[10px] px-1.5 text-destructive" onClick={() => { setLogFilterUser("all"); setLogFilterAction("all"); setLogFilterDate(undefined); }}>
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {filtered.length === 0 ? (
                      <p className="text-center text-xs text-muted-foreground py-3">কোনো activity পাওয়া যায়নি</p>
                    ) : filtered.map((log: any) => (
                      <div key={log.id} className="flex items-start gap-2 p-2 rounded-lg bg-secondary/20 border border-border/20 text-xs">
                        <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <History className="h-3 w-3 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-foreground">
                            <span className="font-semibold">{log.user_name || "System"}</span>
                            {" "}
                            {log.action === "created" && "অর্ডার তৈরি করেছে"}
                            {log.action === "status_changed" && <>স্ট্যাটাস পরিবর্তন: <Badge variant="outline" className="text-[9px] h-4">{log.old_value}</Badge> → <Badge variant="secondary" className="text-[9px] h-4">{log.new_value}</Badge></>}
                            {log.action === "field_edited" && <>"{log.field_name}" পরিবর্তন করেছে</>}
                            {log.action === "note_added" && "নোট যোগ করেছে"}
                            {!["created", "status_changed", "field_edited", "note_added"].includes(log.action) && log.action}
                          </p>
                          {log.details && <p className="text-muted-foreground mt-0.5">{log.details}</p>}
                          <p className="text-muted-foreground/60 mt-0.5">{format(new Date(log.created_at), "dd MMM yyyy, hh:mm a")}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Meta */}
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/30">
              <span>Created: {format(new Date(order.created_at), "dd MMM yyyy, hh:mm a")}</span>
              {order.source && (
                <Badge variant="outline" className="text-xs gap-1"><Globe className="h-3 w-3" />{order.source}</Badge>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CourierStatusModal({
  open, onOpenChange, filteredOrders, courierByOrderId, courierProviders, updateStatus
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filteredOrders: any[];
  courierByOrderId: Record<string, { provider_id: string; status: string; submitted_at: string }>;
  courierProviders: any[];
  updateStatus: any;
}) {
  const providerNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    courierProviders.forEach((cp: any) => { map[cp.id] = cp.name; });
    return map;
  }, [courierProviders]);

  // Find orders where courier status says delivered but order status is not delivered
  const mismatchedOrders = useMemo(() => {
    return filteredOrders.filter((o) => {
      const co = courierByOrderId[o.id];
      if (!co) return false;
      // courier says delivered but order not delivered
      if (co.status === "delivered" && o.status !== "delivered") return true;
      // courier says returned but order not returned
      if (co.status === "returned" && o.status !== "returned") return true;
      // courier says cancelled but order still in_courier
      if (co.status === "cancelled" && o.status === "in_courier") return true;
      return false;
    }).map((o) => ({
      ...o,
      courierStatus: courierByOrderId[o.id]?.status,
      providerName: providerNameMap[courierByOrderId[o.id]?.provider_id] || "Unknown",
    }));
  }, [filteredOrders, courierByOrderId, providerNameMap]);

  const handleBulkUpdate = () => {
    mismatchedOrders.forEach((o) => {
      const co = courierByOrderId[o.id];
      if (!co) return;
      let newStatus: OrderStatus | null = null;
      if (co.status === "delivered") newStatus = "delivered";
      else if (co.status === "returned") newStatus = "returned";
      else if (co.status === "cancelled") newStatus = "cancelled";
      if (newStatus && o.status !== newStatus) {
        updateStatus.mutate({ id: o.id, status: newStatus });
      }
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-violet-600" /> Courier Status Sync
            <Badge variant="secondary" className="ml-2">{mismatchedOrders.length} mismatch</Badge>
          </DialogTitle>
        </DialogHeader>
        {mismatchedOrders.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">সব অর্ডারের স্ট্যাটাস কুরিয়ারের সাথে সিঙ্ক আছে! ✅</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">নিচের অর্ডারগুলোতে কুরিয়ার স্ট্যাটাস ও অর্ডার স্ট্যাটাসে পার্থক্য আছে:</p>
            <div className="space-y-1.5 max-h-[50vh] overflow-y-auto">
              {mismatchedOrders.map((o) => (
                <div key={o.id} className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/30 border border-border/40 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold">{o.order_number}</span>
                    <span className="text-muted-foreground">{o.customer_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">{o.providerName}</Badge>
                    <span className={`px-1.5 py-0.5 rounded-full text-white text-[10px] ${getStatusColor(o.status)}`}>{getStatusLabel(o.status)}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px]">{o.courierStatus}</span>
                  </div>
                </div>
              ))}
            </div>
            <Button className="w-full rounded-xl" onClick={handleBulkUpdate} disabled={updateStatus.isPending}>
              {updateStatus.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              সব স্ট্যাটাস আপডেট করো ({mismatchedOrders.length}টি)
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
