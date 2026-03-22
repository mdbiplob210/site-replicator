import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search, ArrowLeft, Package, Truck, CheckCircle2, Clock, XCircle,
  RotateCcw, AlertTriangle, Phone, Copy, Check, MapPin, MessageSquare,
  Box, CircleDot, ChevronDown, ChevronUp, Loader2
} from "lucide-react";
import { sanitizePhoneInput } from "@/lib/phoneUtils";
import { fetchCourierCheck, getCourierCacheEntry } from "@/lib/courierCheckCache";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Internal order status steps
const statusSteps = [
  { key: "processing", label: "প্রসেসিং", icon: Clock, color: "text-amber-500" },
  { key: "confirmed", label: "কনফার্মড", icon: CheckCircle2, color: "text-blue-500" },
  { key: "in_courier", label: "কুরিয়ারে", icon: Truck, color: "text-purple-500" },
  { key: "delivered", label: "ডেলিভারড", icon: Package, color: "text-green-600" },
];
const cancelStatuses = ["cancelled", "returned", "pending_return"];

// Courier status color mapping
function getStatusColor(status: string) {
  const s = status?.toLowerCase() || "";
  if (s.includes("deliver") || s.includes("success") || s.includes("completed")) return "bg-emerald-500";
  if (s.includes("cancel") || s.includes("return") || s.includes("fail")) return "bg-red-500";
  if (s.includes("pending") || s.includes("pick") || s.includes("hold")) return "bg-amber-500";
  if (s.includes("transit") || s.includes("hub") || s.includes("sort")) return "bg-blue-500";
  return "bg-gray-500";
}

function getStatusBg(status: string) {
  const s = status?.toLowerCase() || "";
  if (s.includes("deliver") || s.includes("success") || s.includes("completed")) return "bg-emerald-50 border-emerald-200 text-emerald-700";
  if (s.includes("cancel") || s.includes("return") || s.includes("fail")) return "bg-red-50 border-red-200 text-red-700";
  if (s.includes("pending") || s.includes("pick") || s.includes("hold")) return "bg-amber-50 border-amber-200 text-amber-700";
  if (s.includes("transit") || s.includes("hub") || s.includes("sort")) return "bg-blue-50 border-blue-200 text-blue-700";
  return "bg-gray-50 border-gray-200 text-gray-700";
}

function getStatusIcon(status: string) {
  const s = status?.toLowerCase() || "";
  if (s.includes("deliver") || s.includes("success") || s.includes("completed")) return CheckCircle2;
  if (s.includes("cancel") || s.includes("return") || s.includes("fail")) return XCircle;
  if (s.includes("pending") || s.includes("pick") || s.includes("hold")) return Clock;
  if (s.includes("transit") || s.includes("hub") || s.includes("sort")) return Truck;
  return CircleDot;
}

const COURIER_LOGOS: Record<string, string> = {
  pathao: "https://api.bdcourier.com/c-logo/pathao-logo.png",
  steadfast: "https://api.bdcourier.com/c-logo/steadfast-logo.png",
  redx: "https://api.bdcourier.com/c-logo/redx-logo.png",
  ecourier: "https://api.bdcourier.com/c-logo/ecourier-logo.png",
  paperfly: "https://api.bdcourier.com/c-logo/paperfly-logo.png",
  parceldex: "https://api.bdcourier.com/c-logo/parceldex-logo.png",
  carrybee: "https://api.bdcourier.com/c-logo/carrybee-logo.webp",
};

// Priority couriers shown as featured cards
const FEATURED_COURIERS = ["steadfast", "pathao"];

