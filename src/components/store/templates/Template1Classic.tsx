import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, Search, Star, Truck, ShieldCheck, RotateCcw, ChevronRight, Minus, Plus, ShoppingCart, Menu, X, Phone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePublicProducts } from "@/hooks/usePublicProducts";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { useState, useMemo, useEffect } from "react";
import { useTracking } from "@/hooks/useTracking";
import { PopupCheckout } from "@/components/store/PopupCheckout";
import { ExitDiscountBanner } from "@/components/store/ExitDiscountBanner";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import BannerCarousel from "@/components/store/BannerCarousel";

const Template1Classic = () => {
  const { data: products = [], isLoading } = usePublicProducts();
  const { data: settings } = useSiteSettings();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const { trackAddToCart, trackViewContent } = useTracking();

  // Popup checkout state
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutItem, setCheckoutItem] = useState<any>(null);
  const [appliedDiscount, setAppliedDiscount] = useState(() => {
    const saved = localStorage.getItem("exit_discount_amount");
    return saved ? Number(saved) : 0;
  });
  const [showDiscountBanner, setShowDiscountBanner] = useState(false);

  // Categories from products
  const categories = useMemo(() => {
    const cats = new Map<string, string>();
    products.forEach(p => {
      if (p.category_id && (p as any).categories?.name) {
        cats.set(p.category_id, (p as any).categories.name);
      }
    });
    return Array.from(cats.entries()).map(([id, name]) => ({ id, name }));
  }, [products]);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredProducts = useMemo(() => {
    let filtered = products;
    if (selectedCategory) {
      filtered = filtered.filter(p => p.category_id === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || p.product_code.toLowerCase().includes(q));
    }
    return filtered;
  }, [products, selectedCategory, searchQuery]);

  const getDiscount = (original: number, selling: number) => {
    if (original <= selling) return 0;
    return Math.round(((original - selling) / original) * 100);
  };

  const handleOrder = (product: any) => {
    trackAddToCart({
      id: product.id,
      name: product.name,
      price: product.selling_price,
      qty: 1,
      productCode: product.product_code,
      category: (product as any).categories?.name || "",
    });
    setCheckoutItem({
      productId: product.id,
      name: product.name,
      price: product.selling_price,
      qty: 1,
      image: product.main_image_url,
      productCode: product.product_code,
      categoryId: product.category_id,
    });
    setCheckoutOpen(true);
  };

  const whatsappNumber = settings?.whatsapp_number || "";
  const phoneNumber = settings?.phone_number || "";
  const siteName = settings?.site_name || "QUICK SHOP BD";
  const siteLogo = settings?.site_logo || "";
  const marqueeText = settings?.marquee_text || "🚚 Cash on delivery nationwide (Guaranteed delivery within 48-72 hours)";
  const footerDescription = settings?.footer_description || settings?.tagline || "The best online shopping destination in Bangladesh.";
  const footerQuickLinks = (settings?.footer_quick_links || "Home,All Products,Offers,Contact").split(",").map(s => s.trim()).filter(Boolean);
  const footerHelpLinks = (settings?.footer_help_links || "Delivery Info,Return Policy,Privacy Policy").split(",").map(s => s.trim()).filter(Boolean);
  const footerAddress = settings?.footer_address || "Dhaka, Bangladesh";
  const footerCopyright = settings?.footer_copyright || "© 2026 QUICK SHOP BD — All rights reserved";
  const contactEmail = settings?.contact_email || "";
  const facebookUrl = settings?.facebook_url || "";
  const instagramUrl = settings?.instagram_url || "";
  const freeDeliveryAbove = Number(settings?.free_delivery_above) || 0;

  // Button settings
  const orderBtnEnabled = settings?.btn_order_enabled !== "false";
  const orderBtnText = settings?.btn_order_text || "Order Now";
  const orderBtnColor = settings?.btn_order_color || "#16a34a";
  const cartBtnEnabled = settings?.btn_cart_enabled !== "false";
  const cartBtnText = settings?.btn_cart_text || "View Details";
  const cartBtnColor = settings?.btn_cart_color || "#2563eb";
  const floatingContactsEnabled = settings?.floating_contacts_enabled !== "false";
  const floatingWhatsappEnabled = settings?.floating_whatsapp_enabled !== "false";
  const floatingCallEnabled = settings?.floating_call_enabled !== "false";

  const handleExitIntent = () => {
    if (appliedDiscount >= 50) return;
    setCheckoutOpen(false);
    setShowDiscountBanner(true);
  };

  const handleAcceptDiscount = () => {
    const newDiscount = Math.min(appliedDiscount + 50, 50);
    setAppliedDiscount(newDiscount);
    localStorage.setItem("exit_discount_amount", String(newDiscount));
    setShowDiscountBanner(false);
    setCheckoutOpen(true);
  };

  const handleRejectDiscount = () => {
    setShowDiscountBanner(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top announcement bar */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white text-center h-[34px] sm:h-[32px] flex items-center justify-center text-[11px] sm:text-sm font-medium overflow-hidden">
        <div className="animate-marquee whitespace-nowrap inline-block">
          {marqueeText} Hotline: {phoneNumber || "01XXXXXXXXX"} &nbsp;&nbsp;&nbsp;
          {marqueeText} Hotline: {phoneNumber || "01XXXXXXXXX"}
        </div>
      </div>


      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-3">
          {/* Mobile menu button */}
          <button onClick={() => setMobileMenu(!mobileMenu)} className="lg:hidden p-2 -ml-1 rounded-lg active:bg-gray-100 transition">
            {mobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            {siteLogo ? (
              <img src={siteLogo} alt={siteName} className="h-7 sm:h-10 w-auto object-contain" />
            ) : (
              <span className="text-lg sm:text-2xl font-black text-green-600">{siteName}</span>
            )}
          </Link>

          {/* Desktop Search */}
          <div className="hidden lg:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-4 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-500"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button onClick={() => setShowSearch(!showSearch)} className="lg:hidden p-2 rounded-lg active:bg-gray-100 transition">
              <Search className="h-5 w-5 text-gray-600" />
            </button>
            <Link to="/checkout" className="p-2 rounded-lg active:bg-gray-100 transition relative">
              <ShoppingCart className="h-5 w-5 text-gray-600" />
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-green-600 text-[10px] font-bold text-white flex items-center justify-center">0</span>
            </Link>
          </div>
        </div>

        {/* Mobile Search */}
        {showSearch && (
          <div className="lg:hidden px-3 pb-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full h-11 pl-4 pr-10 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                autoFocus
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>
        )}

        {/* Mobile Menu */}
        {mobileMenu && (
          <div className="lg:hidden border-t bg-white px-4 py-2 space-y-0.5">
            <button onClick={() => { setSelectedCategory(null); setMobileMenu(false); }} className="block w-full text-left py-2.5 px-3 text-sm font-medium hover:text-green-600 hover:bg-green-50 rounded-lg transition">All Products</button>
            {categories.map(c => (
              <button key={c.id} onClick={() => { setSelectedCategory(c.id); setMobileMenu(false); }} className="block w-full text-left py-2.5 px-3 text-sm hover:text-green-600 hover:bg-green-50 rounded-lg transition">{c.name}</button>
            ))}
          </div>
        )}
      </header>

      {/* Banner Carousel */}
      <BannerCarousel />

      {/* Categories horizontal scroll */}
      {categories.length > 0 && (
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 flex gap-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition ${
                !selectedCategory ? "bg-green-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              সব দেখুন
            </button>
            {categories.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition ${
                  selectedCategory === c.id ? "bg-green-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Trust badges */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {[
            { icon: Truck, label: "ফ্রি ডেলিভারি", sub: "৳১৫০০+ অর্ডারে" },
            { icon: ShieldCheck, label: "১০০% অরিজিনাল", sub: "গ্যারান্টিড" },
            { icon: RotateCcw, label: "ইজি রিটার্ন", sub: "৭ দিনে" },
            { icon: Star, label: "সন্তুষ্ট কাস্টমার", sub: "৫০০০+" },
          ].map(b => (
            <div key={b.label} className="flex items-center gap-2.5">
              <div className="h-9 w-9 sm:h-8 sm:w-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                <b.icon className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-800 leading-tight">{b.label}</p>
                <p className="text-[10px] text-gray-400 leading-tight">{b.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section title */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 pt-5 sm:pt-6 pb-2 sm:pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-xl font-bold text-gray-800">
              {selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : "হয়তো আপনি এই পণ্যগুলিও পছন্দ করবেন"}
            </h2>
            <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5">আমাদের আরও পণ্য রয়েছে, আপনি চাইলে সেগুলোও দেখতে পারেন</p>
          </div>
          {selectedCategory && (
            <button onClick={() => setSelectedCategory(null)} className="flex items-center gap-1 text-green-600 text-sm font-semibold hover:underline">
              সব দেখুন <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Products Grid */}
      <section className="max-w-7xl mx-auto px-2 sm:px-4 pb-20 sm:pb-16">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white rounded-xl p-3 h-[280px] sm:h-[340px]">
                <div className="aspect-square bg-gray-200 rounded-lg" />
                <div className="mt-3 h-3 bg-gray-200 rounded w-3/4" />
                <div className="mt-2 h-3 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag className="h-16 w-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">কোনো প্রোডাক্ট পাওয়া যায়নি</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
            {filteredProducts.map((p) => {
              const discount = getDiscount(p.original_price, p.selling_price);
              const discountAmount = p.original_price - p.selling_price;
              return (
                <div key={p.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  {/* Image */}
                  <Link to={`/product/${(p as any).slug || p.id}`} className="block relative">
                    <div className="aspect-square overflow-hidden bg-gray-50">
                      {p.main_image_url ? (
                        <OptimizedImage src={p.main_image_url} alt={p.name} width={400} quality={80} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="h-10 w-10 text-gray-200" />
                        </div>
                      )}
                    </div>
                    {/* Discount badge */}
                    {discount > 0 && (
                      <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-dashed border-red-400 bg-white flex flex-col items-center justify-center">
                        <span className="text-red-500 font-bold text-[9px] sm:text-[10px] leading-none">{discountAmount}</span>
                        <span className="text-red-500 font-bold text-[8px] sm:text-[9px] leading-none">টাকা</span>
                        <span className="text-red-500 font-bold text-[8px] sm:text-[9px] leading-none">ছাড়</span>
                      </div>
                    )}
                    {/* Free delivery badge */}
                    {(p as any).free_delivery && (
                      <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 bg-green-600 text-white text-[8px] sm:text-[9px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full">
                        🚚 ফ্রি ডেলিভারি
                      </div>
                    )}
                  </Link>

                  {/* Divider */}
                  <div className="h-px bg-gray-100 mx-2 sm:mx-3" />

                  {/* Info */}
                  <div className="p-2 sm:p-3">
                    <Link to={`/product/${(p as any).slug || p.id}`}>
                      <h3 className="text-[13px] sm:text-sm font-semibold text-gray-800 truncate hover:text-green-600 transition">{p.name}</h3>
                    </Link>

                    {/* Rating */}
                    <div className="flex items-center gap-0.5 mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-2.5 w-2.5 sm:h-3 sm:w-3 ${i < 4 ? "fill-amber-400 text-amber-400" : "fill-amber-200 text-amber-200"}`} />
                      ))}
                      <span className="text-[9px] sm:text-[10px] text-gray-400 ml-0.5">(0)</span>
                    </div>

                    {/* Price & Stock */}
                    <div className="flex items-center gap-1.5 sm:gap-2 mt-1.5">
                      <span className="text-green-600 font-bold text-sm sm:text-base">৳{p.selling_price}</span>
                      {discount > 0 && (
                        <span className="text-[10px] sm:text-xs text-gray-400 line-through">৳{p.original_price}</span>
                      )}
                    </div>
                    {p.stock_quantity !== undefined && p.stock_quantity <= 0 && !(p as any).allow_out_of_stock_orders && (
                      <span className="text-[10px] text-red-500 font-semibold">স্টকে নেই</span>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="px-2 sm:px-3 pb-2 sm:pb-3 space-y-1.5 sm:space-y-2">
                    {orderBtnEnabled && (
                    <button
                      onClick={() => handleOrder(p)}
                      disabled={p.stock_quantity !== undefined && p.stock_quantity <= 0 && !(p as any).allow_out_of_stock_orders}
                      className="w-full py-2.5 sm:py-2.5 text-white rounded-lg text-[13px] sm:text-sm font-bold flex items-center justify-center gap-1.5 sm:gap-2 transition hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
                      style={{ backgroundColor: orderBtnColor }}
                    >
                      <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> {orderBtnText}
                    </button>
                    )}
                    {cartBtnEnabled && (
                    <button
                      onClick={() => navigate(`/product/${(p as any).slug || p.id}`)}
                      className="w-full py-2 rounded-lg text-[12px] sm:text-sm font-semibold flex items-center justify-center gap-1.5 sm:gap-2 transition border hover:opacity-80 active:scale-[0.98]"
                      style={{ borderColor: cartBtnColor, color: cartBtnColor }}
                    >
                      <ShoppingBag className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> {cartBtnText}
                    </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Contact floating buttons - WhatsApp & Phone */}
      {floatingContactsEnabled && (whatsappNumber || phoneNumber) && (
        <div className="fixed bottom-20 right-3 sm:right-4 z-40 flex flex-col gap-2.5">
          {floatingWhatsappEnabled && whatsappNumber && (
            <a
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-13 h-13 sm:w-12 sm:h-12 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg hover:bg-green-600 active:scale-95 transition"
              style={{ width: 52, height: 52 }}
            >
              <MessageCircle className="h-5 w-5 sm:h-5 sm:w-5" />
            </a>
          )}
          {floatingCallEnabled && phoneNumber && (
            <a
              href={`tel:${phoneNumber}`}
              className="w-13 h-13 sm:w-12 sm:h-12 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg hover:bg-blue-600 active:scale-95 transition"
              style={{ width: 52, height: 52 }}
            >
              <Phone className="h-5 w-5 sm:h-5 sm:w-5" />
            </a>
          )}
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2 md:col-span-1">
              {siteLogo ? (
                <img src={siteLogo} alt={siteName} className="h-8 w-auto object-contain mb-2" />
              ) : (
                <span className="text-lg font-black text-green-400">{siteName}</span>
              )}
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">{footerDescription}</p>
              {(facebookUrl || instagramUrl) && (
                <div className="flex gap-3 mt-3">
                  {facebookUrl && <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 transition text-xs">Facebook</a>}
                  {instagramUrl && <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-400 transition text-xs">Instagram</a>}
                </div>
              )}
            </div>
            {[
              { title: "কুইক লিংকস", links: footerQuickLinks },
              { title: "সাহায্য", links: footerHelpLinks },
              { title: "যোগাযোগ", links: [`ফোন: ${phoneNumber || "01XXXXXXXXX"}`, ...(contactEmail ? [`ইমেইল: ${contactEmail}`] : []), footerAddress] },
            ].map(col => (
              <div key={col.title}>
                <h4 className="text-xs font-bold text-white mb-2 uppercase tracking-wider">{col.title}</h4>
                <ul className="space-y-1.5">
                  {col.links.map(link => (
                    <li key={link}><span className="text-xs hover:text-white transition cursor-pointer">{link}</span></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-white/10 pt-4 text-center text-xs text-gray-500">
            {footerCopyright}
          </div>
        </div>
      </footer>

      {showDiscountBanner && (
        <ExitDiscountBanner onAccept={handleAcceptDiscount} onReject={handleRejectDiscount} />
      )}

      {/* Popup Checkout */}
      <PopupCheckout
        item={checkoutItem}
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        discount={appliedDiscount}
        onExitIntent={handleExitIntent}
      />

      {/* Marquee animation */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default Template1Classic;
