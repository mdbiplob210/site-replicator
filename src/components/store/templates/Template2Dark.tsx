import { Link } from "react-router-dom";
import { ShoppingBag, Search, Zap, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePublicProducts } from "@/hooks/usePublicProducts";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { useState } from "react";
import { useTracking } from "@/hooks/useTracking";
import { PopupCheckout } from "@/components/store/PopupCheckout";
import { ExitDiscountBanner } from "@/components/store/ExitDiscountBanner";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const Template2Dark = () => {
  const { data: products = [], isLoading } = usePublicProducts();
  const { data: settings } = useSiteSettings();
  const { trackAddToCart } = useTracking();
  const siteName = settings?.site_name || "STORE";
  const siteLogo = settings?.site_logo || "";

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
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gray-950/90 backdrop-blur-lg border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            {siteLogo ? (
              <img src={siteLogo} alt={siteName} className="h-8 w-auto object-contain" />
            ) : (
              <span className="text-2xl font-black tracking-wider">{siteName}<span className="text-amber-400">.</span></span>
            )}
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
            <Link to="/" className="hover:text-white transition">Home</Link>
            <Link to="/" className="hover:text-white transition">Collection</Link>
            <Link to="/" className="hover:text-white transition">Contact</Link>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-full hover:bg-gray-800"><Search className="h-5 w-5" /></button>
            <Link to="/checkout" className="p-2 rounded-full hover:bg-gray-800">
              <ShoppingBag className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-purple-500/10" />
        <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-1.5 text-amber-400 text-sm mb-6">
            <Zap className="h-4 w-4" /> New Arrivals
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight">
            Discover<br /><span className="text-amber-400">Premium</span> Style
          </h1>
          <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
            এক্সক্লুসিভ কালেকশন — সেরা কোয়ালিটি, সেরা দাম
          </p>
          <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-gray-950 font-bold px-10 rounded-full">
            Explore Now
          </Button>
        </div>
      </section>

      {/* Products */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-black text-white mb-10">PRODUCTS</h2>
        {isLoading ? (
          <div className="text-center py-12 text-gray-600">Loading...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-gray-600">কোন প্রোডাক্ট নেই</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {products.map((p) => (
              <div key={p.id} className="group">
                <Link to={`/product/${p.id}`}>
                  <div className="aspect-square bg-gray-900 rounded-xl overflow-hidden mb-3 border border-gray-800 group-hover:border-amber-500/50 transition">
                    {p.main_image_url ? (
                      <OptimizedImage src={p.main_image_url} alt={p.name} width={400} quality={80} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-700">
                        <ShoppingBag className="h-12 w-12" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-bold text-white truncate">{p.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-amber-400 font-bold">৳{p.selling_price}</span>
                    {p.original_price > p.selling_price && (
                      <span className="text-sm text-gray-600 line-through">৳{p.original_price}</span>
                    )}
                  </div>
                </Link>
                <button onClick={() => handleOrder(p)} className="w-full mt-2 py-2 bg-amber-500 hover:bg-amber-600 text-gray-950 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition">
                  <ShoppingCart className="h-4 w-4" /> অর্ডার করুন
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <footer className="border-t border-gray-800 py-10">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-600">
          © 2026 {siteName}
        </div>
      </footer>

      {showDiscountBanner && <ExitDiscountBanner onAccept={handleAcceptDiscount} onReject={handleRejectDiscount} />}
      <PopupCheckout item={checkoutItem} open={checkoutOpen} onClose={() => setCheckoutOpen(false)} discount={appliedDiscount} onExitIntent={handleExitIntent} />
    </div>
  );
};

export default Template2Dark;
