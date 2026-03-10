import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { X, ShoppingBag, User, Phone, MapPin, Minus, Plus, CheckCircle2, Loader2, Users, Clock } from "lucide-react";
import { useTracking } from "@/hooks/useTracking";
import { usePublicProducts } from "@/hooks/usePublicProducts";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { getClientIp, parseDeviceInfo } from "@/lib/deviceDetect";
import { useSiteSettings } from "@/hooks/useSiteSettings";

interface CheckoutItem {
  productId: string;
  name: string;
  price: number;
  qty: number;
  image: string | null;
  productCode?: string;
  categoryId?: string | null;
}

interface PopupCheckoutProps {
  item: CheckoutItem | null;
  open: boolean;
  onClose: () => void;
  discount?: number;
  onExitIntent?: () => void;
}

export function PopupCheckout({ item, open, onClose, discount = 0, onExitIntent }: PopupCheckoutProps) {
  const [form, setForm] = useState({ name: "", phone: "", address: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [completedOrderId, setCompletedOrderId] = useState("");
  const [completedOrderNumber, setCompletedOrderNumber] = useState("");
  const [currentItem, setCurrentItem] = useState<CheckoutItem | null>(null);
  const [qty, setQty] = useState(1);
  const [deliveryArea, setDeliveryArea] = useState<"inside" | "outside">("inside");
  const formInteracted = useRef(false);
  const abandonedSaved = useRef(false);
  const orderSubmitted = useRef(false);
  const initiateTracked = useRef(false);

  const { trackInitiateCheckout, trackAddPaymentInfo, trackPurchase, trackAddToCart, trackCustomEvent } = useTracking();
  const { data: allProducts = [] } = usePublicProducts();
  const { data: settings } = useSiteSettings();

  // Scarcity counter - fake "people viewing" countdown
  const scarcityStart = Number(settings?.checkout_scarcity_count) || 47;
  const [scarcityCount, setScarcityCount] = useState(scarcityStart);

  useEffect(() => {
    if (!open) {
      setScarcityCount(scarcityStart);
      return;
    }
    const timer = setInterval(() => {
      setScarcityCount(prev => {
        if (prev <= 3) return scarcityStart; // reset when too low
        return prev - 1;
      });
    }, 5000);
    return () => clearInterval(timer);
  }, [open, scarcityStart]);

  // Same-category suggestions
  const suggestedProducts = allProducts.filter(
    p => p.category_id && currentItem?.categoryId && p.category_id === currentItem.categoryId && p.id !== currentItem.productId
  ).slice(0, 4);

  useEffect(() => {
    if (item && open) {
      setCurrentItem(item);
      setQty(item.qty);
      setOrderComplete(false);
      setCompletedOrderId("");
      setCompletedOrderNumber("");
      orderSubmitted.current = false;
      abandonedSaved.current = false;
      initiateTracked.current = false;
      // Push a history state so back button can close the popup
      window.history.pushState({ popupCheckout: true }, "");
    }
  }, [item, open]);

  // Handle browser back button
  useEffect(() => {
    if (!open) return;
    const handlePopState = (e: PopStateEvent) => {
      // Back button pressed while popup is open
      if (!orderSubmitted.current && onExitIntent) {
        onExitIntent();
      } else {
        onClose();
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [open, onExitIntent, onClose]);

  // Track InitiateCheckout
  useEffect(() => {
    if (open && currentItem && !initiateTracked.current) {
      initiateTracked.current = true;
      trackInitiateCheckout({
        value: currentItem.price * qty,
        contentName: currentItem.name,
        contentId: currentItem.productCode || currentItem.productId,
        qty,
      });
    }
  }, [open, currentItem, qty, trackInitiateCheckout]);

  // Abandoned order tracking
  const saveAbandonedOrder = useCallback(async () => {
    if (orderSubmitted.current || abandonedSaved.current || !formInteracted.current) return;
    if (!form.name && !form.phone) return;
    if (!currentItem) return;
    abandonedSaved.current = true;
    try {
      await supabase.from("incomplete_orders" as any).insert({
        customer_name: form.name || "Unknown",
        customer_phone: form.phone || null,
        customer_address: form.address || null,
        product_name: currentItem.name,
        product_code: currentItem.productCode || null,
        quantity: qty,
        unit_price: currentItem.price,
        total_amount: currentItem.price * qty,
        notes: form.notes || null,
        block_reason: "abandoned_form",
        landing_page_slug: "website-store",
        device_info: /Mobi|Android/i.test(navigator.userAgent) ? "Mobile" : "Desktop",
        user_agent: navigator.userAgent.substring(0, 200),
        delivery_charge: 0,
        discount: 0,
        status: "processing",
      } as any);
    } catch {}
  }, [form, currentItem, qty]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" && open) saveAbandonedOrder();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [saveAbandonedOrder, open]);

  const updateForm = (updates: Partial<typeof form>) => {
    formInteracted.current = true;
    abandonedSaved.current = false;
    setForm(prev => ({ ...prev, ...updates }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentItem) return;
    if (!form.name || !form.phone || !form.address) {
      toast.error("Please fill in all fields");
      return;
    }
    setSubmitting(true);
    orderSubmitted.current = true;
    trackAddPaymentInfo({ value: currentItem.price * qty });

    try {
      const { data: seqNum } = await supabase.rpc("generate_order_number");
      const orderNumber = String(seqNum || Date.now());
      const orderId = crypto.randomUUID();
      const total = currentItem.price * qty;

      const clientIp = await getClientIp();
      const { deviceInfo } = parseDeviceInfo();

      const { error } = await supabase.from("orders").insert({
        id: orderId,
        order_number: orderNumber,
        customer_name: form.name,
        customer_phone: form.phone,
        customer_address: form.address,
        notes: form.notes || null,
        total_amount: total,
        product_cost: subtotal,
        discount: discount,
        delivery_charge: deliveryCharge,
        status: "processing",
        source: "website",
        client_ip: clientIp,
        device_info: deviceInfo,
        user_agent: navigator.userAgent,
      } as any);
      if (error) throw error;

      await supabase.from("order_items").insert({
        order_id: orderId,
        product_id: currentItem.productId || null,
        product_name: currentItem.name,
        product_code: currentItem.productCode || "",
        quantity: qty,
        unit_price: currentItem.price,
        total_price: total,
      } as any);

      setCompletedOrderId(orderId);
      setCompletedOrderNumber(orderNumber);

      trackPurchase({
        value: total,
        orderId: orderNumber,
        contentName: currentItem.name,
        contentId: currentItem.productCode || currentItem.productId,
        qty,
        customerPhone: form.phone,
        customerName: form.name,
      });

      setOrderComplete(true);
      toast.success("অর্ডার সফল হয়েছে! 🎉");
    } catch (err: any) {
      orderSubmitted.current = false;
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Add suggested product to the existing order
  const handleAddSuggested = async (product: any) => {
    if (!completedOrderId) return;

    trackAddToCart({
      id: product.id,
      name: product.name,
      price: product.selling_price,
      qty: 1,
      productCode: product.product_code,
    });

    try {
      // Add item to existing order
      await supabase.from("order_items").insert({
        order_id: completedOrderId,
        product_id: product.id,
        product_name: product.name,
        product_code: product.product_code || "",
        quantity: 1,
        unit_price: product.selling_price,
        total_price: product.selling_price,
      } as any);

      // Update order total
      const { data: currentOrder } = await supabase
        .from("orders")
        .select("total_amount, product_cost")
        .eq("id", completedOrderId)
        .single();

      if (currentOrder) {
        await supabase.from("orders").update({
          total_amount: (currentOrder.total_amount || 0) + product.selling_price,
          product_cost: (currentOrder.product_cost || 0) + product.selling_price,
        } as any).eq("id", completedOrderId);
      }

      trackCustomEvent("AddToExistingOrder", {
        order_id: completedOrderNumber,
        product_name: product.name,
        value: product.selling_price,
      });

      toast.success(`${product.name} অর্ডারে যোগ হয়েছে! ✅`);
    } catch (err: any) {
      toast.error("যোগ করতে সমস্যা হয়েছে");
    }
  };

  const handleClose = () => {
    if (!orderSubmitted.current) {
      saveAbandonedOrder();
      // Always trigger exit intent if available (parent controls max discount logic)
      if (onExitIntent) {
        onExitIntent();
        return;
      }
    }
    setForm({ name: "", phone: "", address: "", notes: "" });
    setOrderComplete(false);
    formInteracted.current = false;
    onClose();
  };

  const handleForceClose = () => {
    setForm({ name: "", phone: "", address: "", notes: "" });
    setOrderComplete(false);
    formInteracted.current = false;
    onClose();
  };

  if (!open || !currentItem) return null;

  const insideDhaka = Number(settings?.delivery_inside_dhaka) || 80;
  const outsideDhaka = Number(settings?.delivery_outside_dhaka) || 150;
  const freeDeliveryAbove = Number(settings?.free_delivery_above) || 0;

  // Determine if product has free delivery
  const productHasFreeDelivery = currentItem ? allProducts.find(p => p.id === currentItem.productId)?.free_delivery : false;

  const subtotal = currentItem.price * qty;
  const deliveryCharge = productHasFreeDelivery ? 0 : (freeDeliveryAbove > 0 && subtotal >= freeDeliveryAbove) ? 0 : (deliveryArea === "inside" ? insideDhaka : outsideDhaka);
  const total = Math.max(0, subtotal + deliveryCharge - discount);

  return (
    <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md max-h-[92vh] overflow-y-auto bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl animate-in slide-in-from-bottom duration-300 mx-0 sm:mx-4">
        {/* Close button */}
        <button onClick={handleClose} className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition">
          <X className="h-4 w-4" />
        </button>

        {!orderComplete ? (
          <>
            {/* Scarcity Banner */}
            <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-4 sm:px-5 py-2.5 sm:py-2.5 flex items-center justify-center gap-2 text-[11px] sm:text-sm font-semibold rounded-t-3xl sm:rounded-t-3xl">
              <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-pulse" />
              <span>এই অফারটি পাবে আর মাত্র <span className="font-black text-sm sm:text-base">{scarcityCount}</span> জন!</span>
              <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </div>

            {/* Product header */}
            <div className="p-4 sm:p-5 pb-2 sm:pb-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                  {currentItem.image ? (
                    <OptimizedImage src={currentItem.image} alt={currentItem.name} width={64} quality={75} className="w-full h-full object-cover" />
                  ) : (
                    <ShoppingBag className="h-6 w-6 m-auto mt-4 sm:mt-5 text-gray-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-[13px] sm:text-sm truncate">{currentItem.name}</h3>
                  <p className="text-green-600 font-black text-base sm:text-lg">৳{currentItem.price}</p>
                </div>
              </div>
              {/* Quantity */}
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs sm:text-sm text-gray-500">পরিমাণ:</span>
                <div className="flex items-center border rounded-lg overflow-hidden">
                  <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-2 sm:py-1.5 hover:bg-gray-100 active:bg-gray-200 transition">
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="px-3 py-1.5 font-bold text-sm min-w-[2.5rem] text-center">{qty}</span>
                  <button type="button" onClick={() => setQty(qty + 1)} className="px-3 py-2 sm:py-1.5 hover:bg-gray-100 active:bg-gray-200 transition">
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-2.5 sm:space-y-3">
              <div>
                <Label className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-gray-600 mb-1">
                  <User className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> আপনার নাম
                </Label>
                <Input placeholder="পুরো নাম লিখুন" value={form.name} onChange={e => updateForm({ name: e.target.value })} className="h-11 sm:h-11 rounded-xl text-sm" required name="name" autoComplete="name" />
              </div>
              <div>
                <Label className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-gray-600 mb-1">
                  <Phone className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> ফোন নম্বর
                </Label>
                <Input placeholder="01XXXXXXXXX" value={form.phone} onChange={e => updateForm({ phone: e.target.value })} className="h-11 sm:h-11 rounded-xl text-sm" required name="tel" autoComplete="tel" inputMode="tel" />
              </div>
              <div>
                <Label className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-gray-600 mb-1">
                  <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> সম্পূর্ণ ঠিকানা
                </Label>
                <Textarea placeholder="বাড়ি নং, রোড, এলাকা, জেলা" value={form.address} onChange={e => updateForm({ address: e.target.value })} className="rounded-xl resize-none text-sm" rows={2} required name="address" autoComplete="street-address" />
              </div>
              <div>
                <Label className="text-[11px] sm:text-xs font-semibold text-gray-600 mb-1">নোট (ঐচ্ছিক)</Label>
                <Input placeholder="অতিরিক্ত তথ্য..." value={form.notes} onChange={e => updateForm({ notes: e.target.value })} className="h-11 sm:h-11 rounded-xl text-sm" autoComplete="off" />
              </div>

              {/* Delivery Area Selector */}
              <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                <label className="text-xs font-semibold text-gray-600">ডেলিভারি এরিয়া:</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setDeliveryArea("inside")}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition ${deliveryArea === "inside" ? "border-green-500 bg-green-50 text-green-700" : "border-gray-200 text-gray-500"}`}>
                    ঢাকার ভিতরে (৳{insideDhaka})
                  </button>
                  <button type="button" onClick={() => setDeliveryArea("outside")}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition ${deliveryArea === "outside" ? "border-green-500 bg-green-50 text-green-700" : "border-gray-200 text-gray-500"}`}>
                    ঢাকার বাইরে (৳{outsideDhaka})
                  </button>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gray-50 rounded-xl p-3 space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">সাবটোটাল</span><span>৳{subtotal}</span></div>
                {discount > 0 && (
                  <div className="flex justify-between text-red-500 font-semibold">
                    <span>🎁 বিশেষ ছাড়</span><span>-৳{discount}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">ডেলিভারি চার্জ</span>
                  <span className={deliveryCharge === 0 ? "text-green-600 font-semibold" : ""}>
                    {deliveryCharge === 0 ? "ফ্রি" : `৳${deliveryCharge}`}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-base border-t pt-1.5"><span>মোট</span><span className="text-green-600">৳{total}</span></div>
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full h-12 sm:h-12 text-sm sm:text-base font-bold bg-green-600 hover:bg-green-700 active:scale-[0.98] text-white rounded-xl shadow-lg shadow-green-200 transition-all"
              >
                {submitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> প্রসেসিং...</>
                ) : (
                  <>🛒 অর্ডার কনফার্ম করুন — ৳{total}</>
                )}
              </Button>

              <p className="text-center text-[11px] sm:text-xs text-gray-400 pb-2">💳 ক্যাশ অন ডেলিভারি | 🚚 ২-৫ দিনে ডেলিভারি</p>
            </form>
          </>
        ) : (
          /* Order Complete + Suggestions */
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">অর্ডার সফল হয়েছে! 🎉</h3>
              <p className="text-sm text-gray-500 mt-1">অর্ডার নং: {completedOrderNumber}</p>
              <p className="text-xs text-gray-400 mt-1">শীঘ্রই আপনাকে কল করা হবে</p>
            </div>

            {/* Same-category product suggestions */}
            {suggestedProducts.length > 0 && (
              <div className="border-t pt-5">
                <h4 className="font-bold text-sm text-gray-700 mb-3 text-center">
                  🛍️ এই প্রোডাক্টগুলোও আপনার পছন্দ হতে পারে
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {suggestedProducts.map(p => {
                    const discount = p.original_price > p.selling_price
                      ? Math.round(((p.original_price - p.selling_price) / p.original_price) * 100)
                      : 0;
                    return (
                      <div key={p.id} className="border rounded-xl overflow-hidden bg-white">
                        <div className="aspect-square bg-gray-50 relative">
                          {p.main_image_url ? (
                            <OptimizedImage src={p.main_image_url} alt={p.name} width={200} quality={75} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ShoppingBag className="h-6 w-6 text-gray-200" />
                            </div>
                          )}
                          {discount > 0 && (
                            <span className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                              -{discount}%
                            </span>
                          )}
                        </div>
                        <div className="p-2">
                          <p className="text-xs font-semibold truncate">{p.name}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-green-600 font-bold text-sm">৳{p.selling_price}</span>
                            {discount > 0 && <span className="text-[10px] text-gray-400 line-through">৳{p.original_price}</span>}
                          </div>
                          <button
                            onClick={() => handleAddSuggested(p)}
                            className="w-full mt-1.5 py-1.5 text-xs font-bold bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                          >
                            + যোগ করুন
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <Button onClick={handleClose} variant="outline" className="w-full mt-4 rounded-xl">
              বন্ধ করুন
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
