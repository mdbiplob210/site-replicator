type SitePixelFn = ((...args: any[]) => void) & {
  callMethod?: (...args: any[]) => void;
  queue?: any[][];
  loaded?: boolean;
  version?: string;
  push?: (...args: any[]) => number;
};

type SitePixelWindow = Window & typeof globalThis & {
  fbq?: SitePixelFn;
  _fbq?: SitePixelFn;
  _sitePageViewEventId?: string;
  __sitePageViewTracked?: boolean;
  __siteMetaPixelBootstrapped?: Record<string, boolean>;
  __siteMetaPixelTrackedUrls?: Record<string, string>;
  __siteCurrentPixelId?: string;
  __siteMetaPixelLifecycleInstalled?: boolean;
  __siteFbSdkLoaded?: boolean;
};

const META_PIXEL_SDK_SRC = "https://connect.facebook.net/en_US/fbevents.js";

function normalizeTrackedUrl(url: string) {
  if (typeof window === "undefined") return url;

  try {
    const parsed = new URL(url, window.location.origin);
    parsed.hash = "";
    return parsed.toString();
  } catch (_) {
    return String(url || "").split("#")[0] || String(url || "");
  }
}

function isFbqReady(win: SitePixelWindow) {
  return typeof win.fbq === "function" && typeof win.fbq.callMethod === "function";
}

function getExternalId() {
  let externalId = "";

  try {
    externalId = localStorage.getItem("_vid") || "";
  } catch (_) {}

  if (!externalId) {
    externalId = `v_${Date.now()}_${Math.random().toString(36).slice(2, 14)}`;
    try {
      localStorage.setItem("_vid", externalId);
    } catch (_) {}
  }

  return externalId;
}

function ensureFbqStub(win: SitePixelWindow) {
  if (typeof win.fbq === "function") return;

  const fbq = ((...args: any[]) => {
    if (fbq.callMethod) {
      fbq.callMethod(...args);
      return;
    }

    fbq.queue?.push(args);
  }) as NonNullable<SitePixelWindow["fbq"]>;

  if (!win._fbq) win._fbq = fbq;
  fbq.push = (...args: any[]) => {
    fbq.queue?.push(args);
    return fbq.queue?.length ?? 0;
  };
  fbq.loaded = true;
  fbq.version = "2.0";
  fbq.queue = [];
  win.fbq = fbq;
}

function trackSitePageView(pixelId: string, options?: { force?: boolean }) {
  if (typeof window === "undefined" || !pixelId) return "";

  const win = window as SitePixelWindow;
  win.__siteMetaPixelTrackedUrls = win.__siteMetaPixelTrackedUrls || {};

  const currentUrl = normalizeTrackedUrl(window.location.href);
  const trackingKey = `${pixelId}:${currentUrl}`;
  const existingEventId = win.__siteMetaPixelTrackedUrls[trackingKey];

  if (existingEventId && !options?.force) {
    win._sitePageViewEventId = existingEventId;
    win.__sitePageViewTracked = true;
    return existingEventId;
  }

  const eventId = `eid_${Math.random().toString(36).slice(2, 11)}_${Date.now()}`;

  const externalId = getExternalId();
  win.fbq?.("init", pixelId, { external_id: externalId, country: "bd" });

  try {
    win.fbq?.("set", "autoConfig", true, pixelId);
  } catch (_) {}

  // ALWAYS call fbq("track") — even if SDK isn't ready yet.
  // The stub queues it and the SDK will process the queue on load.
  // This is critical for Pixel Helper detection on first visit.
  win.fbq?.("track", "PageView", {}, { eventID: eventId });
  win._sitePageViewEventId = eventId;
  win.__siteMetaPixelTrackedUrls[trackingKey] = eventId;
  win.__sitePageViewTracked = true;

  console.info("[Site Pixel] PageView fired", {
    pixelId,
    eventId,
    url: currentUrl,
    ready: isFbqReady(win),
  });

  return eventId;
}

