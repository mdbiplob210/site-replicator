import { createRoot } from "react-dom/client";
import { inject } from "@vercel/analytics";
import App from "./App.tsx";
import "./index.css";
import { prefetchCriticalData } from "./lib/prefetch";

// Start fetching critical data BEFORE React even renders
prefetchCriticalData();
inject();

// Render immediately
const root = createRoot(document.getElementById("root")!);
root.render(<App />);