export default function TrackOrder() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState("");
  
  // Courier history state
  const [courierData, setCourierData] = useState<any>(null);
  const [courierLoading, setCourierLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showAllCouriers, setShowAllCouriers] = useState(false);
  
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSearchRef = useRef("");

  // Debounced search
  const triggerSearch = useCallback((value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      doSearch(value);
    }, 500);
  }, []);

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    const clean = sanitizePhoneInput(val) || val.trim();
    if (clean.length >= 3) {
      triggerSearch(clean);
    }
  };

  const doSearch = async (q: string) => {
    if (!q || q === lastSearchRef.current) return;
    lastSearchRef.current = q;
    
    setLoading(true);
    setError("");
    setOrder(null);
    setItems([]);
    setCourierData(null);

    try {
      // Search internal orders
      let orderData: any = null;
      const { data: byNumber } = await supabase
        .from("orders")
        .select("id, order_number, customer_name, customer_phone, status, total_amount, delivery_charge, discount, created_at, notes")
        .eq("order_number", q)
        .maybeSingle();

      if (byNumber) {
        orderData = byNumber;
      } else {
        const { data: byPhone } = await supabase
          .from("orders")
          .select("id, order_number, customer_name, customer_phone, status, total_amount, delivery_charge, discount, created_at, notes")
          .eq("customer_phone", q)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        orderData = byPhone;
      }

      if (orderData) {
        setOrder(orderData);
        // Fetch items
        const { data: orderItems } = await supabase
          .from("order_items")
          .select("product_name, quantity, unit_price, total_price")
          .eq("order_id", orderData.id);
        setItems(orderItems || []);
      }

      // Also fetch courier history if looks like a phone number
      const cleanDigits = q.replace(/\D/g, "");
      if (cleanDigits.length >= 11) {
        setCourierLoading(true);
        try {
          const data = await fetchCourierCheck(cleanDigits);
          setCourierData(data);
        } catch {
          // silent fail for courier check
        } finally {
          setCourierLoading(false);
        }
      }

      if (!orderData && cleanDigits.length < 11) {
        setError("কোনো অর্ডার পাওয়া যায়নি। অর্ডার নম্বর বা ফোন নম্বর দিয়ে আবার চেষ্টা করুন।");
      }
    } catch {
      setError("সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = sanitizePhoneInput(query) || query.trim();
    if (!clean) {
      setError("মোবাইল নম্বর বা ট্র্যাকিং আইডি দিন");
      return;
    }
    lastSearchRef.current = ""; // force re-search
    doSearch(clean);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentStepIndex = order ? statusSteps.findIndex(s => s.key === order.status) : -1;
  const isCancelled = order && cancelStatuses.includes(order.status);

  // Parse courier data
  const courierEntries = courierData?.status === "success" && courierData?.data
    ? Object.entries(courierData.data)
        .filter(([k]) => k !== "summary")
        .map(([k, v]: [string, any]) => ({ key: k, ...v }))
        .filter((c: any) => c.total_parcel > 0)
    : [];
  const courierSummary = courierData?.data?.summary;
  const hasResults = order || (courierEntries.length > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/" className="p-2 -ml-2 rounded-xl hover:bg-gray-100 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-foreground">কুরিয়ার ট্র্যাকিং</h1>
            <p className="text-[11px] text-muted-foreground">অর্ডার ও কুরিয়ার হিস্ট্রি দেখুন</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Search Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-border/50 p-5">
          <div className="text-center mb-4">
            <div className="mx-auto w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-blue-500/20">
              <Search className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-lg font-bold text-foreground">ট্র্যাক করুন</h2>
            <p className="text-sm text-muted-foreground mt-1">মোবাইল নম্বর বা অর্ডার নম্বর দিন</p>
          </div>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Input
                placeholder="01XXXXXXXXX বা অর্ডার নম্বর..."
                value={query}
                onChange={handleInputChange}
                className="h-12 rounded-xl text-base pl-4 pr-10 border-border/60 focus:border-blue-400"
                inputMode="tel"
              />
              {(loading || courierLoading) && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-blue-500" />
              )}
            </div>
            <Button 
              type="submit" 
              disabled={loading || !query.trim()} 
              className="h-12 px-5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/20"
            >
              <Search className="h-4 w-4" />
            </Button>
          </form>
        </div>

        {/* Empty state hint */}
        {!loading && !error && !hasResults && !courierLoading && (
          <div className="text-center py-10 animate-fade-in">
            <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Package className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-muted-foreground text-sm">মোবাইল নম্বর দিলে কুরিয়ার হিস্ট্রি দেখতে পারবেন</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center text-red-600 text-sm animate-fade-in">
            <AlertTriangle className="h-5 w-5 mx-auto mb-2" />
            {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && !order && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-white rounded-2xl border border-border/50 p-5 space-y-3">
              <div className="h-6 bg-gray-200 rounded-lg w-1/3 animate-pulse" />
              <div className="h-4 bg-gray-100 rounded-lg w-2/3 animate-pulse" />
              <div className="h-16 bg-gray-100 rounded-xl animate-pulse" />
            </div>
          </div>
        )}

        {/* Internal Order Details */}
        {order && (
          <div className="bg-white rounded-2xl shadow-sm border border-border/50 overflow-hidden animate-fade-in">
            {/* Order Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-200 text-[10px] uppercase tracking-wider font-medium">অর্ডার নম্বর</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-2xl font-bold">#{order.order_number}</p>
                    <button 
                      onClick={() => handleCopy(order.order_number)}
                      className="p-1 rounded hover:bg-white/20 transition"
                    >
                      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5 opacity-70" />}
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-blue-200 text-[10px] uppercase tracking-wider font-medium">তারিখ</p>
                  <p className="font-semibold mt-0.5">{new Date(order.created_at).toLocaleDateString("bn-BD")}</p>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-5">
              {/* Status Timeline */}
              {isCancelled ? (
                <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-200">
                  {order.status === "cancelled" ? <XCircle className="h-6 w-6 text-red-500" /> : <RotateCcw className="h-6 w-6 text-orange-500" />}
                  <div>
                    <p className="font-bold text-red-700">
                      {order.status === "cancelled" ? "অর্ডার বাতিল" : order.status === "returned" ? "রিটার্ন হয়েছে" : "রিটার্ন পেন্ডিং"}
                    </p>
                    {order.notes && <p className="text-xs text-red-500 mt-0.5">{order.notes}</p>}
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">অর্ডার প্রগ্রেস</p>
                  <div className="flex items-center justify-between">
                    {statusSteps.map((step, i) => {
                      const isActive = i <= currentStepIndex;
                      const isCurrent = i === currentStepIndex;
                      const StepIcon = step.icon;
                      return (
                        <div key={step.key} className="flex-1 flex flex-col items-center relative">
                          {i > 0 && (
                            <div className={`absolute top-5 -left-1/2 w-full h-0.5 transition-colors duration-500 ${i <= currentStepIndex ? "bg-emerald-500" : "bg-gray-200"}`} />
                          )}
                          <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${isCurrent ? "bg-emerald-500 text-white ring-4 ring-emerald-100 scale-110" : isActive ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-400"}`}>
                            <StepIcon className="h-5 w-5" />
                          </div>
                          <p className={`text-[11px] mt-2 font-medium text-center transition-colors ${isActive ? "text-emerald-700" : "text-gray-400"}`}>{step.label}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Customer Info */}
              <div className="border-t border-border/40 pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">নাম</span>
                  <span className="font-medium text-foreground">{order.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ফোন</span>
                  <span className="font-medium text-foreground">{order.customer_phone}</span>
                </div>
              </div>

              {/* Items */}
              {items.length > 0 && (
                <div className="border-t border-border/40 pt-4">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">প্রোডাক্ট</p>
                  {items.map((item, i) => (
                    <div key={i} className="flex justify-between py-2 text-sm border-b border-border/20 last:border-0">
                      <span className="text-foreground">{item.product_name} × {item.quantity}</span>
                      <span className="font-semibold text-foreground">৳{item.total_price}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Total */}
              <div className="border-t border-border/40 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">ডেলিভারি</span>
                  <span className="text-foreground">৳{order.delivery_charge}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-sm text-red-500">
                    <span>ডিসকাউন্ট</span>
                    <span>-৳{order.discount}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg mt-2">
                  <span className="text-foreground">মোট</span>
                  <span className="text-emerald-600">৳{order.total_amount}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Courier History Section */}
        {courierLoading && !courierData && (
          <div className="bg-white rounded-2xl border border-border/50 p-8 text-center animate-fade-in">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">কুরিয়ার হিস্ট্রি লোড হচ্ছে...</p>
          </div>
        )}

        {courierData && courierSummary && (
          <div className="space-y-4 animate-fade-in">
            {/* Summary Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-border/50 overflow-hidden">
              <div className="bg-gradient-to-r from-slate-700 to-slate-800 text-white p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Truck className="h-5 w-5" />
                  <h3 className="font-bold text-sm">কুরিয়ার হিস্ট্রি সামারি</h3>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white/10 backdrop-blur rounded-xl p-3 text-center">
                    <p className="text-2xl font-black">{courierSummary.total_parcel || 0}</p>
                    <p className="text-[10px] text-white/70 uppercase tracking-wider mt-0.5">মোট</p>
                  </div>
                  <div className="bg-emerald-500/20 backdrop-blur rounded-xl p-3 text-center">
                    <p className="text-2xl font-black text-emerald-300">{courierSummary.success_parcel || 0}</p>
                    <p className="text-[10px] text-emerald-200/70 uppercase tracking-wider mt-0.5">সাকসেস</p>
                  </div>
                  <div className="bg-red-500/20 backdrop-blur rounded-xl p-3 text-center">
                    <p className="text-2xl font-black text-red-300">{courierSummary.cancelled_parcel || 0}</p>
                    <p className="text-[10px] text-red-200/70 uppercase tracking-wider mt-0.5">ক্যান্সেল</p>
                  </div>
                </div>
                {/* Success rate bar */}
                {courierSummary.total_parcel > 0 && (
                  <div className="mt-3">
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-white/60">সাকসেস রেট</span>
                      <span className="font-bold text-emerald-300">
                        {Math.round((courierSummary.success_parcel / courierSummary.total_parcel) * 100)}%
                      </span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-700"
                        style={{ width: `${(courierSummary.success_parcel / courierSummary.total_parcel) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Per-courier breakdown */}
            {courierEntries.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-border/50 overflow-hidden">
                <div className="p-4 border-b border-border/40">
                  <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                    <Box className="h-4 w-4 text-muted-foreground" />
                    কুরিয়ার ভিত্তিক হিস্ট্রি
                  </h3>
                </div>
                <div className="divide-y divide-border/30">
                  {(showAllCouriers ? courierEntries : courierEntries.slice(0, 3)).map((courier: any, idx: number) => (
                    <div key={courier.key} className={`p-4 ${idx % 2 === 0 ? "bg-background" : "bg-muted/20"} animate-fade-in`} style={{ animationDelay: `${idx * 80}ms` }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {COURIER_LOGOS[courier.key] ? (
                            <img 
                              src={COURIER_LOGOS[courier.key]} 
                              alt={courier.key} 
                              className="h-6 w-auto max-w-[80px] object-contain" 
                              loading="lazy" 
                            />
                          ) : (
                            <span className="font-bold text-foreground text-sm capitalize">{courier.name || courier.key}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="text-center">
                            <p className="font-black text-foreground text-base">{courier.total_parcel}</p>
                            <p className="text-[9px] text-muted-foreground uppercase">মোট</p>
                          </div>
                          <div className="text-center">
                            <p className="font-black text-emerald-600 text-base">{courier.success_parcel}</p>
                            <p className="text-[9px] text-emerald-600 uppercase">সাকসেস</p>
                          </div>
                          <div className="text-center">
                            <p className="font-black text-red-500 text-base">{courier.cancelled_parcel}</p>
                            <p className="text-[9px] text-red-500 uppercase">ক্যান্সেল</p>
                          </div>
                        </div>
                      </div>
                      {/* Mini progress bar per courier */}
                      {courier.total_parcel > 0 && (
                        <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden flex">
                          <div 
                            className="h-full bg-emerald-500 transition-all duration-500"
                            style={{ width: `${(courier.success_parcel / courier.total_parcel) * 100}%` }}
                          />
                          <div 
                            className="h-full bg-red-400 transition-all duration-500"
                            style={{ width: `${(courier.cancelled_parcel / courier.total_parcel) * 100}%` }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {courierEntries.length > 3 && (
                  <button
                    onClick={() => setShowAllCouriers(!showAllCouriers)}
                    className="w-full py-3 text-sm text-blue-600 hover:bg-blue-50 transition flex items-center justify-center gap-1 border-t border-border/30"
                  >
                    {showAllCouriers ? (
                      <><ChevronUp className="h-4 w-4" /> কম দেখুন</>
                    ) : (
                      <><ChevronDown className="h-4 w-4" /> আরো {courierEntries.length - 3}টি দেখুন</>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* No courier data found */}
        {!courierLoading && courierData && (!courierSummary || courierSummary.total_parcel === 0) && !order && (
          <div className="bg-white rounded-2xl border border-border/50 p-6 text-center animate-fade-in">
            <div className="mx-auto w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mb-3">
              <Package className="h-6 w-6 text-blue-400" />
            </div>
            <p className="font-semibold text-foreground">নতুন কাস্টমার</p>
            <p className="text-sm text-muted-foreground mt-1">এই নম্বরে কোনো কুরিয়ার হিস্ট্রি পাওয়া যায়নি</p>
          </div>
        )}

        {/* Call Support */}
        {hasResults && (
          <div className="flex gap-3 animate-fade-in">
            <a
              href="tel:+8801XXXXXXXXX"
              className="flex-1 flex items-center justify-center gap-2 bg-white border border-border/50 rounded-xl py-3.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors shadow-sm"
            >
              <Phone className="h-4 w-4 text-emerald-500" />
              কল করুন
            </a>
            <a
              href="https://wa.me/8801XXXXXXXXX"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 rounded-xl py-3.5 text-sm font-medium text-white hover:bg-emerald-700 transition-colors shadow-sm"
            >
              <MessageSquare className="h-4 w-4" />
              WhatsApp
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
