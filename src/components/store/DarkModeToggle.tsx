import { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";

export function DarkModeToggle() {
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("store-theme") === "dark" || 
      (!localStorage.getItem("store-theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
  });

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("store-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("store-theme", "light");
    }
  }, [dark]);

  return (
    <button
      onClick={() => setDark(!dark)}
      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
      title={dark ? "Light mode" : "Dark mode"}
    >
      {dark ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5 text-gray-600" />}
    </button>
  );
}
