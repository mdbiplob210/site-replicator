import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { prefetchCriticalData } from "./lib/prefetch";

// Start fetching critical data BEFORE React even renders
prefetchCriticalData();

// Register service worker for caching (non-blocking)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

// Render immediately
const root = createRoot(document.getElementById("root")!);
root.render(<App />);
