import { useState, useEffect, useMemo, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2, Truck, MapPin, X, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { prefetchCourierLocations, useCourierCities, useCourierZones } from "@/hooks/useCourierLocations";
import { extractPathaoLocationHints, resolvePathaoLocationMatch, type PathaoLocationItem } from "@/lib/pathaoLocationMatching";
import { toast } from "sonner";

export interface BulkOrderEntry {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  total_amount: number;
  notes?: string;
  courier_note?: string;
}

interface OrderLocationState {
  cityId: string;
  zoneId: string;
  areaId: string;
  weight: string;
  note: string;
  cityName: string;
  zoneName: string;
}

export interface SubmitResultEntry {
  orderId: string;
  success: boolean;
  consignment_id?: string;
  error?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orders: BulkOrderEntry[];
  providerId: string;
  providerName: string;
  onSubmit: (ordersWithLocations: Array<{ orderId: string; cityId: string; zoneId: string; areaId: string; weight: number; note: string }>) => void;
  isSubmitting: boolean;
  progress: { done: number; total: number };
  submitResults?: SubmitResultEntry[];
  fullPage?: boolean;
}

const PATHAO_SLUGS = ["pathao"];
const needsLocation = (providerName: string) =>
  PATHAO_SLUGS.some((s) => providerName.toLowerCase().includes(s));

function OrderRowLocationSelector({
  order, cities, citiesLoading, providerId, state, onChange,
}: {
  order: BulkOrderEntry;
  cities: PathaoLocationItem[];
  citiesLoading: boolean;
  providerId: string;
  state: OrderLocationState;
  onChange: (updates: Partial<OrderLocationState>) => void;
}) {
  const { data: zones = [], isLoading: zonesLoading } = useCourierZones(
    state.cityId ? providerId : null, state.cityId || null
  );

  useEffect(() => {
    if (state.zoneId && !zonesLoading && zones.length > 0 && !zones.some((zone: any) => String(zone.id) === state.zoneId)) {
      onChange({ zoneId: "", zoneName: "", areaId: "" });
      return;
    }

    if (!state.cityId || zonesLoading || zones.length === 0 || state.zoneId) return;
    const { zoneHints } = extractPathaoLocationHints(order.customer_address);
    const matched = resolvePathaoLocationMatch(order.customer_address, zones as PathaoLocationItem[], zoneHints);
    if (matched) onChange({ zoneId: String(matched.id), zoneName: matched.name });
  }, [onChange, order.customer_address, state.cityId, state.zoneId, zones, zonesLoading]);

  return (
    <>
      <Select value={state.cityId} onValueChange={(v) => {
        const city = cities.find((c) => String(c.id) === v);
        onChange({ cityId: v, cityName: city?.name || "", zoneId: "", zoneName: "", areaId: "" });
      }}>
        <SelectTrigger className="h-7 text-[10px]">
          {citiesLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <span className="truncate">{state.cityName || "City"}</span>}
        </SelectTrigger>
        <SelectContent className="max-h-60">
          {cities.map((c) => <SelectItem key={String(c.id)} value={String(c.id)} className="text-xs">{c.name}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={state.zoneId} onValueChange={(v) => {
        const zone = zones.find((z: any) => String(z.id) === v);
        onChange({ zoneId: v, zoneName: (zone as any)?.name || "", areaId: "" });
      }} disabled={!state.cityId}>
        <SelectTrigger className="h-7 text-[10px]">
          {zonesLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <span className="truncate">{state.zoneName || "Zone"}</span>}
        </SelectTrigger>
        <SelectContent className="max-h-60">
          {zones.map((z: any) => <SelectItem key={String(z.id)} value={String(z.id)} className="text-xs">{z.name}</SelectItem>)}
        </SelectContent>
      </Select>
    </>
  );
}

export function PathaoBulkSubmitPreview({ open, onOpenChange, orders, providerId, providerName, onSubmit, isSubmitting, progress, submitResults = [] }: Props) {
  const isPathao = needsLocation(providerName);
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const { data: cities = [], isLoading: citiesLoading } = useCourierCities(open && isPathao ? providerId : null);
  const [orderStates, setOrderStates] = useState<Record<string, OrderLocationState>>({});

  const resultsMap = useMemo(() => {
    const map: Record<string, SubmitResultEntry> = {};
    for (const r of submitResults) map[r.orderId] = r;
    return map;
  }, [submitResults]);

  // Initialize order states
  useEffect(() => {
    if (!open) return;
    // For non-Pathao, initialize immediately; for Pathao, wait for cities
    if (isPathao && cities.length === 0) return;

    const newStates: Record<string, OrderLocationState> = {};
    for (const order of orders) {
      if (orderStates[order.id]?.weight) { newStates[order.id] = orderStates[order.id]; continue; }

      let cityId = "", cityName = "";
      if (isPathao) {
        const { cityHints } = extractPathaoLocationHints(order.customer_address);
        const matched = resolvePathaoLocationMatch(order.customer_address, cities as PathaoLocationItem[], cityHints);
        if (matched) { cityId = String(matched.id); cityName = matched.name; }
      }

      newStates[order.id] = {
        cityId, zoneId: "", areaId: "",
        weight: "0.5",
        note: order.courier_note || order.notes || "",
        cityName, zoneName: "",
      };
    }
    setOrderStates(newStates);
  }, [open, cities, orders, isPathao]);

  useEffect(() => {
    if (!open || !isPathao || !providerId || !session?.access_token) return;

    const cityIds = Array.from(new Set(
      Object.values(orderStates)
        .map((state) => state.cityId)
        .filter(Boolean),
    ));

    cityIds.forEach((cityId) => {
      void prefetchCourierLocations(queryClient, session.access_token, providerId, "zones", cityId);
    });
  }, [isPathao, open, orderStates, providerId, queryClient, session?.access_token]);

  useEffect(() => {
    if (!open) setOrderStates({});
  }, [open]);

  const updateOrderState = useCallback((orderId: string, updates: Partial<OrderLocationState>) => {
    setOrderStates((prev) => ({ ...prev, [orderId]: { ...prev[orderId], ...updates } }));
  }, []);

  // For Pathao: ready = has city+zone. For others: always ready once state exists
  const readyCount = useMemo(() =>
    orders.filter((o) => {
      const s = orderStates[o.id];
      if (!s) return false;
      return isPathao ? !!(s.cityId && s.zoneId) : true;
    }).length,
    [orders, orderStates, isPathao]
  );

  const successCount = submitResults.filter((r) => r.success).length;
  const hasResults = submitResults.length > 0;

  const handleSubmit = () => {
    const readyOrders = orders
      .filter((o) => {
        const s = orderStates[o.id];
        if (!s) return false;
        return isPathao ? !!(s.cityId && s.zoneId) : true;
      })
      .map((o) => ({
        orderId: o.id,
        cityId: orderStates[o.id].cityId || "",
        zoneId: orderStates[o.id].zoneId || "",
        areaId: orderStates[o.id].areaId || "",
        weight: parseFloat(orderStates[o.id].weight) || 0.2,
        note: orderStates[o.id].note,
      }));
    if (readyOrders.length === 0) { toast.error("কোনো অর্ডার Ready নেই!"); return; }
    onSubmit(readyOrders);
  };

  // Grid columns change based on whether location is needed
  const gridCols = isPathao
    ? "grid-cols-[30px_50px_minmax(80px,1fr)_85px_minmax(80px,1fr)_minmax(70px,1fr)_minmax(70px,1fr)_55px_minmax(80px,1fr)_50px_minmax(90px,1fr)]"
    : "grid-cols-[30px_50px_minmax(100px,1fr)_90px_minmax(100px,1.5fr)_60px_minmax(100px,1fr)_50px_minmax(90px,1fr)]";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-full max-h-[90vh] p-0">
        <DialogHeader className="px-4 pt-4 pb-2 border-b">
          <DialogTitle className="flex items-center gap-2 text-base flex-wrap">
            <Truck className="h-5 w-5" />
            Send to {providerName}
            <Badge variant="secondary">{orders.length} অর্ডার</Badge>
            {hasResults ? (
              <Badge className="bg-emerald-600 text-white">{successCount}/{submitResults.length} সাকসেসফুল</Badge>
            ) : (
              <Badge className="bg-emerald-600 text-white">{readyCount} Ready</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-140px)]">
          <div className="px-2 py-2">
            {/* Header row */}
            <div className={`grid ${gridCols} gap-1 items-center py-2 border-b bg-primary text-primary-foreground rounded-t-lg px-2`}>
              <span className="text-[8px] font-bold">SL</span>
              <span className="text-[8px] font-bold">ID</span>
              <span className="text-[8px] font-bold">Name</span>
              <span className="text-[8px] font-bold">Phone</span>
              <span className="text-[8px] font-bold">Address</span>
              {isPathao && <span className="text-[8px] font-bold">City</span>}
              {isPathao && <span className="text-[8px] font-bold">Zone</span>}
              <span className="text-[8px] font-bold text-center">৳</span>
              <span className="text-[8px] font-bold">Note</span>
              <span className="text-[8px] font-bold text-center">Wt</span>
              <span className="text-[8px] font-bold text-center">Status</span>
            </div>

            {/* Order rows */}
            {orders.map((order, idx) => {
              const state = orderStates[order.id];
              const result = resultsMap[order.id];
              const note = state?.note || order.courier_note || order.notes || "";

              return (
                <div
                  key={order.id}
                  className={`grid ${gridCols} gap-1 items-center py-1.5 border-b border-border/20 px-2 ${
                    result?.success ? "bg-emerald-50/50 dark:bg-emerald-950/20" : result && !result.success ? "bg-destructive/5" : "hover:bg-muted/20"
                  }`}
                >
                  <span className="text-[10px] text-muted-foreground">{idx}</span>
                  <span className="text-[10px] font-semibold text-primary">#{order.order_number}</span>
                  <span className="text-[10px] truncate" title={order.customer_name}>{order.customer_name}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">{order.customer_phone}</span>
                  <span className="text-[10px] text-muted-foreground truncate" title={order.customer_address}>{order.customer_address}</span>
                  
                  {/* City & Zone selectors (Pathao only) */}
                  {isPathao && (
                    <>
                      {state && !result ? (
                        <OrderRowLocationSelector
                          order={order}
                          cities={cities as any[]}
                          citiesLoading={citiesLoading}
                          providerId={providerId}
                          state={state}
                          onChange={(updates) => updateOrderState(order.id, updates)}
                        />
                      ) : result ? (
                        <>
                          <span className="text-[10px] text-muted-foreground truncate">{state?.cityName}</span>
                          <span className="text-[10px] text-muted-foreground truncate">{state?.zoneName}</span>
                        </>
                      ) : (
                        <>
                          <span className="text-[10px] text-muted-foreground">—</span>
                          <span className="text-[10px] text-muted-foreground">—</span>
                        </>
                      )}
                    </>
                  )}

                  {/* Amount */}
                  <span className="text-[10px] font-bold text-center">৳{order.total_amount}</span>
                  
                  {/* Note */}
                  <span className="text-[9px] text-muted-foreground truncate" title={note}>
                    {note || "—"}
                  </span>

                  {/* Weight */}
                  {!result && state ? (
                    <Select value={state.weight} onValueChange={(v) => updateOrderState(order.id, { weight: v })}>
                      <SelectTrigger className="h-6 text-[9px] px-1"><span>{state.weight}Kg</span></SelectTrigger>
                      <SelectContent>
                        {["0.2", "0.5", "1", "1.5", "2", "2.5", "3", "4", "5"].map((w) => (
                          <SelectItem key={w} value={w} className="text-xs">{w}Kg</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="text-[10px] text-center">{state?.weight || "0.2"}Kg</span>
                  )}

                  {/* Status */}
                  <div className="flex flex-col items-center gap-0.5">
                    {result ? (
                      result.success ? (
                        <>
                          <Badge className="bg-emerald-600 text-white text-[8px] px-1 py-0 h-4">
                            <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" /> সাকসেস
                          </Badge>
                          {result.consignment_id && (
                            <span className="text-[8px] font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                              {result.consignment_id}
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          <Badge variant="destructive" className="text-[8px] px-1 py-0 h-4">
                            <AlertCircle className="h-2.5 w-2.5 mr-0.5" /> ব্যর্থ
                          </Badge>
                          {result.error && (
                            <span className="text-[7px] text-destructive max-w-[120px] text-center leading-tight line-clamp-3" title={result.error}>
                              {result.error}
                            </span>
                          )}
                        </>
                      )
                    ) : isPathao ? (
                      state?.cityId && state?.zoneId ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Badge variant="outline" className="text-[8px] text-destructive border-destructive/30 px-1 py-0">Zone নেই</Badge>
                      )
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="px-4 py-3 border-t flex items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 inline mr-1" />
            {hasResults
              ? `${successCount}/${submitResults.length} সাকসেসফুলি সাবমিট হয়েছে`
              : `${readyCount}/${orders.length} অর্ডার Ready`
            }
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              <X className="h-3.5 w-3.5 mr-1" /> {hasResults ? "বন্ধ করুন" : "বাতিল"}
            </Button>
            {!hasResults && (
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={isSubmitting || readyCount === 0}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isSubmitting ? (
                  <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> সাবমিট হচ্ছে ({progress.done}/{progress.total})</>
                ) : (
                  <><Truck className="h-3.5 w-3.5 mr-1" /> সাবমিট করুন ({readyCount})</>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
