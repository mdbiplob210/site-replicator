import { prefetchCriticalData, prefetchLandingPageData, getPrefetchedData } from "./lib/prefetch";
import { ensureMetaPixelBootstrap } from "./lib/landingPixelBootstrap";

const path = window.location.pathname;

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

type PrefetchedLandingPage = {
  fb_pixel_id?: string | null;
};

function bootstrapLandingShellPixel(slug: string) {
  const prefetched = getPrefetchedData<PrefetchedLandingPage[]>(`landing-page:${slug}`);
  const pixelId = prefetched?.[0]?.fb_pixel_id?.trim();

  if (!pixelId) {
    console.warn("[LP Pixel] Shell bootstrap skipped: no pixel ID", { slug });
    return;
  }

  ensureMetaPixelBootstrap(pixelId);
  console.info("[LP Pixel] Shell bootstrap ready", { slug, pixelId });
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
    bootstrapLandingShellPixel(slug);
    await landingModulePromise;
  } else {
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
