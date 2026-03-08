import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useProduct } from "@/hooks/usePublicProducts";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Button } from "@/components/ui/button";
import { ShoppingBag, ArrowLeft, Minus, Plus, Truck, Shield, RotateCcw } from "lucide-react";
import { useTracking, useEngagementTracking } from "@/hooks/useTracking";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: product, isLoading } = useProduct(id || "");
  const { data: settings } = useSiteSettings();
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const template = settings?.active_template || "1";
  const { trackViewContent, trackAddToCart } = useTracking();
  useEngagementTracking(); // Track scroll depth & time on page
  const viewTracked = useState(false);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!product) return <div className="min-h-screen flex items-center justify-center">Product not found</div>;

  const isDark = template === "2";
  const bgClass = isDark ? "bg-gray-950 text-white" : template === "5" ? "bg-zinc-100 text-zinc-900" : "bg-white text-gray-900";

  const handleOrder = () => {
    const orderData = { productId: product.id, name: product.name, price: product.selling_price, qty, image: product.main_image_url, productCode: product.product_code };
    sessionStorage.setItem("checkout_item", JSON.stringify(orderData));
    navigate("/checkout");
  };

  return (
    <div className={`min-h-screen ${bgClass}`}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm mb-8 opacity-60 hover:opacity-100 transition">
          <ArrowLeft className="h-4 w-4" /> Back to Store
        </Link>

        <div className="grid md:grid-cols-2 gap-10">
          {/* Image */}
          <div className={`aspect-square rounded-2xl overflow-hidden ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
            {product.main_image_url ? (
              <img src={product.main_image_url} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center opacity-20">
                <ShoppingBag className="h-20 w-20" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col justify-center">
            {product.categories?.name && (
              <span className="text-xs font-semibold uppercase tracking-widest opacity-50 mb-2">{(product.categories as any).name}</span>
            )}
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{product.name}</h1>
            
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl font-black">৳{product.selling_price}</span>
              {product.original_price > product.selling_price && (
                <>
                  <span className="text-lg line-through opacity-40">৳{product.original_price}</span>
                  <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-full">
                    {Math.round((1 - product.selling_price / product.original_price) * 100)}% OFF
                  </span>
                </>
              )}
            </div>

            {product.short_description && (
              <p className="opacity-60 mb-6 leading-relaxed">{product.short_description}</p>
            )}

            {/* Quantity */}
            <div className="flex items-center gap-4 mb-6">
              <span className="text-sm font-semibold">Quantity:</span>
              <div className="flex items-center border rounded-lg overflow-hidden">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-2 hover:bg-gray-100"><Minus className="h-4 w-4" /></button>
                <span className="px-4 py-2 font-bold min-w-[3rem] text-center">{qty}</span>
                <button onClick={() => setQty(qty + 1)} className="px-3 py-2 hover:bg-gray-100"><Plus className="h-4 w-4" /></button>
              </div>
            </div>

            {/* Stock */}
            <p className={`text-sm mb-6 ${product.stock_quantity > 0 ? "text-green-600" : "text-red-500"}`}>
              {product.stock_quantity > 0 ? `✓ In Stock (${product.stock_quantity} available)` : "✗ Out of Stock"}
            </p>

            {/* Order Button */}
            <Button
              size="lg"
              onClick={handleOrder}
              disabled={product.stock_quantity <= 0 && !product.allow_out_of_stock_orders}
              className={`w-full text-lg font-bold py-6 rounded-xl ${
                template === "2" ? "bg-amber-500 hover:bg-amber-600 text-gray-950" :
                template === "4" ? "bg-gradient-to-r from-rose-500 to-violet-500 text-white" :
                template === "5" ? "bg-zinc-900 text-white hover:bg-zinc-800 rounded-none" :
                "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              অর্ডার করুন — ৳{product.selling_price * qty}
            </Button>

            {/* Trust signals */}
            <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t opacity-50">
              <div className="text-center text-xs">
                <Truck className="h-5 w-5 mx-auto mb-1" />
                দ্রুত ডেলিভারি
              </div>
              <div className="text-center text-xs">
                <Shield className="h-5 w-5 mx-auto mb-1" />
                গ্যারান্টি
              </div>
              <div className="text-center text-xs">
                <RotateCcw className="h-5 w-5 mx-auto mb-1" />
                রিটার্ন পলিসি
              </div>
            </div>
          </div>
        </div>

        {product.detailed_description && (
          <div className="mt-16 pt-10 border-t">
            <h2 className="text-2xl font-bold mb-4">বিস্তারিত বিবরণ</h2>
            <div className="opacity-70 leading-relaxed whitespace-pre-wrap">{product.detailed_description}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
