import { useEffect } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export function useDynamicMeta() {
  const { data: settings } = useSiteSettings();

  useEffect(() => {
    if (!settings) return;

    const siteName = settings.site_name;
    if (siteName) {
      document.title = siteName;
      document.querySelector('meta[property="og:title"]')?.setAttribute("content", siteName);
      document.querySelector('meta[name="twitter:title"]')?.setAttribute("content", siteName);
    }

    const siteLogo = settings.site_logo;
    if (siteLogo) {
      // Update favicon
      let favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      if (!favicon) {
        favicon = document.createElement("link");
        favicon.rel = "icon";
        document.head.appendChild(favicon);
      }
      favicon.href = siteLogo;
      favicon.type = siteLogo.endsWith(".svg") ? "image/svg+xml" : "image/png";

      // Also update apple-touch-icon if exists
      let apple = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement;
      if (!apple) {
        apple = document.createElement("link");
        apple.rel = "apple-touch-icon";
        document.head.appendChild(apple);
      }
      apple.href = siteLogo;
    }
  }, [settings]);
}
