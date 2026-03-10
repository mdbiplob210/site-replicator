import { Link } from "react-router-dom";
import { ShoppingBag, ArrowRight, ShoppingCart } from "lucide-react";
import { usePublicProducts } from "@/hooks/usePublicProducts";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { useState } from "react";
import { useTracking } from "@/hooks/useTracking";
import { PopupCheckout } from "@/components/store/PopupCheckout";
import { ExitDiscountBanner } from "@/components/store/ExitDiscountBanner";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const Template3Minimal = () => {
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
    <div className="min-h-screen bg-stone-50 text-stone-900" style={{ fontFamily: "'Georgia', serif" }}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-stone-50/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          {siteLogo ? <img src={siteLogo} alt={siteName} className="h-8 w-auto object-contain" /> : <Link to="/" className="text-xl font-normal tracking-[0.3em] uppercase text-stone-800">{siteName}</Link>}
          <div className="hidden md:flex items-center gap-10 text-xs tracking-[0.2em] uppercase text-stone-500">
            <Link to="/" className="hover:text-stone-900 transition">Shop</Link>
            <Link to="/" className="hover:text-stone-900 transition">About</Link>
            <Link to="/" className="hover:text-stone-900 transition">Contact</Link>
          </div>
          <Link to="/checkout" className="p-2"><ShoppingBag className="h-5 w-5 text-stone-600" /></Link>
        </div>
        <div className="h-px bg-stone-200" />
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-28 text-center">
        <p className="text-xs tracking-[0.3em] uppercase text-stone-400 mb-6">Curated Collection</p>
        <h1 className="text-4xl md:text-5xl font-normal leading-tight text-stone-800 mb-6">Elegance in<br />Every Detail</h1>
        <p className="text-stone-500 mb-10 max-w-md mx-auto text-sm leading-relaxed">A curated collection crafted with beauty and quality in mind</p>
        <Link to="/" className="inline-flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-stone-700 hover:text-stone-900 border-b border-stone-300 pb-1 transition">
          View Collection <ArrowRight className="h-3 w-3" />
        </Link>
      </section>

      <div className="max-w-6xl mx-auto px-6"><div className="h-px bg-stone-200" /></div>

      {/* Products */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        {isLoading ? (
          <div className="text-center py-12 text-stone-400 text-sm">Loading...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-stone-400 text-sm">No products available</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-10">
            {products.map((p) => {
              const outOfStock = p.stock_quantity !== undefined && p.stock_quantity <= 0 && !(p as any).allow_out_of_stock_orders;
              return (
              <div key={p.id} className="group">
                <Link to={`/product/${(p as any).slug || p.id}`}>
                  <div className="aspect-[3/4] bg-stone-100 overflow-hidden mb-4 relative">
                    {p.main_image_url ? (
                      <OptimizedImage src={p.main_image_url} alt={p.name} width={400} quality={80} className="w-full h-full object-cover group-hover:scale-102 transition duration-700" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-300"><ShoppingBag className="h-10 w-10" /></div>
                    )}
                    {(p as any).free_delivery && (
                      <div className="absolute top-2 left-2 bg-stone-800 text-white text-[9px] font-medium px-2 py-0.5 rounded-full tracking-wide">Free Delivery</div>
                    )}
                  </div>
                  <h3 className="text-sm font-normal text-stone-800">{p.name}</h3>
                  <p className="text-sm text-stone-500 mt-1">৳{p.selling_price}</p>
                  {outOfStock && <p className="text-xs text-red-500 mt-0.5">Out of stock</p>}
                </Link>
                <button onClick={() => handleOrder(p)} disabled={outOfStock} className="mt-2 inline-flex items-center gap-1.5 text-xs tracking-[0.1em] uppercase text-stone-600 hover:text-stone-900 border-b border-stone-300 pb-0.5 transition disabled:opacity-40 disabled:cursor-not-allowed">
                  <ShoppingCart className="h-3 w-3" /> Order Now
                </button>
              </div>
              );
            })}
          </div>
        )}
      </section>

      <footer className="border-t border-stone-200 py-12">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-6 mb-4">
            {facebookUrl && <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="text-stone-400 hover:text-stone-700 text-xs tracking-widest uppercase transition">Facebook</a>}
            {instagramUrl && <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="text-stone-400 hover:text-stone-700 text-xs tracking-widest uppercase transition">Instagram</a>}
          </div>
          {(contactEmail || phoneNumber) && (
            <div className="flex items-center justify-center gap-4 mb-4 text-xs text-stone-400">
              {contactEmail && <a href={`mailto:${contactEmail}`} className="hover:text-stone-700 transition">{contactEmail}</a>}
              {phoneNumber && <span>{phoneNumber}</span>}
            </div>
          )}
          <div className="text-xs text-stone-400 tracking-widest uppercase">© 2026 {siteName}</div>
        </div>
      </footer>

      {showDiscountBanner && <ExitDiscountBanner onAccept={handleAcceptDiscount} onReject={handleRejectDiscount} />}
      <PopupCheckout item={checkoutItem} open={checkoutOpen} onClose={() => setCheckoutOpen(false)} discount={appliedDiscount} onExitIntent={handleExitIntent} />
    </div>
  );
};

export default Template3Minimal;
