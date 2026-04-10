import { prefetchCriticalData, prefetchLandingPageData } from "./lib/prefetch";

const path = window.location.pathname;

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

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
    await Promise.all([
      prefetchLandingPageData(slug),
      import("./pages/LandingPageView").catch(() => {}),
    ]);
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
