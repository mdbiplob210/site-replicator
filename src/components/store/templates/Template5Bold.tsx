import { Link } from "react-router-dom";
import { ShoppingBag, ArrowUpRight, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePublicProducts } from "@/hooks/usePublicProducts";

const Template5Bold = () => {
  const { data: products = [], isLoading } = usePublicProducts();

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-zinc-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-3xl font-black tracking-tighter">
            SOH<span className="text-lime-400">OZ</span>
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
            BIG<br />
            <span className="text-lime-400">DEALS</span><br />
            TODAY
          </h1>
          <p className="text-zinc-400 text-lg mb-8 max-w-md">
            সবচেয়ে ভালো প্রোডাক্ট, সবচেয়ে ভালো দাম। আজই অর্ডার করুন।
          </p>
          <Button size="lg" className="bg-lime-400 hover:bg-lime-300 text-zinc-900 font-black px-10 rounded-none text-lg">
            SHOP NOW <ArrowUpRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Products */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-4xl font-black tracking-tighter">ALL PRODUCTS</h2>
          <span className="text-sm font-bold text-zinc-500 bg-zinc-200 px-4 py-2 rounded-full">
            {products.length} items
          </span>
        </div>
        {isLoading ? (
          <div className="text-center py-12 text-zinc-400">Loading...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-zinc-400">No products yet</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p) => (
              <Link key={p.id} to={`/product/${p.id}`} className="group bg-white overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="aspect-square bg-zinc-50 overflow-hidden">
                  {p.main_image_url ? (
                    <img src={p.main_image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-300">
                      <ShoppingBag className="h-12 w-12" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-black text-zinc-900 truncate uppercase text-sm">{p.name}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-lg font-black text-zinc-900">৳{p.selling_price}</span>
                    {p.original_price > p.selling_price && (
                      <span className="text-xs text-zinc-400 line-through">৳{p.original_price}</span>
                    )}
                  </div>
                  <div className="mt-3 opacity-0 group-hover:opacity-100 transition">
                    <span className="inline-block bg-zinc-900 text-white text-xs font-bold px-4 py-2 uppercase tracking-widest">
                      View →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <footer className="bg-zinc-900 text-white py-10">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-zinc-500 font-bold tracking-widest uppercase">
          © 2026 SOHOZ
        </div>
      </footer>
    </div>
  );
};

export default Template5Bold;
