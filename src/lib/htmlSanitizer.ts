/**
 * Sanitize dynamic HTML content by removing problematic scripts
 * that cause console warnings in production (e.g., cdn.tailwindcss.com)
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