function installSitePixelLifecycle(win: SitePixelWindow) {
  if (win.__siteMetaPixelLifecycleInstalled) return;

  const fire = () => {
    if (!win.__siteCurrentPixelId) return;
    trackSitePageView(win.__siteCurrentPixelId);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", fire, { once: true });
  } else {
    queueMicrotask(fire);
  }

  window.addEventListener("load", fire, { once: true });
  window.addEventListener("pageshow", fire);
  window.addEventListener("popstate", fire);
  window.addEventListener("hashchange", fire);

  (["pushState", "replaceState"] as const).forEach((method) => {
    const original = window.history[method] as any;
    if (original?.__siteWrapped) return;

    const wrapped = function (this: History, ...args: any[]) {
      const result = original.apply(this, args);
      setTimeout(fire, 0);
      return result;
    };

    wrapped.__siteWrapped = true;
    (window.history as any)[method] = wrapped;
  });

  win.__siteMetaPixelLifecycleInstalled = true;
}

function ensureMetaPixelSdk(win: SitePixelWindow) {
  const existingScript = document.querySelector(
    'script[data-site-meta-pixel-sdk="true"],script[src*="connect.facebook.net/en_US/fbevents.js"]'
  ) as HTMLScriptElement | null;

  if (existingScript) {
    existingScript.dataset.siteMetaPixelSdk = "true";

    if (isFbqReady(win)) {
      win.__siteFbSdkLoaded = true;
    } else if (!(existingScript as HTMLScriptElement & { __siteLoadHandlerAttached?: boolean }).__siteLoadHandlerAttached) {
      existingScript.addEventListener(
        "load",
        () => {
          win.__siteFbSdkLoaded = true;
          if (win.__siteCurrentPixelId) {
            trackSitePageView(win.__siteCurrentPixelId);
          }
        },
        { once: true }
      );
      (existingScript as HTMLScriptElement & { __siteLoadHandlerAttached?: boolean }).__siteLoadHandlerAttached = true;
    }

    return;
  }

  const script = document.createElement("script");
  script.src = META_PIXEL_SDK_SRC;
  script.async = false;
  script.defer = false;
  script.dataset.siteMetaPixelSdk = "true";
  script.onload = () => {
    win.__siteFbSdkLoaded = true;
    console.info("[Site Pixel] SDK loaded", {
      fbqType: typeof win.fbq,
      ready: typeof win.fbq?.callMethod === "function",
    });
    if (win.__siteCurrentPixelId) {
      trackSitePageView(win.__siteCurrentPixelId);
    }
  };
  script.onerror = () => {
    console.error("[Site Pixel] SDK failed to load", { src: META_PIXEL_SDK_SRC });
  };

  const head = document.head || document.getElementsByTagName("head")[0] || document.documentElement;
  const firstScript = head.querySelector("script") || document.getElementsByTagName("script")[0];

  if (firstScript?.parentNode) {
    firstScript.parentNode.insertBefore(script, firstScript);
  } else {
    head.appendChild(script);
  }
}

export function ensureSitePixelBootstrap(pixelId: string) {
  if (typeof window === "undefined" || !pixelId) return;

  const win = window as SitePixelWindow;
  win.__siteMetaPixelBootstrapped = win.__siteMetaPixelBootstrapped || {};

  ensureFbqStub(win);
  ensureMetaPixelSdk(win);
  installSitePixelLifecycle(win);
  win.__siteCurrentPixelId = pixelId;

  // Fire PageView immediately — stub will queue it for SDK to process on load
  trackSitePageView(pixelId);

  win.__siteMetaPixelBootstrapped[pixelId] = true;
}

export function getSiteTrackedPageViewEventId(pixelId: string, url: string) {
  if (typeof window === "undefined" || !pixelId || !url) return "";

  const win = window as SitePixelWindow;
  const normalizedUrl = normalizeTrackedUrl(url);
  const trackingKey = `${pixelId}:${normalizedUrl}`;

  return win.__siteMetaPixelTrackedUrls?.[trackingKey] || "";
}