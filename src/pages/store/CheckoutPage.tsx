import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { usePageSEO } from "@/hooks/usePageSEO";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ShoppingBag, ArrowLeft, Check, Package, CreditCard, MapPin, Phone, User } from "lucide-react";
import { useTracking } from "@/hooks/useTracking";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { getClientIp, parseDeviceInfo } from "@/lib/deviceDetect";
import { sanitizePhoneInput, isValidBDPhone } from "@/lib/phoneUtils";

interface CheckoutItem {
  productId: string; name: string; price: number; qty: number; image: string | null;
  productCode?: string;
}

const CheckoutPage = () => {
  const { data: settings } = useSiteSettings();
  usePageSEO({ title: "Checkout", noIndex: true });
  const navigate = useNavigate();
  const [item, setItem] = useState<CheckoutItem | null>(null);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", address: "", notes: "" });
  const [deliveryArea, setDeliveryArea] = useState<"inside" | "outside">("inside");
  const checkoutType = settings?.active_checkout || "1";
  const formInteracted = useRef(false);
  const abandonedSaved = useRef(false);
  const orderSubmitted = useRef(false);
  const { trackInitiateCheckout, trackAddPaymentInfo, trackPurchase } = useTracking();
  const initiateTracked = useRef(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("checkout_item");
    if (raw) {
      const parsed = JSON.parse(raw);
      setItem(parsed);
      // Track InitiateCheckout
      if (!initiateTracked.current && parsed) {
        initiateTracked.current = true;
        trackInitiateCheckout({
          value: parsed.price * parsed.qty,
          contentName: parsed.name,
          contentId: parsed.productCode || parsed.productId,
          qty: parsed.qty,
        });
      }
    }
  }, [trackInitiateCheckout]);

  // Track abandoned form - save when user leaves page
  const saveAbandonedOrder = useCallback(async () => {
    if (orderSubmitted.current || abandonedSaved.current || !formInteracted.current) return;
    if (!form.name && !form.phone) return; // No meaningful data
    if (!item) return;
    abandonedSaved.current = true;
    
    try {
      // Generate a stable session ID for this checkout to prevent duplicates
      let sessionId = sessionStorage.getItem("checkout_session_id");
      if (!sessionId) {
        sessionId = `cs_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        sessionStorage.setItem("checkout_session_id", sessionId);
      }

      // Upsert: find existing incomplete order by session_id (stored in notes prefix) or phone
      const phoneVal = form.phone?.trim();
      
      // Try to find by session ID first (in user_agent field as marker)
      const { data: existingBySession } = await supabase
        .from("incomplete_orders" as any)
        .select("id")
        .eq("status", "processing")
        .eq("landing_page_slug", "website-store")
        .ilike("user_agent", `%${sessionId}%`)
        .limit(1);

      let existingId = (existingBySession as any)?.[0]?.id;
      
      // Fallback: try by phone
      if (!existingId && phoneVal) {
        const { data: existingByPhone } = await supabase
          .from("incomplete_orders" as any)
          .select("id")
          .eq("customer_phone", phoneVal)
          .eq("status", "processing")
          .limit(1);
        existingId = (existingByPhone as any)?.[0]?.id;
      }
      
      const incompleteData = {
        customer_name: form.name || "Unknown",
        customer_phone: form.phone || null,
        customer_address: form.address || null,
        product_name: item.name,
        product_code: item.productCode || null,
        quantity: item.qty,
        unit_price: item.price,
        total_amount: item.price * item.qty,
        notes: form.notes || null,
        block_reason: "abandoned_form",
        landing_page_slug: "website-store",
        device_info: /Mobi|Android/i.test(navigator.userAgent) ? "Mobile" : "Desktop",
        user_agent: `${navigator.userAgent.substring(0, 150)}|${sessionId}`,
        updated_at: new Date().toISOString(),
      };

      if (existingId) {
        await supabase.from("incomplete_orders" as any).update(incompleteData as any).eq("id", existingId);
        return;
      }
      
      await supabase.from("incomplete_orders" as any).insert({
        ...incompleteData,
        delivery_charge: 0,
        discount: 0,
        status: "processing",
      } as any);
    } catch (e) {
      // Silent fail - don't block user
    }
  }, [form, item]);

  // Save abandoned order when user leaves page
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!orderSubmitted.current && formInteracted.current && (form.name || form.phone)) {
        // Use sendBeacon for reliability
        const payload = JSON.stringify({
          customer_name: form.name || "Unknown",
          customer_phone: form.phone || null,
          customer_address: form.address || null,
          product_name: item?.name || null,
          product_code: item?.productCode || null,
          quantity: item?.qty || 1,
          unit_price: item?.price || 0,
          total_amount: (item?.price || 0) * (item?.qty || 1),
          block_reason: "abandoned_form",
          status: "processing",
          landing_page_slug: "website-store",
          device_info: /Mobi|Android/i.test(navigator.userAgent) ? "Mobile" : "Desktop",
        });
        // We'll use the edge function or direct insert on visibility change
        abandonedSaved.current = true;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        saveAbandonedOrder();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      // Also save on unmount (navigating away within app)
      saveAbandonedOrder();
    };
  }, [saveAbandonedOrder, item, form]);

  // Mark form as interacted when user types
  const updateForm = (updates: Partial<typeof form>) => {
    formInteracted.current = true;
    abandonedSaved.current = false;
    if (updates.phone !== undefined) {
      updates.phone = sanitizePhoneInput(updates.phone);
    }
    setForm(prev => ({ ...prev, ...updates }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;
    if (!form.name || !form.phone || !form.address) {
      toast.error("Please fill in all fields");
      return;
    }
    setSubmitting(true);
    orderSubmitted.current = true;
    // Track AddPaymentInfo
    trackAddPaymentInfo({ value: item.price * item.qty });
    try {
      const { data: seqNum } = await supabase.rpc("generate_order_number");
      const orderNumber = String(seqNum || Date.now());
      const total = item.price * item.qty;
      
      // Create the order
      // Detect IP and device
      const clientIp = await getClientIp();
      const { deviceInfo } = parseDeviceInfo();

      const { data: orderData, error } = await supabase.from("orders").insert({
        order_number: orderNumber,
        customer_name: form.name,
        customer_phone: form.phone,
        customer_address: form.address,
        notes: form.notes || null,
        total_amount: total,
        product_cost: item.price * item.qty,
        delivery_charge: deliveryCharge,
        status: "processing",
        source: "website",
        client_ip: clientIp,
        device_info: deviceInfo,
        user_agent: navigator.userAgent,
      } as any).select().single();
      if (error) throw error;

      // Insert order item
      if (orderData) {
        await supabase.from("order_items").insert({
          order_id: orderData.id,
          product_id: item.productId || null,
          product_name: item.name,
          product_code: item.productCode || "",
          quantity: item.qty,
          unit_price: item.price,
          total_price: total,
        } as any);
      }

      // Track Purchase event
      trackPurchase({
        value: total,
        orderId: orderNumber,
        contentName: item.name,
        contentId: item.productCode || item.productId,
        qty: item.qty,
        customerPhone: form.phone,
        customerName: form.name,
      });

      // Store order info for success page
      sessionStorage.setItem("last_order", JSON.stringify({
        orderNumber, total, name: item.name, qty: item.qty,
        productCode: item.productCode || item.productId,
        customerPhone: form.phone, customerName: form.name,
      }));

      sessionStorage.removeItem("checkout_item");
      toast.success("Order placed successfully! 🎉");
      navigate("/order-success");
    } catch (err: any) {
      orderSubmitted.current = false;
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!item) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <ShoppingBag className="h-16 w-16 text-gray-300" />
      <p className="text-gray-500">No product selected</p>
      <Button variant="outline" onClick={() => navigate("/")}>Back to Store</Button>
    </div>
  );

  const insideDhaka = Number(settings?.delivery_inside_dhaka) || 80;
  const outsideDhaka = Number(settings?.delivery_outside_dhaka) || 150;
  const freeDeliveryAbove = Number(settings?.free_delivery_above) || 0;
  const subtotal = item.price * item.qty;
  const deliveryCharge = (freeDeliveryAbove > 0 && subtotal >= freeDeliveryAbove) ? 0 : (deliveryArea === "inside" ? insideDhaka : outsideDhaka);
  const total = subtotal + deliveryCharge;

  const formFields = (
    <>
      <div className="space-y-1.5">
        <Label className="flex items-center gap-2 text-sm font-semibold"><User className="h-4 w-4" /> Your Name</Label>
        <Input placeholder="Full name" value={form.name} onChange={e => updateForm({ name: e.target.value })} required />
      </div>
      <div className="space-y-1.5">
        <Label className="flex items-center gap-2 text-sm font-semibold"><Phone className="h-4 w-4" /> Phone Number</Label>
        <Input placeholder="01XXXXXXXXX" value={form.phone} onChange={e => updateForm({ phone: e.target.value })} required />
      </div>
      <div className="space-y-1.5">
        <Label className="flex items-center gap-2 text-sm font-semibold"><MapPin className="h-4 w-4" /> Delivery Address</Label>
        <Textarea placeholder="Enter full address" value={form.address} onChange={e => updateForm({ address: e.target.value })} required />
      </div>
      {/* Delivery Area Selector */}
      <div className="space-y-1.5">
        <Label className="text-sm font-semibold">Delivery Area</Label>
        <div className="flex gap-2">
          <button type="button" onClick={() => setDeliveryArea("inside")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition ${deliveryArea === "inside" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>
            Inside Dhaka — ৳{insideDhaka}
          </button>
          <button type="button" onClick={() => setDeliveryArea("outside")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition ${deliveryArea === "outside" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>
            Outside Dhaka — ৳{outsideDhaka}
          </button>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-sm font-semibold">Note (optional)</Label>
        <Input placeholder="Additional info..." value={form.notes} onChange={e => updateForm({ notes: e.target.value })} />
      </div>
    </>
  );

  const orderSummary = (
    <div className="rounded-xl border p-5 space-y-4">
      <h3 className="font-bold text-lg">Order Summary</h3>
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
          {item.image ? <OptimizedImage src={item.image} alt={item.name} width={64} quality={75} className="w-full h-full object-cover" /> : <ShoppingBag className="h-6 w-6 m-auto mt-5 text-gray-300" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{item.name}</p>
          <p className="text-sm text-gray-500">৳{item.price} × {item.qty}</p>
        </div>
        <span className="font-bold">৳{subtotal}</span>
      </div>
      <div className="border-t pt-3 space-y-2 text-sm">
        <div className="flex justify-between"><span>Subtotal</span><span>৳{subtotal}</span></div>
        <div className="flex justify-between">
          <span>Delivery ({deliveryArea === "inside" ? "Inside Dhaka" : "Outside Dhaka"})</span>
          <span className={deliveryCharge === 0 ? "text-green-600 font-semibold" : ""}>{deliveryCharge === 0 ? "Free" : `৳${deliveryCharge}`}</span>
        </div>
        <div className="flex justify-between font-bold text-lg border-t pt-2"><span>Total</span><span>৳{total}</span></div>
      </div>
    </div>
  );

  // ===== CHECKOUT 1: Single Page Clean =====
  if (checkoutType === "1") {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 mb-6 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <h1 className="text-2xl font-bold mb-6">Checkout</h1>
          {orderSummary}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {formFields}
            <Button type="submit" disabled={submitting} className="w-full py-6 text-lg font-bold bg-blue-600 hover:bg-blue-700 rounded-xl">
              {submitting ? "Processing..." : `Confirm Order — ৳${total}`}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // ===== CHECKOUT 2: Multi-Step Wizard =====
  if (checkoutType === "2") {
    const steps = ["Your Info", "Delivery", "Confirm"];
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <div className="max-w-xl mx-auto px-4 py-8">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 mb-6"><ArrowLeft className="h-4 w-4" /> Back</button>
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-10">
            {steps.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step > i + 1 ? "bg-amber-500 text-gray-950" : step === i + 1 ? "bg-amber-500 text-gray-950" : "bg-gray-800 text-gray-500"}`}>
                  {step > i + 1 ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span className={`text-xs hidden sm:block ${step === i + 1 ? "text-white" : "text-gray-600"}`}>{s}</span>
                {i < 2 && <div className={`w-8 h-0.5 ${step > i + 1 ? "bg-amber-500" : "bg-gray-800"}`} />}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-gray-300">Your Name</Label>
                  <Input className="bg-gray-900 border-gray-800 text-white" value={form.name} onChange={e => updateForm({ name: e.target.value })} required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-gray-300">Phone Number</Label>
                  <Input className="bg-gray-900 border-gray-800 text-white" value={form.phone} onChange={e => updateForm({ phone: e.target.value })} required />
                </div>
                <Button type="button" onClick={() => { if (form.name && form.phone) setStep(2); else toast.error("Please enter name and phone"); }} className="w-full bg-amber-500 text-gray-950 font-bold hover:bg-amber-400 py-5">
                  Next →
                </Button>
              </div>
            )}
            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-gray-300">Delivery Address</Label>
                  <Textarea className="bg-gray-900 border-gray-800 text-white" value={form.address} onChange={e => updateForm({ address: e.target.value })} required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-gray-300">Note</Label>
                  <Input className="bg-gray-900 border-gray-800 text-white" value={form.notes} onChange={e => updateForm({ notes: e.target.value })} />
                </div>
                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1 border-gray-700 text-gray-300">← Back</Button>
                  <Button type="button" onClick={() => { if (form.address) setStep(3); else toast.error("Please enter address"); }} className="flex-1 bg-amber-500 text-gray-950 font-bold hover:bg-amber-400">Next →</Button>
                </div>
              </div>
            )}
            {step === 3 && (
              <div className="space-y-6">
                <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 space-y-3">
                  <p><span className="text-gray-500">Name:</span> {form.name}</p>
                  <p><span className="text-gray-500">Phone:</span> {form.phone}</p>
                  <p><span className="text-gray-500">Address:</span> {form.address}</p>
                </div>
                <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gray-800 rounded-lg overflow-hidden">
                      {item.image ? <OptimizedImage src={item.image} alt={item.name} width={56} quality={75} className="w-full h-full object-cover" /> : null}
                    </div>
                    <div className="flex-1"><p className="font-bold">{item.name}</p><p className="text-sm text-gray-500">৳{item.price} × {item.qty}</p></div>
                    <span className="font-bold text-amber-400">৳{total}</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setStep(2)} className="flex-1 border-gray-700 text-gray-300">← Back</Button>
                  <Button type="submit" disabled={submitting} className="flex-1 bg-amber-500 text-gray-950 font-bold hover:bg-amber-400 py-5">
                    {submitting ? "..." : "Confirm Order"}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    );
  }

  // ===== CHECKOUT 3: Side by Side =====
  if (checkoutType === "3") {
    return (
      <div className="min-h-screen bg-stone-50" style={{ fontFamily: "'Georgia', serif" }}>
        <div className="max-w-5xl mx-auto px-4 py-10">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-stone-400 mb-8"><ArrowLeft className="h-4 w-4" /> Back</button>
          <div className="grid md:grid-cols-2 gap-10">
            <div>
              <h1 className="text-2xl font-normal mb-8 tracking-wide">Checkout</h1>
              <form onSubmit={handleSubmit} className="space-y-5">
                {formFields}
                <Button type="submit" disabled={submitting} className="w-full py-5 bg-stone-900 text-white hover:bg-stone-800 font-normal tracking-wider">
                  {submitting ? "Processing..." : "Place Order"}
                </Button>
              </form>
            </div>
            <div className="md:pl-10 md:border-l border-stone-200">
              {orderSummary}
              <div className="mt-6 text-xs text-stone-400 space-y-2">
              <p>✓ Cash on delivery</p>
                <p>✓ Delivery in 3-5 days</p>
                <p>✓ Easy return policy</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===== CHECKOUT 4: Colorful Card =====
  if (checkoutType === "4") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-violet-50">
        <div className="max-w-lg mx-auto px-4 py-8">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-400 mb-6"><ArrowLeft className="h-4 w-4" /> Back</button>
          <div className="bg-white rounded-3xl shadow-xl border border-rose-100 overflow-hidden">
            <div className="bg-gradient-to-r from-rose-500 to-violet-500 p-6 text-white">
              <h1 className="text-xl font-bold">🛍️ Checkout</h1>
              <div className="flex items-center gap-3 mt-3">
                <div className="w-12 h-12 bg-white/20 rounded-lg overflow-hidden">
                  {item.image ? <OptimizedImage src={item.image} alt={item.name} width={48} quality={75} className="w-full h-full object-cover" /> : null}
                </div>
                <div>
                  <p className="font-semibold truncate max-w-[200px]">{item.name}</p>
                  <p className="text-sm text-white/80">৳{item.price} × {item.qty} = ৳{total}</p>
                </div>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formFields}
              <Button type="submit" disabled={submitting} className="w-full py-6 text-lg font-bold bg-gradient-to-r from-rose-500 to-violet-500 text-white rounded-xl shadow-lg shadow-rose-200">
                {submitting ? "Processing..." : `✨ Place Order — ৳${total}`}
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ===== CHECKOUT 5: Bold Brutalist =====
  return (
    <div className="min-h-screen bg-zinc-100">
      <div className="bg-zinc-900 text-white py-4">
        <div className="max-w-3xl mx-auto px-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="text-sm text-zinc-400 hover:text-white"><ArrowLeft className="h-5 w-5 inline mr-2" />BACK</button>
          <span className="font-black tracking-tighter text-xl">CHECKOUT</span>
          <span className="text-lime-400 font-black">৳{total}</span>
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white p-1 mb-6">
          <div className="flex items-center gap-4 p-4 border-2 border-zinc-900">
            <div className="w-20 h-20 bg-zinc-100 flex-shrink-0">
              {item.image ? <OptimizedImage src={item.image} alt={item.name} width={80} quality={75} className="w-full h-full object-cover" /> : <ShoppingBag className="h-6 w-6 m-auto mt-7 text-zinc-300" />}
            </div>
            <div className="flex-1">
              <p className="font-black uppercase truncate">{item.name}</p>
              <p className="text-sm text-zinc-500">QTY: {item.qty}</p>
            </div>
            <span className="text-2xl font-black">৳{total}</span>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="bg-white p-6 border-2 border-zinc-900 space-y-4">
          <h2 className="font-black uppercase tracking-widest text-sm border-b-2 border-zinc-900 pb-2 mb-4">YOUR INFO</h2>
          {formFields}
          <Button type="submit" disabled={submitting} className="w-full py-6 text-lg font-black uppercase tracking-widest bg-zinc-900 text-white hover:bg-zinc-800 rounded-none">
            {submitting ? "PROCESSING..." : `CONFIRM ORDER → ৳${total}`}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default CheckoutPage;