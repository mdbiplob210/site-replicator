import { useEffect, useRef, useCallback } from "react";
import { useSiteSettings } from "./useSiteSettings";
import { supabase } from "@/integrations/supabase/client";
import { getSiteTrackedPageViewEventId } from "@/lib/sitePixelBootstrap";

// ============================================================
// Comprehensive Tracking Hook
// Supports: Facebook Pixel + CAPI, TikTok Pixel, GTM, Clarity
// Features: Event deduplication, advanced matching for highest EMQ,
//           scroll depth, time on page, device/browser data
// ============================================================

declare global {
  interface Window {
    __lovableTrackedPurchases?: Record<string, string>;
    __lovableVisitorId?: string;
    __siteFbSdkLoaded?: boolean;
    __siteCurrentPixelId?: string;
    __siteMetaPixelBootstrapped?: Record<string, boolean>;
    __siteMetaPixelTrackedUrls?: Record<string, string>;
    fbq?: any;
    _fbq?: any;
    ttq: any;
    dataLayer: any[];
    clarity: any;
  }
}

// ============================================================
// User Data Store for Advanced Matching (highest EMQ)
// ============================================================
interface FBUserData {
  ph?: string;  // phone (raw, will be normalized)
  fn?: string;  // first name
  ln?: string;  // last name
  ct?: string;  // city
  country?: string;
  external_id?: string;
}

const FB_USER_DATA_KEY = "_fb_ud";

