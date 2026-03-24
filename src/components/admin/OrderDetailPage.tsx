import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar as CalendarWidget } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Plus, Calendar, AlertCircle, Truck, Search, MessageSquare,
  Printer, ChevronDown, Users,
  Trash2, Copy, X, ShoppingCart, ArrowLeft, Clock, CheckCircle2,
  PauseCircle, XCircle, Smartphone,
  Loader2, Package, Globe, History,
  Hand, RotateCcw, Phone, Pencil, Activity, ArrowRightLeft
} from "lucide-react";
import { useOrderItems, getStatusLabel, getStatusColor } from "@/hooks/useOrders";
import { usePublicProducts } from "@/hooks/usePublicProducts";
import { CourierHistoryBadge } from "@/components/admin/courier/CourierHistoryBadge";
import { CourierSuccessRate } from "@/components/admin/courier/CourierSuccessRate";
import { useCourierCities, useCourierZones, useCourierAreas, prefetchCourierLocations } from "@/hooks/useCourierLocations";
import { extractPathaoLocationHints, resolvePathaoLocationMatch } from "@/lib/pathaoLocationMatching";
import { toast } from "sonner";

const CANCEL_REASONS = [
  "কাস্টমার ফোন রিসিভ করছে না",
  "কাস্টমার অর্ডার ক্যান্সেল করেছে",
  "ডুপ্লিকেট অর্ডার",
  "ভুল তথ্য দিয়ে অর্ডার করেছে",
  "ডেলিভারি এরিয়ার বাইরে",
  "প্রোডাক্ট স্টক নেই",
  "ফেক অর্ডার",
];

