import { useState, useEffect, useMemo, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2, Truck, MapPin, X, CheckCircle2 } from "lucide-react";
import { useCourierCities, useCourierZones } from "@/hooks/useCourierLocations";
import { toast } from "sonner";

// Re-use location matching logic
const normalizeLocationName = (name: string) =>
  name
    .toLowerCase()
    .replace(/[''`]/g, "")
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const toPhoneticKey = (text: string) =>
  normalizeLocationName(text)
    .replace(/[aeiou]/g, "")
    .replace(/\s/g, "");

const bdDistrictList = [
  "Dhaka","Chittagong","Chattogram","Rajshahi","Khulna","Barishal","Barisal","Sylhet","Rangpur","Mymensingh",
  "Comilla","Cumilla","Gazipur","Narayanganj","Bogra","Bogura","Cox's Bazar","Coxs Bazar","Feni","Tangail",
  "Jessore","Jashore","Brahmanbaria","Narsingdi","Manikganj","Munshiganj","Madaripur","Gopalganj","Faridpur",
  "Shariatpur","Rajbari","Kishoreganj","Netrokona","Sherpur","Jamalpur","Dinajpur","Nilphamari","Kurigram",
  "Lalmonirhat","Gaibandha","Thakurgaon","Panchagarh","Chapainawabganj","Naogaon","Natore","Nawabganj",
  "Pabna","Sirajganj","Joypurhat","Habiganj","Sunamganj","Moulvibazar","Noakhali","Lakshmipur","Chandpur",
  "Pirojpur","Jhalokathi","Jhalokati","Bhola","Patuakhali","Barguna","Satkhira","Narail","Magura","Kushtia",
  "Meherpur","Chuadanga","Jhenaidah","Bandarban","Rangamati","Khagrachari","Keraniganj","Savar","Tongi",
];

const bdThanaList = [
  "Sadar","Mirpur","Uttara","Gulshan","Dhanmondi","Mohammadpur","Motijheel","Tejgaon","Badda","Rampura",
  "Khilgaon","Banani","Cantonment","Lalbagh","Kotwali","Demra","Jatrabari","Kadamtali","Shyampur","Sutrapur",
  "Wari","Hazaribagh","Kamrangirchar","Panchlaish","Halishahar","Bayezid","Double Mooring","Pahartali",
  "Bondor","Bondor","Bakalia","Chandgaon","Fatullah","Siddhirganj","Sonargaon","Rupganj","Araihazar",
  "Savar","Keraniganj","Dohar","Nawabganj","Dhamrai","Tongi","Gazipur Sadar","Kaliakair","Kaliganj",
  "Kapasia","Sreepur","Ghatail","Kalihati","Madhupur","Mirzapur","Nagarpur","Sakhipur","Basail","Delduar",
  "Hemayetpur","Ashulia","Fatullah Bazar","Keraniganj Sadar","Ukhia","Ramu","Teknaf","Chakaria",
];

const getLocationMatchScore = (address: string, candidate: string): number => {
  const normalizedAddress = normalizeLocationName(address);
  const normalizedCandidate = normalizeLocationName(candidate);
  if (!normalizedAddress || !normalizedCandidate) return 0;
  if (normalizedAddress.includes(normalizedCandidate)) return 100 + normalizedCandidate.length;

  const addressTokens = normalizedAddress.split(" ").filter(Boolean);
  const candidateTokens = normalizedCandidate.split(" ").filter((t) => t.length > 1);
  const tokenHits = candidateTokens.filter((ct) =>
    addressTokens.some((at) => at === ct || at.includes(ct) || ct.includes(at))
  ).length;
  if (tokenHits > 0) return 72 + tokenHits * 12 + normalizedCandidate.length;

  const addressKey = toPhoneticKey(address);
  const candidateKey = toPhoneticKey(candidate);
  if (candidateKey.length >= 3 && addressKey.includes(candidateKey)) return 88 + candidateKey.length;

  return 0;
};

const findBestMatch = (address: string, locations: Array<{ id: string | number; name: string }>) => {
  let best: { id: string | number; name: string } | null = null;
  let bestScore = 0;
  for (const loc of locations) {
    const score = getLocationMatchScore(address, loc.name);
    if (score > bestScore) { bestScore = score; best = loc; }
  }
  return bestScore >= 78 ? best : null;
};

const extractHints = (address: string) => {
  const n = normalizeLocationName(address);
  return {
    cityHints: bdDistrictList.filter((d) => n.includes(normalizeLocationName(d))),
    zoneHints: bdThanaList.filter((t) => n.includes(normalizeLocationName(t))),
  };
};

const findByHints = (locations: Array<{ id: string | number; name: string }>, hints: string[]) => {
  const nh = [...new Set(hints.map(normalizeLocationName).filter(Boolean))];
  for (const hint of nh) {
    const m = locations.find((l) => {
      const nl = normalizeLocationName(l.name);
      return nl === hint || nl.includes(hint) || hint.includes(nl);
    });
    if (m) return m;
  }
  return null;
};

const resolveMatch = (address: string, locations: Array<{ id: string | number; name: string }>, hints: string[]) =>
  findByHints(locations, hints) ?? findBestMatch(address, locations);

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

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orders: BulkOrderEntry[];
  providerId: string;
  providerName: string;
  onSubmit: (ordersWithLocations: Array<{ orderId: string; cityId: string; zoneId: string; areaId: string; weight: number; note: string }>) => void;
  isSubmitting: boolean;
  progress: { done: number; total: number };
}

function OrderRowLocationSelector({
  order,
  cities,
  citiesLoading,
  providerId,
  state,
  onChange,
}: {
  order: BulkOrderEntry;
  cities: Array<{ id: string | number; name: string }>;
  citiesLoading: boolean;
  providerId: string;
  state: OrderLocationState;
  onChange: (updates: Partial<OrderLocationState>) => void;
}) {
  const { data: zones = [], isLoading: zonesLoading } = useCourierZones(
    state.cityId ? providerId : null,
    state.cityId || null
  );

  // Auto-detect zone when city changes and zones load
  useEffect(() => {
    if (!state.cityId || zonesLoading || zones.length === 0 || state.zoneId) return;
    const { zoneHints } = extractHints(order.customer_address);
    const matched = resolveMatch(order.customer_address, zones as any[], zoneHints);
    if (matched) {
      onChange({ zoneId: String(matched.id), zoneName: matched.name });
    }
  }, [state.cityId, zones, zonesLoading]);

  return (
    <div className="grid grid-cols-[1fr_40px_60px_80px_1fr_1fr] gap-1 items-center">
      {/* City */}
      <Select value={state.cityId} onValueChange={(v) => {
        const city = cities.find((c) => String(c.id) === v);
        onChange({ cityId: v, cityName: city?.name || "", zoneId: "", zoneName: "", areaId: "" });
      }}>
        <SelectTrigger className="h-7 text-[10px]">
          {citiesLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <span className="truncate">{state.cityName || "City"}</span>}
        </SelectTrigger>
        <SelectContent className="max-h-60">
          {cities.map((c) => (
            <SelectItem key={String(c.id)} value={String(c.id)} className="text-xs">{c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {/* > arrow */}
      <span className="text-[10px] text-muted-foreground text-center">›</span>
      {/* Zone */}
      <Select value={state.zoneId} onValueChange={(v) => {
        const zone = zones.find((z: any) => String(z.id) === v);
        onChange({ zoneId: v, zoneName: (zone as any)?.name || "", areaId: "" });
      }} disabled={!state.cityId}>
        <SelectTrigger className="h-7 text-[10px]">
          {zonesLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <span className="truncate">{state.zoneName || "Zone"}</span>}
        </SelectTrigger>
        <SelectContent className="max-h-60">
          {zones.map((z: any) => (
            <SelectItem key={String(z.id)} value={String(z.id)} className="text-xs">{z.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {/* Amount */}
      <span className="text-xs font-bold text-center">৳{order.total_amount}</span>
      {/* Weight */}
      <Select value={state.weight} onValueChange={(v) => onChange({ weight: v })}>
        <SelectTrigger className="h-7 text-[10px]"><span>{state.weight}Kg</span></SelectTrigger>
        <SelectContent>
          {["0.5", "1", "1.5", "2", "2.5", "3", "4", "5"].map((w) => (
            <SelectItem key={w} value={w} className="text-xs">{w}Kg</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {/* Status indicator */}
      <div className="flex justify-center">
        {state.cityId && state.zoneId ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        ) : (
          <Badge variant="outline" className="text-[9px] text-destructive border-destructive/30">Zone নেই</Badge>
        )}
      </div>
    </div>
  );
}

export function PathaoBulkSubmitPreview({ open, onOpenChange, orders, providerId, providerName, onSubmit, isSubmitting, progress }: Props) {
  const { data: cities = [], isLoading: citiesLoading } = useCourierCities(open ? providerId : null);

  const [orderStates, setOrderStates] = useState<Record<string, OrderLocationState>>({});

  // Initialize order states and auto-detect cities
  useEffect(() => {
    if (!open || cities.length === 0) return;

    const newStates: Record<string, OrderLocationState> = {};
    for (const order of orders) {
      if (orderStates[order.id]?.cityId) {
        newStates[order.id] = orderStates[order.id];
        continue;
      }
      const { cityHints } = extractHints(order.customer_address);
      const matched = resolveMatch(order.customer_address, cities as any[], cityHints);
      newStates[order.id] = {
        cityId: matched ? String(matched.id) : "",
        zoneId: "",
        areaId: "",
        weight: "0.5",
        note: order.courier_note || order.notes || "",
        cityName: matched?.name || "",
        zoneName: "",
      };
    }
    setOrderStates(newStates);
  }, [open, cities, orders]);

  const updateOrderState = useCallback((orderId: string, updates: Partial<OrderLocationState>) => {
    setOrderStates((prev) => ({
      ...prev,
      [orderId]: { ...prev[orderId], ...updates },
    }));
  }, []);

  const readyCount = useMemo(() =>
    orders.filter((o) => orderStates[o.id]?.cityId && orderStates[o.id]?.zoneId).length,
    [orders, orderStates]
  );

  const handleSubmit = () => {
    const readyOrders = orders
      .filter((o) => orderStates[o.id]?.cityId && orderStates[o.id]?.zoneId)
      .map((o) => ({
        orderId: o.id,
        cityId: orderStates[o.id].cityId,
        zoneId: orderStates[o.id].zoneId,
        areaId: orderStates[o.id].areaId,
        weight: parseFloat(orderStates[o.id].weight) || 0.5,
        note: orderStates[o.id].note,
      }));

    if (readyOrders.length === 0) {
      toast.error("কোনো অর্ডারের Zone সিলেক্ট করা হয়নি!");
      return;
    }

    onSubmit(readyOrders);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-full max-h-[90vh] p-0">
        <DialogHeader className="px-4 pt-4 pb-2 border-b">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Truck className="h-5 w-5" />
            Send to {providerName}
            <Badge variant="secondary" className="ml-2">{orders.length} অর্ডার</Badge>
            <Badge variant="default" className="bg-emerald-600">{readyCount} Ready</Badge>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-140px)]">
          <div className="px-4 py-2">
            {/* Header */}
            <div className="grid grid-cols-[40px_60px_1fr_100px_1fr_1fr_40px_60px_80px_1fr_1fr] gap-1 items-center py-2 border-b border-border/50 bg-primary text-primary-foreground rounded-t-lg px-2">
              <span className="text-[9px] font-bold">SL</span>
              <span className="text-[9px] font-bold">ID</span>
              <span className="text-[9px] font-bold">Name</span>
              <span className="text-[9px] font-bold">Phone</span>
              <span className="text-[9px] font-bold">Address</span>
              <span className="text-[9px] font-bold">City</span>
              <span className="text-[9px] font-bold"></span>
              <span className="text-[9px] font-bold">Zone</span>
              <span className="text-[9px] font-bold text-center">Amount</span>
              <span className="text-[9px] font-bold">Weight</span>
              <span className="text-[9px] font-bold text-center">Status</span>
            </div>

            {/* Rows */}
            {orders.map((order, idx) => (
              <div key={order.id} className="grid grid-cols-[40px_60px_1fr_100px_1fr_2fr] gap-1 items-center py-2 border-b border-border/20 hover:bg-muted/20 px-2">
                <span className="text-[10px] text-muted-foreground">{idx}</span>
                <span className="text-[10px] font-semibold text-primary">#{order.order_number}</span>
                <span className="text-[10px] truncate" title={order.customer_name}>{order.customer_name}</span>
                <span className="text-[10px] text-muted-foreground">{order.customer_phone}</span>
                <span className="text-[10px] text-muted-foreground truncate" title={order.customer_address}>{order.customer_address}</span>
                {orderStates[order.id] && (
                  <OrderRowLocationSelector
                    order={order}
                    cities={cities as any[]}
                    citiesLoading={citiesLoading}
                    providerId={providerId}
                    state={orderStates[order.id]}
                    onChange={(updates) => updateOrderState(order.id, updates)}
                  />
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="px-4 py-3 border-t flex items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 inline mr-1" />
            {readyCount}/{orders.length} অর্ডারের Location সেট আছে
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              <X className="h-3.5 w-3.5 mr-1" /> বাতিল
            </Button>
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
