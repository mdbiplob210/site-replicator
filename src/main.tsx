import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { prefetchCriticalData } from "./lib/prefetch";

// Start fetching critical data BEFORE React even renders
prefetchCriticalData();

createRoot(document.getElementById("root")!).render(<App />);
