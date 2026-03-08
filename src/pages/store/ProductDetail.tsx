import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useProduct } from "@/hooks/usePublicProducts";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Button } from "@/components/ui/button";
import { ShoppingBag, ArrowLeft, Minus, Plus, Truck, Shield, RotateCcw, Star, Phone, MessageCircle } from "lucide-react";
import { useTracking, useEngagementTracking } from "@/hooks/useTracking";
import { PopupCheckout } from "@/components/store/PopupCheckout";
import { OptimizedImage } from "@/components/ui/optimized-image";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: product, isLoading } = useProduct(id || "");
  const { data: settings } = useSiteSettings();
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const { trackViewContent, trackAddToCart } = useTracking();
  useEngagementTracking();
  const viewTracked = useState(false);

  // Popup checkout
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutItem, setCheckoutItem] = useState<any>(null);
  const [appliedDiscount, setAppliedDiscount] = useState(() => {
    const saved = localStorage.getItem("exit_discount_amount");
    return saved ? Number(saved) : 0;
  });
  const [showDiscountBanner, setShowDiscountBanner] = useState(false);

  useEffect(() => {
    if (product && !viewTracked[0]) {
      viewTracked[1](true);
      trackViewContent({
        id: product.id,
        name: product.name,
        price: product.selling_price,
        category: (product.categories as any)?.name || "",
        productCode: product.product_code,
        image: product.main_image_url || "",
      });
    }
  }, [product, trackViewContent, viewTracked]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full" /></div>;
  if (!product) return <div className="min-h-screen flex items-center justify-center">Product not found</div>;

  const discount = product.original_price > product.selling_price
    ? Math.round(((product.original_price - product.selling_price) / product.original_price) * 100)
    : 0;
  const discountAmount = product.original_price - product.selling_price;

  const whatsappNumber = settings?.whatsapp_number || "";
  const phoneNumber = settings?.phone_number || "";

  const handleOrder = () => {
    trackAddToCart({
      id: product.id,
      name: product.name,
      price: product.selling_price,
      qty,
      productCode: product.product_code,
      category: (product.categories as any)?.name || "",
    });
    setCheckoutItem({
      productId: product.id,
      name: product.name,
      price: product.selling_price,
      qty,
      image: product.main_image_url,
      productCode: product.product_code,
      categoryId: product.category_id,
    });
    setCheckoutOpen(true);
  };

  const handleExitIntent = () => {
    if (discountUsed) return;
    setCheckoutOpen(false);
    setShowDiscountBanner(true);
  };

  const handleAcceptDiscount = () => {
    setDiscountUsed(true);
    setAppliedDiscount(50);
    setShowDiscountBanner(false);
    setCheckoutOpen(true);
  };

  const handleRejectDiscount = () => {
    setShowDiscountBanner(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white text-center py-2 text-xs font-medium">
        🚚 সারা দেশে ক্যাশ অন ডেলিভারি | ২-৫ দিনে ডেলিভারি
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <Link to="/" className="flex items-center gap-1">
            <span className="text-xl font-black text-green-600">QUICK SHOP</span>
            <span className="text-xl font-black text-gray-800">BD</span>
          </Link>
          <div className="w-10" />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-4">
        {/* Product card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Image */}
          <div className="relative aspect-square sm:aspect-[4/3] max-h-[500px] overflow-hidden bg-gray-50">
            {product.main_image_url ? (
              <OptimizedImage src={product.main_image_url} alt={product.name} width={800} quality={85} eager className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ShoppingBag className="h-20 w-20 text-gray-200" />
              </div>
            )}
            {discount > 0 && (
              <div className="absolute top-3 right-3 w-14 h-14 rounded-full border-2 border-dashed border-red-400 bg-white flex flex-col items-center justify-center">
                <span className="text-red-500 font-bold text-xs leading-none">{discountAmount}</span>
                <span className="text-red-500 font-bold text-[10px] leading-none">টাকা</span>
                <span className="text-red-500 font-bold text-[10px] leading-none">ছাড়</span>
              </div>
            )}
            {/* Thumbnail */}
            {product.additional_images && product.additional_images.length > 0 && (
              <div className="absolute bottom-3 left-3 flex gap-2">
                <div className="w-12 h-12 rounded-lg overflow-hidden border-2 border-green-500 bg-white">
                  <img src={product.main_image_url || ""} alt="" className="w-full h-full object-cover" />
                </div>
                {product.additional_images.slice(0, 3).map((img, i) => (
                  <div key={i} className="w-12 h-12 rounded-lg overflow-hidden border-2 border-white bg-white">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product info */}
          <div className="p-4 sm:p-6">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{product.name}</h1>

            {/* Price */}
            <div className="flex items-center gap-3 mt-2">
              <span className="text-green-600 font-black text-2xl">মূল্য: ৳{product.selling_price} টাকা</span>
              {discount > 0 && (
                <span className="text-gray-400 line-through text-base">মূল্য: ৳{product.original_price} টাকা</span>
              )}
            </div>

            {product.short_description && (
              <p className="text-gray-500 mt-2 text-sm">{product.short_description}</p>
            )}

            {/* Quantity */}
            <div className="flex items-center gap-3 mt-4">
              <div className="flex items-center border rounded-full overflow-hidden">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-2 hover:bg-gray-100 transition">
                  <Minus className="h-4 w-4" />
                </button>
                <span className="px-4 py-2 font-bold min-w-[3rem] text-center">{qty}</span>
                <button onClick={() => setQty(qty + 1)} className="px-3 py-2 hover:bg-gray-100 transition">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <span className={`text-sm ${product.stock_quantity > 0 ? "text-green-600" : "text-red-500"}`}>
                {product.stock_quantity > 0 ? `✓ স্টকে আছে` : "✗ স্টকে নেই"}
              </span>
            </div>

            {/* Action buttons */}
            <div className="space-y-2 mt-5">
              <Button
                size="lg"
                onClick={handleOrder}
                disabled={product.stock_quantity <= 0 && !product.allow_out_of_stock_orders}
                className="w-full text-base font-bold py-6 rounded-xl bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200"
              >
                🛒 অর্ডার করুন
              </Button>

              <button
                onClick={handleOrder}
                className="w-full py-3 border border-green-600 text-green-600 hover:bg-green-50 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition"
              >
                <ShoppingBag className="h-4 w-4" /> কার্টে যোগ করুন
              </button>

              {/* Contact buttons */}
              {whatsappNumber && (
                <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer"
                  className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition">
                  <MessageCircle className="h-4 w-4" /> WhatsApp Message: {whatsappNumber}
                </a>
              )}
              {phoneNumber && (
                <a href={`tel:${phoneNumber}`}
                  className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition">
                  <Phone className="h-4 w-4" /> কল করতে ক্লিক করুন: {phoneNumber}
                </a>
              )}
            </div>

            {/* Category */}
            {(product.categories as any)?.name && (
              <p className="text-sm text-gray-500 mt-4">ক্যাটাগরি: {(product.categories as any).name}</p>
            )}

            {/* Delivery info table */}
            <div className="border rounded-xl mt-4 overflow-hidden">
              <div className="grid grid-cols-2 text-sm">
                <div className="p-3 bg-gray-50 font-medium">ঢাকা সিটির বাহির</div>
                <div className="p-3 font-bold text-right">150 টাকা</div>
                <div className="p-3 bg-gray-50 font-medium border-t">ঢাকা সিটির ভিতর</div>
                <div className="p-3 font-bold text-right border-t">80 টাকা</div>
              </div>
            </div>

            {/* Trust signals */}
            <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t">
              <div className="text-center text-xs text-gray-500">
                <Truck className="h-5 w-5 mx-auto mb-1 text-green-600" />
                দ্রুত ডেলিভারি
              </div>
              <div className="text-center text-xs text-gray-500">
                <Shield className="h-5 w-5 mx-auto mb-1 text-green-600" />
                গ্যারান্টি
              </div>
              <div className="text-center text-xs text-gray-500">
                <RotateCcw className="h-5 w-5 mx-auto mb-1 text-green-600" />
                রিটার্ন পলিসি
              </div>
            </div>
          </div>
        </div>

        {/* Detailed description */}
        {product.detailed_description && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mt-4 p-4 sm:p-6">
            <div className="flex gap-4 mb-4">
              <button className="px-4 py-2 bg-green-600 text-white rounded-full text-sm font-semibold">পণ্যর বিস্তারিত</button>
              <button className="px-4 py-2 text-gray-500 text-sm font-semibold">রিটার্ন পলিসি</button>
            </div>
            <div className="text-gray-600 leading-relaxed whitespace-pre-wrap text-sm">{product.detailed_description}</div>
          </div>
        )}
      </div>

      {/* Discount Banner */}
      {showDiscountBanner && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleRejectDiscount} />
          <div className="relative w-[90%] max-w-sm animate-in zoom-in-95 duration-300">
            {/* Close */}
            <button onClick={handleRejectDiscount} className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center">
              <span className="text-gray-500 text-lg font-bold">✕</span>
            </button>
            <div className="bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 rounded-3xl p-1 shadow-2xl">
              <div className="bg-white rounded-[22px] overflow-hidden">
                {/* Top ribbon */}
                <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-center py-2.5 px-4">
                  <p className="text-xs font-bold tracking-wide uppercase animate-pulse">⚡ বিশেষ অফার — শুধুমাত্র আপনার জন্য! ⚡</p>
                </div>
                {/* Body */}
                <div className="p-6 text-center">
                  <div className="relative inline-block mb-3">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-200">
                      <div className="text-white">
                        <span className="text-3xl font-black block leading-none">৳50</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider">ছাড়!</span>
                      </div>
                    </div>
                    <div className="absolute -top-1 -right-1 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center animate-bounce">
                      <span className="text-white text-xs">🎁</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-black text-gray-900 mb-1">এই ছাড়টি শুধু আপনার জন্য!</h3>
                  <p className="text-sm text-gray-500 mb-1">আজকেই অর্ডার করুন এবং পান</p>
                  <p className="text-2xl font-black text-red-500 mb-3">৳50 টাকা ছাড়!</p>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-2.5 mb-4">
                    <p className="text-xs text-yellow-700 font-semibold">⏰ এই অফার সীমিত সময়ের জন্য — আজকেই অর্ডার করুন!</p>
                  </div>
                  <button
                    onClick={handleAcceptDiscount}
                    className="w-full py-3.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-bold text-base shadow-lg shadow-green-200 transition-all transform hover:scale-[1.02] active:scale-95"
                  >
                    🎉 ৳50 ছাড়ে অর্ডার করুন
                  </button>
                  <button onClick={handleRejectDiscount} className="mt-2 text-xs text-gray-400 hover:text-gray-600 transition">
                    না, ছাড় লাগবে না
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Popup Checkout */}
      <PopupCheckout
        item={checkoutItem}
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        discount={appliedDiscount}
        onExitIntent={handleExitIntent}
      />
    </div>
  );
};

export default ProductDetail;
