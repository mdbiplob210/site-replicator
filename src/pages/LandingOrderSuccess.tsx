import { useEffect, useMemo } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { CheckCircle2, ArrowLeft, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLandingPageBySlug } from "@/hooks/useLandingPages";

function getCookie(name: string) {
  const match = document.cookie.match(new RegExp(`(^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[2]) : "";
}

function getFbc() {
  const existing = getCookie("_fbc");
  if (existing) return existing;

  const fbclid = new URLSearchParams(window.location.search).get("fbclid");
  return fbclid ? `fb.1.${Date.now()}.${fbclid}` : "";
}

function ensureFacebookPixel(pixelId: string) {
  return new Promise<void>((resolve) => {
    const win = window as any;

    if (typeof win.fbq === "function") {
      win.fbq("init", pixelId);
      resolve();
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>('script[data-lp-fb-pixel="true"]');
    if (existing) {
      existing.addEventListener("load", () => {
        if (typeof (window as any).fbq === "function") (window as any).fbq("init", pixelId);
        resolve();
      }, { once: true });
      return;
    }

    ((f: any, b: Document, e: string, v: string, n?: any, t?: HTMLScriptElement, s?: Element | null) => {
      if (f.fbq) return;
      n = f.fbq = function (...args: any[]) {
        if ((n as any).callMethod) {
          (n as any).callMethod.apply(n, args);
        } else {
          (n as any).queue.push(args);
        }
      };
      if (!f._fbq) f._fbq = n;
      (n as any).push = n;
      (n as any).loaded = true;
      (n as any).version = "2.0";
      (n as any).queue = [];
      t = b.createElement(e) as HTMLScriptElement;
      t.async = true;
      t.src = v;
      t.dataset.lpFbPixel = "true";
      t.onload = () => {
        if (typeof (window as any).fbq === "function") (window as any).fbq("init", pixelId);
        resolve();
      };
      s = b.getElementsByTagName(e)[0];
      s?.parentNode?.insertBefore(t, s);
    })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
  });
}

export default function LandingOrderSuccess() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const { data: page } = useLandingPageBySlug(slug || "");

  const orderNumber = searchParams.get("order") || "";
  const orderId = searchParams.get("oid") || "";
  const eventId = searchParams.get("eid") || "";
  const productName = searchParams.get("product") || page?.title || "";
  const productCode = searchParams.get("code") || "";
  const quantity = Math.max(1, Number(searchParams.get("qty") || 1));
  const value = Number(searchParams.get("value") || 0);
  const duplicate = searchParams.get("duplicate") === "1";
  const message = searchParams.get("msg") || (orderNumber
    ? `আপনার অর্ডার সফলভাবে জমা হয়েছে। অর্ডার নম্বর #${orderNumber}`
    : "আপনার অর্ডার সফলভাবে জমা হয়েছে।");

  const persistedState = useMemo(() => {
    if (!eventId) return null;
    try {
      const raw = sessionStorage.getItem(`_lp_purchase_success:${eventId}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, [eventId]);

  useEffect(() => {
    document.title = orderNumber ? `অর্ডার সফল #${orderNumber}` : "অর্ডার সফল";
  }, [orderNumber]);

  useEffect(() => {
    if (!slug || !page?.fb_pixel_id || !eventId || duplicate) return;

    const fireKey = `_lp_purchase_fired:${eventId}`;
    try {
      if (sessionStorage.getItem(fireKey) === "1") return;
    } catch {
      // ignore storage access issues
    }

    const payload = {
      value,
      currency: "BDT",
      content_name: productName,
      content_ids: productCode ? [productCode] : [],
      content_type: "product",
      num_items: quantity,
      order_id: orderNumber,
      subtotal: value,
    };

    const userData = persistedState || {};

    ensureFacebookPixel(page.fb_pixel_id)
      .then(() => {
        const fbq = (window as any).fbq;
        if (typeof fbq === "function") {
          fbq("track", "Purchase", payload, { eventID: eventId });
          console.log("[Purchase] Landing browser fbq fired", { eventId, pixelId: page.fb_pixel_id, value });
        } else {
          console.warn("[Purchase] Landing fbq not available after ensureFacebookPixel");
        }
      })
      .catch((err) => console.error("[Purchase] Landing fbq error:", err));

    console.log("[Purchase] Landing CAPI sending", { eventId, pixelId: page.fb_pixel_id, value, slug });

    fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fb-conversions-api`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({
        pixel_id: page.fb_pixel_id,
        event_name: "Purchase",
        event_id: eventId,
        event_url: window.location.href,
        user_agent: navigator.userAgent,
        fbp: getCookie("_fbp"),
        fbc: getFbc(),
        landing_page_slug: slug,
        user_external_id: orderId || orderNumber,
        user_phone: userData.customer_phone || "",
        user_fn: userData.customer_name ? String(userData.customer_name).split(/\s+/)[0] : "",
        user_ln: userData.customer_name ? String(userData.customer_name).split(/\s+/).slice(1).join(" ") : "",
        custom_data: payload,
      }),
      keepalive: true,
    })
      .then(r => r.json())
      .then(result => console.log("[Purchase] Landing CAPI response:", result))
      .catch((err) => console.error("[Purchase] Landing CAPI error:", err));

    try {
      sessionStorage.setItem(fireKey, "1");
    } catch {
      // ignore storage access issues
    }
  }, [duplicate, eventId, orderId, orderNumber, page?.fb_pixel_id, persistedState, productCode, productName, quantity, slug, value]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-2xl items-center justify-center px-4 py-12">
        <section className="w-full rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CheckCircle2 className="h-10 w-10" />
          </div>

          <h1 className="text-3xl font-bold tracking-tight">অর্ডার সফল হয়েছে</h1>
          <p className="mt-3 text-muted-foreground">{message}</p>

          {orderNumber && (
            <div className="mt-6 rounded-2xl border border-border bg-background p-5">
              <p className="text-sm text-muted-foreground">অর্ডার নম্বর</p>
              <p className="mt-1 text-2xl font-black text-primary">#{orderNumber}</p>
            </div>
          )}

          <div className="mt-6 space-y-3 rounded-2xl border border-border bg-muted/40 p-4 text-left">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Package className="h-4 w-4 text-primary" />
              <span>আপনার পারচেজ ট্র্যাকিং এখন success page থেকে fire হচ্ছে।</span>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link to={slug ? `/lp/${slug}` : "/"}>
              <Button className="w-full gap-2 sm:w-auto">
                <ArrowLeft className="h-4 w-4" />
                আবার পেজে যান
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}