import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ArrowLeft, Package, Truck, CheckCircle2, Clock, XCircle, RotateCcw, AlertTriangle } from "lucide-react";
import { sanitizePhoneInput } from "@/lib/phoneUtils";

const statusSteps = [
  { key: "processing", label: "প্রসেসিং", icon: Clock, color: "text-amber-500" },
  { key: "confirmed", label: "কনফার্মড", icon: CheckCircle2, color: "text-blue-500" },
  { key: "in_courier", label: "কুরিয়ারে", icon: Truck, color: "text-purple-500" },
  { key: "delivered", label: "ডেলিভারড", icon: Package, color: "text-green-600" },
];

const cancelStatuses = ["cancelled", "returned", "pending_return"];

export default function TrackOrder() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = sanitizePhoneInput(query) || query.trim();
    if (!q) return;
    setLoading(true);
    setError("");
    setOrder(null);
    setItems([]);

    try {
      // Search by order number or phone
      let orderData: any = null;
      
      // Try order number first
      const { data: byNumber } = await supabase
        .from("orders")
        .select("id, order_number, customer_name, customer_phone, status, total_amount, delivery_charge, discount, created_at, notes")
        .eq("order_number", q)
        .maybeSingle();
      
      if (byNumber) {
        orderData = byNumber;
      } else {
        // Try by phone (latest order)
        const { data: byPhone } = await supabase
          .from("orders")
          .select("id, order_number, customer_name, customer_phone, status, total_amount, delivery_charge, discount, created_at, notes")
          .eq("customer_phone", q)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        orderData = byPhone;
      }

      if (!orderData) {
        setError("কোনো অর্ডার পাওয়া যায়নি। অর্ডার নম্বর বা ফোন নম্বর দিয়ে আবার চেষ্টা করুন।");
        return;
      }

      setOrder(orderData);

      // Fetch items
      const { data: orderItems } = await supabase
        .from("order_items")
        .select("product_name, quantity, unit_price, total_price")
        .eq("order_id", orderData.id);
      setItems(orderItems || []);
    } catch {
      setError("সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  const currentStepIndex = order ? statusSteps.findIndex(s => s.key === order.status) : -1;
  const isCancelled = order && cancelStatuses.includes(order.status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/" className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-bold">অর্ডার ট্র্যাক করুন</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Search */}
        <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
          <div className="text-center mb-4">
            <div className="mx-auto w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mb-3">
              <Search className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="text-lg font-bold">আপনার অর্ডার খুঁজুন</h2>
            <p className="text-sm text-gray-500 mt-1">অর্ডার নম্বর অথবা ফোন নম্বর দিন</p>
          </div>
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              placeholder="অর্ডার নম্বর বা ফোন নম্বর..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="h-12 rounded-xl text-base"
              inputMode="tel"
            />
            <Button type="submit" disabled={loading || !query.trim()} className="h-12 px-6 rounded-xl">
              {loading ? "খুঁজছি..." : "খুঁজুন"}
            </Button>
          </form>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center text-red-600 text-sm mb-6">
            <AlertTriangle className="h-5 w-5 mx-auto mb-2" />
            {error}
          </div>
        )}

        {/* Order Details */}
        {order && (
          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            {/* Order Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-200 text-xs uppercase tracking-wide">অর্ডার নম্বর</p>
                  <p className="text-2xl font-bold">#{order.order_number}</p>
                </div>
                <div className="text-right">
                  <p className="text-blue-200 text-xs">তারিখ</p>
                  <p className="font-medium">{new Date(order.created_at).toLocaleDateString("bn-BD")}</p>
                </div>
              </div>
            </div>

            {/* Status Timeline */}
            <div className="p-5">
              {isCancelled ? (
                <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-200">
                  {order.status === "cancelled" ? <XCircle className="h-6 w-6 text-red-500" /> : <RotateCcw className="h-6 w-6 text-orange-500" />}
                  <div>
                    <p className="font-bold text-red-700">
                      {order.status === "cancelled" ? "অর্ডার বাতিল" : order.status === "returned" ? "রিটার্ন হয়েছে" : "রিটার্ন পেন্ডিং"}
                    </p>
                    <p className="text-xs text-red-500">{order.notes || ""}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between mb-6">
                  {statusSteps.map((step, i) => {
                    const isActive = i <= currentStepIndex;
                    const isCurrent = i === currentStepIndex;
                    const StepIcon = step.icon;
                    return (
                      <div key={step.key} className="flex-1 flex flex-col items-center relative">
                        {i > 0 && (
                          <div className={`absolute top-5 -left-1/2 w-full h-0.5 ${i <= currentStepIndex ? "bg-green-500" : "bg-gray-200"}`} />
                        )}
                        <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center ${isCurrent ? "bg-green-500 text-white ring-4 ring-green-100" : isActive ? "bg-green-500 text-white" : "bg-gray-200 text-gray-400"}`}>
                          <StepIcon className="h-5 w-5" />
                        </div>
                        <p className={`text-[11px] mt-2 font-medium text-center ${isActive ? "text-green-700" : "text-gray-400"}`}>{step.label}</p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Customer Info */}
              <div className="border-t pt-4 mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">নাম</span>
                  <span className="font-medium">{order.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">ফোন</span>
                  <span className="font-medium">{order.customer_phone}</span>
                </div>
              </div>

              {/* Items */}
              {items.length > 0 && (
                <div className="border-t pt-4 mt-4">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2">প্রোডাক্ট</p>
                  {items.map((item, i) => (
                    <div key={i} className="flex justify-between py-2 text-sm">
                      <span>{item.product_name} × {item.quantity}</span>
                      <span className="font-medium">৳{item.total_price}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Total */}
              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">ডেলিভারি</span>
                  <span>৳{order.delivery_charge}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-sm text-red-500">
                    <span>ডিসকাউন্ট</span>
                    <span>-৳{order.discount}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg mt-2">
                  <span>মোট</span>
                  <span className="text-green-600">৳{order.total_amount}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
