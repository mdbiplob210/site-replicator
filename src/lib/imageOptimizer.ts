/**
 * CDN Image Optimization via Supabase Storage Transforms
 * Appends render/image/transform parameters for on-the-fly resize, format, quality.
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";

interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number; // 1-100
  format?: "webp" | "avif" | "origin";
  resize?: "cover" | "contain" | "fill";
}

/**
 * Returns an optimized URL if the image is hosted on Supabase Storage or Unsplash.
 * For other external URLs, returns the original URL unchanged.
 */
export function getOptimizedImageUrl(
  url: string | null | undefined,
  options: ImageTransformOptions = {}
): string {
  if (!url) return "";

  const {
    width,
    height,
    quality = 75,
    format = "webp",
    resize = "cover",
  } = options;

  // Handle Unsplash URLs - rewrite w/h/q params
  if (url.includes("images.unsplash.com") && width) {
    try {
      const u = new URL(url);
      u.searchParams.set("w", String(width));
      if (height) u.searchParams.set("h", String(height));
      u.searchParams.set("q", String(quality));
      u.searchParams.set("auto", "format");
      u.searchParams.set("fit", "crop");
      return u.toString();
    } catch {
      return url;
    }
  }

  // Only transform Supabase Storage URLs
  const isSupabaseStorage =
    url.includes("/storage/v1/object/public/") ||
    url.includes("/storage/v1/object/sign/");

  if (!isSupabaseStorage) return url;

  // Convert /object/public/ to /render/image/public/ for transforms
  const transformUrl = url.replace(
    "/storage/v1/object/public/",
    "/storage/v1/render/image/public/"
  );

  const params = new URLSearchParams();
  if (width) params.set("width", String(width));
  if (height) params.set("height", String(height));
  params.set("quality", String(quality));
  if (format !== "origin") params.set("format", format);
  params.set("resize", resize);

  const separator = transformUrl.includes("?") ? "&" : "?";
  return `${transformUrl}${separator}${params.toString()}`;
}

/**
 * Generate srcSet for responsive images (Supabase Storage only)
 */
export function getResponsiveSrcSet(
  url: string | null | undefined,
  widths: number[] = [200, 400, 640]
): string {
  if (!url) return "";

  const isSupabaseStorage =
    url.includes("/storage/v1/object/public/") ||
    url.includes("/storage/v1/object/sign/");

  if (!isSupabaseStorage) return "";

  return widths
    .map((w) => `${getOptimizedImageUrl(url, { width: w })} ${w}w`)
    .join(", ");
}
