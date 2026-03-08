import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, Search, Star, Truck, ShieldCheck, RotateCcw, ChevronRight, Minus, Plus, ShoppingCart, Menu, X, Phone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePublicProducts } from "@/hooks/usePublicProducts";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { useState, useMemo } from "react";
import { useTracking } from "@/hooks/useTracking";
import { PopupCheckout } from "@/components/store/PopupCheckout";
import { ExitDiscountBanner } from "@/components/store/ExitDiscountBanner";
import { useSiteSettings } from "@/hooks/useSiteSettings";

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
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white text-center py-2 text-xs sm:text-sm font-medium overflow-hidden">
        <div className="animate-marquee whitespace-nowrap inline-block">
          🚚 সারা দেশে ক্যাশ অন ডেলিভারি (৪৮ থেকে ৭২ ঘণ্টার মধ্যে নিশ্চিত ডেলিভারি) হটলাইনঃ {phoneNumber || "01XXXXXXXXX"} &nbsp;&nbsp;&nbsp;
          🚚 সারা দেশে ক্যাশ অন ডেলিভারি (৪৮ থেকে ৭২ ঘণ্টার মধ্যে নিশ্চিত ডেলিভারি) হটলাইনঃ {phoneNumber || "01XXXXXXXXX"}
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          {/* Mobile menu button */}
          <button onClick={() => setMobileMenu(!mobileMenu)} className="lg:hidden p-2">
            {mobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-1 flex-shrink-0">
            <span className="text-xl sm:text-2xl font-black text-green-600">QUICK SHOP</span>
            <span className="text-xl sm:text-2xl font-black text-gray-800">BD</span>
          </Link>

          {/* Desktop Search */}
          <div className="hidden lg:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="প্রোডাক্ট খুঁজুন খোঁজ..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-4 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-500"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <button onClick={() => setShowSearch(!showSearch)} className="lg:hidden p-2 rounded-full hover:bg-gray-100">
              <Search className="h-5 w-5 text-gray-600" />
            </button>
            <Link to="/checkout" className="p-2 rounded-full hover:bg-gray-100 relative">
              <ShoppingCart className="h-5 w-5 text-gray-600" />
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-green-600 text-[10px] font-bold text-white flex items-center justify-center">0</span>
            </Link>
          </div>
        </div>

        {/* Mobile Search */}
        {showSearch && (
          <div className="lg:hidden px-4 pb-3">
            <div className="relative">
              <input
                type="text"
                placeholder="প্রোডাক্ট খুঁজুন..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-4 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-500"
                autoFocus
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>
        )}

        {/* Mobile Menu */}
        {mobileMenu && (
          <div className="lg:hidden border-t bg-white px-4 py-3 space-y-2">
            <button onClick={() => { setSelectedCategory(null); setMobileMenu(false); }} className="block w-full text-left py-2 text-sm font-medium hover:text-green-600">সব প্রোডাক্ট</button>
            {categories.map(c => (
              <button key={c.id} onClick={() => { setSelectedCategory(c.id); setMobileMenu(false); }} className="block w-full text-left py-2 text-sm hover:text-green-600">{c.name}</button>
            ))}
          </div>
        )}
      </header>

      {/* Categories horizontal scroll */}
      {categories.length > 0 && (
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition ${
                !selectedCategory ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              সব দেখুন
            </button>
            {categories.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition ${
                  selectedCategory === c.id ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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
        <div className="max-w-7xl mx-auto px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Truck, label: "ফ্রি ডেলিভারি", sub: "৳১৫০০+ অর্ডারে" },
            { icon: ShieldCheck, label: "১০০% অরিজিনাল", sub: "গ্যারান্টিড" },
            { icon: RotateCcw, label: "ইজি রিটার্ন", sub: "৭ দিনে" },
            { icon: Star, label: "সন্তুষ্ট কাস্টমার", sub: "৫০০০+" },
          ].map(b => (
            <div key={b.label} className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                <b.icon className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-800">{b.label}</p>
                <p className="text-[10px] text-gray-400">{b.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section title */}
      <div className="max-w-7xl mx-auto px-4 pt-6 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">
              {selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : "হয়তো আপনি এই পণ্যগুলিও পছন্দ করবেন"}
            </h2>
            <p className="text-xs text-gray-400">আমাদের আরও পণ্য রয়েছে, আপনি চাইলে সেগুলোও দেখতে পারেন</p>
          </div>
          {selectedCategory && (
            <button onClick={() => setSelectedCategory(null)} className="flex items-center gap-1 text-green-600 text-sm font-semibold hover:underline">
              সব দেখুন <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Products Grid */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white rounded-xl p-3">
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {filteredProducts.map((p) => {
              const discount = getDiscount(p.original_price, p.selling_price);
              const discountAmount = p.original_price - p.selling_price;
              return (
                <div key={p.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  {/* Image */}
                  <Link to={`/product/${p.id}`} className="block relative">
                    <div className="aspect-square overflow-hidden bg-gray-50">
                      {p.main_image_url ? (
                        <OptimizedImage src={p.main_image_url} alt={p.name} width={400} quality={80} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="h-10 w-10 text-gray-200" />
                        </div>
                      )}
                    </div>
                    {/* Discount badge - circular like reference */}
                    {discount > 0 && (
                      <div className="absolute top-2 right-2 w-12 h-12 rounded-full border-2 border-dashed border-red-400 bg-white flex flex-col items-center justify-center">
                        <span className="text-red-500 font-bold text-[10px] leading-none">{discountAmount}</span>
                        <span className="text-red-500 font-bold text-[9px] leading-none">টাকা</span>
                        <span className="text-red-500 font-bold text-[9px] leading-none">ছাড়</span>
                      </div>
                    )}
                  </Link>

                  {/* Divider */}
                  <div className="h-px bg-gray-100 mx-3" />

                  {/* Info */}
                  <div className="p-3">
                    <Link to={`/product/${p.id}`}>
                      <h3 className="text-sm font-semibold text-gray-800 truncate hover:text-green-600 transition">{p.name}</h3>
                    </Link>

                    {/* Rating */}
                    <div className="flex items-center gap-1 mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-3 w-3 ${i < 4 ? "fill-amber-400 text-amber-400" : "fill-amber-200 text-amber-200"}`} />
                      ))}
                      <span className="text-[10px] text-gray-400 ml-0.5">(0)</span>
                    </div>

                    {/* Price */}
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-green-600 font-bold text-base">৳{p.selling_price} টাকা</span>
                      {discount > 0 && (
                        <span className="text-xs text-gray-400 line-through">৳{p.original_price} টাকা</span>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="px-3 pb-3 space-y-2">
                    <button
                      onClick={() => handleOrder(p)}
                      className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition"
                    >
                      <ShoppingCart className="h-4 w-4" /> অর্ডার করুন
                    </button>
                    <button
                      onClick={() => navigate(`/product/${p.id}`)}
                      className="w-full py-2 border border-green-600 text-green-600 hover:bg-green-50 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition"
                    >
                      <ShoppingBag className="h-4 w-4" /> বিস্তারিত দেখুন
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Contact floating buttons - WhatsApp & Phone */}
      {(whatsappNumber || phoneNumber) && (
        <div className="fixed bottom-20 right-4 z-40 flex flex-col gap-2">
          {whatsappNumber && (
            <a
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg hover:bg-green-600 transition"
            >
              <MessageCircle className="h-5 w-5" />
            </a>
          )}
          {phoneNumber && (
            <a
              href={`tel:${phoneNumber}`}
              className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg hover:bg-blue-600 transition"
            >
              <Phone className="h-5 w-5" />
            </a>
          )}
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2 md:col-span-1">
              <span className="text-lg font-black text-green-400">QUICK SHOP</span>
              <span className="text-lg font-black text-white"> BD</span>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">বাংলাদেশের সেরা অনলাইন শপিং ডেস্টিনেশন।</p>
            </div>
            {[
              { title: "কুইক লিংকস", links: ["হোম", "সব প্রোডাক্ট", "অফার", "যোগাযোগ"] },
              { title: "সাহায্য", links: ["ডেলিভারি তথ্য", "রিটার্ন পলিসি", "প্রাইভেসি পলিসি"] },
              { title: "যোগাযোগ", links: [`ফোন: ${phoneNumber || "01XXXXXXXXX"}`, "ঢাকা, বাংলাদেশ"] },
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
            © 2026 QUICK SHOP BD — All rights reserved
          </div>
        </div>
      </footer>

      {/* Discount Banner */}
      {showDiscountBanner && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleRejectDiscount} />
          <div className="relative w-[90%] max-w-sm animate-in zoom-in-95 duration-300">
            <button onClick={handleRejectDiscount} className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center">
              <span className="text-gray-500 text-lg font-bold">✕</span>
            </button>
            <div className="bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 rounded-3xl p-1 shadow-2xl">
              <div className="bg-white rounded-[22px] overflow-hidden">
                <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-center py-2.5 px-4">
                  <p className="text-xs font-bold tracking-wide uppercase animate-pulse">⚡ বিশেষ অফার — শুধুমাত্র আপনার জন্য! ⚡</p>
                </div>
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
                  <button onClick={handleAcceptDiscount} className="w-full py-3.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-bold text-base shadow-lg shadow-green-200 transition-all transform hover:scale-[1.02] active:scale-95">
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
