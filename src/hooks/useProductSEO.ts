import { useEffect } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

interface ProductSEOData {
  name: string;
  description?: string | null;
  price: number;
  originalPrice?: number | null;
  image?: string | null;
  slug?: string | null;
  id?: string | null;
  stockQuantity?: number | null;
  productCode?: string | null;
  categoryName?: string;
}

export function useProductSEO(product: ProductSEOData | null | undefined) {
  const { data: settings } = useSiteSettings();

  useEffect(() => {
    if (!product) return;

    const siteName = settings?.site_name || "Store";
    const siteUrl = settings?.site_url || window.location.origin;
    const productUrl = `${siteUrl}/product/${product.slug || product.id}`;
    const title = `${product.name} | ${siteName}`;
    const description = product.description
      ? product.description.substring(0, 155)
      : `${product.name} - মাত্র ৳${product.price} টাকায় অর্ডার করুন। ${siteName} থেকে কিনুন।`;

    // Title
    document.title = title;

    // Meta tags
    const metaTags: Record<string, string> = {
      'meta[name="description"]': description,
      'meta[property="og:title"]': title,
      'meta[property="og:description"]': description,
      'meta[property="og:url"]': productUrl,
      'meta[property="og:type"]': "product",
      'meta[name="twitter:title"]': title,
      'meta[name="twitter:description"]': description,
    };

    if (product.image) {
      metaTags['meta[property="og:image"]'] = product.image;
      metaTags['meta[name="twitter:image"]'] = product.image;
    }

    Object.entries(metaTags).forEach(([selector, content]) => {
      let el = document.querySelector(selector) as HTMLMetaElement;
      if (!el) {
        el = document.createElement("meta");
        const match = selector.match(/\[(\w+)="([^"]+)"\]/);
        if (match) el.setAttribute(match[1], match[2]);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    });

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = productUrl;

    // JSON-LD Structured Data
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      description: description,
      image: product.image || undefined,
      url: productUrl,
      sku: product.productCode || product.id,
      offers: {
        "@type": "Offer",
        price: product.price,
        priceCurrency: "BDT",
        availability: (product.stockQuantity ?? 0) > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
        url: productUrl,
        ...(product.originalPrice && product.originalPrice > product.price
          ? { priceValidUntil: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0] }
          : {}),
      },
      brand: {
        "@type": "Brand",
        name: siteName,
      },
    };

    let scriptEl = document.querySelector('script[data-seo="product-jsonld"]') as HTMLScriptElement;
    if (!scriptEl) {
      scriptEl = document.createElement("script");
      scriptEl.type = "application/ld+json";
      scriptEl.setAttribute("data-seo", "product-jsonld");
      document.head.appendChild(scriptEl);
    }
    scriptEl.textContent = JSON.stringify(jsonLd);

    // Cleanup on unmount
    return () => {
      // Restore default title
      if (settings?.site_name) document.title = settings.site_name;
      // Remove product-specific canonical & JSON-LD
      document.querySelector('link[rel="canonical"]')?.remove();
      document.querySelector('script[data-seo="product-jsonld"]')?.remove();
    };
  }, [product, settings]);
}
