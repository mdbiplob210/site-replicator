import { Link } from "react-router-dom";
import { ShoppingBag, Sparkles, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePublicProducts } from "@/hooks/usePublicProducts";

const Template4Colorful = () => {
  const { data: products = [], isLoading } = usePublicProducts();

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-violet-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-rose-100">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-2xl font-extrabold">
            <span className="bg-gradient-to-r from-rose-500 via-violet-500 to-indigo-500 bg-clip-text text-transparent">
              SOHOZ
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-gray-600">
            <Link to="/store" className="hover:text-rose-500 transition">🏠 Home</Link>
            <Link to="/store" className="hover:text-violet-500 transition">🛍️ Shop</Link>
            <Link to="/store" className="hover:text-indigo-500 transition">💬 Contact</Link>
          </div>
          <Link to="/store/cart" className="relative p-2 rounded-full bg-rose-50 hover:bg-rose-100 transition">
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
            <Sparkles className="h-4 w-4" /> ✨ নতুন কালেকশন এসেছে!
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-6">
            <span className="bg-gradient-to-r from-rose-600 via-violet-600 to-indigo-600 bg-clip-text text-transparent">
              আপনার স্টাইল,
            </span>
            <br />
            <span className="text-gray-900">আপনার পছন্দ</span>
          </h1>
          <p className="text-gray-500 text-lg mb-8 max-w-lg mx-auto">
            প্রিমিয়াম প্রোডাক্ট সেরা দামে, দ্রুত ডেলিভারি সারাদেশে
          </p>
          <Button size="lg" className="bg-gradient-to-r from-rose-500 to-violet-500 hover:from-rose-600 hover:to-violet-600 text-white font-bold px-10 rounded-full shadow-lg shadow-rose-200">
            🛍️ Shop Now
          </Button>
        </div>
      </section>

      {/* Products */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-2 text-center">Our Products</h2>
        <p className="text-center text-gray-400 mb-10">সেরা কোয়ালিটির প্রোডাক্ট</p>
        {isLoading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-gray-400">কোন প্রোডাক্ট নেই</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {products.map((p) => (
              <Link key={p.id} to={`/store/product/${p.id}`} className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-rose-50">
                <div className="aspect-square bg-gray-50 relative overflow-hidden">
                  {p.main_image_url ? (
                    <img src={p.main_image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-rose-200">
                      <ShoppingBag className="h-12 w-12" />
                    </div>
                  )}
                  <button className="absolute top-3 right-3 p-2 bg-white/80 rounded-full opacity-0 group-hover:opacity-100 transition">
                    <Heart className="h-4 w-4 text-rose-500" />
                  </button>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 truncate text-sm">{p.name}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="font-extrabold bg-gradient-to-r from-rose-500 to-violet-500 bg-clip-text text-transparent">৳{p.selling_price}</span>
                    {p.original_price > p.selling_price && (
                      <span className="text-xs text-gray-400 line-through">৳{p.original_price}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <footer className="bg-white border-t border-rose-100 py-10">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-400">
          © 2026 SOHOZ — Made with ❤️
        </div>
      </footer>
    </div>
  );
};

export default Template4Colorful;
