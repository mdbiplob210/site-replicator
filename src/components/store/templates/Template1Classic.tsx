import { Link } from "react-router-dom";
import { ShoppingBag, Search, Heart, Star, Truck, ShieldCheck, RotateCcw, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePublicProducts } from "@/hooks/usePublicProducts";
import { useState } from "react";

const Template1Classic = () => {
  const { data: products = [], isLoading } = usePublicProducts();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const getDiscount = (original: number, selling: number) => {
    if (original <= selling) return 0;
    return Math.round(((original - selling) / original) * 100);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-[Inter]">
      {/* Announcement Bar */}
      <div className="bg-gradient-to-r from-[#1a1a2e] via-[#16213e] to-[#0f3460] text-white text-center py-2.5 text-sm tracking-wide">
        <span className="inline-flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          সারা বাংলাদেশে ফ্রি ডেলিভারি — ৳১৫০০+ অর্ডারে
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
        </span>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-1">
            <span className="text-2xl font-black tracking-tighter bg-gradient-to-r from-[#0f3460] to-[#533483] bg-clip-text text-transparent">
              SOHOZ
            </span>
            <span className="text-2xl font-black tracking-tighter text-[#e94560]">STORE</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-[13px] font-semibold uppercase tracking-widest text-gray-500">
            <Link to="/store" className="hover:text-[#0f3460] transition-colors duration-200">Home</Link>
            <Link to="/store" className="hover:text-[#0f3460] transition-colors duration-200">Shop</Link>
            <Link to="/store" className="hover:text-[#0f3460] transition-colors duration-200">New</Link>
            <Link to="/store" className="hover:text-[#0f3460] transition-colors duration-200">Contact</Link>
          </nav>

          <div className="flex items-center gap-2">
            <button className="p-2.5 rounded-full hover:bg-gray-100 transition-colors">
              <Search className="h-[18px] w-[18px] text-gray-600" />
            </button>
            <button className="p-2.5 rounded-full hover:bg-gray-100 transition-colors relative">
              <Heart className="h-[18px] w-[18px] text-gray-600" />
            </button>
            <Link to="/store/checkout" className="p-2.5 rounded-full hover:bg-gray-100 transition-colors relative">
              <ShoppingBag className="h-[18px] w-[18px] text-gray-600" />
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-[#e94560] text-[10px] font-bold text-white flex items-center justify-center">0</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f3460]/[0.03] via-transparent to-[#e94560]/[0.03]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#e94560]/10 text-[#e94560] text-xs font-bold uppercase tracking-wider">
                <Sparkles className="h-3 w-3" /> নতুন কালেকশন ২০২৬
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight text-[#1a1a2e]">
                আপনার স্টাইল,{" "}
                <span className="bg-gradient-to-r from-[#e94560] to-[#533483] bg-clip-text text-transparent">
                  আপনার পছন্দ
                </span>
              </h1>
              <p className="text-gray-500 text-lg max-w-md leading-relaxed">
                প্রিমিয়াম কোয়ালিটির প্রোডাক্ট, সাশ্রয়ী মূল্যে। এখনই অর্ডার করুন এবং পান বিশেষ ডিসকাউন্ট!
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Button
                  size="lg"
                  className="bg-[#1a1a2e] hover:bg-[#16213e] text-white rounded-full px-8 h-12 text-sm font-semibold shadow-lg shadow-[#1a1a2e]/20 transition-all hover:shadow-xl hover:shadow-[#1a1a2e]/30 hover:-translate-y-0.5"
                >
                  শপিং শুরু করুন
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full px-8 h-12 text-sm font-semibold border-gray-300 hover:border-[#1a1a2e] hover:bg-[#1a1a2e] hover:text-white transition-all"
                >
                  অফার দেখুন
                </Button>
              </div>
            </div>

            {/* Hero visual - floating product cards */}
            <div className="relative hidden lg:block">
              <div className="absolute -top-8 -right-8 w-72 h-72 bg-[#e94560]/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-12 -left-8 w-56 h-56 bg-[#533483]/10 rounded-full blur-3xl" />
              <div className="relative grid grid-cols-2 gap-4">
                {products.slice(0, 4).map((p, i) => (
                  <div
                    key={p.id}
                    className={`rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-500 bg-white ${
                      i === 1 ? "translate-y-6" : i === 2 ? "-translate-y-6" : ""
                    }`}
                  >
                    <div className="aspect-square">
                      {p.main_image_url ? (
                        <img src={p.main_image_url} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          <ShoppingBag className="h-8 w-8 text-gray-300" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="border-y border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Truck, title: "ফ্রি ডেলিভারি", desc: "৳১৫০০+ অর্ডারে" },
              { icon: ShieldCheck, title: "১০০% অরিজিনাল", desc: "গ্যারান্টিড কোয়ালিটি" },
              { icon: RotateCcw, title: "ইজি রিটার্ন", desc: "৭ দিনের মধ্যে" },
              { icon: Star, title: "৫০০০+ রিভিউ", desc: "সন্তুষ্ট কাস্টমার" },
            ].map((b) => (
              <div key={b.title} className="flex items-center gap-3">
                <div className="flex-shrink-0 h-11 w-11 rounded-xl bg-gradient-to-br from-[#0f3460]/10 to-[#533483]/10 flex items-center justify-center">
                  <b.icon className="h-5 w-5 text-[#0f3460]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#1a1a2e]">{b.title}</p>
                  <p className="text-xs text-gray-400">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <div className="text-center mb-12">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#e94560]">আমাদের কালেকশন</span>
          <h2 className="text-3xl md:text-4xl font-black text-[#1a1a2e] mt-2">জনপ্রিয় প্রোডাক্টস</h2>
          <p className="text-gray-400 mt-3 max-w-md mx-auto">সেরা কোয়ালিটি প্রোডাক্ট, সেরা দামে</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-gray-200 rounded-2xl" />
                <div className="mt-3 h-4 bg-gray-200 rounded w-3/4" />
                <div className="mt-2 h-4 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag className="h-16 w-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">কোনো প্রোডাক্ট পাওয়া যায়নি</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((p) => {
              const discount = getDiscount(p.original_price, p.selling_price);
              return (
                <Link
                  key={p.id}
                  to={`/store/product/${p.id}`}
                  className="group relative"
                  onMouseEnter={() => setHoveredId(p.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <div className="relative rounded-2xl overflow-hidden bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all duration-500">
                    {/* Discount Badge */}
                    {discount > 0 && (
                      <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full bg-[#e94560] text-white text-[10px] font-bold tracking-wide shadow-lg shadow-[#e94560]/30">
                        -{discount}%
                      </div>
                    )}

                    {/* Wishlist */}
                    <button
                      className="absolute top-3 right-3 z-10 h-8 w-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-[#e94560] hover:text-white"
                      onClick={(e) => e.preventDefault()}
                    >
                      <Heart className="h-3.5 w-3.5" />
                    </button>

                    {/* Image */}
                    <div className="aspect-[4/5] overflow-hidden">
                      {p.main_image_url ? (
                        <img
                          src={p.main_image_url}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center">
                          <ShoppingBag className="h-10 w-10 text-gray-200" />
                        </div>
                      )}
                    </div>

                    {/* Quick Add */}
                    <div
                      className={`absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/50 to-transparent transition-all duration-300 ${
                        hoveredId === p.id ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                      }`}
                    >
                      <button className="w-full py-2.5 bg-white rounded-xl text-[#1a1a2e] text-xs font-bold uppercase tracking-wider hover:bg-[#1a1a2e] hover:text-white transition-colors shadow-lg">
                        এখনই কিনুন
                      </button>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="mt-3 px-1">
                    {p.categories?.name && (
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-0.5">
                        {p.categories.name}
                      </p>
                    )}
                    <h3 className="text-sm font-bold text-[#1a1a2e] truncate group-hover:text-[#e94560] transition-colors">
                      {p.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[15px] font-black text-[#1a1a2e]">৳{p.selling_price.toLocaleString()}</span>
                      {discount > 0 && (
                        <span className="text-xs text-gray-400 line-through">৳{p.original_price.toLocaleString()}</span>
                      )}
                    </div>
                    {/* Rating Stars */}
                    <div className="flex items-center gap-1 mt-1.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                      ))}
                      <span className="text-[10px] text-gray-400 ml-1">(120+)</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* CTA Banner */}
      <section className="mx-4 sm:mx-6 lg:mx-auto max-w-7xl mb-16">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#1a1a2e] via-[#16213e] to-[#0f3460] p-8 md:p-14">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#e94560]/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-[#533483]/30 rounded-full blur-[80px]" />
          <div className="relative z-10 text-center max-w-2xl mx-auto">
            <h3 className="text-2xl md:text-4xl font-black text-white mb-3">
              স্পেশাল ডিসকাউন্ট পান! 🎉
            </h3>
            <p className="text-gray-300 mb-6 text-sm md:text-base">
              এখনই অর্ডার করুন এবং পান ৳২০০ পর্যন্ত ইনস্ট্যান্ট ডিসকাউন্ট। সীমিত সময়ের অফার!
            </p>
            <Button
              size="lg"
              className="bg-[#e94560] hover:bg-[#d63851] text-white rounded-full px-10 h-12 text-sm font-bold shadow-lg shadow-[#e94560]/30 hover:shadow-xl hover:shadow-[#e94560]/40 transition-all hover:-translate-y-0.5"
            >
              অফার দেখুন
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1a1a2e] text-gray-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <Link to="/store" className="inline-block mb-4">
                <span className="text-xl font-black text-white">SOHOZ</span>
                <span className="text-xl font-black text-[#e94560]">STORE</span>
              </Link>
              <p className="text-sm text-gray-500 leading-relaxed">
                বাংলাদেশের সেরা অনলাইন শপিং ডেস্টিনেশন। প্রিমিয়াম কোয়ালিটি, সাশ্রয়ী দাম।
              </p>
            </div>
            {[
              { title: "কুইক লিংকস", links: ["হোম", "শপ", "অফার", "যোগাযোগ"] },
              { title: "সাহায্য", links: ["ডেলিভারি তথ্য", "রিটার্ন পলিসি", "প্রাইভেসি পলিসি", "FAQ"] },
              { title: "যোগাযোগ", links: ["ফোন: 01XXXXXXXXX", "ইমেইল: info@sohoz.store", "ঢাকা, বাংলাদেশ"] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="text-sm font-bold text-white mb-3 uppercase tracking-wider">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link}>
                      <span className="text-sm hover:text-white transition-colors cursor-pointer">{link}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-white/10 pt-6 text-center text-xs text-gray-500">
            © 2026 SOHOZ STORE — All rights reserved
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Template1Classic;
