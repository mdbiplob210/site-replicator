import { useEffect, useRef, useCallback } from "react";
import { useSiteSettings } from "./useSiteSettings";
import { supabase } from "@/integrations/supabase/client";

// ============================================================
// Comprehensive Tracking Hook
// Supports: Facebook Pixel + CAPI, TikTok Pixel, GTM, Clarity
// Features: Event deduplication, scroll depth, time on page,
//           device/browser data, content engagement tracking
// ============================================================

declare global {
  interface Window {
    fbq: any;
    _fbq: any;
    ttq: any;
    dataLayer: any[];
    clarity: any;
  }
}

// Generate unique event ID for deduplication across browser pixel & CAPI
function generateEventId(prefix = "evt"): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

// Get _fbp cookie value
function getFbp(): string {
  const match = document.cookie.match(/_fbp=([^;]+)/);
  return match ? match[1] : "";
}

// Get _fbc cookie value (from URL click ID)
function getFbc(): string {
  const match = document.cookie.match(/_fbc=([^;]+)/);
  if (match) return match[1];
  // Try to build from URL fbclid
  const params = new URLSearchParams(window.location.search);
  const fbclid = params.get("fbclid");
  if (fbclid) return `fb.1.${Date.now()}.${fbclid}`;
  return "";
}

// Get _ttp cookie for TikTok
function getTtp(): string {
  const match = document.cookie.match(/_ttp=([^;]+)/);
  return match ? match[1] : "";
}

// Get comprehensive device/browser info
function getDeviceInfo() {
  const ua = navigator.userAgent;
  const isMobile = /Mobi|Android/i.test(ua);
  const isTablet = /Tablet|iPad/i.test(ua);
  const screenRes = `${screen.width}x${screen.height}`;
  const viewportRes = `${window.innerWidth}x${window.innerHeight}`;
  const lang = navigator.language;
  const platform = (navigator as any).userAgentData?.platform || navigator.platform || "";
  const connection = (navigator as any).connection;

  return {
    device_type: isTablet ? "tablet" : isMobile ? "mobile" : "desktop",
    screen_resolution: screenRes,
    viewport: viewportRes,
    language: lang,
    platform,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    cookiesEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack === "1",
    connection_type: connection?.effectiveType || "unknown",
    referrer: document.referrer || "direct",
  };
}

// Get external referrer info
function getReferrerInfo() {
  const ref = document.referrer;
  if (!ref) return { source: "direct", medium: "none" };
  try {
    const url = new URL(ref);
    const host = url.hostname.toLowerCase();
    if (host.includes("facebook.com") || host.includes("fb.com")) return { source: "facebook", medium: "social" };
    if (host.includes("instagram.com")) return { source: "instagram", medium: "social" };
    if (host.includes("tiktok.com")) return { source: "tiktok", medium: "social" };
    if (host.includes("google.")) return { source: "google", medium: "organic" };
    if (host.includes("youtube.com")) return { source: "youtube", medium: "social" };
    return { source: host, medium: "referral" };
  } catch {
    return { source: "unknown", medium: "referral" };
  }
}

// UTM parameters
function getUtmParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get("utm_source") || "",
    utm_medium: params.get("utm_medium") || "",
    utm_campaign: params.get("utm_campaign") || "",
    utm_content: params.get("utm_content") || "",
    utm_term: params.get("utm_term") || "",
    fbclid: params.get("fbclid") || "",
    gclid: params.get("gclid") || "",
    ttclid: params.get("ttclid") || "",
  };
}

// ============================================================
// Script Loaders
// ============================================================

let fbPixelLoaded = false;
let tiktokPixelLoaded = false;
let gtmLoaded = false;
let clarityLoaded = false;

