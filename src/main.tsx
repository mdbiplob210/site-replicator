import { prefetchCriticalData } from "./lib/prefetch";

// Start fetching critical data BEFORE React even loads
prefetchCriticalData();

// For landing pages, prefetch the chunk immediately
const path = window.location.pathname;
if (path.startsWith("/lp/")) {
  import("./pages/LandingPageView").catch(() => {});
}

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Register service worker early for caching benefits
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    setTimeout(() => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }, 1000); // Reduced from 2s to 1s
  }, { once: true });
}

// Render immediately
const root = createRoot(document.getElementById("root")!);
root.render(<App />);

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
