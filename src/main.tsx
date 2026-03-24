import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { prefetchCriticalData } from "./lib/prefetch";

// Start fetching critical data — non-blocking, runs in parallel with React hydration
prefetchCriticalData();

// Register service worker (deferred to after load)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, { once: true });
}

// Render immediately
const root = createRoot(document.getElementById("root")!);
root.render(<App />);