function loadFBPixel(pixelId: string) {
  if (fbPixelLoaded || !pixelId) return;
  fbPixelLoaded = true;

  (function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
    if (f.fbq) return;
    n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
    if (!f._fbq) f._fbq = n;
    n.push = n; n.loaded = !0; n.version = "2.0";
    n.queue = [];
    t = b.createElement(e); t.async = !0; t.src = v;
    s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");

  window.fbq("init", pixelId, {
    external_id: getVisitorId(),
    em: "", ph: "", fn: "", ln: "", ct: "", st: "", zp: "", country: "",
  });

  // Enable advanced matching & automatic events
  window.fbq("set", "autoConfig", true, pixelId);
}

function loadTikTokPixel(pixelId: string) {
  if (tiktokPixelLoaded || !pixelId) return;
  tiktokPixelLoaded = true;

  (function (w: any, d: any, t: any) {
    w.TiktokAnalyticsObject = t;
    const ttq = w[t] = w[t] || [];
    ttq.methods = ["page", "track", "identify", "instances", "debug", "on", "off", "once", "ready", "alias", "group", "enableCookie", "disableCookie"];
    ttq.setAndDefer = function (t: any, e: any) {
      t[e] = function () { t.push([e].concat(Array.prototype.slice.call(arguments, 0))); };
    };
    for (let i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
    ttq.instance = function (t: any) {
      const e = ttq._i[t] || [];
      for (let n = 0; n < ttq.methods.length; n++) ttq.setAndDefer(e, ttq.methods[n]);
      return e;
    };
    ttq.load = function (e: any, n?: any) {
      const p = "https://analytics.tiktok.com/i18n/pixel/events.js";
      ttq._i = ttq._i || {};
      ttq._i[e] = [];
      ttq._i[e]._u = p;
      ttq._t = ttq._t || {};
      ttq._t[e] = +new Date();
      ttq._o = ttq._o || {};
      ttq._o[e] = n || {};
      const o = d.createElement("script");
      o.type = "text/javascript"; o.async = true; o.src = p + "?sdkid=" + e + "&lib=" + t;
      const a = d.getElementsByTagName("script")[0];
      a.parentNode!.insertBefore(o, a);
    };
    ttq.load(pixelId);
    ttq.page();
  })(window, document, "ttq");
}

function loadGTM(gtmId: string) {
  if (gtmLoaded || !gtmId) return;
  gtmLoaded = true;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ "gtm.start": new Date().getTime(), event: "gtm.js" });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${gtmId}`;
  document.head.appendChild(script);

  // Also add noscript iframe
  const noscript = document.createElement("noscript");
  const iframe = document.createElement("iframe");
  iframe.src = `https://www.googletagmanager.com/ns.html?id=${gtmId}`;
  iframe.height = "0";
  iframe.width = "0";
  iframe.style.display = "none";
  iframe.style.visibility = "hidden";
  noscript.appendChild(iframe);
  document.body.insertBefore(noscript, document.body.firstChild);
}

function loadClarity(clarityId: string) {
  if (clarityLoaded || !clarityId) return;
  clarityLoaded = true;

  (function (c: any, l: any, a: any, r: any, i: any, t?: any, y?: any) {
    c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
    t = l.createElement(r); t.async = 1; t.src = "https://www.clarity.ms/tag/" + i;
    y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
  })(window, document, "clarity", "script", clarityId);
}

