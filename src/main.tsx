import { prefetchCriticalData, prefetchLandingPageData, getPrefetchedData, prefetchSiteSettingsData } from "./lib/prefetch";
import { ensureSitePixelBootstrap } from "./lib/sitePixelBootstrap";

const path = window.location.pathname;

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

type PrefetchedSiteSetting = {
  key: string;
  value: string;
};

function bootstrapMainSiteShellPixel() {
  const prefetched = getPrefetchedData<PrefetchedSiteSetting[]>("site-settings");
  const pixelId = prefetched?.find((entry) => entry.key === "fb_pixel_id")?.value?.trim();

  if (!pixelId) {
    console.warn("[Site Pixel] Shell bootstrap skipped: no pixel ID");
    return;
  }

  ensureSitePixelBootstrap(pixelId);
  console.info("[Site Pixel] Shell bootstrap ready", { pixelId });
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    setTimeout(() => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }, 1000);
  }, { once: true });
}

async function bootstrapApp() {
  if (path.startsWith("/lp/")) {
    const slug = path.replace("/lp/", "").split("/")[0];
    const landingModulePromise = import("./pages/LandingPageView").catch(() => {});

    await prefetchLandingPageData(slug);
    await landingModulePromise;
  } else {
    await prefetchSiteSettingsData();
    bootstrapMainSiteShellPixel();
    prefetchCriticalData();
  }

  const root = createRoot(document.getElementById("root")!);
  root.render(<App />);
}

void bootstrapApp();

// Init link prefetching faster
if (!path.startsWith("/lp/")) {
  requestAnimationFrame(() => {
    setTimeout(() => {
      import("./lib/routePrefetch").then(({ initLinkPrefetching }) => {
        initLinkPrefetching();
      });
    }, 300); // Reduced from 500ms to 300ms
  });
}
