/**
 * Sanitize dynamic HTML content by removing problematic scripts
 * that cause console warnings in production (e.g., cdn.tailwindcss.com)
 * and optimizing assets for performance.
 */

const BLOCKED_SCRIPT_PATTERNS = [
  /cdn\.tailwindcss\.com/i,
  /unpkg\.com\/tailwindcss/i,
];

const DEFERRED_SCRIPT_PATTERNS = [
  /connect\.facebook\.net/i,
  /analytics\.tiktok\.com/i,
  /googletagmanager\.com/i,
  /google-analytics\.com/i,
  /gtag\/js/i,
  /clarity\.ms/i,
  /hotjar/i,
  /snap\.licdn\.com/i,
  /static\.ads-twitter\.com/i,
];

const DEFERRED_SCRIPT_TYPE = "text/lovable-deferred-script";

function shouldDeferScript(src: string) {
  return DEFERRED_SCRIPT_PATTERNS.some((pattern) => pattern.test(src));
}

function shouldDisableScript(src: string, disablePatterns: RegExp[]) {
  return disablePatterns.some((pattern) => pattern.test(src));
}

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
 * Convert known non-critical third-party script tags inside landing HTML into inert
 * placeholders. They will be restored after first paint by landingDeferredScriptLoader.
 */
export function deferLandingMarkupScripts(
  html: string,
  options?: { disablePatterns?: RegExp[] },
): string {
  if (!html) return html;
  const disablePatterns = options?.disablePatterns ?? [];

  const replaceScript = (_match: string, src: string) => {
    if (shouldDisableScript(src, disablePatterns)) {
      return `<!-- removed duplicate marketing script: ${src} -->`;
    }
    if (!shouldDeferScript(src)) return _match;
    return `<script type="${DEFERRED_SCRIPT_TYPE}" data-lp-src="${src}"></script>`;
  };

  let deferred = html.replace(
    /<script[^>]*src\s*=\s*["']([^"']*)["'][^>]*>[\s\S]*?<\/script>/gi,
    replaceScript,
  );

  deferred = deferred.replace(
    /<script[^>]*src\s*=\s*["']([^"']*)["'][^>]*\/?\s*>/gi,
    replaceScript,
  );

  return deferred;
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

    // Keep Supabase Storage URLs as-is (render/image transform not available on all projects)
    const srcMatch = newAttrs.match(/\ssrc\s*=\s*["']([^"']+)["']/i);
    if (srcMatch) {
      const originalSrc = srcMatch[1];

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

/**
 * Apply safer defaults for heavy embeds in landing markup.
 */
export function optimizeLandingEmbeds(html: string): string {
  if (!html) return html;

  let optimized = html.replace(/<iframe\b([^>]*)>/gi, (match, attrs: string) => {
    let nextAttrs = attrs;
    if (!/\sloading\s*=/i.test(nextAttrs)) {
      nextAttrs += ' loading="lazy"';
    }
    if (!/\sreferrerpolicy\s*=/i.test(nextAttrs)) {
      nextAttrs += ' referrerpolicy="strict-origin-when-cross-origin"';
    }
    return `<iframe${nextAttrs}>`;
  });

  optimized = optimized.replace(/<video\b([^>]*)>/gi, (match, attrs: string) => {
    let nextAttrs = attrs;
    if (!/\splaysinline\s*=/i.test(nextAttrs)) {
      nextAttrs += " playsinline";
    }
    if (!/\spreload\s*=/i.test(nextAttrs) && !/\sautoplay\b/i.test(nextAttrs)) {
      nextAttrs += ' preload="metadata"';
    }
    return `<video${nextAttrs}>`;
  });

  return optimized;
}

export const landingDeferredScriptLoader = `
<script>
(function(){
  function restoreDeferredScripts() {
    var nodes = document.querySelectorAll('script[type="${DEFERRED_SCRIPT_TYPE}"][data-lp-src]');
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      if (!node || node.getAttribute('data-lp-loaded') === '1') continue;
      var src = node.getAttribute('data-lp-src');
      if (!src || !node.parentNode) continue;
      node.setAttribute('data-lp-loaded', '1');
      var script = document.createElement('script');
      script.src = src;
      script.async = true;
      node.parentNode.insertBefore(script, node.nextSibling);
    }
  }

  function scheduleRestore() {
    var raf = window.requestAnimationFrame || function(cb) { setTimeout(cb, 16); };
    var idle = window.requestIdleCallback || function(cb) { setTimeout(cb, 150); };
    raf(function() { idle(restoreDeferredScripts); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleRestore, { once: true });
  } else {
    scheduleRestore();
  }
})();
</script>`;
