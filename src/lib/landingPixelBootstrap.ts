type LandingPixelFn = ((...args: any[]) => void) & {
  callMethod?: (...args: any[]) => void;
  queue?: any[][];
  loaded?: boolean;
  version?: string;
  push?: (...args: any[]) => number;
};

type LandingPixelWindow = Window & typeof globalThis & {
  fbq?: LandingPixelFn;
  _fbq?: LandingPixelFn;
  _lpPageViewEventId?: string;
  __lpPageViewTracked?: boolean;
  __lpMetaPixelBootstrapped?: Record<string, boolean>;
};

export function ensureMetaPixelBootstrap(pixelId: string) {
  if (typeof window === "undefined" || !pixelId) return;

  const win = window as LandingPixelWindow;
  win.__lpMetaPixelBootstrapped = win.__lpMetaPixelBootstrapped || {};

  if (!win.fbq) {
    const fbq = ((...args: any[]) => {
      if (fbq.callMethod) {
        fbq.callMethod(...args);
        return;
      }

      fbq.queue?.push(args);
    }) as NonNullable<LandingPixelWindow["fbq"]>;

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

  if (!document.querySelector('script[data-lp-meta-pixel-sdk="true"]')) {
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    script.dataset.lpMetaPixelSdk = "true";
    document.head.appendChild(script);
  }

  if (win.__lpMetaPixelBootstrapped[pixelId]) return;

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

  const eventId = win._lpPageViewEventId || `eid_${Math.random().toString(36).slice(2, 11)}_${Date.now()}`;
  win._lpPageViewEventId = eventId;

  win.fbq?.("init", pixelId, { external_id: externalId, country: "bd" });
  if (!win.__lpPageViewTracked) {
    win.fbq?.("track", "PageView", {}, { eventID: eventId });
    win.__lpPageViewTracked = true;
  }

  win.__lpMetaPixelBootstrapped[pixelId] = true;
}