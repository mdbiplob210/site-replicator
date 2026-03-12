import { useState, useRef, useEffect, useCallback, ImgHTMLAttributes } from "react";
import { getOptimizedImageUrl, getResponsiveSrcSet } from "@/lib/imageOptimizer";
import { cn } from "@/lib/utils";

function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  // Must start with http(s):// or / or data: to be a valid image source
  return /^(https?:\/\/|\/|data:)/i.test(trimmed);
}

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src: string | null | undefined;
  alt: string;
  width?: number;
  height?: number;
  quality?: number;
  sizes?: string;
  /** Disable lazy loading */
  eager?: boolean;
  /** Fallback element when no src */
  fallback?: React.ReactNode;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  quality = 75,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  eager = false,
  fallback,
  className,
  ...props
}: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [useOriginalSrc, setUseOriginalSrc] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const optimizedSrc = getOptimizedImageUrl(src, { width, height, quality });
  const srcSet = getResponsiveSrcSet(src);
  const effectiveSrc = useOriginalSrc ? (src || "") : optimizedSrc;
  const effectiveSrcSet = useOriginalSrc ? "" : srcSet;

  // Check if image is already cached (loaded from browser cache)
  const checkIfCached = useCallback(() => {
    if (imgRef.current?.complete && imgRef.current?.naturalWidth > 0) {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    setLoaded(false);
    setError(false);
    setUseOriginalSrc(false);
    // After state reset, check if new src is already cached
    requestAnimationFrame(() => checkIfCached());
  }, [src, checkIfCached]);

  if (!src || !isValidImageUrl(src) || error) {
    return fallback ? <>{fallback}</> : null;
  }

  return (
    <img
      ref={imgRef}
      src={effectiveSrc}
      srcSet={effectiveSrcSet || undefined}
      sizes={effectiveSrcSet ? sizes : undefined}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onLoad={() => setLoaded(true)}
      onError={() => {
        if (!useOriginalSrc && src) {
          setUseOriginalSrc(true);
          setLoaded(false);
          return;
        }
        setError(true);
      }}
      className={cn(
        "transition-opacity duration-200",
        loaded ? "opacity-100" : "opacity-0",
        className
      )}
      {...props}
    />
  );
}
