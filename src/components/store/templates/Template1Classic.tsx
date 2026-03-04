import { Link } from "react-router-dom";
import { ShoppingBag, Search, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePublicProducts } from "@/hooks/usePublicProducts";

const Template1Classic = () => {
  const { data: products = [], isLoading } = usePublicProducts();

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/store" className="text-2xl font-bold tracking-tight text-gray-900">
            SOHOZ<span className="text-blue-600">STORE</span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <Link to="/store" className="hover:text-gray-900 transition">Home</Link>
            <Link to="/store" className="hover:text-gray-900 transition">Shop</Link>
            <Link to="/store" className="hover:text-gray-900 transition">About</Link>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-full hover:bg-gray-100"><Search className="h-5 w-5" /></button>
            <Link to="/store/cart" className="p-2 rounded-full hover:bg-gray-100 relative">
              <ShoppingBag className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-50 py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
            Premium Quality<br />Products
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            আমাদের সেরা কোয়ালিটি প্রোডাক্ট দেখুন এবং অর্ডার করুন
          </p>
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 rounded-full">
            Shop Now
          </Button>
        </div>
      </section>

      {/* Products Grid */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">আমাদের প্রোডাক্টস</h2>
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-gray-500">কোন প্রোডাক্ট পাওয়া যায়নি</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((p) => (
              <Link key={p.id} to={`/store/product/${p.id}`} className="group">
                <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden mb-3">
                  {p.main_image_url ? (
                    <img src={p.main_image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <ShoppingBag className="h-12 w-12" />
                    </div>
                  )}
                </div>
                <h3 className="font-semibold text-gray-900 truncate">{p.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-blue-600 font-bold">৳{p.selling_price}</span>
                  {p.original_price > p.selling_price && (
                    <span className="text-sm text-gray-400 line-through">৳{p.original_price}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-100 py-10">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
          © 2026 SOHOZ STORE — All rights reserved
        </div>
      </footer>
    </div>
  );
};

export default Template1Classic;
