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

    return `<img${newAttrs}>`;
  });
}