export function OrderDetailPage({ orderId, order, onClose }: { orderId: string | null; order: any; onClose: () => void }) {
  const { data: items = [], isLoading } = useOrderItems(orderId);
  const { data: allProducts = [] } = usePublicProducts();
  const { user, isAdmin, userRoles, session } = useAuth();
  const queryClient = useQueryClient();

  // Check transfer permission inside this component
  const { data: hasTransferPerm = false } = useQuery({
    queryKey: ["transfer-perm-detail", user?.id],
    queryFn: async () => {
      if (isAdmin) return true;
      const { data } = await supabase.from("employee_permissions").select("id").eq("user_id", user!.id).eq("permission", "transfer_orders" as any).limit(1);
      return (data && data.length > 0) || false;
    },
    enabled: !!user?.id,
  });
  const canTransferOrders = isAdmin || hasTransferPerm;
  const { data: userDisplayName } = useQuery({
    queryKey: ["user-profile-name-detail", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("full_name").eq("user_id", user!.id).limit(1).maybeSingle();
      return data?.full_name || user?.email || "System";
    },
    enabled: !!user?.id,
  });
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
  const editSelectedCourier = useMemo(
    () => editCourierProviders.find((provider: any) => provider.id === editCourierId) || null,
    [editCourierProviders, editCourierId],
  );
  const lastEditAutoCityIdRef = useRef<string | null>(null);
  const lastEditAutoZoneIdRef = useRef<string | null>(null);
  const isEditPathaoCourier = editSelectedCourier?.slug === "pathao";
  const [editStatus, setEditStatus] = useState<string>("");
  const [detailCancelDialogOpen, setDetailCancelDialogOpen] = useState(false);
  const [detailCancelReason, setDetailCancelReason] = useState("");
  const [detailCancelCustom, setDetailCancelCustom] = useState("");
  const [logFilterUser, setLogFilterUser] = useState("all");
  const [logFilterAction, setLogFilterAction] = useState("all");
  const [logFilterDate, setLogFilterDate] = useState<Date | undefined>();

  // Order transfer
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferToUserId, setTransferToUserId] = useState<string | null>(null);
  const [isTransferring, setIsTransferring] = useState(false);

  // All users for individual transfer
  const { data: transferPanels = [] } = useQuery({
    queryKey: ["all-users-for-individual-transfer"],
    queryFn: async () => {
      const { data: roles, error: rolesErr } = await supabase.from("user_roles").select("user_id, role");
      if (rolesErr) throw rolesErr;
      const userIds = [...new Set(roles?.map(r => r.user_id) || [])];
      if (userIds.length === 0) return [];
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds);
      return userIds.map(uid => ({
        user_id: uid,
        full_name: profiles?.find(p => p.user_id === uid)?.full_name || `User (${uid.slice(0, 8)})`,
        role: roles?.find(r => r.user_id === uid)?.role || "user",
      }));
    },
    enabled: transferOpen,
  });

  // Current assignment
  const { data: currentAssignment } = useQuery({
    queryKey: ["order-assignment-detail", orderId],
    queryFn: async () => {
      const { data, error } = await supabase.from("order_assignments").select("*").eq("order_id", orderId!).order("assigned_at", { ascending: false }).limit(1);
      if (error) throw error;
      return data?.[0] || null;
    },
    enabled: !!orderId,
  });

  const handleTransferOrder = async () => {
    if (!orderId) return;
    const targetId = transferToUserId;
    if (!targetId) return;
    setIsTransferring(true);
    try {
      const { error } = await supabase.rpc("bulk_transfer_orders" as any, {
        _order_ids: [orderId],
        _target_user_id: targetId,
        _assigned_by: user?.id || null,
      });
      if (error) throw error;
      const targetPanel = transferPanels.find((p: any) => p.user_id === targetId);
      const fromPanel = transferPanels.find((p: any) => p.user_id === currentAssignment?.assigned_to);
      const transferredBy = user?.email || "Unknown";
      // Fire-and-forget activity log to not block UI
      logActivity("order_transferred", "assigned_to", fromPanel?.full_name || currentAssignment?.assigned_to || "unassigned", targetPanel?.full_name || targetId, `অর্ডার ট্রান্সফার: ${fromPanel?.full_name || "Unassigned"} → ${targetPanel?.full_name || "Unknown"} (by ${transferredBy})`);
      queryClient.invalidateQueries({ queryKey: ["order-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["order-assignments-list"] });
      queryClient.invalidateQueries({ queryKey: ["order-assignment-detail", orderId] });
      queryClient.invalidateQueries({ queryKey: ["panel-stats"] });
      queryClient.invalidateQueries({ queryKey: ["order-activity-logs", orderId] });
      toast.success(`অর্ডার সফলভাবে ${targetPanel?.full_name || "অন্য প্যানেলে"} ট্রান্সফার হয়েছে!`);
      setTransferOpen(false);
      setTransferToUserId(null);
    } catch (e: any) {
      toast.error("ট্রান্সফার ব্যর্থ: " + e.message);
    } finally {
      setIsTransferring(false);
    }
  };

  // Populate fields when order changes (only on initial load or order switch)
  const orderRef = order?.id;
  const initializedOrderRef = useRef<string | null>(null);
  useEffect(() => {
    if (order && orderRef && initializedOrderRef.current !== orderRef) {
      initializedOrderRef.current = orderRef;
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
  const courierOrderRef = existingCourierOrder?.id;
  useEffect(() => {
    if (existingCourierOrder) {
      setEditCourierId(existingCourierOrder.courier_provider_id || null);
    } else {
      setEditCourierId(null);
    }
    setEditCourierCityId(null);
    setEditCourierZoneId(null);
    setEditCourierAreaId(null);
  }, [courierOrderRef, orderRef]);

  useEffect(() => {
    if (!isEditPathaoCourier || !editCourierId || !session?.access_token) {
      return;
    }

    void prefetchCourierLocations(queryClient, session.access_token, editCourierId, "cities");
  }, [editCourierId, isEditPathaoCourier, queryClient, session?.access_token]);

  useEffect(() => {
    if (!isEditPathaoCourier || !editCourierId || !editCourierCityId || !session?.access_token) {
      return;
    }

    void prefetchCourierLocations(queryClient, session.access_token, editCourierId, "zones", editCourierCityId);
  }, [editCourierCityId, editCourierId, isEditPathaoCourier, queryClient, session?.access_token]);

  useEffect(() => {
    if (!isEditPathaoCourier || !editCourierId || !editCourierZoneId || !session?.access_token) {
      return;
    }

    void prefetchCourierLocations(queryClient, session.access_token, editCourierId, "areas", undefined, editCourierZoneId);
  }, [editCourierId, editCourierZoneId, isEditPathaoCourier, queryClient, session?.access_token]);

  useEffect(() => {
    if (!isEditPathaoCourier || !editAddress.trim() || editCitiesLoading || editCourierCities.length === 0) {
      return;
    }

    const canAutoUpdateCity = !editCourierCityId || editCourierCityId === lastEditAutoCityIdRef.current;
    if (!canAutoUpdateCity) return;

    const { cityHints } = extractPathaoLocationHints(editAddress);
    const matchedCity = resolvePathaoLocationMatch(editAddress, editCourierCities as Array<{ id: string | number; name: string }>, cityHints);

    if (matchedCity) {
      const nextCityId = String(matchedCity.id);
      if (editCourierCityId !== nextCityId) {
        setEditCourierCityId(nextCityId);
        setEditCourierZoneId(null);
        setEditCourierAreaId(null);
      }
      if (session?.access_token && editCourierId) {
        void prefetchCourierLocations(queryClient, session.access_token, editCourierId, "zones", nextCityId);
      }
      lastEditAutoCityIdRef.current = nextCityId;
      return;
    }

    if (editCourierCityId && editCourierCityId === lastEditAutoCityIdRef.current) {
      setEditCourierCityId(null);
      setEditCourierZoneId(null);
      setEditCourierAreaId(null);
    }
    lastEditAutoCityIdRef.current = null;
  }, [editAddress, editCitiesLoading, editCourierCities, editCourierCityId, isEditPathaoCourier]);

  useEffect(() => {
    if (!isEditPathaoCourier || !editCourierCityId || !editAddress.trim() || editZonesLoading || editCourierZones.length === 0) {
      return;
    }

    const canAutoUpdateZone = !editCourierZoneId || editCourierZoneId === lastEditAutoZoneIdRef.current;
    if (!canAutoUpdateZone) return;

    const { zoneHints } = extractPathaoLocationHints(editAddress);
    const matchedZone = resolvePathaoLocationMatch(editAddress, editCourierZones as Array<{ id: string | number; name: string }>, zoneHints);

    if (matchedZone) {
      const nextZoneId = String(matchedZone.id);
      if (editCourierZoneId !== nextZoneId) {
        setEditCourierZoneId(nextZoneId);
        setEditCourierAreaId(null);
      }
      if (session?.access_token && editCourierId) {
        void prefetchCourierLocations(queryClient, session.access_token, editCourierId, "areas", undefined, nextZoneId);
      }
      lastEditAutoZoneIdRef.current = nextZoneId;
      return;
    }

    if (editCourierZoneId && editCourierZoneId === lastEditAutoZoneIdRef.current) {
      setEditCourierZoneId(null);
      setEditCourierAreaId(null);
    }
    lastEditAutoZoneIdRef.current = null;
  }, [editAddress, editCourierCityId, editCourierZoneId, editCourierZones, editZonesLoading, isEditPathaoCourier]);

  // Product search for detail dialog
  const { data: allOrderItemsForSales = [] } = useQuery({
    queryKey: ["all-order-items-sales-filter"],
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
        order_id: orderId, user_id: user?.id || null, user_name: userDisplayName || user?.email || "System",
        action, field_name: fieldName || null, old_value: oldValue || null, new_value: newValue || null, details: details || null,
      } as any);
    } catch (e) { console.error(e); }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!orderId || !order || newStatus === order.status) return;
    if (newStatus === "in_courier") {
      toast.error("In Courier স্ট্যাটাস শুধুমাত্র কুরিয়ার API-এর মাধ্যমে সম্ভব!");
      return;
    }
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

    // If status changed to cancelled, open cancel dialog instead
    if (editStatus && editStatus !== order.status && editStatus === "cancelled") {
      setDetailCancelReason("");
      setDetailCancelCustom("");
      setDetailCancelDialogOpen(true);
      return;
    }

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

      // Include status change in save
      if (editStatus && editStatus !== order.status) {
        changes.status = editStatus;
        await logActivity("status_changed", "status", order.status, editStatus, `স্ট্যাটাস পরিবর্তন: ${getStatusLabel(order.status as any)} → ${getStatusLabel(editStatus as any)}`);
      }

      // Save courier selection
      const courierChanged = editCourierId !== (existingCourierOrder?.courier_provider_id || null);
      if (courierChanged && editCourierId) {
        if (existingCourierOrder) {
          await supabase.from("courier_orders").update({ courier_provider_id: editCourierId } as any).eq("id", existingCourierOrder.id);
        } else {
          await supabase.from("courier_orders").upsert({ order_id: orderId, courier_provider_id: editCourierId, courier_status: "pending" } as any, { onConflict: "order_id" });
        }
        await logActivity("field_edited", "courier", existingCourierOrder?.courier_provider_id || "none", editCourierId);
        queryClient.invalidateQueries({ queryKey: ["courier-orders-filter"] });
        queryClient.invalidateQueries({ queryKey: ["courier-order-detail", orderId] });
      }

      // If status is changing to in_courier, require courier provider and API
      const isGoingToCourier = editStatus === "in_courier" && order.status !== "in_courier";
      const courierProviderId = editCourierId || existingCourierOrder?.courier_provider_id;
      
      if (isGoingToCourier && !courierProviderId) {
        toast.error("কুরিয়ার সিলেক্ট করা হয়নি! প্রথমে কুরিয়ার প্রোভাইডার সিলেক্ট করুন।");
        delete changes.status;
        setIsSaving(false);
        return;
      }
      
      if (isGoingToCourier && courierProviderId) {
        const provider = editCourierProviders?.find((p: any) => p.id === courierProviderId);
        const hasApiConfig = provider?.api_configs && Array.isArray(provider.api_configs) && provider.api_configs.length > 0 && (provider.api_configs[0] as any)?.api_key;
        
        if (!hasApiConfig) {
          toast.error("এই কুরিয়ারের API কনফিগার করা হয়নি! API ছাড়া In Courier-এ পাঠানো যাবে না।");
          delete changes.status;
          setIsSaving(false);
          return;
        }
        
        try {
          const { data: session } = await supabase.auth.getSession();
          const token = session?.session?.access_token;
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          const apikey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

          const resp = await fetch(`${supabaseUrl}/functions/v1/courier-submit`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "apikey": apikey,
              "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({
              action: "submit-order",
              provider_id: courierProviderId,
              order_id: orderId,
              city_id: editCourierCityId ? Number(editCourierCityId) : undefined,
              zone_id: editCourierZoneId ? Number(editCourierZoneId) : undefined,
              area_id: editCourierAreaId ? Number(editCourierAreaId) : undefined,
            }),
          });
          const result = await resp.json();
          
          if (result.success) {
            delete changes.status;
            queryClient.invalidateQueries({ queryKey: ["courier-orders-filter"] });
            queryClient.invalidateQueries({ queryKey: ["courier-order-detail", orderId] });
            toast.success(`কুরিয়ারে সাবমিট হয়েছে! Consignment: ${result.consignment_id || "N/A"}`);
          } else {
            toast.error(`কুরিয়ার API ত্রুটি: ${result.error || "Unknown error"}`);
            delete changes.status;
          }
        } catch (apiErr: any) {
          toast.error(`কুরিয়ার সাবমিট ব্যর্থ: ${apiErr.message}`);
          delete changes.status;
        }
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
      } else if (courierChanged || isGoingToCourier) {
        queryClient.invalidateQueries({ queryKey: ["orders"] });
        queryClient.invalidateQueries({ queryKey: ["order-counts"] });
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
    <div className="space-y-6">
      {/* Back button + Header */}
      <div className="flex items-center gap-3">
        <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary/80 transition-all">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <ShoppingCart className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
              Order Details
              {order && <Badge variant="secondary" className="text-xs">{order.order_number}</Badge>}
              {order && <Badge className={cn("text-[10px]", getStatusColor(order.status))}>{getStatusLabel(order.status)}</Badge>}
            </h1>
            <p className="text-sm text-muted-foreground">
              {order ? `${order.customer_name} — ৳${Number(order.total_amount).toLocaleString()}` : "Loading..."}
            </p>
          </div>
        </div>
      </div>

      {order && (
        <div className="max-w-3xl space-y-6">
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

            {/* Courier Success Rate - auto loads */}
            <CourierSuccessRate phone={editPhone} />

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



            {/* Courier Selection for Edit */}
            <div className="p-4 rounded-2xl bg-secondary/20 border border-border/40 space-y-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <div className="h-6 w-6 rounded-lg bg-violet-500/10 flex items-center justify-center"><Truck className="h-3.5 w-3.5 text-violet-500" /></div>
                কুরিয়ার সিলেক্ট
              </h3>
              <Select value={editCourierId || "none"} onValueChange={(v) => {
                const nextCourierId = v === "none" ? null : v;
                const nextCourier = nextCourierId ? editCourierProviders.find((cp: any) => cp.id === nextCourierId) : null;
                setEditCourierId(nextCourierId);
                setEditCourierCityId(null);
                setEditCourierZoneId(null);
                setEditCourierAreaId(null);
                if (nextCourierId && nextCourier?.slug === "pathao" && session?.access_token) {
                  void prefetchCourierLocations(queryClient, session.access_token, nextCourierId, "cities");
                }
              }}>
                <SelectTrigger className="rounded-xl h-9 text-sm">
                  <SelectValue placeholder="কুরিয়ার সিলেক্ট করুন" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-muted-foreground">কুরিয়ার সিলেক্ট করুন</span>
                  </SelectItem>
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

            {/* BD Courier Check removed - now using CourierSuccessRate component above */}
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
                  // in_courier status is set only via courier API
                  { value: "on_hold", label: "Hold", color: "bg-yellow-500", icon: PauseCircle },
                  { value: "hand_delivery", label: "Hand Delivery", color: "bg-cyan-500", icon: Hand },
                  { value: "cancelled", label: "Cancelled", color: "bg-red-500", icon: XCircle },
                  ...(order.status === "pending_return" ? [{ value: "returned", label: "Return", color: "bg-red-400", icon: RotateCcw }] : []),
                  ...(order.status === "in_courier" ? [{ value: "pending_return", label: "Pending Return", color: "bg-orange-500", icon: RotateCcw }] : []),
                ].map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setEditStatus(s.value)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold border-2 transition-all duration-200",
                      editStatus === s.value && editStatus !== order.status
                        ? `${s.color} text-white border-transparent shadow-lg scale-[1.05] ring-2 ring-offset-1 ring-primary/40`
                        : order.status === s.value
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
                <DeviceTrackingInfo userAgent={order.user_agent} clientIp={order.client_ip} deviceInfo={order.device_info} source={order.source} />
              </CollapsibleContent>
            </Collapsible>

            {/* Order Transfer */}
            {canTransferOrders && (
            <div className="p-4 rounded-2xl bg-secondary/20 border border-border/40 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <div className="h-6 w-6 rounded-lg bg-indigo-500/10 flex items-center justify-center"><ArrowRightLeft className="h-3.5 w-3.5 text-indigo-500" /></div>
                  অর্ডার ট্রান্সফার
                </h3>
                {currentAssignment && (
                  <Badge variant="outline" className="text-xs">
                    বর্তমান: {transferPanels.find((p: any) => p.user_id === currentAssignment.assigned_to)?.full_name || "অ্যাসাইনড"}
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {transferPanels
                  .filter((p: any) => p.user_id !== currentAssignment?.assigned_to)
                  .map((p: any) => (
                    <Button
                      key={p.user_id}
                      variant="outline"
                      size="sm"
                      className="rounded-xl text-xs justify-start gap-1.5 h-9 hover:bg-indigo-50 hover:border-indigo-300 dark:hover:bg-indigo-900/20"
                      disabled={isTransferring}
                      onClick={async () => {
                        setTransferToUserId(p.user_id);
                        setIsTransferring(true);
                        try {
                          const { error } = await supabase.rpc("bulk_transfer_orders" as any, {
                            _order_ids: [orderId],
                            _target_user_id: p.user_id,
                            _assigned_by: user?.id || null,
                          });
                          if (error) throw error;
                          const fromPanel = transferPanels.find((tp: any) => tp.user_id === currentAssignment?.assigned_to);
                          logActivity("order_transferred", "assigned_to", fromPanel?.full_name || "unassigned", p.full_name, `অর্ডার ট্রান্সফার: ${fromPanel?.full_name || "Unassigned"} → ${p.full_name} (by ${user?.email || "Unknown"})`);
                          queryClient.invalidateQueries({ queryKey: ["order-assignments"] });
                          queryClient.invalidateQueries({ queryKey: ["order-assignments-list"] });
                          queryClient.invalidateQueries({ queryKey: ["order-assignment-detail", orderId] });
                          queryClient.invalidateQueries({ queryKey: ["panel-stats"] });
                          toast.success(`অর্ডার সফলভাবে ${p.full_name}-এর কাছে ট্রান্সফার হয়েছে!`);
                        } catch (e: any) {
                          toast.error("ট্রান্সফার ব্যর্থ: " + e.message);
                        } finally {
                          setIsTransferring(false);
                          setTransferToUserId(null);
                        }
                      }}
                    >
                      <Users className="h-3 w-3 text-indigo-500 shrink-0" />
                      <span className="truncate">{p.full_name}</span>
                    </Button>
                  ))}
              </div>
              {isTransferring && (
                <div className="text-xs text-muted-foreground flex items-center gap-1.5 justify-center">
                  <Loader2 className="h-3 w-3 animate-spin" /> ট্রান্সফার হচ্ছে...
                </div>
              )}
            </div>
            )}

            {/* Save Button */}
            <Button className="w-full rounded-xl shadow-sm" onClick={handleSaveChanges} disabled={isSaving}>
              {isSaving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : editStatus && editStatus !== order.status ? `সেভ করুন ও স্ট্যাটাস আপডেট করুন` : "পরিবর্তন সেভ করুন"}
            </Button>

            {/* Activity Log */}
            {activityLogs.length > 0 && (
              <ActivityLogSection
                activityLogs={activityLogs}
                logFilterUser={logFilterUser}
                setLogFilterUser={setLogFilterUser}
                logFilterAction={logFilterAction}
                setLogFilterAction={setLogFilterAction}
                logFilterDate={logFilterDate}
                setLogFilterDate={setLogFilterDate}
              />
            )}

            {/* Meta */}
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/30">
              <span>Created: {format(new Date(order.created_at), "dd MMM yyyy, hh:mm a")}</span>
              {order.source && (
                <Badge variant="outline" className="text-xs gap-1"><Globe className="h-3 w-3" />{order.source}</Badge>
              )}
            </div>
          </div>
        )}
    </div>
  );
}



function DeviceTrackingInfo({ userAgent, clientIp, deviceInfo, source }: { userAgent?: string | null; clientIp?: string | null; deviceInfo?: string | null; source?: string | null }) {
  const ua = userAgent || "";
  const mobileRe = new RegExp("Mobile|Android|iPhone|iPod", "i");
  const tabletRe = new RegExp("iPad|Tablet", "i");
  const isMobile = mobileRe.test(ua);
  const isTablet = tabletRe.test(ua);
  const deviceType = isTablet ? "Tablet" : isMobile ? "Mobile" : "Desktop";

  let osName = "Unknown";
  if (new RegExp("Android", "i").test(ua)) { const v = ua.match(new RegExp("Android\\s([\\d.]+)"))?.[1] || ""; osName = ("Android " + v).trim(); }
  else if (new RegExp("iPhone|iPad", "i").test(ua)) { const v = ua.match(new RegExp("OS\\s([\\d_]+)"))?.[1]?.replace(/_/g, ".") || ""; osName = ("iOS " + v).trim(); }
  else if (new RegExp("Windows", "i").test(ua)) osName = "Windows";
  else if (new RegExp("Mac OS X", "i").test(ua)) osName = "macOS";
  else if (new RegExp("Linux", "i").test(ua)) osName = "Linux";

  let browserName = "Unknown";
  if (new RegExp("Edg/", "i").test(ua)) browserName = "Edge";
  else if (new RegExp("OPR|Opera", "i").test(ua)) browserName = "Opera";
  else if (new RegExp("SamsungBrowser", "i").test(ua)) browserName = "Samsung Browser";
  else if (new RegExp("Firefox", "i").test(ua)) browserName = "Firefox";
  else if (new RegExp("Chrome", "i").test(ua) && !new RegExp("Edg", "i").test(ua)) browserName = "Chrome";
  else if (new RegExp("Safari", "i").test(ua) && !new RegExp("Chrome", "i").test(ua)) browserName = "Safari";

  let model = "";
  if (new RegExp("iPhone", "i").test(ua)) model = "iPhone";
  else if (new RegExp("iPad", "i").test(ua)) model = "iPad";
  else if (new RegExp("SM-[A-Z]\\d+", "i").test(ua)) model = "Samsung";
  else if (new RegExp("Pixel", "i").test(ua)) model = "Google Pixel";
  else if (new RegExp("Xiaomi|Redmi|POCO", "i").test(ua)) model = "Xiaomi";
  else if (new RegExp("OPPO|CPH", "i").test(ua)) model = "OPPO";
  else if (new RegExp("vivo", "i").test(ua)) model = "Vivo";

  const infoItems = [
    { label: "IP Address", value: clientIp || "N/A", icon: "🌐" },
    { label: "Device Type", value: deviceType, icon: deviceType === "Mobile" ? "📱" : "💻" },
    { label: "OS", value: osName, icon: "🖥️" },
    { label: "Browser", value: browserName, icon: "🌍" },
    { label: "Model", value: model || "Unknown", icon: "📲" },
    { label: "Raw Info", value: deviceInfo || "N/A", icon: "📋" },
    { label: "Source", value: source || "N/A", icon: "📡" },
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
}

