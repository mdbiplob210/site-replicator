import { useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, ArrowLeft, Package, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTracking } from "@/hooks/useTracking";

const OrderSuccess = () => {
  const [searchParams] = useSearchParams();
  const orderNumber = searchParams.get("order") || "";
  const { trackPurchase } = useTracking();

  // Read order data persisted by checkout flow
  const orderData = useMemo(() => {
    try {
      const raw = sessionStorage.getItem("last_order");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  // Fire Purchase event on success page as reliable backup
  useEffect(() => {
    const effectiveOrderNumber = orderNumber || orderData?.orderNumber;
    if (!effectiveOrderNumber || !orderData) return;

    // trackPurchase has built-in dedup via markPurchaseTracked
    console.log("[Purchase] Firing from OrderSuccess page", {
      orderId: effectiveOrderNumber,
      value: orderData.total,
      product: orderData.name,
    });

    trackPurchase({
      value: orderData.total || 0,
      orderId: effectiveOrderNumber,
      contentName: orderData.name || "",
      contentId: orderData.productCode || "",
      qty: orderData.qty || 1,
      customerPhone: orderData.customerPhone,
      customerName: orderData.customerName,
    });
  }, [orderNumber, orderData, trackPurchase]);

  const displayOrderNumber = orderNumber || orderData?.orderNumber || "";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 px-4">
      <div className="text-center max-w-md w-full">
        <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-500">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">অর্ডার সফল হয়েছে! 🎉</h1>
        <p className="text-gray-500 mb-2">আপনার অর্ডারটি প্রসেসিং এ আছে। আমরা শীঘ্রই আপনাকে কল করবো।</p>

        {displayOrderNumber && (
          <div className="bg-white rounded-xl border border-green-200 p-4 mb-6 mt-4 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">অর্ডার নম্বর</p>
            <p className="text-2xl font-black text-green-600">#{displayOrderNumber}</p>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 space-y-3 text-left shadow-sm">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Package className="h-4 w-4 text-green-500 flex-shrink-0" />
            <span>ডেলিভারি ২-৫ কার্যদিবসের মধ্যে</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Phone className="h-4 w-4 text-blue-500 flex-shrink-0" />
            <span>কনফার্মেশনের জন্য শীঘ্রই কল করা হবে</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <MapPin className="h-4 w-4 text-red-500 flex-shrink-0" />
            <span>ক্যাশ অন ডেলিভারি</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {displayOrderNumber && (
            <Link to={`/track-order?q=${displayOrderNumber}`}>
              <Button className="w-full bg-green-600 hover:bg-green-700 text-white gap-2">
                📦 অর্ডার ট্র্যাক করুন
              </Button>
            </Link>
          )}
          <Link to="/">
            <Button variant="outline" className="w-full gap-2">
              <ArrowLeft className="h-4 w-4" /> শপে ফিরে যান
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
