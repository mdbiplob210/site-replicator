import { prefetchCriticalData } from "./lib/prefetch";

// Start fetching critical data BEFORE React even loads
prefetchCriticalData();

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Register service worker early for caching benefits
if ('serviceWorker' in navigator) {
  // Register sooner (3s instead of 10s) for faster subsequent loads
  window.addEventListener('load', () => {
    setTimeout(() => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }, 3000);
  }, { once: true });
}

// Render immediately
const root = createRoot(document.getElementById("root")!);
root.render(<App />);

// Init link prefetching after first paint (deferred)
requestAnimationFrame(() => {
  setTimeout(() => {
    import("./lib/routePrefetch").then(({ initLinkPrefetching }) => {
      initLinkPrefetching();
    });
  }, 1500);
});
