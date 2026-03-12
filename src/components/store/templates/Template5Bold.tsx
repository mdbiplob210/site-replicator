import { Link } from "react-router-dom";
import { ShoppingBag, ArrowUpRight, Menu, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePublicProducts } from "@/hooks/usePublicProducts";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { getDisplayImage } from "@/lib/imageUtils";
import { useState } from "react";
import { useTracking } from "@/hooks/useTracking";
import { PopupCheckout } from "@/components/store/PopupCheckout";
import { ExitDiscountBanner } from "@/components/store/ExitDiscountBanner";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const Template5Bold = () => {
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
    setCheckoutItem({ productId: product.id, name: product.name, price: product.selling_price, qty: 1, image: getDisplayImage(product), productCode: product.product_code, categoryId: product.category_id });
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
    <div className="min-h-screen bg-zinc-100 text-zinc-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-zinc-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            {siteLogo ? <img src={siteLogo} alt={siteName} className="h-9 w-auto object-contain" /> : <span className="text-3xl font-black tracking-tighter">{siteName}</span>}
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-bold uppercase tracking-widest text-zinc-400">
            <Link to="/" className="hover:text-white transition">Shop</Link>
            <Link to="/" className="hover:text-white transition">New</Link>
            <Link to="/" className="hover:text-white transition">About</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/checkout" className="flex items-center gap-2 bg-lime-400 text-zinc-900 px-4 py-2 rounded-full font-bold text-sm hover:bg-lime-300 transition">
              <ShoppingBag className="h-4 w-4" /> Cart
            </Link>
            <button className="md:hidden p-2"><Menu className="h-5 w-5" /></button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-zinc-900 text-white py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"40\" height=\"40\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cpath d=\"M0 0h40v40H0z\" fill=\"none\"%2F%3E%3Ccircle cx=\"20\" cy=\"20\" r=\"1\" fill=\"white\"%2F%3E%3C%2Fsvg%3E')" }} />
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <h1 className="text-6xl md:text-8xl font-black leading-none tracking-tighter mb-8">
            BIG<br /><span className="text-lime-400">DEALS</span><br />TODAY
          </h1>
          <p className="text-zinc-400 text-lg mb-8 max-w-md">Best products, best prices. Order today.</p>
          <Button size="lg" className="bg-lime-400 hover:bg-lime-300 text-zinc-900 font-black px-10 rounded-none text-lg">
            SHOP NOW <ArrowUpRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Products */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-4xl font-black tracking-tighter">ALL PRODUCTS</h2>
          <span className="text-sm font-bold text-zinc-500 bg-zinc-200 px-4 py-2 rounded-full">{products.length} items</span>
        </div>
        {isLoading ? (
          <div className="text-center py-12 text-zinc-400">Loading...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-zinc-400">No products yet</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p, idx) => {
              const outOfStock = p.stock_quantity !== undefined && p.stock_quantity <= 0 && !(p as any).allow_out_of_stock_orders;
              return (
              <div key={p.id} className="group bg-white overflow-hidden hover:shadow-2xl transition-all duration-300">
                <Link to={`/product/${(p as any).slug || p.id}`}>
                  <div className="aspect-square bg-zinc-50 overflow-hidden relative">
                    <OptimizedImage src={getDisplayImage(p)} alt={p.name || ''} width={400} quality={80} eager={idx < 4} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" fallback={<div className="w-full h-full flex items-center justify-center text-zinc-300"><ShoppingBag className="h-12 w-12" /></div>} />
                    {(p as any).free_delivery && (
                      <div className="absolute top-2 left-2 bg-lime-400 text-zinc-900 text-[9px] font-black px-2 py-0.5 uppercase tracking-wider">FREE DELIVERY</div>
                    )}
                  </div>
                  <div className="p-4 pb-2">
                    <h3 className="font-black text-zinc-900 truncate uppercase text-sm">{p.name}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-lg font-black text-zinc-900">৳{p.selling_price}</span>
                      {p.original_price > p.selling_price && (
                        <span className="text-xs text-zinc-400 line-through">৳{p.original_price}</span>
                      )}
                    </div>
                    {outOfStock && <span className="text-[10px] text-red-500 font-bold uppercase">OUT OF STOCK</span>}
                  </div>
                </Link>
                <div className="px-4 pb-4">
                  <button onClick={() => handleOrder(p)} disabled={outOfStock} className="w-full py-2.5 bg-zinc-900 hover:bg-lime-400 hover:text-zinc-900 text-white text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition disabled:opacity-40 disabled:cursor-not-allowed">
                    <ShoppingCart className="h-4 w-4" /> ORDER NOW
                  </button>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </section>

      <footer className="bg-zinc-900 text-white py-10">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-6 mb-4">
            {facebookUrl && <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-white text-xs font-bold tracking-widest uppercase transition">Facebook</a>}
            {instagramUrl && <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-white text-xs font-bold tracking-widest uppercase transition">Instagram</a>}
          </div>
          {(contactEmail || phoneNumber) && (
            <div className="flex items-center justify-center gap-4 mb-4 text-xs text-zinc-500">
              {contactEmail && <span>{contactEmail}</span>}
              {phoneNumber && <span>{phoneNumber}</span>}
            </div>
          )}
          <div className="text-sm text-zinc-500 font-bold tracking-widest uppercase">© 2026 {siteName}</div>
        </div>
      </footer>

      {showDiscountBanner && <ExitDiscountBanner onAccept={handleAcceptDiscount} onReject={handleRejectDiscount} />}
      <PopupCheckout item={checkoutItem} open={checkoutOpen} onClose={() => setCheckoutOpen(false)} discount={appliedDiscount} onExitIntent={handleExitIntent} />
    </div>
  );
};

export default Template5Bold;
