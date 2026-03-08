import { Link } from "react-router-dom";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { usePublicProducts } from "@/hooks/usePublicProducts";

const Template3Minimal = () => {
  const { data: products = [], isLoading } = usePublicProducts();

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900" style={{ fontFamily: "'Georgia', serif" }}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-stone-50/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <Link to="/" className="text-xl font-normal tracking-[0.3em] uppercase text-stone-800">
            Sohoz
          </Link>
          <div className="hidden md:flex items-center gap-10 text-xs tracking-[0.2em] uppercase text-stone-500">
            <Link to="/" className="hover:text-stone-900 transition">Shop</Link>
            <Link to="/" className="hover:text-stone-900 transition">About</Link>
            <Link to="/" className="hover:text-stone-900 transition">Contact</Link>
          </div>
          <Link to="/checkout" className="p-2">
            <ShoppingBag className="h-5 w-5 text-stone-600" />
          </Link>
        </div>
        <div className="h-px bg-stone-200" />
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-28 text-center">
        <p className="text-xs tracking-[0.3em] uppercase text-stone-400 mb-6">Curated Collection</p>
        <h1 className="text-4xl md:text-5xl font-normal leading-tight text-stone-800 mb-6">
          Elegance in<br />Every Detail
        </h1>
        <p className="text-stone-500 mb-10 max-w-md mx-auto text-sm leading-relaxed">
          সৌন্দর্য এবং গুণমানের সমন্বয়ে তৈরি আমাদের কিউরেটেড কালেকশন
        </p>
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
            {products.map((p) => (
              <Link key={p.id} to={`/product/${p.id}`} className="group">
                <div className="aspect-[3/4] bg-stone-100 overflow-hidden mb-4">
                  {p.main_image_url ? (
                    <img src={p.main_image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-102 transition duration-700" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-300">
                      <ShoppingBag className="h-10 w-10" />
                    </div>
                  )}
                </div>
                <h3 className="text-sm font-normal text-stone-800">{p.name}</h3>
                <p className="text-sm text-stone-500 mt-1">৳{p.selling_price}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <footer className="border-t border-stone-200 py-12">
        <div className="max-w-6xl mx-auto px-6 text-center text-xs text-stone-400 tracking-widest uppercase">
          © 2026 Sohoz
        </div>
      </footer>
    </div>
  );
};

export default Template3Minimal;
