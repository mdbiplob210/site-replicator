import { describe, expect, it } from "vitest";
import { deferLandingMarkupScripts, optimizeLandingEmbeds, optimizeLandingImages, sanitizeHtmlScripts } from "@/lib/htmlSanitizer";

describe("htmlSanitizer", () => {
  it("removes blocked Tailwind CDN scripts", () => {
    const html = '<script src="https://cdn.tailwindcss.com"></script>';
    expect(sanitizeHtmlScripts(html)).toContain("removed: https://cdn.tailwindcss.com");
  });

  it("defers known third-party marketing scripts inside landing markup", () => {
    const html = '<script src="https://www.googletagmanager.com/gtm.js?id=GTM-123"></script>';
    const deferred = deferLandingMarkupScripts(html);

    expect(deferred).toContain('type="text/lovable-deferred-script"');
    expect(deferred).toContain('data-lp-src="https://www.googletagmanager.com/gtm.js?id=GTM-123"');
  });

  it("keeps the first image eager and lazy-loads later images", () => {
    const html = '<img src="/hero.jpg"><img src="/gallery.jpg">';
    const optimized = optimizeLandingImages(html);

    expect(optimized).toContain('fetchpriority="high"');
    expect(optimized).toContain('loading="lazy"');
    expect(optimized).toContain('decoding="async"');
  });

  it("adds safer defaults for iframe and video embeds", () => {
    const html = '<iframe src="https://example.com/embed"></iframe><video src="/demo.mp4"></video>';
    const optimized = optimizeLandingEmbeds(html);

    expect(optimized).toContain('loading="lazy"');
    expect(optimized).toContain('referrerpolicy="strict-origin-when-cross-origin"');
    expect(optimized).toContain('playsinline');
    expect(optimized).toContain('preload="metadata"');
  });
});