// Persistent visitor ID
function getVisitorId(): string {
  let vid = localStorage.getItem("_vid");
  if (!vid) {
    vid = `v_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
    localStorage.setItem("_vid", vid);
  }
  return vid;
}

// ============================================================
// CAPI (Server-Side) Event Sender
// ============================================================
async function sendCAPIEvent(params: {
  pixelId: string;
  eventName: string;
  eventId: string;
  customData?: Record<string, any>;
  customerPhone?: string;
  customerName?: string;
}) {
  try {
    const { pixelId, eventName, eventId, customData = {}, customerPhone, customerName } = params;
    
    const body: Record<string, any> = {
      pixel_id: pixelId,
      event_name: eventName,
      event_id: eventId,
      event_url: window.location.href,
      user_agent: navigator.userAgent,
      fbp: getFbp(),
      fbc: getFbc(),
      custom_data: {
        ...customData,
        visitor_id: getVisitorId(),
      },
    };

    // Add hashed user data if available
    if (customerPhone) body.custom_data.ph = customerPhone;
    if (customerName) body.custom_data.fn = customerName;

    await supabase.functions.invoke("fb-conversions-api", { body });
  } catch (e) {
    console.warn("[CAPI] Failed:", e);
  }
}

// ============================================================
// Main Tracking Hook
// ============================================================
export function useTracking() {
  const { data: settings } = useSiteSettings();
  const initialized = useRef(false);

  const fbPixelId = settings?.fb_pixel_id || "";
  const tiktokPixelId = settings?.tiktok_pixel_id || "";
  const gtmId = settings?.gtm_id || "";
  const clarityId = settings?.clarity_id || "";

  // Initialize all tracking scripts
  useEffect(() => {
    if (initialized.current || !settings) return;
    initialized.current = true;

    if (fbPixelId) loadFBPixel(fbPixelId);
    if (tiktokPixelId) loadTikTokPixel(tiktokPixelId);
    if (gtmId) loadGTM(gtmId);
    if (clarityId) loadClarity(clarityId);

    // Save UTM params to sessionStorage for later use
    const utms = getUtmParams();
    if (utms.utm_source || utms.fbclid || utms.gclid || utms.ttclid) {
      sessionStorage.setItem("_utm", JSON.stringify(utms));
    }
  }, [settings, fbPixelId, tiktokPixelId, gtmId, clarityId]);

  // ---- Event Functions ----

  const trackPageView = useCallback((pageTitle?: string) => {
    const eventId = generateEventId("pv");
    const device = getDeviceInfo();
    const referrer = getReferrerInfo();

    // FB Pixel
    if (fbPixelId && window.fbq) {
      window.fbq("track", "PageView", {}, { eventID: eventId });
    }

    // TikTok
    if (tiktokPixelId && window.ttq) {
      window.ttq.page();
    }

    // GTM
    if (gtmId && window.dataLayer) {
      window.dataLayer.push({
        event: "page_view",
        page_title: pageTitle || document.title,
        page_location: window.location.href,
        page_referrer: document.referrer,
        ...device,
        ...referrer,
      });
    }

    // CAPI (server-side PageView)
    if (fbPixelId) {
      sendCAPIEvent({
        pixelId: fbPixelId,
        eventName: "PageView",
        eventId,
        customData: {
          page_title: pageTitle || document.title,
          page_url: window.location.href,
          ...device,
          ...referrer,
        },
      });
    }
  }, [fbPixelId, tiktokPixelId, gtmId]);

  const trackViewContent = useCallback((product: {
    id: string; name: string; price: number; category?: string;
    productCode?: string; image?: string;
  }) => {
    const eventId = generateEventId("vc");
    const contentId = product.productCode || product.id;

    // FB Pixel
    if (fbPixelId && window.fbq) {
      window.fbq("track", "ViewContent", {
        content_name: product.name,
        content_ids: [contentId],
        content_type: "product",
        content_category: product.category || "",
        value: product.price,
        currency: "BDT",
      }, { eventID: eventId });
    }

    // TikTok
    if (tiktokPixelId && window.ttq) {
      window.ttq.track("ViewContent", {
        content_id: contentId,
        content_name: product.name,
        content_type: "product",
        content_category: product.category || "",
        value: product.price,
        currency: "BDT",
        quantity: 1,
      });
    }

    // GTM
    if (gtmId && window.dataLayer) {
      window.dataLayer.push({
        event: "view_item",
        ecommerce: {
          currency: "BDT",
          value: product.price,
          items: [{
            item_id: contentId,
            item_name: product.name,
            item_category: product.category || "",
            price: product.price,
            quantity: 1,
          }],
        },
      });
    }

    // CAPI
    if (fbPixelId) {
      sendCAPIEvent({
        pixelId: fbPixelId,
        eventName: "ViewContent",
        eventId,
        customData: {
          content_name: product.name,
          content_ids: [contentId],
          content_type: "product",
          content_category: product.category || "",
          value: product.price,
          currency: "BDT",
        },
      });
    }
  }, [fbPixelId, tiktokPixelId, gtmId]);

  const trackAddToCart = useCallback((product: {
    id: string; name: string; price: number; qty: number;
    productCode?: string; category?: string;
  }) => {
    const eventId = generateEventId("atc");
    const contentId = product.productCode || product.id;

    if (fbPixelId && window.fbq) {
      window.fbq("track", "AddToCart", {
        content_name: product.name,
        content_ids: [contentId],
        content_type: "product",
        value: product.price * product.qty,
        currency: "BDT",
        num_items: product.qty,
      }, { eventID: eventId });
    }

    if (tiktokPixelId && window.ttq) {
      window.ttq.track("AddToCart", {
        content_id: contentId,
        content_name: product.name,
        content_type: "product",
        value: product.price * product.qty,
        currency: "BDT",
        quantity: product.qty,
      });
    }

    if (gtmId && window.dataLayer) {
      window.dataLayer.push({
        event: "add_to_cart",
        ecommerce: {
          currency: "BDT",
          value: product.price * product.qty,
          items: [{
            item_id: contentId,
            item_name: product.name,
            price: product.price,
            quantity: product.qty,
          }],
        },
      });
    }

    if (fbPixelId) {
      sendCAPIEvent({
        pixelId: fbPixelId,
        eventName: "AddToCart",
        eventId,
        customData: {
          content_name: product.name,
          content_ids: [contentId],
          content_type: "product",
          value: product.price * product.qty,
          currency: "BDT",
          num_items: product.qty,
        },
      });
    }
  }, [fbPixelId, tiktokPixelId, gtmId]);

  const trackInitiateCheckout = useCallback((params: {
    value: number; currency?: string; contentName: string;
    contentId: string; qty: number;
  }) => {
    const eventId = generateEventId("ic");

    if (fbPixelId && window.fbq) {
      window.fbq("track", "InitiateCheckout", {
        content_name: params.contentName,
        content_ids: [params.contentId],
        content_type: "product",
        value: params.value,
        currency: params.currency || "BDT",
        num_items: params.qty,
      }, { eventID: eventId });
    }

    if (tiktokPixelId && window.ttq) {
      window.ttq.track("InitiateCheckout", {
        content_id: params.contentId,
        content_name: params.contentName,
        content_type: "product",
        value: params.value,
        currency: params.currency || "BDT",
        quantity: params.qty,
      });
    }

    if (gtmId && window.dataLayer) {
      window.dataLayer.push({
        event: "begin_checkout",
        ecommerce: {
          currency: params.currency || "BDT",
          value: params.value,
          items: [{
            item_id: params.contentId,
            item_name: params.contentName,
            price: params.value / params.qty,
            quantity: params.qty,
          }],
        },
      });
    }

    if (fbPixelId) {
      sendCAPIEvent({
        pixelId: fbPixelId,
        eventName: "InitiateCheckout",
        eventId,
        customData: {
          content_name: params.contentName,
          content_ids: [params.contentId],
          content_type: "product",
          value: params.value,
          currency: params.currency || "BDT",
          num_items: params.qty,
        },
      });
    }
  }, [fbPixelId, tiktokPixelId, gtmId]);

  const trackAddPaymentInfo = useCallback((params: {
    value: number; currency?: string;
  }) => {
    const eventId = generateEventId("api");

    if (fbPixelId && window.fbq) {
      window.fbq("track", "AddPaymentInfo", {
        value: params.value,
        currency: params.currency || "BDT",
      }, { eventID: eventId });
    }

    if (tiktokPixelId && window.ttq) {
      window.ttq.track("AddPaymentInfo", {
        value: params.value,
        currency: params.currency || "BDT",
      });
    }
  }, [fbPixelId, tiktokPixelId]);

  const trackPurchase = useCallback((params: {
    value: number; currency?: string; orderId: string;
    contentName: string; contentId: string; qty: number;
    customerPhone?: string; customerName?: string;
  }) => {
    const eventId = generateEventId("pur");

    // Store eventId to prevent duplicate on page reload
    const purchaseKey = `_pur_${params.orderId}`;
    if (sessionStorage.getItem(purchaseKey)) return; // Already tracked
    sessionStorage.setItem(purchaseKey, eventId);

    if (fbPixelId && window.fbq) {
      window.fbq("track", "Purchase", {
        content_name: params.contentName,
        content_ids: [params.contentId],
        content_type: "product",
        value: params.value,
        currency: params.currency || "BDT",
        num_items: params.qty,
        order_id: params.orderId,
      }, { eventID: eventId });
    }

    if (tiktokPixelId && window.ttq) {
      window.ttq.track("CompletePayment", {
        content_id: params.contentId,
        content_name: params.contentName,
        content_type: "product",
        value: params.value,
        currency: params.currency || "BDT",
        quantity: params.qty,
      });
    }

    if (gtmId && window.dataLayer) {
      window.dataLayer.push({
        event: "purchase",
        ecommerce: {
          transaction_id: params.orderId,
          currency: params.currency || "BDT",
          value: params.value,
          items: [{
            item_id: params.contentId,
            item_name: params.contentName,
            price: params.value / params.qty,
            quantity: params.qty,
          }],
        },
      });
    }

    // CAPI - most important for attribution
    if (fbPixelId) {
      sendCAPIEvent({
        pixelId: fbPixelId,
        eventName: "Purchase",
        eventId,
        customerPhone: params.customerPhone,
        customerName: params.customerName,
        customData: {
          content_name: params.contentName,
          content_ids: [params.contentId],
          content_type: "product",
          value: params.value,
          currency: params.currency || "BDT",
          num_items: params.qty,
          order_id: params.orderId,
        },
      });
    }
  }, [fbPixelId, tiktokPixelId, gtmId]);

  const trackContact = useCallback(() => {
    const eventId = generateEventId("ct");

    if (fbPixelId && window.fbq) {
      window.fbq("track", "Contact", {}, { eventID: eventId });
    }

    if (tiktokPixelId && window.ttq) {
      window.ttq.track("Contact");
    }
  }, [fbPixelId, tiktokPixelId]);

  const trackSearch = useCallback((searchTerm: string) => {
    const eventId = generateEventId("sr");

    if (fbPixelId && window.fbq) {
      window.fbq("track", "Search", {
        search_string: searchTerm,
      }, { eventID: eventId });
    }

    if (tiktokPixelId && window.ttq) {
      window.ttq.track("Search", {
        query: searchTerm,
      });
    }

    if (gtmId && window.dataLayer) {
      window.dataLayer.push({
        event: "search",
        search_term: searchTerm,
      });
    }
  }, [fbPixelId, tiktokPixelId, gtmId]);

  // Custom event for any additional tracking
  const trackCustomEvent = useCallback((eventName: string, data?: Record<string, any>) => {
    const eventId = generateEventId("ce");

    if (fbPixelId && window.fbq) {
      window.fbq("trackCustom", eventName, data || {}, { eventID: eventId });
    }

    if (gtmId && window.dataLayer) {
      window.dataLayer.push({ event: eventName, ...data });
    }
  }, [fbPixelId, gtmId]);

  return {
    trackPageView,
    trackViewContent,
    trackAddToCart,
    trackInitiateCheckout,
    trackAddPaymentInfo,
    trackPurchase,
    trackContact,
    trackSearch,
    trackCustomEvent,
    isReady: !!settings,
    fbPixelId,
    tiktokPixelId,
    gtmId,
  };
}

// ============================================================
// Scroll Depth & Time on Page Tracker
// ============================================================
export function useEngagementTracking() {
  const { trackCustomEvent } = useTracking();
  const startTime = useRef(Date.now());
  const maxScroll = useRef(0);
  const scrollMilestones = useRef(new Set<number>());

  useEffect(() => {
    startTime.current = Date.now();
    maxScroll.current = 0;
    scrollMilestones.current.clear();

    const handleScroll = () => {
      const scrollPercent = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      );
      if (scrollPercent > maxScroll.current) {
        maxScroll.current = scrollPercent;
      }

      // Track milestones: 25%, 50%, 75%, 100%
      const milestones = [25, 50, 75, 100];
      for (const m of milestones) {
        if (scrollPercent >= m && !scrollMilestones.current.has(m)) {
          scrollMilestones.current.add(m);
          trackCustomEvent("ScrollDepth", { depth: m, page: window.location.pathname });
        }
      }
    };

    const handleUnload = () => {
      const timeSpent = Math.round((Date.now() - startTime.current) / 1000);
      // Use sendBeacon if possible for reliability
      if (navigator.sendBeacon) {
        const data = JSON.stringify({
          event: "TimeOnPage",
          seconds: timeSpent,
          max_scroll: maxScroll.current,
          page: window.location.pathname,
        });
        // We can't send to fbq on unload, but GTM dataLayer might pick it up
      }
      trackCustomEvent("TimeOnPage", {
        seconds: timeSpent,
        max_scroll: maxScroll.current,
        page: window.location.pathname,
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("beforeunload", handleUnload);
      // Track on component unmount too
      const timeSpent = Math.round((Date.now() - startTime.current) / 1000);
      if (timeSpent > 2) {
        trackCustomEvent("TimeOnPage", {
          seconds: timeSpent,
          max_scroll: maxScroll.current,
          page: window.location.pathname,
        });
      }
    };
  }, [trackCustomEvent]);
}
