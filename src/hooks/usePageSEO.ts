import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useSiteSettings } from "@/hooks/useSiteSettings";

interface PageSEOOptions {
  title?: string;
  description?: string;
  ogImage?: string;
  noIndex?: boolean;
}

export function usePageSEO(options?: PageSEOOptions) {
  const { data: settings } = useSiteSettings();
  const location = useLocation();

  useEffect(() => {
    if (!settings) return;

    const siteName = settings.site_name || "Store";
    const siteUrl = settings.site_url || window.location.origin;
    const pageUrl = `${siteUrl}${location.pathname}`;

    const title = options?.title ? `${options.title} | ${siteName}` : siteName;
    const description = options?.description || settings.site_description || "আপনার পছন্দের প্রোডাক্ট অর্ডার করুন - দ্রুত ডেলিভারি";

    document.title = title;

    // Set meta tags
    const setMeta = (selector: string, content: string) => {
      let el = document.querySelector(selector) as HTMLMetaElement;
      if (!el) {
        el = document.createElement("meta");
        const match = selector.match(/\[(\w+)="([^"]+)"\]/);
        if (match) el.setAttribute(match[1], match[2]);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMeta('meta[name="description"]', description);
    setMeta('meta[property="og:title"]', title);
    setMeta('meta[property="og:description"]', description);
    setMeta('meta[property="og:url"]', pageUrl);
    setMeta('meta[name="twitter:title"]', title);
    setMeta('meta[name="twitter:description"]', description);

    if (options?.ogImage) {
      setMeta('meta[property="og:image"]', options.ogImage);
      setMeta('meta[name="twitter:image"]', options.ogImage);
    }

    if (options?.noIndex) {
      setMeta('meta[name="robots"]', "noindex, nofollow");
    }

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = pageUrl;

    return () => {
      document.querySelector('link[rel="canonical"]')?.remove();
      document.querySelector('meta[name="robots"]')?.remove();
    };
  }, [settings, location.pathname, options?.title, options?.description]);
}
