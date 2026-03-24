import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { prefetchCriticalData } from "./lib/prefetch";

// Start fetching critical data — deferred slightly to let React render first
setTimeout(prefetchCriticalData, 50);

// Register service worker (deferred well past TTI)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    setTimeout(() => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }, 10000);
  }, { once: true });
}

// Render immediately
const root = createRoot(document.getElementById("root")!);
root.render(<App />);
