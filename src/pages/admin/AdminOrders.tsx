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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus, Search, Calendar, AlertCircle, ShieldAlert, Truck, Key,
  Settings, Download, Printer, RefreshCw, ChevronDown, Wifi, Ban,
  Trash2, Copy, X, ShoppingCart, ArrowLeft, Clock, CheckCircle2,
  GitMerge, PauseCircle, XCircle, Trash, Smartphone, BarChart3,
  MessageSquare, Filter, Loader2, Package, Globe, SlidersHorizontal, AlertTriangle, History,
  Hand, RotateCcw, CalendarClock, Phone, Pencil, Activity, FileText
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
import { useBulkMemoPrint } from "@/components/admin/courier/BulkMemoPrint";
import { useCourierCities, useCourierZones, useCourierAreas } from "@/hooks/useCourierLocations";
import { ApiKeysView } from "@/components/admin/api/ApiKeysView";
import { Constants } from "@/integrations/supabase/types";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import * as XLSX from "@datalens-tech/xlsx";
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
  "Customer has no money",
  "Customer doesn't like it",
  "Customer refuses to receive",
  "Outside delivery area",
  "Wrong order / Duplicate",
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
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  const [productSearchFocused, setProductSearchFocused] = useState(false);
  const [bulkStatusValue, setBulkStatusValue] = useState("");
  const [bulkCourierId, setBulkCourierId] = useState("");
  const [inlineNoteOrderId, setInlineNoteOrderId] = useState<string | null>(null);
  const [inlineNoteText, setInlineNoteText] = useState("");
  const [selectedOrderSource, setSelectedOrderSource] = useState("");
  const [newOrderStatus, setNewOrderStatus] = useState<string>("processing");
  const [newOrderCancelReason, setNewOrderCancelReason] = useState("");
  const [newOrderCancelCustom, setNewOrderCancelCustom] = useState("");
  const [cancelReasonFilter, setCancelReasonFilter] = useState("all");
  const [newSourceName, setNewSourceName] = useState("");
  const [newSourceIcon, setNewSourceIcon] = useState("📦");
  
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
  const [filterProductIds, setFilterProductIds] = useState<string[]>([]);
  const [filterProductInput, setFilterProductInput] = useState("");
  const [filterProductFocused, setFilterProductFocused] = useState(false);
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
  const { data: nextOrderNumber = "1" } = useNextOrderNumber();
  const { data: allProducts = [] } = usePublicProducts();

  // Fetch blocked phones for toggle
  const { data: blockedPhones = [], refetch: refetchBlockedPhones } = useQuery({
    queryKey: ["blocked-phones-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("blocked_phones").select("phone_number");
      if (error) return [];
      return (data || []).map((d: any) => d.phone_number as string);
    },
  });
  const blockedPhoneSet = new Set(blockedPhones);

  // Fetch order sources
  const { data: orderSources = [], refetch: refetchOrderSources } = useQuery({
    queryKey: ["order-sources"],
    queryFn: async () => {
      const { data, error } = await supabase.from("order_sources" as any).select("*").eq("is_active", true).order("created_at", { ascending: true });
      if (error) return [];
      return data as any[];
    },
  });

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
        .select("order_id, courier_provider_id, courier_status, submitted_at, tracking_id, consignment_id");
      if (error) throw error;
      return data;
    },
  });
  const { data: courierProviders = [] } = useQuery({
    queryKey: ["courier-providers-filter"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courier_providers")
        .select("id, name, slug, logo_url, is_active, api_configs");
      if (error) throw error;
      return (data || []).filter((cp: any) => {
        if (!cp.is_active) return false;
        const configs = Array.isArray(cp.api_configs) ? cp.api_configs : JSON.parse(cp.api_configs || "[]");
        return configs.length > 0 && configs.some((c: any) => c.api_key);
      });
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
      // Fetch all order items with pagination to bypass 1000 row limit
      let allItems: any[] = [];
      let from = 0;
      const pageSize = 1000;
      while (true) {
        const { data, error } = await supabase
          .from("order_items")
          .select("order_id, product_name, product_code, product_id")
          .range(from, from + pageSize - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        allItems = allItems.concat(data);
        if (data.length < pageSize) break;
        from += pageSize;
      }
      return allItems;
    },
  });

  // Order assignments for employee column
  const { data: orderAssignments = [] } = useQuery({
    queryKey: ["order-assignments-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_assignments")
        .select("order_id, assigned_to, status");
      if (error) throw error;
      return data;
    },
  });

  // Profiles for employee names
  const { data: profilesList = [] } = useQuery({
    queryKey: ["profiles-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name");
      if (error) throw error;
      return data;
    },
  });

  // Employee name map from profiles
  const profileNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    profilesList.forEach((p: any) => { if (p.full_name) map[p.user_id] = p.full_name; });
    return map;
  }, [profilesList]);

  // Assignment by order id
  const assignmentByOrderId = useMemo(() => {
    const map: Record<string, string> = {};
    orderAssignments.forEach((a: any) => {
      map[a.order_id] = profileNameMap[a.assigned_to] || "—";
    });
    return map;
  }, [orderAssignments, profileNameMap]);

  // Customer delivery stats by phone for courier column
  const customerStatsByPhone = useMemo(() => {
    const phoneMap: Record<string, { total: number; success: number; failed: number; confirmed: number; isNew: boolean }> = {};
    orders.forEach((o) => {
      const phone = o.customer_phone;
      if (!phone) return;
      if (!phoneMap[phone]) phoneMap[phone] = { total: 0, success: 0, failed: 0, confirmed: 0, isNew: true };
      phoneMap[phone].total++;
      if (o.status === "delivered") phoneMap[phone].success++;
      if (o.status === "returned" || o.status === "cancelled") phoneMap[phone].failed++;
      if (o.status === "confirmed") phoneMap[phone].confirmed++;
      phoneMap[phone].isNew = phoneMap[phone].total <= 1;
    });
    return phoneMap;
  }, [orders]);

  // Build product image lookup from allProducts
  const productImageMap = useMemo(() => {
    const map: Record<string, string> = {};
    allProducts.forEach((p: any) => {
      if (p.main_image_url) {
        map[p.id] = p.main_image_url;
        map[p.name] = p.main_image_url;
      }
    });
    return map;
  }, [allProducts]);

  // Build lookup maps
  const courierProviderNameMap = useMemo(() => {
    const map: Record<string, { name: string; logo_url: string | null }> = {};
    courierProviders.forEach((cp: any) => { map[cp.id] = { name: cp.name, logo_url: cp.logo_url || null }; });
    return map;
  }, [courierProviders]);

  const courierByOrderId = useMemo(() => {
    const map: Record<string, { provider_id: string; status: string; submitted_at: string; tracking_id: string | null; consignment_id: string | null; provider_name: string; logo_url: string | null }> = {};
    courierOrders.forEach((co: any) => {
      const info = courierProviderNameMap[co.courier_provider_id];
      map[co.order_id] = { provider_id: co.courier_provider_id, status: co.courier_status, submitted_at: co.submitted_at, tracking_id: co.tracking_id, consignment_id: co.consignment_id, provider_name: info?.name || "—", logo_url: info?.logo_url || null };
    });
    return map;
  }, [courierOrders, courierProviderNameMap]);

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

  // Filter products for the filter dropdown
  const filteredFilterProducts = useMemo(() => {
    if (!filterProductInput.trim()) return (allProducts || []).slice(0, 20);
    const q = filterProductInput.toLowerCase();
    return (allProducts || []).filter((p: any) =>
      p.name.toLowerCase().includes(q) || p.product_code.toLowerCase().includes(q)
    ).slice(0, 20);
  }, [allProducts, filterProductInput]);

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
        if (filterPaymentStatus === "paid" && o.payment_status !== "paid") return false;
        if (filterPaymentStatus === "unpaid" && o.payment_status === "paid") return false;
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
      if (filterProductIds.length > 0) {
        const items = orderItemsByOrderId[o.id] || [];
        const itemProductIds = items.map((i: any) => i.product_id).filter(Boolean);
        const itemNames = items.map((i: any) => i.product_name?.toLowerCase());
        const selectedProducts = (allProducts || []).filter((p: any) => filterProductIds.includes(p.id));
        if (!selectedProducts.some((sp: any) => itemProductIds.includes(sp.id) || itemNames.includes(sp.name?.toLowerCase()))) return false;
      } else if (filterProductSearch) {
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
      // Cancel reason filter
      if (cancelReasonFilter !== "all" && activeTab === "Cancelled") {
        if (cancelReasonFilter === "no_reason") { if ((o as any).cancel_reason) return false; }
        else if (cancelReasonFilter === "others") { if (!(o as any).cancel_reason || CANCEL_REASONS.includes((o as any).cancel_reason)) return false; }
        else { if ((o as any).cancel_reason !== cancelReasonFilter) return false; }
      }
      return true;
    });
  }, [orders, searchQuery, filterSource, filterPhone, filterAmountMin, filterAmountMax, filterDeviceType, filterAddress, filterDistrict, filterThana, filterZone, filterPaymentStatus, filterCourierProvider, filterCourierStatus, filterStatus, filterProductSearch, filterProductIds, filterCategory, filterCourierCharged, filterNotes, filterUrl, filterOrderTag, filterSalesType, courierByOrderId, orderItemsByOrderId, allProducts, cancelReasonFilter, activeTab]);

  const activeFilterCount = [filterSource, filterPhone, filterAmountMin, filterAmountMax, filterAddress, filterStatus, filterNotes, filterUrl, filterOrderTag].filter(Boolean).length
    + (filterProductIds.length > 0 ? 1 : (filterProductSearch ? 1 : 0))
    + [filterDeviceType, filterPaymentStatus, filterCourierProvider, filterCourierStatus, filterCategory, filterCourierCharged, filterSalesType, filterDistrict, filterThana, filterZone].filter(v => v !== "all").length
    + (orderDateFilter !== "all" ? 1 : 0);

  // Site settings for shop name
  const { data: siteSettings } = useSiteSettings();
  const shopName = siteSettings?.site_name || "STORE";
  const shopLogo = siteSettings?.site_logo || "";

  // Bulk memo print
  const selectedOrdersForPrint = useMemo(() => filteredOrders.filter(o => selectedOrderIds.has(o.id)), [filteredOrders, selectedOrderIds]);
  
  const handleMarkPrinted = useCallback(async (orderIds: string[]) => {
    for (const id of orderIds) {
      await supabase.from("orders").update({ memo_printed: true } as any).eq("id", id);
    }
    queryClient.invalidateQueries({ queryKey: ["orders"] });
    toast.success(`${orderIds.length} order memo(s) marked as printed!`);
  }, [queryClient]);

  const bulkPrint = useBulkMemoPrint({
    orders: selectedOrdersForPrint,
    courierByOrderId,
    orderItemsByOrderId,
    siteName: shopName,
    siteLogo: shopLogo,
    onPrinted: handleMarkPrinted,
  });

  const clearAllFilters = () => {
    setFilterSource(""); setFilterPhone(""); setFilterAmountMin(""); setFilterAmountMax("");
    setFilterDeviceType("all"); setFilterAddress(""); setFilterDistrict("all"); setFilterThana("all"); setFilterZone("all");
    setFilterPaymentStatus("all"); setFilterCourierProvider("all"); setFilterCourierStatus("all");
    setFilterStatus(""); setFilterProductSearch(""); setFilterProductIds([]); setFilterProductInput(""); setFilterCategory("all");
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
      toast.error("No orders to export!");
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
      "Source": o.source || "Panel",
      "Notes": o.notes || "",
      "Date": format(new Date(o.created_at), "dd MMM yyyy, hh:mm a"),
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orders");
    XLSX.writeFile(wb, `orders-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    toast.success(`${filteredOrders.length} orders exported!`);
  }, [filteredOrders]);

  // Print filtered orders
  const handlePrint = useCallback(() => {
    if (filteredOrders.length === 0) {
      toast.error("No orders to print!");
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
        <p style="color:#666;margin-bottom:15px">${filteredOrders.length} orders</p>
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
    setTimeout(() => { printWindow.print(); }, 300);
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

  const handleInlineNoteSave = async (orderId: string, noteText: string) => {
    const { error } = await supabase.from("orders").update({ notes: noteText } as any).eq("id", orderId);
    if (error) { toast.error("Failed to save note"); return; }
    queryClient.invalidateQueries({ queryKey: ["orders"] });
    logActivity(orderId, "note_updated", "notes", undefined, noteText, "Inline note updated");
    toast.success("Note saved!");
    setInlineNoteOrderId(null);
    setInlineNoteText("");
  };

  const handleTogglePaymentStatus = async (orderId: string, currentStatus: string) => {
    const newStatus = currentStatus === "paid" ? "unpaid" : "paid";
    const { error } = await supabase.from("orders").update({ payment_status: newStatus } as any).eq("id", orderId);
    if (error) { toast.error("Payment status update failed"); return; }
    queryClient.invalidateQueries({ queryKey: ["orders"] });
    logActivity(orderId, "payment_status_changed", "payment_status", currentStatus, newStatus);
    toast.success(`Payment status: ${newStatus === "paid" ? "Paid" : "Unpaid"}`);
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

  // Bulk status change
  const handleBulkStatusChange = (newStatus: string) => {
    if (selectedOrderIds.size === 0) return;
    if (newStatus === "cancelled") {
      // For cancel, apply directly without reason dialog for bulk
      selectedOrderIds.forEach(id => {
        updateStatus.mutate({ id, status: newStatus as OrderStatus });
        logActivity(id, "status_changed", "status", "", "Cancelled", "বাল্ক ক্যান্সেল");
      });
    } else {
      selectedOrderIds.forEach(id => {
        const order = filteredOrders.find(o => o.id === id);
        updateStatus.mutate({ id, status: newStatus as OrderStatus });
        logActivity(id, "status_changed", "status", order ? getStatusLabel(order.status) : "", getStatusLabel(newStatus as OrderStatus), "বাল্ক স্ট্যাটাস চেঞ্জ");
      });
    }
    toast.success(`${selectedOrderIds.size}টি অর্ডারের স্ট্যাটাস আপডেট হয়েছে!`);
    setSelectedOrderIds(new Set());
    setBulkStatusValue("");
  };

  // Bulk delete
  const handleBulkDelete = () => {
    if (selectedOrderIds.size === 0) return;
    if (!confirm(`${selectedOrderIds.size}টি অর্ডার ডিলিট করবেন? এটি undo করা যাবে না!`)) return;
    selectedOrderIds.forEach(id => {
      deleteOrder.mutate(id);
    });
    toast.success(`${selectedOrderIds.size}টি অর্ডার ডিলিট হয়েছে!`);
    setSelectedOrderIds(new Set());
  };

  // Bulk courier assign
  const handleBulkCourierAssign = async (courierId: string) => {
    if (selectedOrderIds.size === 0 || !courierId) return;
    let count = 0;
    for (const orderId of selectedOrderIds) {
      const { error } = await supabase.from("courier_orders").upsert({
        order_id: orderId,
        courier_provider_id: courierId,
        courier_status: "pending",
      } as any, { onConflict: "order_id" });
      if (!error) count++;
    }
    queryClient.invalidateQueries({ queryKey: ["courier-orders-filter"] });
    toast.success(`${count}টি অর্ডারে কুরিয়ার অ্যাসাইন হয়েছে!`);
    setSelectedOrderIds(new Set());
    setBulkCourierId("");
  };

  const handleCreateOrder = () => {
    if (!customerName.trim()) return;
    if (newOrderStatus === "cancelled" && !newOrderCancelReason && !newOrderCancelCustom.trim()) {
      toast.error("ক্যান্সেল কারণ সিলেক্ট করুন!");
      return;
    }
    const computedProductCost = orderItems.length > 0 ? itemsTotal : productCost;
    const computedTotal = totalAmount || (computedProductCost + deliveryCharge - discount);
    const finalCancelReason = newOrderStatus === "cancelled" 
      ? (newOrderCancelReason === "others" ? newOrderCancelCustom : newOrderCancelReason) 
      : null;
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
        source: selectedOrderSource || "Panel",
        status: newOrderStatus as any,
        cancel_reason: finalCancelReason,
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
    setNewOrderStatus("processing");
    setNewOrderCancelReason("");
    setNewOrderCancelCustom("");
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
                <IncompleteOrderCard
                  key={io.id}
                  io={io}
                  activeIncompleteTab={activeIncompleteTab}
                  convertIncomplete={convertIncomplete}
                  deleteIncomplete={deleteIncomplete}
                />
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
      <div className="space-y-3 sm:space-y-5">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">Orders</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">Manage and track all orders</p>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {/* Mobile: compact icon buttons, Desktop: full buttons */}
            <a href="/admin/orders/backfill-items" className="hidden sm:block">
              <Button variant="outline" size="sm" className="gap-2 rounded-xl border-border/60 shadow-sm hover:shadow">
                <Package className="h-4 w-4 text-primary" /> Backfill
              </Button>
            </a>
            <Button variant="outline" size="sm" className="gap-1.5 sm:gap-2 rounded-xl border-border/60 shadow-sm hover:shadow text-xs sm:text-sm" onClick={() => setCurrentView("incomplete")}>
              <AlertCircle className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-amber-500" /> <span className="hidden xs:inline">Incomplete</span><span className="xs:hidden">Inc.</span>
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 sm:gap-2 rounded-xl border-border/60 shadow-sm hover:shadow text-xs sm:text-sm" onClick={() => setCurrentView("fakeOrder")}>
              <ShieldAlert className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-red-500" /> <span className="hidden sm:inline">Fake Order</span><span className="sm:hidden">Fake</span>
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 sm:gap-2 rounded-xl border-border/60 shadow-sm hover:shadow text-xs sm:text-sm" onClick={() => setCurrentView("courier")}>
              <Truck className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-violet-500" /> <span className="hidden sm:inline">Courier</span>
            </Button>

            <Button variant="outline" size="sm" className="gap-2 rounded-xl border-border/60 shadow-sm hover:shadow" onClick={() => setCurrentView("api")}>
              <Key className="h-4 w-4 text-amber-500" /> API Keys
            </Button>

            {/* Order Settings Dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 rounded-xl border-border/60 shadow-sm hover:shadow"><Settings className="h-4 w-4" /> Order Settings</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg rounded-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader><DialogTitle className="flex items-center gap-2 text-lg"><div className="p-2 rounded-xl bg-secondary"><Settings className="h-5 w-5 text-muted-foreground" /></div>Order Settings</DialogTitle></DialogHeader>
                
                {/* Order Status Settings */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">Order Status</h3>
                  <div className="grid grid-cols-2 gap-2.5">
                    {orderStatusSettings.map((s) => (
                      <label key={s.label} className="flex items-center gap-3 p-3 rounded-xl border border-border/40 hover:bg-secondary/30 cursor-pointer transition-all">
                        <Checkbox defaultChecked /><span className={`h-2.5 w-2.5 rounded-full ${s.color}`} /><span className="text-sm font-medium">{s.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Order Sources Management */}
                <div className="space-y-3 border-t border-border/40 pt-4">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><Globe className="h-4 w-4" /> Order Sources</h3>
                  <div className="space-y-2">
                    {orderSources.map((src: any) => (
                      <div key={src.id} className="flex items-center justify-between p-2.5 rounded-xl border border-border/40 bg-secondary/20">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{src.icon}</span>
                          <span className="text-sm font-medium">{src.name}</span>
                          {src.is_system && <Badge variant="secondary" className="text-[10px] h-4 px-1.5">System</Badge>}
                        </div>
                        {!src.is_system && (
                          <button className="h-6 w-6 rounded-md flex items-center justify-center hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" onClick={async () => {
                            if (!confirm(`"${src.name}" সোর্স ডিলিট করবেন?`)) return;
                            await supabase.from("order_sources" as any).delete().eq("id", src.id);
                            refetchOrderSources();
                            toast.success("সোর্স ডিলিট হয়েছে!");
                          }}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {/* Add new source */}
                  <div className="flex gap-2 items-end">
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs">New Source Name</Label>
                      <Input placeholder="e.g. Facebook, Instagram..." className="rounded-xl h-9 text-sm" value={newSourceName} onChange={(e) => setNewSourceName(e.target.value)} />
                    </div>
                    <Select value={newSourceIcon} onValueChange={setNewSourceIcon}>
                      <SelectTrigger className="w-16 h-9 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["📦", "📞", "💬", "📱", "🌐", "🔗", "📧", "🏪", "📣", "🎯"].map(icon => (
                          <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button size="sm" className="h-9 rounded-xl" disabled={!newSourceName.trim()} onClick={async () => {
                      const slug = newSourceName.trim().toLowerCase().replace(/\s+/g, '_');
                      const { error } = await supabase.from("order_sources" as any).insert({ name: newSourceName.trim(), slug, icon: newSourceIcon, is_system: false } as any);
                      if (error) { toast.error("সোর্স তৈরি ব্যর্থ: " + error.message); return; }
                      setNewSourceName("");
                      setNewSourceIcon("📦");
                      refetchOrderSources();
                      toast.success("নতুন সোর্স তৈরি হয়েছে!");
                    }}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Button className="w-full mt-2 rounded-xl shadow-sm">Save Settings</Button>
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
                <div className="space-y-6">
                  {/* Customer Info Section */}
                  <div className="p-4 rounded-2xl bg-secondary/20 border border-border/40 space-y-4">
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center"><Phone className="h-3.5 w-3.5 text-primary" /></div>
                      কাস্টমার তথ্য
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-muted-foreground">কাস্টমারের নাম *</Label>
                        <Input placeholder="নাম লিখুন" className="rounded-xl h-10 text-sm" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-muted-foreground">ফোন নম্বর</Label>
                        <Input placeholder="01XXXXXXXXX" className="rounded-xl h-10 text-sm" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
                      </div>
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
                    <Label className="text-xs font-semibold text-muted-foreground">ঠিকানা</Label>
                    <Textarea placeholder="সম্পূর্ণ ঠিকানা লিখুন" rows={2} className="rounded-xl text-sm" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} />
                  </div>

                  {/* Courier Selection */}
                  <div className="p-4 rounded-2xl bg-secondary/20 border border-border/40 space-y-3">
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <div className="h-6 w-6 rounded-lg bg-violet-500/10 flex items-center justify-center"><Truck className="h-3.5 w-3.5 text-violet-500" /></div>
                      কুরিয়ার সিলেক্ট
                    </h3>
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
                        {courierProviders.map((cp: any) => (
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

                  {/* City/Zone/Area from Courier API */}
                  {selectedCourierId && (
                    <div className="p-3 rounded-xl bg-background border border-border/30 space-y-3">
                      <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                        📍 {courierProviders.find((cp: any) => cp.id === selectedCourierId)?.name} এরিয়া সিলেক্ট
                      </p>
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
                    </div>
                  )}
                  </div>

                  {/* Product Items */}
                  <div className="p-4 rounded-2xl bg-secondary/20 border border-border/40 space-y-3">
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center"><Package className="h-3.5 w-3.5 text-primary" /></div>
                      প্রোডাক্ট যোগ করুন
                    </h3>
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
                            onClick={() => { addProductToOrder(p); setProductSearchFocused(false); }}
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

                  {/* Financial Summary */}
                  <div className="p-4 rounded-2xl bg-secondary/20 border border-border/40 space-y-3">
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <div className="h-6 w-6 rounded-lg bg-emerald-500/10 flex items-center justify-center">৳</div>
                      মূল্য হিসাব
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-muted-foreground">প্রোডাক্ট খরচ (৳)</Label>
                        <Input type="number" className="rounded-xl h-10 text-sm font-medium" value={orderItems.length > 0 ? itemsTotal : productCost} onChange={(e) => setProductCost(Number(e.target.value))} disabled={orderItems.length > 0} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-muted-foreground">ডেলিভারি চার্জ (৳)</Label>
                        <Input type="number" className="rounded-xl h-10 text-sm font-medium" value={deliveryCharge} onChange={(e) => setDeliveryCharge(Number(e.target.value))} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-muted-foreground">ডিসকাউন্ট (৳)</Label>
                        <Input type="number" className="rounded-xl h-10 text-sm font-medium" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} />
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="text-xs text-muted-foreground">প্রোডাক্ট + ডেলিভারি − ডিসকাউন্ট</p>
                        <p className="text-xs text-muted-foreground font-medium">
                          ৳{(orderItems.length > 0 ? itemsTotal : productCost).toLocaleString()} + ৳{deliveryCharge.toLocaleString()} − ৳{discount.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-primary font-semibold">সর্বমোট</p>
                        <p className="text-3xl font-bold text-primary">৳{((orderItems.length > 0 ? itemsTotal : productCost) + deliveryCharge - discount).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                  {/* Notes & Source */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><MessageSquare className="h-3 w-3" /> স্টাফ নোট</Label>
                      <Textarea placeholder="ইন্টারনাল স্টাফ নোট..." rows={2} className="rounded-xl text-sm" value={notes} onChange={(e) => setNotes(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Truck className="h-3 w-3" /> কুরিয়ার নোট</Label>
                      <Textarea placeholder="কুরিয়ার/প্যাকিং নোট (মেমো তে প্রিন্ট হবে)..." rows={2} className="rounded-xl text-sm" value={courierNote} onChange={(e) => setCourierNote(e.target.value)} />
                    </div>
                  </div>
                  {/* Order Source */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Globe className="h-3 w-3" /> অর্ডার সোর্স</Label>
                    <Select value={selectedOrderSource} onValueChange={setSelectedOrderSource}>
                      <SelectTrigger className="rounded-xl h-10 text-sm"><SelectValue placeholder="সোর্স সিলেক্ট করুন..." /></SelectTrigger>
                      <SelectContent>
                        {orderSources.filter((s: any) => !s.is_system || s.slug !== 'api').map((src: any) => (
                          <SelectItem key={src.id} value={src.name}>
                            <span className="flex items-center gap-2">{src.icon} {src.name}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Order Status */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold flex items-center gap-1.5"><Activity className="h-4 w-4 text-primary" /> অর্ডার স্ট্যাটাস</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { value: "processing", label: "New Order", color: "bg-blue-500", icon: Clock },
                        { value: "confirmed", label: "Confirmed", color: "bg-emerald-600", icon: CheckCircle2 },
                        { value: "inquiry", label: "Inquiry", color: "bg-amber-600", icon: Clock },
                        { value: "on_hold", label: "Hold", color: "bg-yellow-500", icon: PauseCircle },
                        { value: "hand_delivery", label: "Hand Delivery", color: "bg-cyan-500", icon: Hand },
                        { value: "cancelled", label: "Cancelled", color: "bg-red-500", icon: XCircle },
                      ].map((s) => (
                        <button
                          key={s.value}
                          type="button"
                          onClick={() => setNewOrderStatus(s.value)}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold border-2 transition-all duration-200",
                            newOrderStatus === s.value
                              ? `${s.color} text-white border-transparent shadow-lg scale-[1.02]`
                              : "bg-secondary/30 text-foreground border-border/40 hover:border-primary/30 hover:bg-secondary/50"
                          )}
                        >
                          <s.icon className="h-3.5 w-3.5" />
                          {s.label}
                        </button>
                      ))}
                    </div>
                    {newOrderStatus === "cancelled" && (
                      <div className="space-y-2 p-3 rounded-xl border border-destructive/30 bg-destructive/5">
                        <Label className="text-xs font-semibold text-destructive flex items-center gap-1"><XCircle className="h-3.5 w-3.5" /> ক্যান্সেল কারণ</Label>
                        {CANCEL_REASONS.map((reason) => (
                          <label key={reason} className={cn(
                            "flex items-center gap-2 p-2 rounded-lg border cursor-pointer text-xs transition-all",
                            newOrderCancelReason === reason ? "border-destructive bg-destructive/10" : "border-border/40 hover:bg-secondary/30"
                          )}>
                            <input type="radio" name="new_cancel_reason" className="accent-destructive" checked={newOrderCancelReason === reason} onChange={() => setNewOrderCancelReason(reason)} />
                            {reason}
                          </label>
                        ))}
                        <label className={cn(
                          "flex items-center gap-2 p-2 rounded-lg border cursor-pointer text-xs transition-all",
                          newOrderCancelReason === "others" ? "border-destructive bg-destructive/10" : "border-border/40 hover:bg-secondary/30"
                        )}>
                          <input type="radio" name="new_cancel_reason" className="accent-destructive" checked={newOrderCancelReason === "others"} onChange={() => setNewOrderCancelReason("others")} />
                          Others (নিজে লিখুন)
                        </label>
                        {newOrderCancelReason === "others" && (
                          <Textarea placeholder="ক্যান্সেলের কারণ লিখুন..." className="rounded-lg text-xs" rows={2} value={newOrderCancelCustom} onChange={(e) => setNewOrderCancelCustom(e.target.value)} />
                        )}
                      </div>
                    )}
                  </div>
                  <Button className="w-full rounded-xl shadow-sm" onClick={handleCreateOrder} disabled={createOrder.isPending || !customerName.trim()}>
                    {createOrder.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</> : <><Plus className="h-4 w-4" /> Create Order</>}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Status Tabs - Horizontal scroll on mobile, grid on desktop */}
        <div className="overflow-x-auto -mx-2 px-2 pb-2 scrollbar-hide">
          <div className="flex sm:grid sm:grid-cols-6 gap-1.5 sm:gap-2 min-w-max sm:min-w-0">
            {statusTabs.map((tab) => (
              <button
                key={tab.label}
                onClick={() => { setActiveTab(tab.label); setCancelReasonFilter("all"); }}
                className={`flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-[11px] sm:text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                  activeTab === tab.label
                    ? `${tab.color} text-white shadow-lg`
                    : "bg-card text-muted-foreground hover:bg-secondary border border-border/40"
                }`}
              >
                <tab.icon className="h-3 sm:h-3.5 w-3 sm:w-3.5 shrink-0" />
                <span className="truncate">{tab.label}</span>
                <span className={`text-[9px] sm:text-[10px] font-bold shrink-0 ${activeTab === tab.label ? "text-white/80" : "text-muted-foreground/50"}`}>
                  {counts[tab.label] || 0}
                </span>
              </button>
            ))}
          </div>
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
        <Card className="p-2 sm:p-3 border-border/40 flex items-center gap-2 sm:gap-3 flex-wrap shadow-sm">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-10 border-0 bg-transparent shadow-none focus-visible:ring-0 text-sm h-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl border-border/60" onClick={handleRefresh} title="রিফ্রেশ"><RefreshCw className={cn("h-3.5 sm:h-4 w-3.5 sm:w-4", isLoading && "animate-spin")} /></Button>
            <Button variant="outline" size="icon" className="h-8 w-8 sm:hidden rounded-xl border-border/60" onClick={handleExport} title="Export"><Download className="h-3.5 w-3.5" /></Button>
            <Button variant="outline" size="sm" className="gap-1.5 h-9 rounded-xl border-border/60 hidden sm:flex" onClick={handleExport}><Download className="h-4 w-4" /> Export</Button>
            <Button variant="outline" size="sm" className="gap-1.5 h-9 rounded-xl border-border/60 hidden sm:flex" onClick={handlePrint}><Printer className="h-4 w-4" /> Print</Button>
          </div>
        </Card>

        {/* Cancel Reason Filter for Cancelled tab */}
        {activeTab === "Cancelled" && (
          <Card className="p-3 border-border/40 shadow-sm">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Filter className="h-3.5 w-3.5" /> ক্যান্সেল কারণ:</span>
              <button
                onClick={() => setCancelReasonFilter("all")}
                className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all", cancelReasonFilter === "all" ? "bg-primary text-primary-foreground shadow-sm" : "bg-secondary/50 text-muted-foreground hover:bg-secondary")}
              >
                সব ({filteredOrders.length})
              </button>
              {CANCEL_REASONS.map((reason) => {
                const count = filteredOrders.filter((o: any) => o.cancel_reason === reason).length;
                return (
                  <button
                    key={reason}
                    onClick={() => setCancelReasonFilter(reason)}
                    className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all", cancelReasonFilter === reason ? "bg-destructive text-destructive-foreground shadow-sm" : "bg-secondary/50 text-muted-foreground hover:bg-secondary")}
                  >
                    {reason} ({count})
                  </button>
                );
              })}
              {(() => {
                const otherCount = filteredOrders.filter((o: any) => o.cancel_reason && !CANCEL_REASONS.includes(o.cancel_reason)).length;
                const noReasonCount = filteredOrders.filter((o: any) => !o.cancel_reason).length;
                return (
                  <>
                    {otherCount > 0 && (
                      <button
                        onClick={() => setCancelReasonFilter("others")}
                        className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all", cancelReasonFilter === "others" ? "bg-destructive text-destructive-foreground shadow-sm" : "bg-secondary/50 text-muted-foreground hover:bg-secondary")}
                      >
                        অন্যান্য ({otherCount})
                      </button>
                    )}
                    {noReasonCount > 0 && (
                      <button
                        onClick={() => setCancelReasonFilter("no_reason")}
                        className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all", cancelReasonFilter === "no_reason" ? "bg-muted text-foreground shadow-sm" : "bg-secondary/50 text-muted-foreground hover:bg-secondary")}
                      >
                        কারণ নেই ({noReasonCount})
                      </button>
                    )}
                  </>
                );
              })()}
            </div>
           </Card>
        )}

        {/* Cancel Reason Chart */}
        {activeTab === "Cancelled" && (() => {
          const allCancelled = orders.filter((o: any) => o.status === "cancelled");
          if (allCancelled.length === 0) return null;
          const reasonCounts: Record<string, number> = {};
          allCancelled.forEach((o: any) => {
            const reason = o.cancel_reason || "কারণ উল্লেখ নেই";
            reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
          });
          const sortedReasons = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1]);
          const maxCount = Math.max(...sortedReasons.map(([, c]) => c));
          const colors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-blue-500", "bg-violet-500", "bg-cyan-500", "bg-emerald-500", "bg-pink-500"];
          return (
            <Card className="p-4 border-border/40 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-destructive" />
                ক্যান্সেল কারণ বিশ্লেষণ
                <Badge variant="secondary" className="text-[10px]">{allCancelled.length}টি ক্যান্সেল</Badge>
              </h3>
              <div className="space-y-2.5">
                {sortedReasons.map(([reason, count], idx) => {
                  const pct = Math.round((count / allCancelled.length) * 100);
                  return (
                    <div key={reason} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground truncate max-w-[60%]">{reason}</span>
                        <span className="text-muted-foreground font-semibold">{count}টি ({pct}%)</span>
                      </div>
                      <div className="h-3 rounded-full bg-secondary/40 overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all duration-500", colors[idx % colors.length])}
                          style={{ width: `${(count / maxCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })()}

        {selectedOrderIds.size > 0 && (
          <Card className="p-3 border-primary/30 bg-primary/5 shadow-sm flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Checkbox checked={true} onCheckedChange={() => setSelectedOrderIds(new Set())} />
              <span className="text-sm font-semibold text-foreground">{selectedOrderIds.size}টি অর্ডার সিলেক্টেড</span>
            </div>
            <div className="h-5 w-px bg-border/60" />
            {/* Bulk Status Change */}
            <Select value={bulkStatusValue} onValueChange={(v) => { setBulkStatusValue(v); handleBulkStatusChange(v); }}>
              <SelectTrigger className="w-[150px] h-8 rounded-xl text-xs font-semibold border-border/60">
                <SelectValue placeholder="স্ট্যাটাস চেঞ্জ" />
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
            {/* Bulk Courier Assign */}
            <Select value={bulkCourierId} onValueChange={(v) => { setBulkCourierId(v); handleBulkCourierAssign(v); }}>
              <SelectTrigger className="w-[160px] h-8 rounded-xl text-xs font-semibold border-border/60">
                <Truck className="h-3.5 w-3.5 mr-1" />
                <SelectValue placeholder="কুরিয়ার অ্যাসাইন" />
              </SelectTrigger>
              <SelectContent>
                {courierProviders.map((cp: any) => (
                  <SelectItem key={cp.id} value={cp.id}>
                    <div className="flex items-center gap-2">
                      <Truck className="h-3 w-3" /> {cp.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Bulk Print */}
            <Button variant="outline" size="sm" className="gap-1.5 h-8 rounded-xl text-xs border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 dark:bg-violet-900/20 dark:border-violet-700 dark:text-violet-400" onClick={() => {
              const selectedOrders = filteredOrders.filter(o => selectedOrderIds.has(o.id));
              if (selectedOrders.length === 0) return;
              bulkPrint.handleBulkPrint();
            }}>
              <Printer className="h-3.5 w-3.5" /> মেমো প্রিন্ট ({selectedOrderIds.size})
            </Button>
            {/* Bulk Delete */}
            <Button variant="destructive" size="sm" className="gap-1.5 h-8 rounded-xl text-xs" onClick={handleBulkDelete}>
              <Trash2 className="h-3.5 w-3.5" /> ডিলিট
            </Button>
            <Button variant="ghost" size="sm" className="h-8 rounded-xl text-xs text-muted-foreground ml-auto" onClick={() => setSelectedOrderIds(new Set())}>
              <X className="h-3.5 w-3.5 mr-1" /> বাতিল
            </Button>
          </Card>
        )}

        {/* Advanced Filter Panel - Sheet on mobile, Collapsible on desktop */}
        {/* Mobile Filter Sheet */}
        <div className="sm:hidden">
          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 rounded-xl border-border/60 shadow-sm hover:shadow w-full justify-between">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-sm">ফিল্টার</span>
                  {activeFilterCount > 0 && (
                    <Badge className="h-5 min-w-[20px] px-1.5 text-[10px] font-bold">{activeFilterCount}</Badge>
                  )}
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-bold">
                      {filteredOrders.length}/{orders.length}
                    </Badge>
                  )}
                </div>
                <Filter className="h-4 w-4 text-muted-foreground" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl px-4">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <SlidersHorizontal className="h-5 w-5 text-primary" /> ফিল্টারিং
                  {activeFilterCount > 0 && <Badge className="text-xs">{activeFilterCount} ফিল্টার</Badge>}
                </SheetTitle>
              </SheetHeader>
              <ScrollArea className="h-[calc(85vh-80px)] mt-4 pr-2">
                {/* Filter content rendered below via shared component */}
                <MobileFilterContent
                  orderDateFilter={orderDateFilter} setOrderDateFilter={setOrderDateFilter}
                  customDateFrom={customDateFrom} setCustomDateFrom={setCustomDateFrom}
                  customDateTo={customDateTo} setCustomDateTo={setCustomDateTo}
                  filterSource={filterSource} setFilterSource={setFilterSource}
                  filterPhone={filterPhone} setFilterPhone={setFilterPhone}
                  filterAmountMin={filterAmountMin} setFilterAmountMin={setFilterAmountMin}
                  filterAmountMax={filterAmountMax} setFilterAmountMax={setFilterAmountMax}
                  filterDeviceType={filterDeviceType} setFilterDeviceType={setFilterDeviceType}
                  filterPaymentStatus={filterPaymentStatus} setFilterPaymentStatus={setFilterPaymentStatus}
                  filterCourierProvider={filterCourierProvider} setFilterCourierProvider={setFilterCourierProvider}
                  filterCourierStatus={filterCourierStatus} setFilterCourierStatus={setFilterCourierStatus}
                  filterCategory={filterCategory} setFilterCategory={setFilterCategory}
                  filterCourierCharged={filterCourierCharged} setFilterCourierCharged={setFilterCourierCharged}
                  filterSalesType={filterSalesType} setFilterSalesType={setFilterSalesType}
                  filterAddress={filterAddress} setFilterAddress={setFilterAddress}
                  filterNotes={filterNotes} setFilterNotes={setFilterNotes}
                  filterDistrict={filterDistrict} setFilterDistrict={setFilterDistrict}
                  filterThana={filterThana} setFilterThana={setFilterThana}
                  filterZone={filterZone} setFilterZone={setFilterZone}
                  filterProductInput={filterProductInput} setFilterProductInput={setFilterProductInput}
                  filterProductIds={filterProductIds} setFilterProductIds={setFilterProductIds}
                  filterProductFocused={filterProductFocused} setFilterProductFocused={setFilterProductFocused}
                  filteredFilterProducts={filteredFilterProducts}
                  courierProviders={courierProviders}
                  categories={categories}
                  clearAllFilters={clearAllFilters}
                  activeFilterCount={activeFilterCount}
                  filteredOrders={filteredOrders}
                  orders={orders}
                  onClose={() => setFiltersOpen(false)}
                />
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop Filter Collapsible */}
        <div className="hidden sm:block">
        <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 rounded-xl border-border/60 shadow-sm hover:shadow w-full justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-primary" />
                <span className="font-semibold">ফিল্টারিং</span>
                {activeFilterCount > 0 && (
                  <Badge className="h-5 min-w-[20px] px-1.5 text-[10px] font-bold">{activeFilterCount} ফিল্টার</Badge>
                )}
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-bold">
                    {filteredOrders.length}/{orders.length} অর্ডার
                  </Badge>
                )}
                {activeFilterCount > 0 && filteredOrders.length > 0 && (
                  <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-medium">
                    ৳{filteredOrders.reduce((s, o) => s + Number(o.total_amount), 0).toLocaleString()}
                  </Badge>
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
                  <Select value={filterSource || "all"} onValueChange={(v) => setFilterSource(v === "all" ? "" : v)}>
                    <SelectTrigger className="rounded-lg h-7 text-xs"><SelectValue placeholder="All" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {orderSources.map((src: any) => (
                        <SelectItem key={src.id} value={src.name}>{src.icon} {src.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold text-muted-foreground">Phone</Label>
                  <Input placeholder="Phone..." className="rounded-lg h-7 text-xs" value={filterPhone} onChange={(e) => setFilterPhone(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold text-muted-foreground">Address</Label>
                  <Input placeholder="Address..." className="rounded-lg h-7 text-xs" value={filterAddress} onChange={(e) => setFilterAddress(e.target.value)} />
                </div>
                <div className="space-y-1 relative">
                  <Label className="text-[10px] font-semibold text-muted-foreground">Product</Label>
                  {filterProductIds.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-1">
                      {filterProductIds.map(pid => {
                        const p = (allProducts || []).find((pr: any) => pr.id === pid);
                        return p ? (
                          <Badge key={pid} variant="secondary" className="text-[9px] py-0 px-1.5 gap-0.5">
                            {p.name.length > 15 ? p.name.slice(0, 15) + "…" : p.name}
                            <X className="h-2.5 w-2.5 cursor-pointer ml-0.5" onClick={() => setFilterProductIds(prev => prev.filter(id => id !== pid))} />
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  )}
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                    <Input
                      placeholder="প্রোডাক্ট সার্চ..."
                      className="rounded-lg h-7 text-xs pl-7"
                      value={filterProductInput}
                      onChange={(e) => setFilterProductInput(e.target.value)}
                      onFocus={() => setFilterProductFocused(true)}
                      onBlur={() => setTimeout(() => setFilterProductFocused(false), 200)}
                    />
                  </div>
                  {filterProductFocused && filteredFilterProducts.length > 0 && (
                    <div className="absolute z-50 left-0 right-0 top-full mt-1 border border-border rounded-lg max-h-48 overflow-y-auto bg-card shadow-lg">
                      {filteredFilterProducts.map((p: any) => {
                        const isSelected = filterProductIds.includes(p.id);
                        return (
                          <div
                            key={p.id}
                            className={cn("flex items-center gap-2 px-2.5 py-1.5 cursor-pointer hover:bg-accent/50 text-xs border-b border-border/30 last:border-b-0", isSelected && "bg-accent/30")}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              if (isSelected) {
                                setFilterProductIds(prev => prev.filter(id => id !== p.id));
                              } else {
                                setFilterProductIds(prev => [...prev, p.id]);
                              }
                            }}
                          >
                            {p.main_image_url ? (
                              <img src={p.main_image_url} alt="" className="w-7 h-7 rounded object-cover border border-border/50 flex-shrink-0" />
                            ) : (
                              <div className="w-7 h-7 rounded bg-muted flex items-center justify-center flex-shrink-0">
                                <Package className="h-3.5 w-3.5 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{p.name}</p>
                              <p className="text-[9px] text-muted-foreground">{p.product_code} • ৳{p.selling_price}</p>
                            </div>
                            {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0" />}
                          </div>
                        );
                      })}
                    </div>
                  )}
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
                      <SelectItem value="paid">✅ Paid</SelectItem>
                      <SelectItem value="unpaid">💰 Unpaid</SelectItem>
                      <SelectItem value="free_delivery">🆓 Free Delivery</SelectItem>
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
        </div>

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
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
            <Table className="w-full">
              <TableHeader>
                <TableRow className="bg-muted/30 border-b border-border/40">
                  <TableHead className="font-semibold text-xs text-muted-foreground px-3 py-2.5 w-[30px]">
                    <Checkbox 
                      checked={selectedOrderIds.size === filteredOrders.length && filteredOrders.length > 0}
                      onCheckedChange={(checked) => {
                        if (checked) setSelectedOrderIds(new Set(filteredOrders.map(o => o.id)));
                        else setSelectedOrderIds(new Set());
                      }}
                    />
                  </TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground px-3 py-2.5 uppercase tracking-wider">Order</TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground px-3 py-2.5 uppercase tracking-wider">Customer</TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground px-3 py-2.5 uppercase tracking-wider text-center">Products</TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground px-3 py-2.5 uppercase tracking-wider text-center">Amount</TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground px-3 py-2.5 uppercase tracking-wider text-center">Payment</TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground px-3 py-2.5 uppercase tracking-wider text-center">Status</TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground px-3 py-2.5 uppercase tracking-wider text-center">Courier</TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground px-3 py-2.5 uppercase tracking-wider text-center">Note</TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground px-3 py-2.5 uppercase tracking-wider text-center">Source</TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground px-3 py-2.5 uppercase tracking-wider text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order, idx) => {
                  const courierInfo = courierByOrderId[order.id];
                  const items = orderItemsByOrderId[order.id] || [];
                  const custStats = order.customer_phone ? customerStatsByPhone[order.customer_phone] : null;
                  const employeeName = assignmentByOrderId[order.id] || "";
                  return (
                  <TableRow key={order.id} className={cn("hover:bg-primary/5 cursor-pointer group border-l-[3px] transition-colors", idx % 2 === 0 ? "bg-background border-l-primary/40" : "bg-muted/20 border-l-transparent", selectedOrderIds.has(order.id) && "bg-primary/10 border-l-primary")} onClick={() => setDetailOrderId(order.id)}>
                    {/* Checkbox */}
                    <TableCell className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={selectedOrderIds.has(order.id)} onCheckedChange={(checked) => {
                        const newSet = new Set(selectedOrderIds);
                        if (checked) newSet.add(order.id); else newSet.delete(order.id);
                        setSelectedOrderIds(newSet);
                      }} />
                    </TableCell>
                    {/* ORDER: number, date, time */}
                    <TableCell className="px-3 py-3">
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-primary text-sm">#{order.order_number.replace(/^ORD-0*/, '')}</p>
                        {(order as any).memo_printed && (
                          <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-emerald-500/20 text-emerald-600" title="মেমো প্রিন্টেড">
                            <Printer className="h-2.5 w-2.5" />
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{format(new Date(order.created_at), "dd MMM yy")}</p>
                      <p className="text-[10px] text-muted-foreground">{format(new Date(order.created_at), "hh:mm a")}</p>
                    </TableCell>
                    {/* CUSTOMER: name, phone with call/copy/whatsapp, address */}
                    <TableCell className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                      <p className="font-semibold text-foreground text-sm cursor-pointer" onClick={() => setDetailOrderId(order.id)}>{order.customer_name}</p>
                      {order.customer_phone && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-xs font-mono text-primary font-semibold">{order.customer_phone}</span>
                          <a href={`tel:${order.customer_phone}`} className="h-5 w-5 rounded flex items-center justify-center hover:bg-emerald-500/10 text-emerald-600" title="কল করুন">
                            <Phone className="h-3 w-3" />
                          </a>
                          <button onClick={() => { navigator.clipboard.writeText(order.customer_phone || ""); toast.success("নম্বর কপি হয়েছে!"); }} className="h-5 w-5 rounded flex items-center justify-center hover:bg-secondary text-muted-foreground" title="কপি">
                            <Copy className="h-3 w-3" />
                          </button>
                          <a href={`https://wa.me/${(order.customer_phone || "").replace(/[^0-9]/g, "").replace(/^0/, "880")}`} target="_blank" rel="noopener noreferrer" className="h-5 w-5 rounded flex items-center justify-center hover:bg-emerald-500/10 text-emerald-600" title="WhatsApp">
                            <MessageSquare className="h-3 w-3" />
                          </a>
                          {custStats && custStats.total > 0 && (
                            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground ml-1">
                              <BarChart3 className="h-2.5 w-2.5" />
                              <span className="font-semibold">{custStats.total}</span>
                            </span>
                          )}
                        </div>
                      )}
                      {order.customer_address && (
                        <p className="text-[11px] text-muted-foreground mt-0.5 truncate max-w-[200px] cursor-pointer" onClick={() => setDetailOrderId(order.id)}>{order.customer_address}</p>
                      )}
                    </TableCell>
                    {/* PRODUCTS: show item image + name */}
                    <TableCell className="px-3 py-3">
                      {items.length > 0 ? (
                        <div className="space-y-1 max-w-[180px]">
                          {items.slice(0, 2).map((item: any, i: number) => {
                            const imgUrl = item.product_id ? productImageMap[item.product_id] : productImageMap[item.product_name];
                            return (
                              <div key={i} className="flex items-center gap-1.5">
                                {imgUrl ? (
                                  <img src={imgUrl} alt="" className="h-6 w-6 rounded object-cover shrink-0 border border-border/40" />
                                ) : (
                                  <div className="h-6 w-6 rounded bg-secondary/60 flex items-center justify-center shrink-0">
                                    <Package className="h-3 w-3 text-muted-foreground/40" />
                                  </div>
                                )}
                                <span className="text-[11px] text-foreground truncate">{item.product_name}</span>
                              </div>
                            );
                          })}
                          {items.length > 2 && (
                            <span className="text-[10px] text-muted-foreground">+{items.length - 2} আরো</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    {/* AMOUNT */}
                    <TableCell className="px-3 py-3 text-center">
                      <span className="text-base font-bold text-foreground">৳{Number(order.total_amount).toLocaleString()}</span>
                    </TableCell>
                    {/* PAYMENT: Paid/Unpaid toggle */}
                    <TableCell className="px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleTogglePaymentStatus(order.id, (order as any).payment_status || "unpaid")}
                        className="inline-block"
                      >
                        {((order as any).payment_status || "unpaid") === "paid" ? (
                          <Badge variant="outline" className="text-[11px] font-semibold border-emerald-300 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-700 dark:text-emerald-400 cursor-pointer">
                            ✅ Paid
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[11px] font-semibold border-orange-300 text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-700 dark:text-orange-400 cursor-pointer">
                            Unpaid
                          </Badge>
                        )}
                      </button>
                      <p className="text-[10px] text-muted-foreground mt-1">COD</p>
                    </TableCell>
                    {/* STATUS */}
                    <TableCell className="px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <Select value={order.status} onValueChange={(value) => handleStatusChange(order.id, value, order.status)}>
                        <SelectTrigger className="w-[130px] h-8 rounded-full text-xs border-0 px-3 font-semibold mx-auto"
                          style={{ backgroundColor: order.status === 'processing' ? '#3b82f6' : order.status === 'confirmed' ? '#059669' : order.status === 'inquiry' ? '#d97706' : order.status === 'cancelled' ? '#ef4444' : order.status === 'delivered' ? '#10b981' : order.status === 'in_courier' ? '#8b5cf6' : order.status === 'on_hold' ? '#eab308' : order.status === 'returned' ? '#f97316' : order.status === 'pending_return' ? '#f97316' : order.status === 'hand_delivery' ? '#06b6d4' : order.status === 'ship_later' ? '#14b8a6' : '#6b7280', color: 'white' }}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {([...["processing", "confirmed", "inquiry", "on_hold", "hand_delivery", "cancelled"] as const, ...(order.status === "pending_return" ? ["returned" as const] : []), ...(order.status === "inquiry" ? ["pending_return" as const] : [])]).map((s) => (
                            <SelectItem key={s} value={s}>
                              <div className="flex items-center gap-2">
                                <span className={`h-2 w-2 rounded-full ${getStatusColor(s as OrderStatus)}`} />
                                {getStatusLabel(s as OrderStatus)}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {order.status === "cancelled" && (order as any).cancel_reason && (
                        <p className="text-[10px] text-destructive mt-1 truncate max-w-[130px]" title={(order as any).cancel_reason}>
                          {(order as any).cancel_reason}
                        </p>
                      )}
                    </TableCell>
                    {/* COURIER: logo + name */}
                    <TableCell className="px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      {courierInfo ? (
                        <div className="flex items-center justify-center gap-1.5">
                          {courierInfo.logo_url ? (
                            <img src={courierInfo.logo_url} alt="" className="h-5 w-5 rounded object-contain" />
                          ) : (
                            <Truck className="h-3.5 w-3.5 text-violet-500" />
                          )}
                          <span className="text-xs font-medium text-foreground">{courierInfo.provider_name}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    {/* NOTE: inline view + add */}
                    <TableCell className="px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        {order.notes ? (
                          <Popover>
                            <PopoverTrigger asChild>
                              <button className="h-7 w-7 rounded-lg flex items-center justify-center bg-primary/10 hover:bg-primary/20 transition-colors text-primary" title="নোট দেখুন">
                                <MessageSquare className="h-3.5 w-3.5" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64 p-3 rounded-xl text-xs">
                              <p className="font-semibold text-foreground mb-1 text-[11px]">Staff Note</p>
                              <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{order.notes}</p>
                            </PopoverContent>
                          </Popover>
                        ) : (
                          <span className="h-7 w-7 rounded-lg flex items-center justify-center bg-muted/40 text-muted-foreground/40">
                            <MessageSquare className="h-3.5 w-3.5" />
                          </span>
                        )}
                        <Popover open={inlineNoteOrderId === order.id} onOpenChange={(open) => {
                          if (open) { setInlineNoteOrderId(order.id); setInlineNoteText(order.notes || ""); }
                          else { setInlineNoteOrderId(null); setInlineNoteText(""); }
                        }}>
                          <PopoverTrigger asChild>
                            <button className="h-7 w-7 rounded-lg flex items-center justify-center bg-primary/10 hover:bg-primary/20 transition-colors text-primary" title="নোট যোগ/এডিট করুন">
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-72 p-3 rounded-xl">
                            <p className="text-xs font-semibold text-foreground mb-2">নোট লিখুন</p>
                            <Textarea
                              placeholder="এখানে নোট লিখুন..."
                              rows={3}
                              className="rounded-lg text-xs mb-2"
                              value={inlineNoteText}
                              onChange={(e) => setInlineNoteText(e.target.value)}
                              autoFocus
                            />
                            <div className="flex gap-1.5">
                              <Button size="sm" className="flex-1 h-7 text-xs rounded-lg" onClick={() => handleInlineNoteSave(order.id, inlineNoteText)}>
                                সেভ করুন
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 text-xs rounded-lg" onClick={() => { setInlineNoteOrderId(null); setInlineNoteText(""); }}>
                                বাতিল
                              </Button>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </TableCell>
                    {/* SOURCE */}
                    <TableCell className="px-3 py-3 text-center">
                      {order.source ? (
                        <Badge variant="secondary" className="text-[10px] font-medium">
                          <Globe className="h-2.5 w-2.5 mr-1" />
                          {order.source}
                        </Badge>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">প্যানেল</span>
                      )}
                    </TableCell>
                    {/* ACTIONS */}
                    <TableCell className="px-3 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        {/* Activity Log Popover */}
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-secondary/60 transition-colors text-muted-foreground hover:text-foreground" title="Activity Log">
                              <History className="h-3.5 w-3.5" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80 p-0 rounded-xl max-h-[300px] overflow-y-auto" side="left">
                            <ActivityLogPopover orderId={order.id} />
                          </PopoverContent>
                        </Popover>
                        {/* Edit */}
                        <button className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-secondary/60 transition-colors text-muted-foreground hover:text-foreground" title="Edit" onClick={() => setDetailOrderId(order.id)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        {/* Block/Unblock Customer Toggle */}
                        {(() => {
                          const isBlocked = !!order.customer_phone && blockedPhoneSet.has(order.customer_phone);
                          return (
                            <button className={`h-7 w-7 rounded-lg flex items-center justify-center transition-colors ${isBlocked ? "bg-red-500/15 text-red-500 hover:bg-red-500/25" : "hover:bg-red-500/10 text-muted-foreground hover:text-red-500"}`} title={isBlocked ? "Unblock Customer" : "Block Customer"} onClick={async () => {
                              if (!order.customer_phone) { toast.error("ফোন নম্বর নেই!"); return; }
                              if (isBlocked) {
                                if (!confirm(`${order.customer_phone} আনব্লক করবেন?`)) return;
                                const { error } = await supabase.from("blocked_phones").delete().eq("phone_number", order.customer_phone);
                                if (error) { toast.error("আনব্লক ব্যর্থ: " + error.message); return; }
                                logActivity(order.id, "customer_unblocked", "phone", order.customer_phone, undefined, "কাস্টমার আনব্লক করা হয়েছে");
                                toast.success(`${order.customer_phone} আনব্লক হয়েছে!`);
                              } else {
                                if (!confirm(`${order.customer_phone} ব্লক করবেন? এই নম্বর থেকে আর অর্ডার আসবে না।`)) return;
                                const { error } = await supabase.from("blocked_phones").insert({ phone_number: order.customer_phone, reason: `Blocked from order ${order.order_number}`, blocked_by: user?.id || null } as any);
                                if (error) { toast.error("ব্লক ব্যর্থ: " + error.message); return; }
                                logActivity(order.id, "customer_blocked", "phone", undefined, order.customer_phone, "কাস্টমার ব্লক করা হয়েছে");
                                toast.success(`${order.customer_phone} ব্লক হয়েছে!`);
                              }
                              refetchBlockedPhones();
                            }}>
                              <Ban className="h-3.5 w-3.5" />
                            </button>
                          );
                        })()}
                        {/* Bill Print */}
                        <button className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground" title="বিল প্রিন্ট" onClick={async () => {
                          const { data: items } = await supabase.from("order_items").select("product_name, product_code, quantity, unit_price, total_price").eq("order_id", order.id);
                          const printW = window.open("", "_blank");
                          if (!printW) return;
                          const itemRows = (items || []).map((it: any) => `<tr><td>${it.product_name}</td><td style="text-align:center">${it.quantity}</td><td style="text-align:right">৳${it.unit_price}</td><td style="text-align:right">৳${it.total_price}</td></tr>`).join("");
                          printW.document.write(`<html><head><title>Bill - ${order.order_number}</title><style>
                            *{margin:0;padding:0;box-sizing:border-box}
                            body{font-family:'Segoe UI',sans-serif;padding:20px;font-size:13px;color:#111}
                            .bill{border:2px solid #000;max-width:400px;margin:auto;padding:20px}
                            .header{text-align:center;border-bottom:2px solid #000;padding-bottom:10px;margin-bottom:12px}
                            .header h2{font-size:18px;margin-bottom:2px}
                            .order-no{font-size:14px;font-weight:bold;color:#333}
                            .info{margin-bottom:10px}
                            .info .row{display:flex;justify-content:space-between;padding:2px 0}
                            .info .label{font-weight:600}
                            table{width:100%;border-collapse:collapse;margin:8px 0}
                            th{text-align:left;font-size:11px;color:#555;border-bottom:1px solid #999;padding:4px 2px}
                            td{padding:4px 2px;border-bottom:1px solid #eee;font-size:12px}
                            .divider{border-top:2px dashed #999;margin:10px 0}
                            .total{font-size:16px;font-weight:bold;background:#f5f5f5;padding:8px;border-radius:4px;display:flex;justify-content:space-between}
                            .footer{text-align:center;font-size:10px;color:#999;margin-top:12px;padding-top:6px;border-top:1px solid #eee}
                            @media print{body{padding:0}}
                          </style></head><body>
                            <div class="bill">
                              <div class="header">
                                <h2>কাস্টমার বিল</h2>
                                <div class="order-no">#${order.order_number}</div>
                                <div style="font-size:11px;color:#666">${format(new Date(order.created_at), "dd MMM yyyy, hh:mm a")}</div>
                              </div>
                              <div class="info">
                                <div class="row"><span class="label">নাম:</span><span>${order.customer_name}</span></div>
                                <div class="row"><span class="label">ফোন:</span><span>${order.customer_phone || "—"}</span></div>
                                <div class="row"><span class="label">ঠিকানা:</span><span>${order.customer_address || "—"}</span></div>
                              </div>
                              <table><thead><tr><th>প্রোডাক্ট</th><th style="text-align:center">পরিমাণ</th><th style="text-align:right">দাম</th><th style="text-align:right">মোট</th></tr></thead><tbody>${itemRows || '<tr><td colspan="4" style="text-align:center;color:#999">কোনো আইটেম নেই</td></tr>'}</tbody></table>
                              <div class="divider"></div>
                              <div class="info">
                                <div class="row"><span class="label">সাবটোটাল:</span><span>৳${order.product_cost || 0}</span></div>
                                <div class="row"><span class="label">ডেলিভারি চার্জ:</span><span>৳${order.delivery_charge}</span></div>
                                ${Number(order.discount) > 0 ? `<div class="row"><span class="label">ডিসকাউন্ট:</span><span>-৳${order.discount}</span></div>` : ""}
                              </div>
                              <div class="divider"></div>
                              <div class="total"><span>মোট:</span><span>৳${order.total_amount}</span></div>
                              <div class="footer">ধন্যবাদ আপনার অর্ডারের জন্য!<br/>তারিখ: ${format(new Date(), "dd/MM/yyyy")}</div>
                            </div>
                          </body></html>`);
                          printW.document.close();
                          setTimeout(() => {
                            printW.print();
                            printW.onafterprint = () => printW.close();
                          }, 300);
                        }}>
                          <FileText className="h-3.5 w-3.5" />
                        </button>
                        {/* Delete */}
                        <button className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive" title="Delete" onClick={() => { if (confirm("অর্ডারটি ডিলিট করবেন?")) deleteOrder.mutate(order.id); }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            </div>

            {/* Mobile Card Layout */}
            <div className="md:hidden divide-y divide-border/30">
              {filteredOrders.map((order, idx) => {
                const items = orderItemsByOrderId[order.id] || [];
                const custStats = order.customer_phone ? customerStatsByPhone[order.customer_phone] : null;
                const courierInfo = courierByOrderId[order.id];
                return (
                  <div key={order.id} className="p-3 space-y-2 active:bg-secondary/30 border-b border-border/20 last:border-b-0" onClick={() => setDetailOrderId(order.id)}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Checkbox checked={selectedOrderIds.has(order.id)} onCheckedChange={(checked) => {
                          const newSet = new Set(selectedOrderIds);
                          if (checked) newSet.add(order.id); else newSet.delete(order.id);
                          setSelectedOrderIds(newSet);
                        }} onClick={(e) => e.stopPropagation()} />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-primary text-sm">#{order.order_number.replace(/^ORD-0*/, '')}</span>
                            {(order as any).memo_printed && (
                              <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-emerald-500/20 text-emerald-600">
                                <Printer className="h-2.5 w-2.5" />
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground">{format(new Date(order.created_at), "dd MMM yy, hh:mm a")}</p>
                        </div>
                      </div>
                      <span className="text-base font-bold text-foreground">৳{Number(order.total_amount).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground truncate">{order.customer_name}</p>
                        {order.customer_phone && (
                          <div className="flex items-center gap-1.5 mt-0.5" onClick={(e) => e.stopPropagation()}>
                            <span className="text-xs font-mono text-primary">{order.customer_phone}</span>
                            <a href={`tel:${order.customer_phone}`} className="h-5 w-5 rounded flex items-center justify-center bg-emerald-500/10 text-emerald-600">
                              <Phone className="h-3 w-3" />
                            </a>
                            <button onClick={() => { navigator.clipboard.writeText(order.customer_phone || ""); toast.success("কপি!"); }} className="h-5 w-5 rounded flex items-center justify-center bg-secondary text-muted-foreground">
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        <Select value={order.status} onValueChange={(value) => handleStatusChange(order.id, value, order.status)}>
                          <SelectTrigger className="w-[105px] h-7 rounded-full text-[10px] border-0 px-2 font-semibold"
                            style={{ backgroundColor: order.status === 'processing' ? '#3b82f6' : order.status === 'confirmed' ? '#059669' : order.status === 'cancelled' ? '#ef4444' : order.status === 'delivered' ? '#10b981' : order.status === 'in_courier' ? '#8b5cf6' : order.status === 'on_hold' ? '#eab308' : order.status === 'returned' ? '#f97316' : '#6b7280', color: 'white' }}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {([...["processing", "confirmed", "inquiry", "on_hold", "hand_delivery", "cancelled"] as const, ...(order.status === "pending_return" ? ["returned" as const] : []), ...(order.status === "inquiry" ? ["pending_return" as const] : [])]).map((s) => (
                              <SelectItem key={s} value={s}>
                                <div className="flex items-center gap-2">
                                  <span className={`h-2 w-2 rounded-full ${getStatusColor(s as OrderStatus)}`} />
                                  {getStatusLabel(s as OrderStatus)}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {/* Items + courier + payment row */}
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <span>{items.length} items</span>
                        <span>·</span>
                        {courierInfo ? (
                          <span className="flex items-center gap-1">
                            <Truck className="h-3 w-3 text-violet-500" />
                            {courierInfo.provider_name}
                          </span>
                        ) : (
                          <span>No courier</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {((order as any).payment_status || "unpaid") === "paid" && (
                          <Badge variant="outline" className="text-[9px] h-4 border-emerald-300 text-emerald-600 bg-emerald-50 px-1">✅ Paid</Badge>
                        )}
                        {order.source && <span className="bg-secondary/60 px-1.5 py-0.5 rounded text-[10px]">{order.source}</span>}
                      </div>
                    </div>
                    {order.status === "cancelled" && (order as any).cancel_reason && (
                      <p className="text-[10px] text-destructive bg-destructive/5 px-2 py-1 rounded-lg truncate">
                        {(order as any).cancel_reason}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
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

  // Courier selection for edit
  const [editCourierId, setEditCourierId] = useState<string | null>(null);
  const [editCourierCityId, setEditCourierCityId] = useState<string | null>(null);
  const [editCourierZoneId, setEditCourierZoneId] = useState<string | null>(null);
  const [editCourierAreaId, setEditCourierAreaId] = useState<string | null>(null);

  // Courier providers
  const { data: editCourierProviders = [] } = useQuery({
    queryKey: ["courier-providers-filter"],
    queryFn: async () => {
      const { data, error } = await supabase.from("courier_providers").select("id, name, slug, is_active, api_configs");
      if (error) throw error;
      return (data || []).filter((cp: any) => {
        if (!cp.is_active) return false;
        const configs = Array.isArray(cp.api_configs) ? cp.api_configs : JSON.parse(cp.api_configs || "[]");
        return configs.length > 0 && configs.some((c: any) => c.api_key);
      });
    },
  });

  // Existing courier order for this order
  const { data: existingCourierOrder } = useQuery({
    queryKey: ["courier-order-detail", orderId],
    queryFn: async () => {
      const { data, error } = await supabase.from("courier_orders").select("*").eq("order_id", orderId!).order("submitted_at", { ascending: false }).limit(1);
      if (error) throw error;
      return data?.[0] || null;
    },
    enabled: !!orderId,
  });

  // Courier location hooks
  const { data: editCourierCities = [], isLoading: editCitiesLoading } = useCourierCities(editCourierId);
  const { data: editCourierZones = [], isLoading: editZonesLoading } = useCourierZones(editCourierId, editCourierCityId);
  const { data: editCourierAreas = [], isLoading: editAreasLoading } = useCourierAreas(editCourierId, editCourierZoneId);
  const [editStatus, setEditStatus] = useState<string>("");
  const [detailCancelDialogOpen, setDetailCancelDialogOpen] = useState(false);
  const [detailCancelReason, setDetailCancelReason] = useState("");
  const [detailCancelCustom, setDetailCancelCustom] = useState("");
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
      setEditStatus(order.status || "");
    }
  }, [orderRef]);

  // Populate courier when existing courier order loads
  useMemo(() => {
    if (existingCourierOrder) {
      setEditCourierId(existingCourierOrder.courier_provider_id || null);
    } else {
      setEditCourierId(null);
    }
    setEditCourierCityId(null);
    setEditCourierZoneId(null);
    setEditCourierAreaId(null);
  }, [existingCourierOrder?.id, orderRef]);

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

  const handleStatusChange = async (newStatus: string) => {
    if (!orderId || !order || newStatus === order.status) return;
    if (newStatus === "cancelled") {
      setDetailCancelReason("");
      setDetailCancelCustom("");
      setDetailCancelDialogOpen(true);
      return;
    }
    try {
      const { error } = await supabase.from("orders").update({ status: newStatus as any }).eq("id", orderId);
      if (error) throw error;
      await logActivity("status_changed", "status", order.status, newStatus, `স্ট্যাটাস পরিবর্তন: ${getStatusLabel(order.status as any)} → ${getStatusLabel(newStatus as any)}`);
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order-counts"] });
      queryClient.invalidateQueries({ queryKey: ["order-activity-logs", orderId] });
      toast.success("স্ট্যাটাস আপডেট হয়েছে!");
    } catch (e: any) { toast.error(e.message); }
  };

  const confirmDetailCancel = async () => {
    if (!orderId || !order) return;
    const reason = detailCancelReason === "others" ? detailCancelCustom : detailCancelReason;
    try {
      const { error } = await supabase.from("orders").update({ status: "cancelled" as any, cancel_reason: reason } as any).eq("id", orderId);
      if (error) throw error;
      await logActivity("status_changed", "status", order.status, "cancelled", `কারণ: ${reason}`);
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order-counts"] });
      queryClient.invalidateQueries({ queryKey: ["order-activity-logs", orderId] });
      setDetailCancelDialogOpen(false);
      toast.success("অর্ডার ক্যান্সেল হয়েছে!");
    } catch (e: any) { toast.error(e.message); }
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

      // Save courier selection
      const courierChanged = editCourierId !== (existingCourierOrder?.courier_provider_id || null);
      if (courierChanged && editCourierId) {
        if (existingCourierOrder) {
          await supabase.from("courier_orders").update({ courier_provider_id: editCourierId } as any).eq("id", existingCourierOrder.id);
        } else {
          await supabase.from("courier_orders").insert({ order_id: orderId, courier_provider_id: editCourierId, courier_status: "pending" } as any);
        }
        await logActivity("field_edited", "courier", existingCourierOrder?.courier_provider_id || "none", editCourierId);
        queryClient.invalidateQueries({ queryKey: ["courier-orders-filter"] });
        queryClient.invalidateQueries({ queryKey: ["courier-order-detail", orderId] });
      }

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
        onClose();
      } else if (courierChanged) {
        toast.success("কুরিয়ার আপডেট হয়েছে!");
        onClose();
      } else {
        onClose();
      }
    } catch (e: any) {
      toast.error("আপডেট ব্যর্থ: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Recalculate product_cost & total_amount from order_items
  const recalcOrderTotals = async () => {
    if (!orderId || !order) return;
    try {
      const { data: freshItems, error } = await supabase.from("order_items").select("total_price").eq("order_id", orderId);
      if (error) throw error;
      const newProductCost = (freshItems || []).reduce((s: number, i: any) => s + Number(i.total_price), 0);
      const newTotal = newProductCost + Number(order.delivery_charge) - Number(order.discount);
      await supabase.from("orders").update({ product_cost: newProductCost, total_amount: newTotal }).eq("id", orderId);
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order-counts"] });
    } catch (e) { console.error("Recalc error:", e); }
  };

  const addProductToDetailOrder = async (product: any) => {
    if (!orderId) return;
    try {
      // Check if product already exists in order items — merge by incrementing qty
      const existingItem = items.find((i: any) => i.product_id === product.id || (i.product_name === product.name && i.product_code === product.product_code));
      if (existingItem) {
        const newQty = (existingItem.quantity || 1) + 1;
        const newTotal = newQty * Number(existingItem.unit_price);
        const { error } = await supabase.from("order_items").update({ quantity: newQty, total_price: newTotal }).eq("id", existingItem.id);
        if (error) throw error;
        await logActivity("field_edited", "order_items", `${existingItem.quantity}`, `${newQty}`, `${product.name} কোয়ান্টিটি বাড়ানো হয়েছে`);
      } else {
        const { error } = await supabase.from("order_items").insert({
          order_id: orderId, product_id: product.id, product_name: product.name,
          product_code: product.product_code, quantity: 1, unit_price: Number(product.selling_price), total_price: Number(product.selling_price),
        });
        if (error) throw error;
        await logActivity("field_edited", "order_items", undefined, undefined, `প্রোডাক্ট যোগ করা হয়েছে: ${product.name}`);
      }
      queryClient.invalidateQueries({ queryKey: ["order-items", orderId] });
      queryClient.invalidateQueries({ queryKey: ["all-order-items-filter"] });
      setDetailProductSearch("");
      setDetailProductFocused(false);
      await recalcOrderTotals();
      toast.success(existingItem ? "কোয়ান্টিটি বাড়ানো হয়েছে!" : "প্রোডাক্ট যোগ হয়েছে!");
    } catch (e: any) { toast.error(e.message); }
  };

  const updateDetailItemQty = async (item: any, newQty: number) => {
    if (!orderId) return;
    try {
      if (newQty <= 0) {
        const { error } = await supabase.from("order_items").delete().eq("id", item.id);
        if (error) throw error;
        await logActivity("field_edited", "order_items", undefined, undefined, `${item.product_name} রিমুভ করা হয়েছে`);
        toast.success("আইটেম রিমুভ হয়েছে!");
      } else {
        const newTotal = newQty * Number(item.unit_price);
        const { error } = await supabase.from("order_items").update({ quantity: newQty, total_price: newTotal }).eq("id", item.id);
        if (error) throw error;
      }
      queryClient.invalidateQueries({ queryKey: ["order-items", orderId] });
      queryClient.invalidateQueries({ queryKey: ["all-order-items-filter"] });
      await recalcOrderTotals();
    } catch (e: any) { toast.error(e.message); }
  };

  const updateDetailItemPrice = async (item: any, newPrice: number) => {
    if (!orderId || newPrice < 0) return;
    try {
      const newTotal = item.quantity * newPrice;
      const { error } = await supabase.from("order_items").update({ unit_price: newPrice, total_price: newTotal }).eq("id", item.id);
      if (error) throw error;
      await logActivity("field_edited", "order_items", `৳${item.unit_price}`, `৳${newPrice}`, `${item.product_name} ইউনিট প্রাইস পরিবর্তন`);
      queryClient.invalidateQueries({ queryKey: ["order-items", orderId] });
      queryClient.invalidateQueries({ queryKey: ["all-order-items-filter"] });
      await recalcOrderTotals();
    } catch (e: any) { toast.error(e.message); }
  };

  const removeDetailItem = async (item: any) => {
    if (!orderId) return;
    try {
      const { error } = await supabase.from("order_items").delete().eq("id", item.id);
      if (error) throw error;
      await logActivity("field_edited", "order_items", undefined, undefined, `${item.product_name} রিমুভ করা হয়েছে`);
      queryClient.invalidateQueries({ queryKey: ["order-items", orderId] });
      queryClient.invalidateQueries({ queryKey: ["all-order-items-filter"] });
      await recalcOrderTotals();
      toast.success("আইটেম রিমুভ হয়েছে!");
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
          <div className="space-y-6">
            {/* Customer Info - Editable */}
            <div className="p-4 rounded-2xl bg-secondary/20 border border-border/40 space-y-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center"><Phone className="h-3.5 w-3.5 text-primary" /></div>
                কাস্টমার তথ্য
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">কাস্টমারের নাম</Label>
                  <Input className="rounded-xl h-10 text-sm" value={editName} onChange={(e) => setEditName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">ফোন নম্বর</Label>
                  <Input className="rounded-xl h-10 text-sm" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
                </div>
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
              <Label className="text-xs font-semibold text-muted-foreground">ঠিকানা</Label>
              <Textarea className="rounded-xl text-sm" rows={2} value={editAddress} onChange={(e) => setEditAddress(e.target.value)} />
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

            {/* Courier Selection for Edit */}
            <div className="p-4 rounded-2xl bg-secondary/20 border border-border/40 space-y-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <div className="h-6 w-6 rounded-lg bg-violet-500/10 flex items-center justify-center"><Truck className="h-3.5 w-3.5 text-violet-500" /></div>
                কুরিয়ার সিলেক্ট
              </h3>
              <Select value={editCourierId || ""} onValueChange={(v) => {
                setEditCourierId(v || null);
                setEditCourierCityId(null);
                setEditCourierZoneId(null);
                setEditCourierAreaId(null);
              }}>
                <SelectTrigger className="rounded-xl h-9 text-sm">
                  <SelectValue placeholder="কুরিয়ার সিলেক্ট করুন" />
                </SelectTrigger>
                <SelectContent>
                  {editCourierProviders.map((cp: any) => (
                    <SelectItem key={cp.id} value={cp.id}>
                      <div className="flex items-center gap-2">
                        <Truck className="h-3.5 w-3.5" /> {cp.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {editCourierId && (
                <Badge variant="outline" className="text-xs gap-1">
                  <Truck className="h-3 w-3" />
                  {editCourierProviders.find((cp: any) => cp.id === editCourierId)?.name || ""}
                </Badge>
              )}

              {/* City/Zone/Area from Courier API for Edit */}
              {editCourierId && (
                <div className="p-3 rounded-xl bg-background border border-border/30 space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    📍 {editCourierProviders.find((cp: any) => cp.id === editCourierId)?.name} এরিয়া সিলেক্ট
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold text-muted-foreground">City</Label>
                  <Select value={editCourierCityId || ""} onValueChange={(v) => {
                    setEditCourierCityId(v || null);
                    setEditCourierZoneId(null);
                    setEditCourierAreaId(null);
                  }}>
                    <SelectTrigger className="rounded-lg h-8 text-xs">
                      <SelectValue placeholder={editCitiesLoading ? "লোড হচ্ছে..." : "City সিলেক্ট করুন"} />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {editCourierCities.map((c: any) => (
                        <SelectItem key={String(c.id)} value={String(c.id)}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold text-muted-foreground">Zone</Label>
                  <Select value={editCourierZoneId || ""} onValueChange={(v) => {
                    setEditCourierZoneId(v || null);
                    setEditCourierAreaId(null);
                  }} disabled={!editCourierCityId}>
                    <SelectTrigger className="rounded-lg h-8 text-xs">
                      <SelectValue placeholder={editZonesLoading ? "লোড হচ্ছে..." : "Zone সিলেক্ট করুন"} />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {editCourierZones.map((z: any) => (
                        <SelectItem key={String(z.id)} value={String(z.id)}>{z.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold text-muted-foreground">Area/Thana</Label>
                  <Select value={editCourierAreaId || ""} onValueChange={setEditCourierAreaId} disabled={!editCourierZoneId}>
                    <SelectTrigger className="rounded-lg h-8 text-xs">
                      <SelectValue placeholder={editAreasLoading ? "লোড হচ্ছে..." : "Area সিলেক্ট করুন"} />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {editCourierAreas.map((a: any) => (
                        <SelectItem key={String(a.id)} value={String(a.id)}>{a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                </div>
              </div>
              )}
            </div>

            {/* Courier Tracking Info */}
            {existingCourierOrder && (
              <div className="p-4 rounded-2xl bg-violet-500/5 border border-violet-500/20 space-y-3">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <div className="h-6 w-6 rounded-lg bg-violet-500/10 flex items-center justify-center"><Package className="h-3.5 w-3.5 text-violet-500" /></div>
                  কুরিয়ার ট্র্যাকিং তথ্য
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {existingCourierOrder.tracking_id && (
                    <div className="space-y-1">
                      <Label className="text-[10px] font-semibold text-muted-foreground">ট্র্যাকিং আইডি</Label>
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono font-semibold text-foreground bg-secondary/50 px-2 py-1 rounded-lg">{existingCourierOrder.tracking_id}</code>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { navigator.clipboard.writeText(existingCourierOrder.tracking_id!); toast.success("কপি হয়েছে!"); }}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                  {existingCourierOrder.consignment_id && (
                    <div className="space-y-1">
                      <Label className="text-[10px] font-semibold text-muted-foreground">কনসাইনমেন্ট আইডি</Label>
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono font-semibold text-foreground bg-secondary/50 px-2 py-1 rounded-lg">{existingCourierOrder.consignment_id}</code>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { navigator.clipboard.writeText(existingCourierOrder.consignment_id!); toast.success("কপি হয়েছে!"); }}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                  <div className="space-y-1">
                    <Label className="text-[10px] font-semibold text-muted-foreground">কুরিয়ার স্ট্যাটাস</Label>
                    <Badge variant="outline" className="text-xs font-semibold capitalize">{existingCourierOrder.courier_status}</Badge>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-semibold text-muted-foreground">সাবমিট তারিখ</Label>
                    <p className="text-xs text-foreground">{format(new Date(existingCourierOrder.submitted_at), "dd MMM yyyy, hh:mm a")}</p>
                  </div>
                </div>
                {/* Extended courier response data */}
                {existingCourierOrder.courier_response && typeof existingCourierOrder.courier_response === 'object' && (
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/30">
                    {(existingCourierOrder.courier_response as any).rider_name && (
                      <div className="text-xs"><span className="text-muted-foreground">রাইডার:</span> <span className="font-medium text-foreground">{(existingCourierOrder.courier_response as any).rider_name}</span></div>
                    )}
                    {(existingCourierOrder.courier_response as any).rider_phone && (
                      <div className="text-xs"><span className="text-muted-foreground">রাইডার ফোন:</span> <span className="font-medium text-foreground">{(existingCourierOrder.courier_response as any).rider_phone}</span></div>
                    )}
                    {(existingCourierOrder.courier_response as any).area && (
                      <div className="text-xs"><span className="text-muted-foreground">এরিয়া:</span> <span className="font-medium text-foreground">{(existingCourierOrder.courier_response as any).area}</span></div>
                    )}
                    {(existingCourierOrder.courier_response as any).delivery_fee !== undefined && (
                      <div className="text-xs"><span className="text-muted-foreground">ডেলিভারি ফি:</span> <span className="font-medium text-foreground">৳{(existingCourierOrder.courier_response as any).delivery_fee}</span></div>
                    )}
                    {(existingCourierOrder.courier_response as any).cod_amount !== undefined && (
                      <div className="text-xs"><span className="text-muted-foreground">COD:</span> <span className="font-medium text-foreground">৳{(existingCourierOrder.courier_response as any).cod_amount}</span></div>
                    )}
                    {(existingCourierOrder.courier_response as any).delivery_date && (
                      <div className="text-xs"><span className="text-muted-foreground">ডেলিভারি তারিখ:</span> <span className="font-medium text-foreground">{(existingCourierOrder.courier_response as any).delivery_date}</span></div>
                    )}
                    {(existingCourierOrder.courier_response as any).return_reason && (
                      <div className="text-xs col-span-2"><span className="text-muted-foreground">রিটার্ন কারণ:</span> <span className="font-medium text-destructive">{(existingCourierOrder.courier_response as any).return_reason}</span></div>
                    )}
                  </div>
                )}
                {!existingCourierOrder.tracking_id && !existingCourierOrder.consignment_id && (
                  <p className="text-xs text-muted-foreground italic">ট্র্যাকিং/কনসাইনমেন্ট আইডি এখনো পাওয়া যায়নি। কুরিয়ার ওয়েবহুক থেকে আপডেট হবে।</p>
                )}
              </div>
            )}

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
                      onClick={() => { addProductToDetailOrder(p); }}
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
                  {items.map((item: any) => {
                    const imgUrl = item.product_id 
                      ? allProducts.find((p: any) => p.id === item.product_id)?.main_image_url 
                      : allProducts.find((p: any) => p.name === item.product_name)?.main_image_url;
                    return (
                    <div key={item.id} className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/30 border border-border/40">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {imgUrl ? (
                          <img src={imgUrl} alt="" className="h-10 w-10 rounded-lg object-cover border border-border/40 flex-shrink-0" />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-secondary/60 flex items-center justify-center flex-shrink-0">
                            <Package className="h-4 w-4 text-muted-foreground/40" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{item.product_name}</p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <span>{item.product_code} ·</span>
                            <span>৳</span>
                            <input
                              type="number"
                              defaultValue={Number(item.unit_price)}
                              className="w-16 bg-transparent border-b border-dashed border-muted-foreground/40 hover:border-primary focus:border-primary focus:outline-none text-xs font-medium text-foreground"
                              onBlur={(e) => {
                                const val = Number(e.target.value);
                                if (val !== Number(item.unit_price) && val >= 0) updateDetailItemPrice(item, val);
                              }}
                              onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="flex items-center gap-1">
                          <button onClick={() => updateDetailItemQty(item, item.quantity - 1)} className="h-7 w-7 rounded-lg border border-border flex items-center justify-center hover:bg-secondary text-foreground">−</button>
                          <span className="w-8 text-center text-sm font-semibold text-foreground">{item.quantity}</span>
                          <button onClick={() => updateDetailItemQty(item, item.quantity + 1)} className="h-7 w-7 rounded-lg border border-border flex items-center justify-center hover:bg-secondary text-foreground">+</button>
                        </div>
                        <span className="font-semibold text-foreground w-20 text-right">৳{Number(item.total_price).toLocaleString()}</span>
                        <button onClick={() => removeDetailItem(item)} className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    );
                  })}
                  <div className="flex justify-between items-center pt-2 border-t border-border/40">
                    <span className="text-xs text-muted-foreground">{items.length}টি আইটেম</span>
                    <span className="text-sm font-bold text-primary">৳{itemsTotal.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Financial */}
            <div className="p-4 rounded-2xl bg-secondary/20 border border-border/40 space-y-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <div className="h-6 w-6 rounded-lg bg-emerald-500/10 flex items-center justify-center">৳</div>
                মূল্য হিসাব
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">প্রোডাক্ট খরচ (৳)</Label>
                  <Input type="number" className="rounded-xl h-10 text-sm font-medium" value={Number(order.product_cost)} disabled />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">ডেলিভারি চার্জ (৳)</Label>
                  <Input type="number" className="rounded-xl h-10 text-sm font-medium" value={editDelivery} onChange={(e) => setEditDelivery(Number(e.target.value))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">ডিসকাউন্ট (৳)</Label>
                  <Input type="number" className="rounded-xl h-10 text-sm font-medium" value={editDiscount} onChange={(e) => setEditDiscount(Number(e.target.value))} />
                </div>
              </div>
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground">প্রোডাক্ট + ডেলিভারি − ডিসকাউন্ট</p>
                  <p className="text-xs text-muted-foreground font-medium">
                    ৳{Number(order.product_cost).toLocaleString()} + ৳{editDelivery.toLocaleString()} − ৳{editDiscount.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-primary font-semibold">সর্বমোট</p>
                  <p className="text-3xl font-bold text-primary">৳{(Number(order.product_cost) + editDelivery - editDiscount).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Dual Notes */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><MessageSquare className="h-3 w-3" /> স্টাফ নোট</Label>
                <Textarea rows={2} className="rounded-xl text-sm" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Truck className="h-3 w-3" /> কুরিয়ার নোট</Label>
                <Textarea rows={2} className="rounded-xl text-sm" value={editCourierNote} onChange={(e) => setEditCourierNote(e.target.value)} />
              </div>
            </div>

            {/* Status Change */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold flex items-center gap-1.5">
                <Activity className="h-4 w-4 text-primary" /> স্ট্যাটাস পরিবর্তন
              </Label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: "processing", label: "New Order", color: "bg-blue-500", icon: Clock },
                  { value: "confirmed", label: "Confirmed", color: "bg-emerald-600", icon: CheckCircle2 },
                  { value: "inquiry", label: "Inquiry", color: "bg-amber-600", icon: Clock },
                  { value: "on_hold", label: "Hold", color: "bg-yellow-500", icon: PauseCircle },
                  { value: "hand_delivery", label: "Hand Delivery", color: "bg-cyan-500", icon: Hand },
                  { value: "cancelled", label: "Cancelled", color: "bg-red-500", icon: XCircle },
                  ...(order.status === "pending_return" ? [{ value: "returned", label: "Return", color: "bg-red-400", icon: RotateCcw }] : []),
                  ...(order.status === "inquiry" ? [{ value: "pending_return", label: "Pending Return", color: "bg-orange-500", icon: RotateCcw }] : []),
                ].map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => handleStatusChange(s.value)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold border-2 transition-all duration-200",
                      order.status === s.value
                        ? `${s.color} text-white border-transparent shadow-lg scale-[1.02]`
                        : "bg-secondary/30 text-foreground border-border/40 hover:border-primary/30 hover:bg-secondary/50"
                    )}
                  >
                    <s.icon className="h-3.5 w-3.5" />
                    {s.label}
                  </button>
                ))}
              </div>
              </div>
              {/* Show existing cancel reason */}
              {order.status === "cancelled" && (order as any).cancel_reason && (
                <div className="p-3 rounded-xl border border-destructive/30 bg-destructive/5">
                  <p className="text-xs font-semibold text-destructive flex items-center gap-1 mb-1"><XCircle className="h-3.5 w-3.5" /> ক্যান্সেল কারণ</p>
                  <p className="text-sm text-foreground">{(order as any).cancel_reason}</p>
                </div>
              )}

              {/* Detail Cancel Reason Dialog */}
              <Dialog open={detailCancelDialogOpen} onOpenChange={setDetailCancelDialogOpen}>
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
                        detailCancelReason === reason ? "border-primary bg-primary/5" : "border-border/40 hover:bg-secondary/30"
                      )}>
                        <input type="radio" name="detail_cancel_reason" className="accent-primary" checked={detailCancelReason === reason} onChange={() => setDetailCancelReason(reason)} />
                        <span className="text-sm font-medium">{reason}</span>
                      </label>
                    ))}
                    <label className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                      detailCancelReason === "others" ? "border-primary bg-primary/5" : "border-border/40 hover:bg-secondary/30"
                    )}>
                      <input type="radio" name="detail_cancel_reason" className="accent-primary" checked={detailCancelReason === "others"} onChange={() => setDetailCancelReason("others")} />
                      <span className="text-sm font-medium">Others (নিজে লিখুন)</span>
                    </label>
                    {detailCancelReason === "others" && (
                      <Textarea placeholder="ক্যান্সেলের কারণ লিখুন..." className="rounded-xl" value={detailCancelCustom} onChange={(e) => setDetailCancelCustom(e.target.value)} rows={2} />
                    )}
                    <Button className="w-full rounded-xl" variant="destructive" onClick={confirmDetailCancel} disabled={!detailCancelReason || (detailCancelReason === "others" && !detailCancelCustom.trim())}>
                      ক্যান্সেল নিশ্চিত করুন
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

            {/* Device & Tracking Info */}
            <Collapsible>
              <CollapsibleTrigger className="w-full flex items-center justify-between p-4 rounded-2xl bg-secondary/20 border border-border/40 hover:bg-secondary/30 transition-colors">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <div className="h-6 w-6 rounded-lg bg-blue-500/10 flex items-center justify-center"><Smartphone className="h-3.5 w-3.5 text-blue-500" /></div>
                  ডিভাইস ও ট্র্যাকিং তথ্য
                </h3>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform" />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 p-4 rounded-2xl bg-secondary/10 border border-border/30 space-y-3">
                {(() => {
                  const ua = order.user_agent || "";
                  // Parse device info from user_agent
                  const isMobile = /Mobile|Android|iPhone|iPod/i.test(ua);
                  const isTablet = /iPad|Tablet/i.test(ua);
                  const deviceType = isTablet ? "Tablet" : isMobile ? "Mobile" : "Desktop";

                  let osName = "Unknown";
                  if (/Android/i.test(ua)) { const v = ua.match(/Android\s([\d.]+)/)?.[1] || ""; osName = `Android ${v}`.trim(); }
                  else if (/iPhone|iPad/i.test(ua)) { const v = ua.match(/OS\s([\d_]+)/)?.[1]?.replace(/_/g, ".") || ""; osName = `iOS ${v}`.trim(); }
                  else if (/Mac OS X/i.test(ua)) { const v = ua.match(/Mac OS X\s([\d_.]+)/)?.[1]?.replace(/_/g, ".") || ""; osName = `macOS ${v}`.trim(); }
                  else if (/Windows/i.test(ua)) { const v = ua.match(/Windows NT\s([\d.]+)/)?.[1] || ""; const wm: Record<string,string> = {"10.0":"10/11","6.3":"8.1","6.2":"8","6.1":"7"}; osName = `Windows ${wm[v]||v}`.trim(); }
                  else if (/Linux/i.test(ua)) osName = "Linux";

                  let browserName = "Unknown";
                  if (/Edg\//i.test(ua)) browserName = "Edge";
                  else if (/OPR|Opera/i.test(ua)) browserName = "Opera";
                  else if (/SamsungBrowser/i.test(ua)) browserName = "Samsung Browser";
                  else if (/UCBrowser/i.test(ua)) browserName = "UC Browser";
                  else if (/Firefox/i.test(ua)) browserName = "Firefox";
                  else if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) browserName = "Chrome";
                  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browserName = "Safari";

                  let model = "";
                  if (/iPhone/i.test(ua)) model = "iPhone";
                  else if (/iPad/i.test(ua)) model = "iPad";
                  else if (/SM-[A-Z]\d+/i.test(ua)) model = ua.match(/SM-[A-Z]\d+/i)?.[0] || "Samsung";
                  else if (/Pixel/i.test(ua)) model = "Google Pixel";
                  else if (/Xiaomi|Redmi|POCO/i.test(ua)) model = ua.match(/Xiaomi|Redmi\s?\w+|POCO\s?\w+/i)?.[0] || "Xiaomi";
                  else if (/OPPO|CPH/i.test(ua)) model = "OPPO";
                  else if (/vivo/i.test(ua)) model = "Vivo";
                  else if (/realme/i.test(ua)) model = "Realme";

                  const infoItems = [
                    { label: "IP Address", value: order.client_ip || "সংগ্রহ হয়নি", icon: "🌐" },
                    { label: "ডিভাইস টাইপ", value: deviceType, icon: deviceType === "Mobile" ? "📱" : deviceType === "Tablet" ? "📱" : "💻" },
                    { label: "অপারেটিং সিস্টেম", value: osName, icon: "🖥️" },
                    { label: "ব্রাউজার", value: browserName, icon: "🌍" },
                    { label: "ডিভাইস মডেল", value: model || "Unknown", icon: "📲" },
                    { label: "ডিভাইস ইনফো (Raw)", value: order.device_info || "N/A", icon: "📋" },
                    { label: "সোর্স", value: order.source || "N/A", icon: "📡" },
                  ];

                  return (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        {infoItems.map((info, i) => (
                          <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-background border border-border/30">
                            <span className="text-base mt-0.5">{info.icon}</span>
                            <div className="min-w-0">
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{info.label}</p>
                              <p className="text-sm font-medium text-foreground truncate">{info.value}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      {ua && (
                        <div className="p-3 rounded-xl bg-background border border-border/30">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Full User Agent</p>
                          <p className="text-[11px] text-muted-foreground font-mono break-all leading-relaxed">{ua}</p>
                        </div>
                      )}
                    </>
                  );
                })()}
              </CollapsibleContent>
            </Collapsible>

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
                        {uniqueActions.map((a) => <SelectItem key={a} value={a}>{a === "created" ? "তৈরি" : a === "status_changed" ? "স্ট্যাটাস" : a === "field_edited" ? "এডিট" : a === "note_added" ? "নোট" : a === "quick_note" ? "📝 নোট" : a}</SelectItem>)}
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
                            {log.action === "quick_note" && "📝 নোট যোগ করেছে"}
                            {!["created", "status_changed", "field_edited", "note_added", "quick_note"].includes(log.action) && log.action}
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

function IncompleteOrderCard({ io, activeIncompleteTab, convertIncomplete, deleteIncomplete }: {
  io: any; activeIncompleteTab: string; convertIncomplete: any; deleteIncomplete: any;
}) {
  const [noteInput, setNoteInput] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const queryClient = useQueryClient();

  // Convert dialog state
  const [convertOpen, setConvertOpen] = useState(false);
  const [cName, setCName] = useState("");
  const [cPhone, setCPhone] = useState("");
  const [cAddress, setCAddress] = useState("");
  const [cDelivery, setCDelivery] = useState(0);
  const [cDiscount, setCDiscount] = useState(0);
  const [cNotes, setCNotes] = useState("");

  const openConvertDialog = () => {
    setCName(io.customer_name || "");
    setCPhone(io.customer_phone || "");
    setCAddress(io.customer_address || "");
    setCDelivery(io.delivery_charge || 0);
    setCDiscount(io.discount || 0);
    setCNotes(io.notes || "");
    setConvertOpen(true);
  };

  const handleConvert = () => {
    if (!cName.trim()) {
      toast.error("কাস্টমারের নাম দিন!");
      return;
    }
    convertIncomplete.mutate({
      order: io,
      overrides: {
        customer_name: cName,
        customer_phone: cPhone || null,
        customer_address: cAddress || null,
        delivery_charge: cDelivery,
        discount: cDiscount,
        notes: cNotes || null,
      },
    }, {
      onSuccess: () => setConvertOpen(false),
    });
  };

  const productTotal = (io.unit_price || 0) * (io.quantity || 1);
  const computedTotal = productTotal + cDelivery - cDiscount;

  const handleSaveNote = async () => {
    if (!noteInput.trim()) return;
    setIsSavingNote(true);
    try {
      const existingNotes = io.notes || "";
      const timestamp = format(new Date(), "dd MMM yyyy, hh:mm a");
      const newNotes = existingNotes
        ? `${existingNotes}\n[${timestamp}] ${noteInput.trim()}`
        : `[${timestamp}] ${noteInput.trim()}`;
      
      const { error } = await supabase.from("incomplete_orders" as any)
        .update({ notes: newNotes, updated_at: new Date().toISOString() } as any)
        .eq("id", io.id);
      if (error) throw error;
      setNoteInput("");
      queryClient.invalidateQueries({ queryKey: ["incomplete-orders"] });
      toast.success("নোট যোগ হয়েছে!");
    } catch (e: any) {
      toast.error("নোট যোগ করতে ব্যর্থ");
    } finally {
      setIsSavingNote(false);
    }
  };

  return (
    <Card className="p-4 border-border/40">
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

          {/* Notes display */}
          {io.notes && (
            <div className="p-2 rounded-lg bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-800/30">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1 mb-1">
                <MessageSquare className="h-3 w-3" /> নোট
              </p>
              <div className="text-xs text-foreground/80 whitespace-pre-line max-h-20 overflow-y-auto">
                {io.notes}
              </div>
            </div>
          )}

          {/* Quick note input */}
          <div className="flex gap-1.5 items-center">
            <Input
              placeholder="নোট লিখুন..."
              className="rounded-lg h-7 text-xs flex-1"
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && noteInput.trim()) handleSaveNote(); }}
            />
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs px-2.5 rounded-lg gap-1"
              disabled={!noteInput.trim() || isSavingNote}
              onClick={handleSaveNote}
            >
              {isSavingNote ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
              নোট
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {activeIncompleteTab !== "Converted" && (
            <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={openConvertDialog}>
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

      {/* Convert to Order Dialog */}
      <Dialog open={convertOpen} onOpenChange={setConvertOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitMerge className="h-5 w-5 text-primary" /> অর্ডারে কনভার্ট করুন
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {/* Product info (read-only) */}
            {io.product_name && (
              <div className="bg-secondary/50 rounded-xl p-3 space-y-1">
                <p className="text-xs font-semibold text-muted-foreground">প্রোডাক্ট তথ্য</p>
                <p className="text-sm font-medium text-foreground">{io.product_name} {io.product_code ? `(${io.product_code})` : ""}</p>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>পরিমাণ: {io.quantity || 1}</span>
                  <span>দাম: ৳{io.unit_price || 0}</span>
                  <span className="font-semibold text-foreground">সাবটোটাল: ৳{productTotal}</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3">
              <div>
                <Label className="text-xs">কাস্টমারের নাম <span className="text-destructive">*</span></Label>
                <Input value={cName} onChange={(e) => setCName(e.target.value)} className="mt-1" placeholder="নাম" />
              </div>
              <div>
                <Label className="text-xs">ফোন নম্বর</Label>
                <Input value={cPhone} onChange={(e) => setCPhone(e.target.value)} className="mt-1" placeholder="01XXXXXXXXX" />
              </div>
              <div>
                <Label className="text-xs">ঠিকানা</Label>
                <Textarea value={cAddress} onChange={(e) => setCAddress(e.target.value)} className="mt-1" placeholder="সম্পূর্ণ ঠিকানা" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">ডেলিভারি চার্জ (৳)</Label>
                  <Input type="number" value={cDelivery} onChange={(e) => setCDelivery(Number(e.target.value))} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">ডিসকাউন্ট (৳)</Label>
                  <Input type="number" value={cDiscount} onChange={(e) => setCDiscount(Number(e.target.value))} className="mt-1" />
                </div>
              </div>
              <div>
                <Label className="text-xs">নোট</Label>
                <Textarea value={cNotes} onChange={(e) => setCNotes(e.target.value)} className="mt-1" placeholder="স্টাফ নোট..." rows={2} />
              </div>
            </div>

            {/* Total summary */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">মোট পরিশোধযোগ্য</span>
              <span className="text-lg font-bold text-primary">৳{computedTotal}</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 rounded-lg px-3 py-2">
              <Package className="h-3.5 w-3.5" />
              <span>সোর্স: <span className="font-semibold text-foreground">Failed Order</span></span>
            </div>

            <Button className="w-full rounded-xl gap-2" onClick={handleConvert} disabled={convertIncomplete.isPending || !cName.trim()}>
              {convertIncomplete.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> কনভার্ট হচ্ছে...</> : <><GitMerge className="h-4 w-4" /> অর্ডার তৈরি করুন</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// Activity Log Popover Content
function ActivityLogPopover({ orderId }: { orderId: string }) {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["activity-log-popover", orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_activity_logs")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!orderId,
  });

  if (isLoading) {
    return <div className="p-4 text-center"><Loader2 className="h-4 w-4 animate-spin mx-auto text-muted-foreground" /></div>;
  }

  if (logs.length === 0) {
    return <div className="p-4 text-center text-xs text-muted-foreground">কোনো activity নেই</div>;
  }

  return (
    <div className="divide-y divide-border/30">
      <div className="px-3 py-2 bg-secondary/30">
        <p className="text-xs font-semibold text-foreground flex items-center gap-1.5"><Activity className="h-3 w-3" /> Activity Log</p>
      </div>
      {logs.map((log: any) => (
        <div key={log.id} className="px-3 py-2 text-[11px] space-y-0.5">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-foreground">{log.action === "status_changed" ? "স্ট্যাটাস চেঞ্জ" : log.action === "created" ? "তৈরি" : log.action === "note_updated" ? "নোট" : log.action === "customer_blocked" ? "ব্লক" : log.action}</span>
            <span className="text-muted-foreground">{format(new Date(log.created_at), "dd MMM, hh:mm a")}</span>
          </div>
          {log.old_value && log.new_value && (
            <p className="text-muted-foreground">
              <span className="line-through text-red-400">{log.old_value}</span> → <span className="text-emerald-600 font-medium">{log.new_value}</span>
            </p>
          )}
          {log.details && <p className="text-muted-foreground">{log.details}</p>}
          {log.user_name && <p className="text-muted-foreground/60">{log.user_name}</p>}
        </div>
      ))}
    </div>
  );
}

// Mobile Filter Drawer Content
function MobileFilterContent(props: any) {
  const {
    orderDateFilter, setOrderDateFilter, filterSource, setFilterSource,
    filterPhone, setFilterPhone, filterAmountMin, setFilterAmountMin,
    filterAmountMax, setFilterAmountMax, filterDeviceType, setFilterDeviceType,
    filterPaymentStatus, setFilterPaymentStatus, filterCourierProvider, setFilterCourierProvider,
    filterCourierStatus, setFilterCourierStatus, filterCategory, setFilterCategory,
    filterCourierCharged, setFilterCourierCharged, filterSalesType, setFilterSalesType,
    filterAddress, setFilterAddress, filterNotes, setFilterNotes,
    filterDistrict, setFilterDistrict, filterThana, setFilterThana,
    filterZone, setFilterZone, courierProviders, categories,
    clearAllFilters, activeFilterCount, filteredOrders, orders, onClose,
  } = props;

  return (
    <div className="space-y-4 pb-6">
      {/* Date Filter */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-muted-foreground">📅 তারিখ ফিল্টার</Label>
        <Select value={orderDateFilter} onValueChange={(v: any) => setOrderDateFilter(v)}>
          <SelectTrigger className="rounded-xl h-10 text-sm"><SelectValue placeholder="All Time" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="yesterday">Yesterday</SelectItem>
            <SelectItem value="7days">Last 7 Days</SelectItem>
            <SelectItem value="30days">Last 30 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Two column grid for compact filters */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground">📱 Device</Label>
          <Select value={filterDeviceType} onValueChange={setFilterDeviceType}>
            <SelectTrigger className="rounded-xl h-10 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="mobile">Mobile</SelectItem>
              <SelectItem value="desktop">Desktop</SelectItem>
              <SelectItem value="tablet">Tablet</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground">💰 Payment</Label>
          <Select value={filterPaymentStatus} onValueChange={setFilterPaymentStatus}>
            <SelectTrigger className="rounded-xl h-10 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="paid">✅ Paid</SelectItem>
              <SelectItem value="unpaid">💰 Unpaid</SelectItem>
              <SelectItem value="free_delivery">🆓 Free</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground">🚚 Courier</Label>
          <Select value={filterCourierProvider} onValueChange={setFilterCourierProvider}>
            <SelectTrigger className="rounded-xl h-10 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="no_courier">No Courier</SelectItem>
              {courierProviders.map((cp: any) => <SelectItem key={cp.id} value={cp.id}>{cp.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground">📦 Category</Label>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="rounded-xl h-10 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {categories.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground">💵 Min Amount</Label>
          <Input type="number" placeholder="0" className="rounded-xl h-10 text-sm" value={filterAmountMin} onChange={(e: any) => setFilterAmountMin(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground">💵 Max Amount</Label>
          <Input type="number" placeholder="∞" className="rounded-xl h-10 text-sm" value={filterAmountMax} onChange={(e: any) => setFilterAmountMax(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground">🏷️ Sales Type</Label>
          <Select value={filterSalesType} onValueChange={setFilterSalesType}>
            <SelectTrigger className="rounded-xl h-10 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="api">API/Website</SelectItem>
              <SelectItem value="manual">Manual</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground">🚛 Delivery</Label>
          <Select value={filterCourierCharged} onValueChange={setFilterCourierCharged}>
            <SelectTrigger className="rounded-xl h-10 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="charged">Charged</SelectItem>
              <SelectItem value="free">Free</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Text filters */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground">📞 Phone</Label>
          <Input placeholder="ফোন নম্বর..." className="rounded-xl h-10 text-sm" value={filterPhone} onChange={(e: any) => setFilterPhone(e.target.value)} inputMode="tel" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground">🌐 Source</Label>
          <Input placeholder="Source..." className="rounded-xl h-10 text-sm" value={filterSource} onChange={(e: any) => setFilterSource(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground">📍 Address</Label>
          <Input placeholder="ঠিকানা..." className="rounded-xl h-10 text-sm" value={filterAddress} onChange={(e: any) => setFilterAddress(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground">📝 Notes</Label>
          <Input placeholder="Notes..." className="rounded-xl h-10 text-sm" value={filterNotes} onChange={(e: any) => setFilterNotes(e.target.value)} />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 pt-2 border-t border-border/30 sticky bottom-0 bg-background pb-2">
        {activeFilterCount > 0 && (
          <Button variant="destructive" className="flex-1 rounded-xl gap-1.5" onClick={() => { clearAllFilters(); onClose(); }}>
            <X className="h-4 w-4" /> ক্লিয়ার ({activeFilterCount})
          </Button>
        )}
        <Button className="flex-1 rounded-xl gap-1.5" onClick={onClose}>
          ফলাফল দেখুন ({filteredOrders.length})
        </Button>
      </div>
    </div>
  );
}
