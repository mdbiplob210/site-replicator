/**
 * Sanitize dynamic HTML content by removing problematic scripts
 * that cause console warnings in production (e.g., cdn.tailwindcss.com)
 * and optimizing assets for performance.
 */

const BLOCKED_SCRIPT_PATTERNS = [
  /cdn\.tailwindcss\.com/i,
  /unpkg\.com\/tailwindcss/i,
];

/**
 * Remove script tags that match blocked patterns from HTML string
 */
export function sanitizeHtmlScripts(html: string): string {
  if (!html) return html;

  // Remove <script> tags with blocked src
  let sanitized = html.replace(
    /<script[^>]*src\s*=\s*["']([^"']*)["'][^>]*>[\s\S]*?<\/script>/gi,
    (match, src) => {
      if (BLOCKED_SCRIPT_PATTERNS.some((p) => p.test(src))) {
        return `<!-- removed: ${src} (use compiled Tailwind instead) -->`;
      }
      return match;
    }
  );

  // Also remove standalone <script src="..."/> (self-closing)
  sanitized = sanitized.replace(
    /<script[^>]*src\s*=\s*["']([^"']*)["'][^>]*\/?\s*>/gi,
    (match, src) => {
      if (BLOCKED_SCRIPT_PATTERNS.some((p) => p.test(src))) {
        return `<!-- removed: ${src} (use compiled Tailwind instead) -->`;
      }
      return match;
    }
  );

  return sanitized;
}

/**
 * Optimize images in landing page HTML for performance:
 * - Add loading="lazy" to images beyond the first one
 * - Add decoding="async" to all images
 * - Add fetchpriority="high" to the first image
 * - Add width/height hints to prevent CLS
 * - Convert Supabase Storage images to WebP format via transform URL
 * - Add srcset for responsive delivery
 */
export function optimizeLandingImages(html: string): string {
  if (!html) return html;

  let imgIndex = 0;

  return html.replace(/<img\b([^>]*)>/gi, (match, attrs: string) => {
    imgIndex++;

    // Don't touch tracking pixels (1x1)
    if (/width\s*=\s*["']1["']/i.test(attrs) && /height\s*=\s*["']1["']/i.test(attrs)) {
      return match;
    }

    let newAttrs = attrs;

    // Add decoding="async" if not present
    if (!/\sdecoding\s*=/i.test(newAttrs)) {
      newAttrs += ' decoding="async"';
    }

    if (imgIndex === 1) {
      // First image: eager load, high priority
      if (!/\sfetchpriority\s*=/i.test(newAttrs)) {
        newAttrs += ' fetchpriority="high"';
      }
    } else {
      // Subsequent images: lazy load
      if (!/\sloading\s*=/i.test(newAttrs)) {
        newAttrs += ' loading="lazy"';
      }
    }

    // Optimize Supabase Storage URLs to WebP
    const srcMatch = newAttrs.match(/\ssrc\s*=\s*["']([^"']+)["']/i);
    if (srcMatch) {
      const originalSrc = srcMatch[1];
      
      // Convert Supabase Storage URLs to WebP via render transform
      if (originalSrc.includes('/storage/v1/object/public/')) {
        const webpSrc = originalSrc
          .replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');
        const separator = webpSrc.includes('?') ? '&' : '?';
        const optimizedSrc = `${webpSrc}${separator}format=webp&quality=75`;
        newAttrs = newAttrs.replace(srcMatch[0], ` src="${optimizedSrc}"`);

        // Add responsive srcset if no srcset already
        if (!/\ssrcset\s*=/i.test(newAttrs)) {
          const srcsetEntries = [400, 800].map(w => {
            return `${webpSrc}${separator}format=webp&quality=75&width=${w}&resize=cover ${w}w`;
          }).join(', ');
          newAttrs += ` srcset="${srcsetEntries}" sizes="(max-width: 640px) 100vw, 800px"`;
        }
      }

      // Optimize Unsplash URLs
      if (originalSrc.includes('images.unsplash.com')) {
        try {
          const u = new URL(originalSrc);
          u.searchParams.set('auto', 'format');
          u.searchParams.set('q', '75');
          if (!u.searchParams.has('w')) u.searchParams.set('w', '800');
          newAttrs = newAttrs.replace(srcMatch[0], ` src="${u.toString()}"`);
        } catch {}
      }
    }

    return `<img${newAttrs}>`;
  });
}
