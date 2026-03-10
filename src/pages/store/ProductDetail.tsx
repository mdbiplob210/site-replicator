import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useProduct, useSuggestedProducts } from "@/hooks/usePublicProducts";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useProductSEO } from "@/hooks/useProductSEO";
import { Button } from "@/components/ui/button";
import { ShoppingBag, ArrowLeft, Minus, Plus, Truck, Shield, RotateCcw, Phone, MessageCircle } from "lucide-react";
import { useTracking, useEngagementTracking } from "@/hooks/useTracking";
import { PopupCheckout } from "@/components/store/PopupCheckout";
import { ExitDiscountBanner } from "@/components/store/ExitDiscountBanner";
import { OptimizedImage } from "@/components/ui/optimized-image";

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: product, isLoading } = useProduct(slug || "");
  const { data: settings } = useSiteSettings();

  // SEO: dynamic meta tags, canonical URL, JSON-LD structured data
  useProductSEO(product ? {
    name: product.name || "",
    description: product.short_description || product.detailed_description,
    price: product.selling_price || 0,
    originalPrice: product.original_price,
    image: product.main_image_url,
    slug: product.slug,
    id: product.id,
    stockQuantity: product.stock_quantity,
    productCode: product.product_code,
  } : null);
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const { trackViewContent, trackAddToCart, trackCustomEvent } = useTracking();
  useEngagementTracking();
  const viewTrackedRef = useRef(false);

  // Image gallery state
  const [selectedImage, setSelectedImage] = useState(0);
  const allImages = product ? [product.main_image_url, ...(product.additional_images || [])].filter(Boolean) as string[] : [];

  // Exit popup settings from site_settings
  const exitEnabled = settings?.exit_popup_enabled === 'true';
  const exitDiscount = Number(settings?.exit_popup_discount || 50);
  const exitTimer = Number(settings?.exit_popup_timer || 300);
  const exitMessage = settings?.exit_popup_message || 'This discount is only for you!';

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
    if (product && !viewTrackedRef.current) {
      viewTrackedRef.current = true;
      trackViewContent({
        id: product.id,
        name: product.name,
        price: product.selling_price,
        category: "",
        productCode: product.product_code,
        image: product.main_image_url || "",
      });
    }
  }, [product, trackViewContent]);

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
      trackCustomEvent('ExitIntentShown', { page: 'product', product_id: slug });
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
  }, [exitEnabled, appliedDiscount, checkoutOpen, slug, trackCustomEvent]);

  const offerCountdownMinutes = Number(settings?.offer_countdown_minutes) || 30;

  // Countdown timer state - must be before early returns
  const [countdown, setCountdown] = useState(() => {
    const saved = sessionStorage.getItem("offer_countdown_end");
    if (saved) {
      const remaining = Math.max(0, Math.floor((Number(saved) - Date.now()) / 1000));
      return remaining;
    }
    const seconds = offerCountdownMinutes * 60;
    sessionStorage.setItem("offer_countdown_end", String(Date.now() + seconds * 1000));
    return seconds;
  });

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown > 0]);

  const countdownHours = Math.floor(countdown / 3600);
  const countdownMins = Math.floor((countdown % 3600) / 60);
  const countdownSecs = countdown % 60;

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
      category: "",
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
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white text-center py-2 sm:py-2 text-[11px] sm:text-xs font-medium">
        🚚 Cash on delivery all over Bangladesh | Delivery in 2-5 days
      </div>

      {/* Urgency Countdown Timer */}
      {countdown > 0 && (
        <div className="bg-gradient-to-r from-red-600 to-orange-500 text-white py-2 sm:py-2.5 px-3 sm:px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 sm:gap-3">
            <span className="text-[11px] sm:text-sm font-semibold animate-pulse">🔥 Offer ends in</span>
            <div className="flex items-center gap-1">
              {countdownHours > 0 && (
                <div className="bg-white/20 rounded-md px-1.5 sm:px-2 py-0.5 sm:py-1 text-center min-w-[2rem] sm:min-w-[2.5rem]">
                  <span className="text-xs sm:text-base font-black">{String(countdownHours).padStart(2, "0")}</span>
                  <span className="text-[8px] sm:text-[9px] block -mt-0.5">Hours</span>
                </div>
              )}
              <span className="font-bold text-sm sm:text-lg">:</span>
              <div className="bg-white/20 rounded-md px-1.5 sm:px-2 py-0.5 sm:py-1 text-center min-w-[2rem] sm:min-w-[2.5rem]">
                <span className="text-xs sm:text-base font-black">{String(countdownMins).padStart(2, "0")}</span>
                <span className="text-[8px] sm:text-[9px] block -mt-0.5">Minutes</span>
              </div>
              <span className="font-bold text-sm sm:text-lg">:</span>
              <div className="bg-white/20 rounded-md px-1.5 sm:px-2 py-0.5 sm:py-1 text-center min-w-[2rem] sm:min-w-[2.5rem]">
                <span className="text-xs sm:text-base font-black">{String(countdownSecs).padStart(2, "0")}</span>
                <span className="text-[8px] sm:text-[9px] block -mt-0.5">Seconds</span>
              </div>
            </div>
            <span className="text-[10px] sm:text-xs font-medium hidden sm:inline">⏰ Hurry up!</span>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 -ml-1 rounded-lg active:bg-gray-100 transition">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <Link to="/" className="flex items-center gap-1">
            <span className="text-lg sm:text-xl font-black text-green-600">QUICK SHOP</span>
            <span className="text-lg sm:text-xl font-black text-gray-800">BD</span>
          </Link>
          <div className="w-10" />
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Desktop: two columns, Mobile: stacked */}
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          
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
                    <span className="text-red-500 font-bold text-[10px] leading-none">BDT</span>
                    <span className="text-red-500 font-bold text-[10px] leading-none">OFF</span>
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
          <div className="w-full lg:w-1/2 space-y-3 sm:space-y-4">
            {/* Title */}
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 leading-tight">{product.name}</h1>

            {/* Price */}
            <div className="flex items-baseline gap-2 sm:gap-3 flex-wrap">
              <span className="text-green-600 font-black text-2xl sm:text-3xl">৳{product.selling_price}</span>
              {discount > 0 && (
                <span className="text-gray-400 line-through text-base sm:text-lg">৳{product.original_price}</span>
              )}
            </div>

            {product.short_description && (
              <p className="text-gray-500 text-sm">{product.short_description}</p>
            )}

            {/* Quantity */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center border rounded-full overflow-hidden">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-2.5 sm:py-2 hover:bg-gray-100 active:bg-gray-200 transition">
                  <Minus className="h-4 w-4" />
                </button>
                <span className="px-4 py-2 font-bold min-w-[3rem] text-center">{qty}</span>
                <button onClick={() => setQty(qty + 1)} className="px-3 py-2.5 sm:py-2 hover:bg-gray-100 active:bg-gray-200 transition">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              {/* Stock & Free Delivery */}
              <span className={`text-sm ${product.stock_quantity > 0 ? "text-green-600" : "text-red-500"}`}>
                {product.stock_quantity > 0 ? `✓ In stock` : "✗ Out of stock"}
              </span>
              {product.free_delivery && (
                <span className="text-sm text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded-full">🚚 Free delivery</span>
              )}
            </div>

            {/* Action buttons */}
            <div className="space-y-2.5 sm:space-y-2">
              <Button
                size="lg"
                onClick={handleOrder}
                disabled={product.stock_quantity <= 0 && !product.allow_out_of_stock_orders}
                className="w-full text-base font-bold py-6 sm:py-6 rounded-xl bg-green-600 hover:bg-green-700 active:scale-[0.98] text-white shadow-lg shadow-green-200 transition-all"
              >
                🛒 Order now
              </Button>

              <button
                onClick={handleOrder}
                className="w-full py-3 border border-green-600 text-green-600 hover:bg-green-50 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition"
              >
                <ShoppingBag className="h-4 w-4" /> Add to cart
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
                  <Phone className="h-4 w-4" /> Click to call : {phoneNumber}
                </a>
              )}

              {/* Phone 2 */}
              {phoneNumber2 && (
                <a href={`tel:${phoneNumber2}`}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition">
                  <Phone className="h-4 w-4" /> Click to call : {phoneNumber2}
                </a>
              )}

              {/* Messenger */}
              {messengerLink && (
                <a href={messengerLink} target="_blank" rel="noopener noreferrer"
                  className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.36 2 2 6.13 2 11.7c0 2.91 1.2 5.42 3.15 7.2.16.15.26.36.27.58l.05 1.82c.02.56.6.93 1.1.7l2.04-.9c.17-.08.36-.1.55-.06.88.24 1.82.36 2.84.36 5.64 0 10-4.13 10-9.7S17.64 2 12 2zm5.95 7.57l-2.9 4.6c-.46.73-1.44.92-2.13.41l-2.31-1.73a.6.6 0 00-.72 0l-3.12 2.37c-.42.32-.96-.18-.69-.63l2.9-4.6c.46-.73 1.44-.92 2.13-.41l2.31 1.73a.6.6 0 00.72 0l3.12-2.37c.42-.32.96.18.69.63z"/></svg>
                  Click to message
                </a>
              )}
            </div>

            {/* Category */}
            {product.category_id && (
              <p className="text-sm text-gray-500">Category: {product.category_id}</p>
            )}

            {/* Delivery info table */}
            <div className="border rounded-xl overflow-hidden">
              <div className="grid grid-cols-2 text-sm">
                <div className="p-3 bg-gray-50 font-medium">Outside Dhaka City</div>
                <div className="p-3 font-bold text-right">{outsideDhaka} BDT</div>
                <div className="p-3 bg-gray-50 font-medium border-t">Inside Dhaka City</div>
                <div className="p-3 font-bold text-right border-t">{insideDhaka} BDT</div>
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
                Fast delivery
              </div>
              <div className="text-center text-xs text-gray-500">
                <Shield className="h-5 w-5 mx-auto mb-1 text-green-600" />
                Warranty
              </div>
              <div className="text-center text-xs text-gray-500">
                <RotateCcw className="h-5 w-5 mx-auto mb-1 text-green-600" />
                Return policy
              </div>
            </div>
          </div>
        </div>

        {/* Detailed description */}
        {(product.short_description || product.detailed_description) && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mt-6 p-4 sm:p-6">
            <div className="flex gap-4 mb-4">
              <button className="px-4 py-2 bg-green-600 text-white rounded-full text-sm font-semibold">Product details</button>
              <button className="px-4 py-2 text-gray-500 text-sm font-semibold">Return policy</button>
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

        {/* Suggested Products */}
        <SuggestedProducts categoryId={product.category_id} currentProductId={product.id} onOrder={(p: any) => {
          trackAddToCart({ id: p.id, name: p.name, price: p.selling_price, qty: 1, productCode: p.product_code });
          setCheckoutItem({ productId: p.id, name: p.name, price: p.selling_price, qty: 1, image: p.main_image_url, productCode: p.product_code, categoryId: p.category_id });
          setCheckoutOpen(true);
        }} />
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

// Suggested Products Component
function SuggestedProducts({ categoryId, currentProductId, onOrder }: { categoryId: string | null | undefined; currentProductId: string; onOrder: (p: any) => void }) {
  const { data: products = [], isLoading } = useSuggestedProducts(categoryId, currentProductId);

  if (isLoading || products.length === 0) return null;

  return (
    <div className="mt-8 mb-8">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-800 border-b-2 border-green-500 inline-block pb-1">
          You might also like these products
        </h2>
        <p className="text-sm text-gray-500 mt-1">We have more products you might want to check out</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {products.map((p) => {
          const pDiscount = p.original_price > p.selling_price
            ? Math.round(((p.original_price - p.selling_price) / p.original_price) * 100)
            : 0;
          const pDiscountAmount = p.original_price - p.selling_price;

          return (
            <div key={p.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition group">
              <Link to={`/product/${p.slug || p.id}`} className="block">
                <div className="relative aspect-square overflow-hidden bg-gray-50">
                  {p.main_image_url ? (
                    <OptimizedImage
                      src={p.main_image_url}
                      alt={p.name}
                      width={300}
                      quality={80}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <ShoppingBag className="h-10 w-10" />
                    </div>
                  )}
                  {pDiscount > 0 && (
                    <div className="absolute top-2 right-2 w-12 h-12 rounded-full border-2 border-dashed border-red-400 bg-white flex flex-col items-center justify-center">
                      <span className="text-red-500 font-bold text-[10px] leading-none">{pDiscountAmount}</span>
                      <span className="text-red-500 font-bold text-[9px] leading-none">BDT</span>
                      <span className="text-red-500 font-bold text-[9px] leading-none">OFF</span>
                    </div>
                  )}
                </div>
              </Link>
              <div className="p-3">
                <Link to={`/product/${p.slug || p.id}`}>
                  <h3 className="font-semibold text-gray-800 text-sm truncate mb-1">{p.name}</h3>
                </Link>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-green-600 font-bold">{p.selling_price} BDT</span>
                  {pDiscount > 0 && (
                    <span className="text-gray-400 line-through text-xs">{p.original_price} BDT</span>
                  )}
                </div>
                <button
                  onClick={() => onOrder(p)}
                  className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-1.5 transition"
                >
                  🛒 Order now
                </button>
                <button
                  onClick={() => onOrder(p)}
                  className="w-full mt-1.5 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <ShoppingBag className="h-3.5 w-3.5" /> Add to cart
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-right mt-4">
        <Link to="/" className="inline-flex items-center gap-1 text-green-600 hover:text-green-700 font-semibold text-sm border border-green-500 rounded-full px-4 py-1.5 hover:bg-green-50 transition">
          সব দেখুন →
        </Link>
      </div>
    </div>
  );
}

export default ProductDetail;
