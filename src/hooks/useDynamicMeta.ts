import { useEffect } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export function useDynamicMeta() {
  const { data: settings } = useSiteSettings();

  useEffect(() => {
    if (!settings) return;

    const siteName = settings.site_name;
    const siteUrl = settings.site_url || window.location.origin;

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

    // Set canonical for homepage
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = siteUrl;

    // WebSite JSON-LD structured data
    let scriptEl = document.querySelector('script[data-seo="website-jsonld"]') as HTMLScriptElement;
    if (!scriptEl) {
      scriptEl = document.createElement("script");
      scriptEl.type = "application/ld+json";
      scriptEl.setAttribute("data-seo", "website-jsonld");
      document.head.appendChild(scriptEl);
    }
    scriptEl.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: siteName || "Store",
      url: siteUrl,
      potentialAction: {
        "@type": "SearchAction",
        target: `${siteUrl}/product/{search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    });
  }, [settings]);
}
