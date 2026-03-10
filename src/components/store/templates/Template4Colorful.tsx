import { Link } from "react-router-dom";
import { ShoppingBag, Sparkles, Heart, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePublicProducts } from "@/hooks/usePublicProducts";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { useState } from "react";
import { useTracking } from "@/hooks/useTracking";
import { PopupCheckout } from "@/components/store/PopupCheckout";
import { ExitDiscountBanner } from "@/components/store/ExitDiscountBanner";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const Template4Colorful = () => {
  const { data: products = [], isLoading } = usePublicProducts();
  const { data: settings } = useSiteSettings();
  const { trackAddToCart } = useTracking();
  const siteName = settings?.site_name || "STORE";
  const siteLogo = settings?.site_logo || "";
  const facebookUrl = settings?.facebook_url || "";
  const instagramUrl = settings?.instagram_url || "";
  const contactEmail = settings?.contact_email || "";
  const phoneNumber = settings?.phone_number || "";

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutItem, setCheckoutItem] = useState<any>(null);
  const [appliedDiscount, setAppliedDiscount] = useState(() => {
    const saved = localStorage.getItem("exit_discount_amount");
    return saved ? Number(saved) : 0;
  });
  const [showDiscountBanner, setShowDiscountBanner] = useState(false);

  const handleOrder = (product: any) => {
    trackAddToCart({ id: product.id, name: product.name, price: product.selling_price, qty: 1, productCode: product.product_code });
    setCheckoutItem({ productId: product.id, name: product.name, price: product.selling_price, qty: 1, image: product.main_image_url, productCode: product.product_code, categoryId: product.category_id });
    setCheckoutOpen(true);
  };

  const handleExitIntent = () => {
    if (appliedDiscount >= 50) return;
    setCheckoutOpen(false);
    setShowDiscountBanner(true);
  };

  const handleAcceptDiscount = () => {
    const d = Math.min(appliedDiscount + 50, 50);
    setAppliedDiscount(d);
    localStorage.setItem("exit_discount_amount", String(d));
    setShowDiscountBanner(false);
    setCheckoutOpen(true);
  };

  const handleRejectDiscount = () => setShowDiscountBanner(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-violet-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-rose-100">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-2xl font-extrabold flex items-center gap-2">
            {siteLogo ? <img src={siteLogo} alt={siteName} className="h-8 w-auto object-contain" /> : <span className="bg-gradient-to-r from-rose-500 via-violet-500 to-indigo-500 bg-clip-text text-transparent">{siteName}</span>}
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-gray-600">
            <Link to="/" className="hover:text-rose-500 transition">🏠 Home</Link>
            <Link to="/" className="hover:text-violet-500 transition">🛍️ Shop</Link>
            <Link to="/" className="hover:text-indigo-500 transition">💬 Contact</Link>
          </div>
          <Link to="/checkout" className="relative p-2 rounded-full bg-rose-50 hover:bg-rose-100 transition">
            <ShoppingBag className="h-5 w-5 text-rose-500" />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute top-10 left-10 w-64 h-64 bg-rose-300/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-violet-300/20 rounded-full blur-3xl" />
        <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-rose-100 to-violet-100 rounded-full px-5 py-2 text-sm font-semibold text-rose-600 mb-6">
            <Sparkles className="h-4 w-4" /> ✨ New Collection Arrived!
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-6">
            <span className="bg-gradient-to-r from-rose-600 via-violet-600 to-indigo-600 bg-clip-text text-transparent">Your Style,</span>
            <br /><span className="text-gray-900">Your Choice</span>
          </h1>
          <p className="text-gray-500 text-lg mb-8 max-w-lg mx-auto">Premium products at the best prices, fast delivery nationwide</p>
          <Button size="lg" className="bg-gradient-to-r from-rose-500 to-violet-500 hover:from-rose-600 hover:to-violet-600 text-white font-bold px-10 rounded-full shadow-lg shadow-rose-200">
            🛍️ Shop Now
          </Button>
        </div>
      </section>

      {/* Products */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-2 text-center">Our Products</h2>
        <p className="text-center text-gray-400 mb-10">Best quality products</p>
        {isLoading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No products available</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {products.map((p) => {
              const outOfStock = p.stock_quantity !== undefined && p.stock_quantity <= 0 && !(p as any).allow_out_of_stock_orders;
              return (
              <div key={p.id} className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-rose-50">
                <Link to={`/product/${(p as any).slug || p.id}`}>
                  <div className="aspect-square bg-gray-50 relative overflow-hidden">
                    {p.main_image_url ? (
                      <OptimizedImage src={p.main_image_url} alt={p.name} width={400} quality={80} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-rose-200"><ShoppingBag className="h-12 w-12" /></div>
                    )}
                    <button className="absolute top-3 right-3 p-2 bg-white/80 rounded-full opacity-0 group-hover:opacity-100 transition">
                      <Heart className="h-4 w-4 text-rose-500" />
                    </button>
                    {(p as any).free_delivery && (
                      <div className="absolute top-3 left-3 bg-gradient-to-r from-rose-500 to-violet-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">🚚 Free Delivery</div>
                    )}
                  </div>
                  <div className="p-4 pb-2">
                    <h3 className="font-bold text-gray-900 truncate text-sm">{p.name}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="font-extrabold bg-gradient-to-r from-rose-500 to-violet-500 bg-clip-text text-transparent">৳{p.selling_price}</span>
                      {p.original_price > p.selling_price && (
                        <span className="text-xs text-gray-400 line-through">৳{p.original_price}</span>
                      )}
                    </div>
                    {outOfStock && <span className="text-[10px] text-red-500 font-semibold">স্টকে নেই</span>}
                  </div>
                </Link>
                <div className="px-4 pb-4">
                  <button onClick={() => handleOrder(p)} disabled={outOfStock} className="w-full py-2 bg-gradient-to-r from-rose-500 to-violet-500 hover:from-rose-600 hover:to-violet-600 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition disabled:opacity-40 disabled:cursor-not-allowed">
                    <ShoppingCart className="h-4 w-4" /> অর্ডার করুন
                  </button>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </section>

      <footer className="bg-white border-t border-rose-100 py-10">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-4 mb-3">
            {facebookUrl && <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="text-rose-400 hover:text-rose-600 text-sm font-semibold transition">Facebook</a>}
            {instagramUrl && <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:text-violet-600 text-sm font-semibold transition">Instagram</a>}
          </div>
          {(contactEmail || phoneNumber) && (
            <div className="flex items-center justify-center gap-4 mb-3 text-xs text-gray-400">
              {contactEmail && <span>{contactEmail}</span>}
              {phoneNumber && <span>{phoneNumber}</span>}
            </div>
          )}
          <div className="text-sm text-gray-400">© 2026 {siteName} — Made with ❤️</div>
        </div>
      </footer>

      {showDiscountBanner && <ExitDiscountBanner onAccept={handleAcceptDiscount} onReject={handleRejectDiscount} />}
      <PopupCheckout item={checkoutItem} open={checkoutOpen} onClose={() => setCheckoutOpen(false)} discount={appliedDiscount} onExitIntent={handleExitIntent} />
    </div>
  );
};

export default Template4Colorful;