function getStoredUserData(): FBUserData {
  try {
    const raw = sessionStorage.getItem(FB_USER_DATA_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

function storeUserData(data: FBUserData) {
  try {
    const existing = getStoredUserData();
    const merged = { ...existing, ...data };
    sessionStorage.setItem(FB_USER_DATA_KEY, JSON.stringify(merged));
  } catch {}
}

/** Normalize phone for Meta: remove spaces, dashes, leading +880 → 880 prefix */
function normalizePhoneForMeta(phone: string): string {
  if (!phone) return "";
  let cleaned = phone.replace(/[^0-9]/g, "");
  // BD phone: if starts with 0, prepend 880
  if (cleaned.startsWith("0")) cleaned = "880" + cleaned.slice(1);
  // If doesn't start with 880, prepend it
  if (!cleaned.startsWith("880") && cleaned.length === 10) cleaned = "880" + cleaned;
  return cleaned;
}

/**
 * Set user data for FB advanced matching. Call when form data is available.
 * This updates both sessionStorage and the FB pixel via fbq('init').
 */
export function setFBUserData(params: {
  phone?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  city?: string;
  orderId?: string;
}) {
  const data: FBUserData = { country: "bd" };

  if (params.phone) {
    data.ph = normalizePhoneForMeta(params.phone);
  }
  if (params.firstName) data.fn = params.firstName.trim().toLowerCase();
  if (params.lastName) data.ln = params.lastName.trim().toLowerCase();
  if (params.fullName && !params.firstName) {
    const parts = params.fullName.trim().split(/\s+/);
    data.fn = (parts[0] || "").toLowerCase();
    data.ln = (parts.slice(1).join(" ") || "").toLowerCase();
  }
  if (params.city) data.ct = params.city.trim().toLowerCase();
  if (params.orderId) data.external_id = params.orderId;

  storeUserData(data);

  // Re-init pixel with updated user data if loaded
  if (window.fbq && fbPixelIdGlobal) {
    const ud = getStoredUserData();
    window.fbq("init", fbPixelIdGlobal, buildFBInitParams(ud));
  }
}

function buildFBInitParams(ud: FBUserData) {
  return {
    external_id: ud.external_id || getVisitorId(),
    ph: ud.ph || "",
    fn: ud.fn || "",
    ln: ud.ln || "",
    ct: ud.ct || "",
    country: "bd",
    // em, st, zp left empty (not using email)
  };
}

// Global pixel ID reference for re-init
let fbPixelIdGlobal = "";

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

function isFbPixelReady(): boolean {
  return typeof window.fbq === "function" && typeof window.fbq.callMethod === "function";
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
  if (!pixelId) return;
  fbPixelIdGlobal = pixelId;

  const existingScript = document.querySelector(
    'script[data-site-meta-pixel-sdk="true"],script[src*="connect.facebook.net/en_US/fbevents.js"]'
  ) as HTMLScriptElement | null;
  const isShellBootstrapped =
    window.__siteCurrentPixelId === pixelId &&
    !!window.__siteMetaPixelBootstrapped?.[pixelId];

  if (isShellBootstrapped) {
    if (existingScript || window.__siteFbSdkLoaded || isFbPixelReady()) {
      fbPixelLoaded = true;
    }
    return;
  }

  if (typeof window.fbq === "function") {
    const ud = getStoredUserData();
    window.fbq("init", pixelId, buildFBInitParams(ud));

    try {
      window.fbq("set", "autoConfig", true, pixelId);
    } catch {}

    if (existingScript && (window.__siteFbSdkLoaded || isFbPixelReady())) {
      fbPixelLoaded = true;
      return;
    }
  }

  if (fbPixelLoaded || existingScript) return;
  fbPixelLoaded = true;

  (function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
    if (f.fbq) return;
    n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
    if (!f._fbq) f._fbq = n;
    n.push = n; n.loaded = !0; n.version = "2.0";
    n.queue = [];
    t = b.createElement(e); t.async = !1; t.defer = !1; t.src = v; t.dataset.siteMetaPixelSdk = "true";
    s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");

  // Init with stored user data for advanced matching
  const ud = getStoredUserData();
  window.fbq("init", pixelId, buildFBInitParams(ud));

  // Enable automatic configuration
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
  try {
    let vid = localStorage.getItem("_vid");
    if (!vid) {
      vid = `v_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
      localStorage.setItem("_vid", vid);
    }
    return vid;
  } catch {
    if (!window.__lovableVisitorId) {
      window.__lovableVisitorId = `v_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
    }
    return window.__lovableVisitorId;
  }
}

function markPurchaseTracked(orderId: string, eventId: string): boolean {
  const purchaseKey = `_pur_${orderId}`;

  try {
    if (sessionStorage.getItem(purchaseKey)) return false;
    sessionStorage.setItem(purchaseKey, eventId);
    return true;
  } catch {
    window.__lovableTrackedPurchases = window.__lovableTrackedPurchases || {};
    if (window.__lovableTrackedPurchases[orderId]) return false;
    window.__lovableTrackedPurchases[orderId] = eventId;
    return true;
  }
}

// ============================================================
// CAPI (Server-Side) Event Sender — always sends user data
// ============================================================
async function sendCAPIEvent(params: {
  pixelId: string;
  eventName: string;
  eventId: string;
  customData?: Record<string, any>;
  customerPhone?: string;
  customerName?: string;
  customerEmail?: string;
  customerCity?: string;
  orderId?: string;
}) {
  try {
    const { pixelId, eventName, eventId, customData = {}, customerPhone, customerName, customerEmail, customerCity, orderId } = params;
    if (!pixelId) return;

    // Get stored user data as fallback
    const storedUD = getStoredUserData();

    const body: Record<string, any> = {
      pixel_id: pixelId,
      event_name: eventName,
      event_id: eventId,
      event_url: window.location.href,
      user_agent: navigator.userAgent,
      fbp: getFbp(),
      fbc: getFbc(),
      user_external_id: orderId || storedUD.external_id || getVisitorId(),
      user_country: "bd",
      custom_data: {
        ...customData,
        visitor_id: getVisitorId(),
        content_category: customData.content_category || "ecommerce",
      },
    };

    // Phone: use provided or stored
    const phone = customerPhone || (storedUD.ph ? storedUD.ph : "");
    if (phone) body.user_phone = phone;

    // Name: use provided or stored
    if (customerName) {
      const nameParts = customerName.trim().split(/\s+/);
      body.user_fn = nameParts[0] || "";
      body.user_ln = nameParts.slice(1).join(" ") || "";
    } else {
      if (storedUD.fn) body.user_fn = storedUD.fn;
      if (storedUD.ln) body.user_ln = storedUD.ln;
    }

    if (customerEmail) body.user_email = customerEmail;

    // City — also send as state for BD (improves EMQ)
    const city = customerCity || storedUD.ct || "";
    if (city) {
      body.user_ct = city;
      body.user_st = city;
    }

    await supabase.functions.invoke("fb-conversions-api", { body });
  } catch {
    // Silent fail - CAPI is non-critical
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

  const ensureCommerceTrackersReady = useCallback(() => {
    if (fbPixelId && typeof window.fbq !== "function") {
      loadFBPixel(fbPixelId);
    }
    if (tiktokPixelId && !window.ttq?.track) {
      loadTikTokPixel(tiktokPixelId);
    }
    if (gtmId && !Array.isArray(window.dataLayer)) {
      loadGTM(gtmId);
    }
  }, [fbPixelId, tiktokPixelId, gtmId]);

  // Initialize tracking scripts — FB pixel loads IMMEDIATELY for reliable detection,
  // other scripts are deferred to avoid blocking the main thread.
  useEffect(() => {
    if (initialized.current || !settings) return;
    if (
      window.location.pathname.startsWith("/lp/") ||
      window.location.pathname.startsWith("/admin") ||
      window.location.pathname.startsWith("/login")
    ) return;
    initialized.current = true;

    // FB Pixel MUST load immediately — delayed loading causes missed PageView
    // and Pixel Helper detection failures on first visit
    if (fbPixelId) loadFBPixel(fbPixelId);

    // Non-critical trackers load after first paint
    setTimeout(() => {
      if (tiktokPixelId) loadTikTokPixel(tiktokPixelId);
      if (gtmId) loadGTM(gtmId);
      if (clarityId) loadClarity(clarityId);
    }, 1500);

    // Save UTM params
    const utms = getUtmParams();
    if (utms.utm_source || utms.fbclid || utms.gclid || utms.ttclid) {
      sessionStorage.setItem("_utm", JSON.stringify(utms));
    }
  }, [settings, fbPixelId, tiktokPixelId, gtmId, clarityId]);

  // ---- Event Functions ----

  const trackPageView = useCallback((pageTitle?: string) => {
    ensureCommerceTrackersReady();
    const browserEventId = fbPixelId ? getSiteTrackedPageViewEventId(fbPixelId, window.location.href) : "";
    const eventId = browserEventId || generateEventId("pv");
    const device = getDeviceInfo();
    const referrer = getReferrerInfo();
    const shouldSkipBrowserPixel = !!browserEventId;

    const firePageView = () => {
      const shellEventId = fbPixelId ? getSiteTrackedPageViewEventId(fbPixelId, window.location.href) : "";

      if (shouldSkipBrowserPixel || shellEventId) {
        return true;
      }

      if (isFbPixelReady()) {
        window.fbq("track", "PageView", {}, { eventID: eventId });
        return true;
      }
      return false;
    };

    if (!firePageView()) {
      // SDK not ready — retry until loaded (max ~6s)
      if (fbPixelId) loadFBPixel(fbPixelId);
      let attempts = 0;
      const retryTimer = setInterval(() => {
        attempts++;
        if (firePageView() || attempts >= 20) {
          clearInterval(retryTimer);
          if (attempts >= 20 && !shouldSkipBrowserPixel) {
            console.warn("[Tracking] PageView: fbq never became ready");
          }
        }
      }, 300);
    }

    if (tiktokPixelId && window.ttq) {
      window.ttq.page();
    }

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
  }, [ensureCommerceTrackersReady, fbPixelId, tiktokPixelId, gtmId]);

  const trackViewContent = useCallback((product: {
    id: string; name: string; price: number; category?: string;
    productCode?: string; image?: string;
  }) => {
    ensureCommerceTrackersReady();
    const eventId = generateEventId("vc");
    const contentId = product.productCode || product.id;

    const vcData = {
      content_name: product.name,
      content_ids: [contentId],
      contents: [{ id: contentId, quantity: 1, item_price: product.price }],
      content_type: "product",
      content_category: product.category || "",
      value: product.price,
      currency: "BDT",
    };

    const fireVC = () => {
      if (window.fbq && typeof window.fbq === "function") {
        window.fbq("track", "ViewContent", vcData, { eventID: eventId });
        return true;
      }
      return false;
    };

    if (!fireVC()) {
      if (fbPixelId) loadFBPixel(fbPixelId);
      let attempts = 0;
      const retryTimer = setInterval(() => {
        attempts++;
        if (fireVC() || attempts >= 20) clearInterval(retryTimer);
      }, 300);
    }

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

    if (fbPixelId) {
      sendCAPIEvent({
        pixelId: fbPixelId,
        eventName: "ViewContent",
        eventId,
        customData: {
          content_name: product.name,
          content_ids: [contentId],
          contents: [{ id: contentId, quantity: 1, item_price: product.price }],
          content_type: "product",
          content_category: product.category || "ecommerce",
          value: product.price,
          currency: "BDT",
        },
      });
    }
  }, [ensureCommerceTrackersReady, fbPixelId, tiktokPixelId, gtmId]);

  const trackAddToCart = useCallback((product: {
    id: string; name: string; price: number; qty: number;
    productCode?: string; category?: string;
  }) => {
    ensureCommerceTrackersReady();
    const eventId = generateEventId("atc");
    const contentId = product.productCode || product.id;

    const atcData = {
      content_name: product.name,
      content_ids: [contentId],
      content_type: "product",
      value: product.price * product.qty,
      currency: "BDT",
      num_items: product.qty,
    };

    const fireATC = () => {
      if (window.fbq && typeof window.fbq === "function") {
        window.fbq("track", "AddToCart", atcData, { eventID: eventId });
        return true;
      }
      return false;
    };

    if (!fireATC()) {
      if (fbPixelId) loadFBPixel(fbPixelId);
      let attempts = 0;
      const retryTimer = setInterval(() => {
        attempts++;
        if (fireATC() || attempts >= 20) clearInterval(retryTimer);
      }, 300);
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
  }, [ensureCommerceTrackersReady, fbPixelId, tiktokPixelId, gtmId]);

  const trackInitiateCheckout = useCallback((params: {
    value: number; currency?: string; contentName: string;
    contentId: string; qty: number;
    customerPhone?: string; customerName?: string;
  }) => {
    ensureCommerceTrackersReady();
    const eventId = generateEventId("ic");

    // Store user data if provided
    if (params.customerPhone || params.customerName) {
      setFBUserData({ phone: params.customerPhone, fullName: params.customerName });
    }

    const icData = {
      content_name: params.contentName,
      content_ids: [params.contentId],
      content_type: "product",
      value: params.value,
      currency: params.currency || "BDT",
      num_items: params.qty,
    };

    const fireIC = () => {
      if (window.fbq && typeof window.fbq === "function") {
        window.fbq("track", "InitiateCheckout", icData, { eventID: eventId });
        return true;
      }
      return false;
    };

    if (!fireIC()) {
      if (fbPixelId) loadFBPixel(fbPixelId);
      let attempts = 0;
      const retryTimer = setInterval(() => {
        attempts++;
        if (fireIC() || attempts >= 20) clearInterval(retryTimer);
      }, 300);
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
        customerPhone: params.customerPhone,
        customerName: params.customerName,
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
  }, [ensureCommerceTrackersReady, fbPixelId, tiktokPixelId, gtmId]);

  const trackAddPaymentInfo = useCallback((params: {
    value: number; currency?: string;
    customerPhone?: string; customerName?: string;
  }) => {
    ensureCommerceTrackersReady();
    const eventId = generateEventId("api");

    if (params.customerPhone || params.customerName) {
      setFBUserData({ phone: params.customerPhone, fullName: params.customerName });
    }

    const apiData = { value: params.value, currency: params.currency || "BDT" };
    const fireAPI = () => {
      if (window.fbq && typeof window.fbq === "function") {
        window.fbq("track", "AddPaymentInfo", apiData, { eventID: eventId });
        return true;
      }
      return false;
    };

    if (!fireAPI()) {
      if (fbPixelId) loadFBPixel(fbPixelId);
      let attempts = 0;
      const retryTimer = setInterval(() => {
        attempts++;
        if (fireAPI() || attempts >= 20) clearInterval(retryTimer);
      }, 300);
    }

    if (tiktokPixelId && window.ttq) {
      window.ttq.track("AddPaymentInfo", {
        value: params.value,
        currency: params.currency || "BDT",
      });
    }

    if (fbPixelId) {
      sendCAPIEvent({
        pixelId: fbPixelId,
        eventName: "AddPaymentInfo",
        eventId,
        customerPhone: params.customerPhone,
        customerName: params.customerName,
        customData: {
          value: params.value,
          currency: params.currency || "BDT",
        },
      });
    }
  }, [ensureCommerceTrackersReady, fbPixelId, tiktokPixelId]);

  const trackPurchase = useCallback((params: {
    value: number; currency?: string; orderId: string;
    contentName: string; contentId: string; qty: number;
    customerPhone?: string; customerName?: string; customerCity?: string;
  }) => {
    ensureCommerceTrackersReady();
    const eventId = generateEventId("pur");

    // Prevent duplicate purchase events even in restricted in-app browsers
    if (!markPurchaseTracked(params.orderId, eventId)) {
      console.log("[Purchase] Skipped duplicate for order:", params.orderId);
      return;
    }

    console.log("[Purchase] Firing event", { orderId: params.orderId, value: params.value, eventId });

    // Update user data with all available info
    setFBUserData({
      phone: params.customerPhone,
      fullName: params.customerName,
      city: params.customerCity,
      orderId: params.orderId,
    });

    const purchaseData = {
      content_name: params.contentName,
      content_ids: [params.contentId],
      contents: [{ id: params.contentId, quantity: params.qty, item_price: params.value / params.qty }],
      content_type: "product",
      content_category: "ecommerce",
      value: params.value,
      currency: params.currency || "BDT",
      num_items: params.qty,
      order_id: params.orderId,
    };

    const fireBrowserPurchase = () => {
      if (window.fbq && typeof window.fbq === "function") {
        window.fbq("track", "Purchase", purchaseData, { eventID: eventId });
        console.log("[Purchase] Browser fbq fired", { eventId, pixelId: fbPixelId });
        return true;
      }
      return false;
    };

    if (!fireBrowserPurchase()) {
      // SDK not ready yet — load it and retry
      if (fbPixelId) loadFBPixel(fbPixelId);
      let attempts = 0;
      const retryTimer = setInterval(() => {
        attempts++;
        if (fireBrowserPurchase() || attempts >= 30) {
          clearInterval(retryTimer);
          if (attempts >= 30) console.warn("[Purchase] Browser fbq never loaded");
        }
      }, 300);
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

    // CAPI - most important for attribution (always send even if browser fbq failed)
    if (fbPixelId) {
      console.log("[Purchase] Sending CAPI event", { eventId, pixelId: fbPixelId });
      sendCAPIEvent({
        pixelId: fbPixelId,
        eventName: "Purchase",
        eventId,
        customerPhone: params.customerPhone,
        customerName: params.customerName,
        customerCity: params.customerCity,
        orderId: params.orderId,
        customData: {
          content_name: params.contentName,
          content_ids: [params.contentId],
          contents: [{ id: params.contentId, quantity: params.qty, item_price: params.value / params.qty }],
          content_type: "product",
          content_category: "ecommerce",
          value: params.value,
          currency: params.currency || "BDT",
          num_items: params.qty,
          order_id: params.orderId,
          predicted_ltv: params.value,
          status: "completed",
        },
      });
    }
  }, [ensureCommerceTrackersReady, fbPixelId, tiktokPixelId, gtmId]);

  const trackContact = useCallback((data?: { method?: string; page?: string }) => {
    ensureCommerceTrackersReady();
    const eventId = generateEventId("ct");

    const fireCt = () => {
      if (window.fbq && typeof window.fbq === "function") {
        window.fbq("track", "Contact", data || {}, { eventID: eventId });
        return true;
      }
      return false;
    };

    if (!fireCt()) {
      if (fbPixelId) loadFBPixel(fbPixelId);
      let attempts = 0;
      const retryTimer = setInterval(() => {
        attempts++;
        if (fireCt() || attempts >= 20) clearInterval(retryTimer);
      }, 300);
    }

    if (tiktokPixelId && window.ttq) {
      window.ttq.track("Contact", data || {});
    }

    if (gtmId && window.dataLayer) {
      window.dataLayer.push({ event: "contact", ...data });
    }

    if (fbPixelId) {
      sendCAPIEvent({
        pixelId: fbPixelId,
        eventName: "Contact",
        eventId,
        customData: data || {},
      });
    }
  }, [fbPixelId, tiktokPixelId, gtmId]);

  const trackLead = useCallback((params?: {
    value?: number; currency?: string; contentName?: string;
    customerPhone?: string; customerName?: string;
  }) => {
    ensureCommerceTrackersReady();
    const eventId = generateEventId("ld");

    // Store user data immediately for advanced matching
    if (params?.customerPhone || params?.customerName) {
      setFBUserData({ phone: params?.customerPhone, fullName: params?.customerName });
    }

    const leadData = {
      value: params?.value || 0,
      currency: params?.currency || "BDT",
      content_name: params?.contentName || "",
    };
    const fireLead = () => {
      if (window.fbq && typeof window.fbq === "function") {
        window.fbq("track", "Lead", leadData, { eventID: eventId });
        return true;
      }
      return false;
    };

    if (!fireLead()) {
      if (fbPixelId) loadFBPixel(fbPixelId);
      let attempts = 0;
      const retryTimer = setInterval(() => {
        attempts++;
        if (fireLead() || attempts >= 20) clearInterval(retryTimer);
      }, 300);
    }

    if (tiktokPixelId && window.ttq) {
      window.ttq.track("SubmitForm", {
        value: params?.value || 0,
        currency: params?.currency || "BDT",
        content_name: params?.contentName || "",
      });
    }

    if (gtmId && window.dataLayer) {
      window.dataLayer.push({
        event: "generate_lead",
        value: params?.value || 0,
        currency: params?.currency || "BDT",
        content_name: params?.contentName || "",
      });
    }

    if (fbPixelId) {
      sendCAPIEvent({
        pixelId: fbPixelId,
        eventName: "Lead",
        eventId,
        customerPhone: params?.customerPhone,
        customerName: params?.customerName,
        customData: {
          value: params?.value || 0,
          currency: params?.currency || "BDT",
          content_name: params?.contentName || "",
        },
      });
    }
  }, [ensureCommerceTrackersReady, fbPixelId, tiktokPixelId, gtmId]);

  const trackCompleteRegistration = useCallback((params?: {
    value?: number; currency?: string; contentName?: string; status?: string;
  }) => {
    const eventId = generateEventId("cr");

    if (fbPixelId && window.fbq) {
      window.fbq("track", "CompleteRegistration", {
        value: params?.value || 0,
        currency: params?.currency || "BDT",
        content_name: params?.contentName || "",
        status: params?.status || "completed",
      }, { eventID: eventId });
    }

    if (tiktokPixelId && window.ttq) {
      window.ttq.track("CompleteRegistration", {
        value: params?.value || 0,
        currency: params?.currency || "BDT",
        content_name: params?.contentName || "",
      });
    }

    if (fbPixelId) {
      sendCAPIEvent({
        pixelId: fbPixelId,
        eventName: "CompleteRegistration",
        eventId,
        customData: {
          value: params?.value || 0,
          currency: params?.currency || "BDT",
          content_name: params?.contentName || "",
          status: params?.status || "completed",
        },
      });
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

    // CAPI for Search
    if (fbPixelId) {
      sendCAPIEvent({
        pixelId: fbPixelId,
        eventName: "Search",
        eventId,
        customData: {
          search_string: searchTerm,
        },
      });
    }
  }, [fbPixelId, tiktokPixelId, gtmId]);

  const trackAddToWishlist = useCallback((product: {
    id: string; name: string; price: number;
    productCode?: string; category?: string;
  }) => {
    const eventId = generateEventId("aw");
    const contentId = product.productCode || product.id;

    if (fbPixelId && window.fbq) {
      window.fbq("track", "AddToWishlist", {
        content_name: product.name,
        content_ids: [contentId],
        content_type: "product",
        content_category: product.category || "",
        value: product.price,
        currency: "BDT",
      }, { eventID: eventId });
    }

    if (tiktokPixelId && window.ttq) {
      window.ttq.track("AddToWishlist", {
        content_id: contentId,
        content_name: product.name,
        value: product.price,
        currency: "BDT",
      });
    }

    if (fbPixelId) {
      sendCAPIEvent({
        pixelId: fbPixelId,
        eventName: "AddToWishlist",
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
  }, [fbPixelId, tiktokPixelId]);

  const trackFindLocation = useCallback((data?: Record<string, any>) => {
    const eventId = generateEventId("fl");
    if (fbPixelId && window.fbq) {
      window.fbq("track", "FindLocation", data || {}, { eventID: eventId });
    }
    if (fbPixelId) {
      sendCAPIEvent({ pixelId: fbPixelId, eventName: "FindLocation", eventId, customData: data || {} });
    }
  }, [fbPixelId]);

  const trackSchedule = useCallback((data?: Record<string, any>) => {
    const eventId = generateEventId("sc");
    if (fbPixelId && window.fbq) {
      window.fbq("track", "Schedule", data || {}, { eventID: eventId });
    }
    if (fbPixelId) {
      sendCAPIEvent({ pixelId: fbPixelId, eventName: "Schedule", eventId, customData: data || {} });
    }
  }, [fbPixelId]);

  const trackCustomizeProduct = useCallback((product?: { name?: string; id?: string; value?: number }) => {
    const eventId = generateEventId("cp");
    const params: Record<string, any> = {};
    if (product?.name) params.content_name = product.name;
    if (product?.id) params.content_ids = [product.id];
    if (product?.value) { params.value = product.value; params.currency = "BDT"; }
    params.content_type = "product";

    if (fbPixelId && window.fbq) {
      window.fbq("track", "CustomizeProduct", params, { eventID: eventId });
    }
    if (fbPixelId) {
      sendCAPIEvent({ pixelId: fbPixelId, eventName: "CustomizeProduct", eventId, customData: params });
    }
  }, [fbPixelId]);

  const trackSubscribe = useCallback((params?: { value?: number; currency?: string; predictedLtv?: number }) => {
    const eventId = generateEventId("sub");
    const data: Record<string, any> = {
      value: params?.value || 0,
      currency: params?.currency || "BDT",
    };
    if (params?.predictedLtv) data.predicted_ltv = params.predictedLtv;

    if (fbPixelId && window.fbq) {
      window.fbq("track", "Subscribe", data, { eventID: eventId });
    }
    if (fbPixelId) {
      sendCAPIEvent({ pixelId: fbPixelId, eventName: "Subscribe", eventId, customData: data });
    }
  }, [fbPixelId]);

  const trackStartTrial = useCallback((params?: { value?: number; currency?: string; predictedLtv?: number }) => {
    const eventId = generateEventId("st");
    const data: Record<string, any> = {
      value: params?.value || 0,
      currency: params?.currency || "BDT",
    };
    if (params?.predictedLtv) data.predicted_ltv = params.predictedLtv;

    if (fbPixelId && window.fbq) {
      window.fbq("track", "StartTrial", data, { eventID: eventId });
    }
    if (fbPixelId) {
      sendCAPIEvent({ pixelId: fbPixelId, eventName: "StartTrial", eventId, customData: data });
    }
  }, [fbPixelId]);

  const trackSubmitApplication = useCallback((data?: Record<string, any>) => {
    const eventId = generateEventId("sa");
    if (fbPixelId && window.fbq) {
      window.fbq("track", "SubmitApplication", data || {}, { eventID: eventId });
    }
    if (fbPixelId) {
      sendCAPIEvent({ pixelId: fbPixelId, eventName: "SubmitApplication", eventId, customData: data || {} });
    }
  }, [fbPixelId]);

  const trackDonate = useCallback((params?: { value?: number; currency?: string }) => {
    const eventId = generateEventId("dn");
    const data = { value: params?.value || 0, currency: params?.currency || "BDT" };
    if (fbPixelId && window.fbq) {
      window.fbq("track", "Donate", data, { eventID: eventId });
    }
    if (fbPixelId) {
      sendCAPIEvent({ pixelId: fbPixelId, eventName: "Donate", eventId, customData: data });
    }
  }, [fbPixelId]);

  // Custom event with CAPI support
  const trackCustomEvent = useCallback((eventName: string, data?: Record<string, any>) => {
    const eventId = generateEventId("ce");

    if (fbPixelId && window.fbq) {
      window.fbq("trackCustom", eventName, data || {}, { eventID: eventId });
    }

    if (gtmId && window.dataLayer) {
      window.dataLayer.push({ event: eventName, ...data });
    }

    // Send custom events to CAPI too for better signal
    if (fbPixelId) {
      sendCAPIEvent({
        pixelId: fbPixelId,
        eventName: eventName,
        eventId,
        customData: data || {},
      });
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
    trackLead,
    trackCompleteRegistration,
    trackSearch,
    trackAddToWishlist,
    trackFindLocation,
    trackSchedule,
    trackCustomizeProduct,
    trackSubscribe,
    trackStartTrial,
    trackSubmitApplication,
    trackDonate,
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
      if (navigator.sendBeacon) {
        const data = JSON.stringify({
          event: "TimeOnPage",
          seconds: timeSpent,
          max_scroll: maxScroll.current,
          page: window.location.pathname,
        });
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
