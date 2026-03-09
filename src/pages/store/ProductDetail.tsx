import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useProduct, useSuggestedProducts } from "@/hooks/usePublicProducts";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Button } from "@/components/ui/button";
import { ShoppingBag, ArrowLeft, Minus, Plus, Truck, Shield, RotateCcw, Phone, MessageCircle } from "lucide-react";
import { useTracking, useEngagementTracking } from "@/hooks/useTracking";
import { PopupCheckout } from "@/components/store/PopupCheckout";
import { ExitDiscountBanner } from "@/components/store/ExitDiscountBanner";
import { OptimizedImage } from "@/components/ui/optimized-image";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: product, isLoading } = useProduct(id || "");
  const { data: settings } = useSiteSettings();
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const { trackViewContent, trackAddToCart, trackCustomEvent } = useTracking();
  useEngagementTracking();
  const viewTracked = useState(false);

  // Image gallery state
  const [selectedImage, setSelectedImage] = useState(0);
  const allImages = product ? [product.main_image_url, ...(product.additional_images || [])].filter(Boolean) as string[] : [];

  // Exit popup settings from site_settings
  const exitEnabled = settings?.exit_popup_enabled === 'true';
  const exitDiscount = Number(settings?.exit_popup_discount || 50);
  const exitTimer = Number(settings?.exit_popup_timer || 300);
  const exitMessage = settings?.exit_popup_message || 'এই ছাড়টি শুধু আপনার জন্য!';

  // Popup checkout
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutItem, setCheckoutItem] = useState<any>(null);
  const [appliedDiscount, setAppliedDiscount] = useState(() => {
    const saved = localStorage.getItem("exit_discount_amount");
    return saved ? Number(saved) : 0;
  });
  const [showDiscountBanner, setShowDiscountBanner] = useState(false);
  const exitShownRef = useRef(false);

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

  // Exit intent detection
  useEffect(() => {
    if (!exitEnabled || appliedDiscount > 0) return;
    const dismissed = sessionStorage.getItem('_store_exit_dismissed');
    if (dismissed) return;
    let canShow = false;
    const delayTimer = setTimeout(() => { canShow = true; }, 5000);
    const triggerExit = () => {
      if (!canShow || exitShownRef.current || checkoutOpen) return;
      exitShownRef.current = true;
      setShowDiscountBanner(true);
      trackCustomEvent('ExitIntentShown', { page: 'product', product_id: id });
    };
    const handleMouseOut = (e: MouseEvent) => { if (e.clientY <= 0 && !e.relatedTarget) triggerExit(); };
    const handleVisibility = () => { if (document.visibilityState === 'hidden') triggerExit(); };
    let lastScroll = 0, scrollUpCount = 0;
    const handleScroll = () => {
      const st = window.pageYOffset || document.documentElement.scrollTop;
      if (st < lastScroll && lastScroll - st > 100) { scrollUpCount++; if (scrollUpCount >= 3) triggerExit(); }
      else scrollUpCount = 0;
      lastScroll = st;
    };
    document.addEventListener('mouseout', handleMouseOut);
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      clearTimeout(delayTimer);
      document.removeEventListener('mouseout', handleMouseOut);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [exitEnabled, appliedDiscount, checkoutOpen, id, trackCustomEvent]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full" /></div>;
  if (!product) return <div className="min-h-screen flex items-center justify-center">Product not found</div>;

  const discount = product.original_price > product.selling_price
    ? Math.round(((product.original_price - product.selling_price) / product.original_price) * 100)
    : 0;
  const discountAmount = product.original_price - product.selling_price;

  const whatsappNumber = settings?.whatsapp_number || "";
  const phoneNumber = settings?.phone_number || "";
  const phoneNumber2 = settings?.phone_number_2 || "";
  const messengerLink = settings?.messenger_link || "";
  const paymentNumber = settings?.payment_number || "";
  const insideDhaka = settings?.delivery_inside_dhaka || "80";
  const outsideDhaka = settings?.delivery_outside_dhaka || "150";

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
    if (!exitEnabled || appliedDiscount >= exitDiscount) return;
    setCheckoutOpen(false);
    setShowDiscountBanner(true);
  };

  const handleAcceptDiscount = () => {
    const newDiscount = Math.min(appliedDiscount + exitDiscount, exitDiscount);
    setAppliedDiscount(newDiscount);
    localStorage.setItem("exit_discount_amount", String(newDiscount));
    sessionStorage.setItem('_store_exit_dismissed', '1');
    setShowDiscountBanner(false);
    setCheckoutOpen(true);
    trackCustomEvent('ExitOfferAccepted', { value: exitDiscount, currency: 'BDT' });
  };

  const handleRejectDiscount = () => {
    setShowDiscountBanner(false);
    sessionStorage.setItem('_store_exit_dismissed', '1');
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

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Desktop: two columns, Mobile: stacked */}
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Left: Image Gallery */}
          <div className="w-full lg:w-1/2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Main Image */}
              <div className="relative aspect-square overflow-hidden bg-gray-50">
                {allImages.length > 0 ? (
                  <OptimizedImage src={allImages[selectedImage]} alt={product.name} width={800} quality={85} eager className="w-full h-full object-contain" />
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
                {/* Navigation arrows */}
                {allImages.length > 1 && (
                  <>
                    <button
                      onClick={() => setSelectedImage((prev) => (prev === 0 ? allImages.length - 1 : prev - 1))}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 border border-gray-200 flex items-center justify-center shadow hover:bg-white transition"
                    >
                      ←
                    </button>
                    <button
                      onClick={() => setSelectedImage((prev) => (prev === allImages.length - 1 ? 0 : prev + 1))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 border border-gray-200 flex items-center justify-center shadow hover:bg-white transition"
                    >
                      →
                    </button>
                  </>
                )}
                {/* Zoom button */}
                <button className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-white/90 border border-gray-200 flex items-center justify-center text-gray-500 shadow hover:bg-white transition text-sm">
                  +
                </button>
              </div>
              {/* Thumbnails */}
              {allImages.length > 1 && (
                <div className="flex gap-2 p-3">
                  {allImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition flex-shrink-0 ${selectedImage === i ? 'border-green-500' : 'border-gray-200'}`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Product Info */}
          <div className="w-full lg:w-1/2 space-y-4">
            {/* Title */}
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">{product.name}</h1>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-green-600 font-black text-3xl">মূল্য: ৳{product.selling_price} টাকা</span>
              {discount > 0 && (
                <span className="text-gray-400 line-through text-lg">মূল্য: ৳{product.original_price} টাকা</span>
              )}
            </div>

            {product.short_description && (
              <p className="text-gray-500 text-sm">{product.short_description}</p>
            )}

            {/* Quantity */}
            <div className="flex items-center gap-3">
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
            <div className="space-y-2">
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

              {/* WhatsApp */}
              {whatsappNumber && (
                <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer"
                  className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition">
                  <MessageCircle className="h-4 w-4" /> WhatsApp Message: {whatsappNumber}
                </a>
              )}

              {/* Phone 1 */}
              {phoneNumber && (
                <a href={`tel:${phoneNumber}`}
                  className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition">
                  <Phone className="h-4 w-4" /> কল করতে ক্লিক করুন : {phoneNumber}
                </a>
              )}

              {/* Phone 2 */}
              {phoneNumber2 && (
                <a href={`tel:${phoneNumber2}`}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition">
                  <Phone className="h-4 w-4" /> কল করতে ক্লিক করুন : {phoneNumber2}
                </a>
              )}

              {/* Messenger */}
              {messengerLink && (
                <a href={messengerLink} target="_blank" rel="noopener noreferrer"
                  className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.36 2 2 6.13 2 11.7c0 2.91 1.2 5.42 3.15 7.2.16.15.26.36.27.58l.05 1.82c.02.56.6.93 1.1.7l2.04-.9c.17-.08.36-.1.55-.06.88.24 1.82.36 2.84.36 5.64 0 10-4.13 10-9.7S17.64 2 12 2zm5.95 7.57l-2.9 4.6c-.46.73-1.44.92-2.13.41l-2.31-1.73a.6.6 0 00-.72 0l-3.12 2.37c-.42.32-.96-.18-.69-.63l2.9-4.6c.46-.73 1.44-.92 2.13-.41l2.31 1.73a.6.6 0 00.72 0l3.12-2.37c.42-.32.96.18.69.63z"/></svg>
                  মেসেজ করতে ক্লিক করুন
                </a>
              )}
            </div>

            {/* Category */}
            {(product.categories as any)?.name && (
              <p className="text-sm text-gray-500">ক্যাটাগরি: {(product.categories as any).name}</p>
            )}

            {/* Delivery info table */}
            <div className="border rounded-xl overflow-hidden">
              <div className="grid grid-cols-2 text-sm">
                <div className="p-3 bg-gray-50 font-medium">ঢাকা সিটির বাহির</div>
                <div className="p-3 font-bold text-right">{outsideDhaka} টাকা</div>
                <div className="p-3 bg-gray-50 font-medium border-t">ঢাকা সিটির ভিতর</div>
                <div className="p-3 font-bold text-right border-t">{insideDhaka} টাকা</div>
                {paymentNumber && (
                  <>
                    <div className="p-3 bg-gray-50 font-medium border-t">Payment Number</div>
                    <div className="p-3 font-bold text-right border-t">{paymentNumber}</div>
                  </>
                )}
              </div>
            </div>

            {/* Trust signals */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t">
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
        {(product.short_description || product.detailed_description) && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mt-6 p-4 sm:p-6">
            <div className="flex gap-4 mb-4">
              <button className="px-4 py-2 bg-green-600 text-white rounded-full text-sm font-semibold">পণ্যর বিস্তারিত</button>
              <button className="px-4 py-2 text-gray-500 text-sm font-semibold">রিটার্ন পলিসি</button>
            </div>
            {product.short_description && (
              <div
                className="text-gray-700 leading-relaxed text-sm mb-4 product-description"
                dangerouslySetInnerHTML={{ __html: product.short_description }}
              />
            )}
            {product.detailed_description && (
              <div
                className="text-gray-600 leading-relaxed text-sm product-description"
                dangerouslySetInnerHTML={{ __html: product.detailed_description }}
              />
            )}
          </div>
        )}
      </div>

      {showDiscountBanner && (
        <ExitDiscountBanner
          onAccept={handleAcceptDiscount}
          onReject={handleRejectDiscount}
          discountAmount={exitDiscount}
          timerSeconds={exitTimer}
          message={exitMessage}
        />
      )}

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
