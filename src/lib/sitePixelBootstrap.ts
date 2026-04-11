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
  __siteMetaPixelBootstrapped?: Record<string, boolean>;
};

const META_PIXEL_SDK_SRC = "https://connect.facebook.net/en_US/fbevents.js";

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

function ensureMetaPixelSdk() {
  const existingScript = document.querySelector(
    'script[data-site-meta-pixel-sdk="true"],script[src*="connect.facebook.net/en_US/fbevents.js"]'
  ) as HTMLScriptElement | null;

  if (existingScript) {
    existingScript.dataset.siteMetaPixelSdk = "true";
    return;
  }

  const script = document.createElement("script");
  script.src = META_PIXEL_SDK_SRC;
  script.async = false;
  script.defer = false;
  script.dataset.siteMetaPixelSdk = "true";

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

  if (win.__siteMetaPixelBootstrapped[pixelId]) return;

  ensureFbqStub(win);
  ensureMetaPixelSdk();

  const externalId = getExternalId();
  win.fbq?.("init", pixelId, { external_id: externalId, country: "bd" });

  try {
    win.fbq?.("set", "autoConfig", true, pixelId);
  } catch (_) {}

  win.__siteMetaPixelBootstrapped[pixelId] = true;
}