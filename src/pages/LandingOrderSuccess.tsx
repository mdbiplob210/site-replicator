import { useEffect, useMemo } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { CheckCircle2, ArrowLeft, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLandingPageBySlug } from "@/hooks/useLandingPages";
import { useSiteSettings } from "@/hooks/useSiteSettings";

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

function getSafeNumber(value: string | number | null | undefined, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getSafePositiveInteger(value: string | number | null | undefined, fallback = 1) {
  const parsed = Math.floor(getSafeNumber(value, fallback));
  return parsed > 0 ? parsed : fallback;
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
  const { data: settings } = useSiteSettings();

  const orderNumber = searchParams.get("order") || "";
  const orderId = searchParams.get("oid") || "";
  const rawEventId = searchParams.get("eid") || "";
  const eventId = rawEventId || `eid_auto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const productName = searchParams.get("product") || page?.title || "";
  const productCode = searchParams.get("code") || "";
  const quantity = Math.max(1, Number(searchParams.get("qty") || 1));
  const value = Number(searchParams.get("value") || 0);
  const duplicate = searchParams.get("duplicate") === "1";
  const message = searchParams.get("msg") || (orderNumber
    ? `আপনার অর্ডার সফলভাবে জমা হয়েছে। অর্ডার নম্বর #${orderNumber}`
    : "আপনার অর্ডার সফলভাবে জমা হয়েছে।");

  const persistedState = useMemo(() => {
    // Try with raw eventId first, then without
    try {
      if (rawEventId) {
        const raw = sessionStorage.getItem(`_lp_purchase_success:${rawEventId}`);
        if (raw) return JSON.parse(raw);
      }
      // Fallback: try to find any recent persisted state
      return null;
    } catch {
      return null;
    }
  }, [rawEventId]);

  const effectiveOrderNumber = orderNumber || persistedState?.order_number || "";
  const effectiveOrderId = orderId || persistedState?.order_id || "";
  const effectiveProductName = productName || persistedState?.product_name || page?.title || "";
  const effectiveProductCode = productCode || persistedState?.product_code || "";
  const effectiveQuantity = getSafePositiveInteger(searchParams.get("qty"), getSafePositiveInteger(persistedState?.quantity, 1));
  const effectiveValue = getSafeNumber(
    searchParams.get("value"),
    getSafeNumber(persistedState?.total_value, getSafeNumber(persistedState?.unit_price, 0) * effectiveQuantity),
  );
  const effectivePixelId = page?.fb_pixel_id || settings?.fb_pixel_id || "";

  useEffect(() => {
    document.title = effectiveOrderNumber ? `অর্ডার সফল #${effectiveOrderNumber}` : "অর্ডার সফল";
  }, [effectiveOrderNumber]);

  // Fire Purchase event — this is the SINGLE source of truth for Purchase tracking
  useEffect(() => {
    if (!slug || duplicate) return;

    const fireKey = `_lp_purchase_fired:${eventId}`;
    try {
      if (sessionStorage.getItem(fireKey) === "1") return;
    } catch {
      // ignore storage access issues
    }

    const payload = {
      value: effectiveValue,
      currency: "BDT",
      content_name: effectiveProductName,
      content_ids: effectiveProductCode ? [effectiveProductCode] : [],
      content_type: "product",
      num_items: effectiveQuantity,
      order_id: effectiveOrderNumber,
      subtotal: effectiveValue,
    };

    const userData = persistedState || {};
    let cancelled = false;

    const sendPurchase = async () => {
      let browserSent = false;
      let serverSent = false;

      if (effectivePixelId) {
        try {
          await ensureFacebookPixel(effectivePixelId);
          const fbq = (window as any).fbq;
          if (typeof fbq === "function") {
            fbq("track", "Purchase", payload, { eventID: eventId });
            browserSent = true;
            console.log("[Purchase] Landing browser fbq fired", { eventId, pixelId: effectivePixelId, value: effectiveValue });
          } else {
            console.error("[Purchase] Landing fbq unavailable after ensureFacebookPixel", { eventId, pixelId: effectivePixelId });
          }
        } catch (err) {
          console.error("[Purchase] Landing fbq error:", err);
        }
      } else {
        console.warn("[Purchase] Landing browser fbq skipped: no pixel configured, using server fallback", { slug, eventId });
      }

      try {
        console.log("[Purchase] Landing CAPI sending", { eventId, pixelId: effectivePixelId, value: effectiveValue, slug });

        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fb-conversions-api`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            pixel_id: effectivePixelId,
            event_name: "Purchase",
            event_id: eventId,
            event_url: window.location.href,
            user_agent: navigator.userAgent,
            fbp: getCookie("_fbp"),
            fbc: getFbc(),
            landing_page_slug: slug,
            user_external_id: effectiveOrderId || effectiveOrderNumber,
            user_phone: userData.customer_phone || "",
            user_fn: userData.customer_name ? String(userData.customer_name).split(/\s+/)[0] : "",
            user_ln: userData.customer_name ? String(userData.customer_name).split(/\s+/).slice(1).join(" ") : "",
            custom_data: payload,
          }),
          keepalive: true,
        });

        const result = await response.json().catch(() => null);
        if (!response.ok && !result?.skipped) {
          console.error("[Purchase] Landing CAPI failed", { status: response.status, result, eventId, slug });
        } else {
          serverSent = Boolean(result?.success || result?.skipped);
          console.log("[Purchase] Landing CAPI response:", result);
        }
      } catch (err) {
        console.error("[Purchase] Landing CAPI error:", err);
      }

      if (!cancelled && (browserSent || serverSent)) {
        try {
          sessionStorage.setItem(fireKey, "1");
        } catch {
          // ignore storage access issues
        }
      }
    };

    void sendPurchase();

    return () => {
      cancelled = true;
    };
  }, [duplicate, effectiveOrderId, effectiveOrderNumber, effectivePixelId, effectiveProductCode, effectiveProductName, effectiveQuantity, effectiveValue, eventId, persistedState, slug]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-2xl items-center justify-center px-4 py-12">
        <section className="w-full rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CheckCircle2 className="h-10 w-10" />
          </div>

          <h1 className="text-3xl font-bold tracking-tight">অর্ডার সফল হয়েছে</h1>
          <p className="mt-3 text-muted-foreground">{message}</p>

          {effectiveOrderNumber && (
            <div className="mt-6 rounded-2xl border border-border bg-background p-5">
              <p className="text-sm text-muted-foreground">অর্ডার নম্বর</p>
              <p className="mt-1 text-2xl font-black text-primary">#{effectiveOrderNumber}</p>
            </div>
          )}

          <div className="mt-6 space-y-3 rounded-2xl border border-border bg-muted/40 p-4 text-left">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Package className="h-4 w-4 text-primary" />
              <span>আপনার অর্ডারটি কনফার্ম করতে শীঘ্রই কল করা হবে।</span>
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