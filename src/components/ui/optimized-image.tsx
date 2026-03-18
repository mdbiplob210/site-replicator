import { useState, useRef, useEffect, useCallback, ImgHTMLAttributes } from "react";
import { getOptimizedImageUrl, getResponsiveSrcSet } from "@/lib/imageOptimizer";
import { cn } from "@/lib/utils";

function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const trimmed = url.trim();
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
  /** Show a shimmer placeholder while loading */
  showPlaceholder?: boolean;
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
  showPlaceholder = true,
  className,
  style,
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

  // Check if image is already cached
  const checkIfCached = useCallback(() => {
    if (imgRef.current?.complete && imgRef.current?.naturalWidth > 0) {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    setLoaded(false);
    setError(false);
    setUseOriginalSrc(false);
    requestAnimationFrame(() => checkIfCached());
  }, [src, checkIfCached]);

  if (!src || !isValidImageUrl(src) || error) {
    return fallback ? <>{fallback}</> : null;
  }

  return (
    <div className="relative w-full h-full" style={{ containIntrinsicSize: width && height ? `${width}px ${height}px` : undefined, contentVisibility: eager ? undefined : 'auto' }}>
      {showPlaceholder && !loaded && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
      <img
        ref={imgRef}
        src={effectiveSrc}
        srcSet={effectiveSrcSet || undefined}
        sizes={effectiveSrcSet ? sizes : undefined}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        decoding={eager ? "sync" : "async"}
        fetchPriority={eager ? "high" : undefined}
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
          loaded ? "opacity-100" : "opacity-0",
          className
        )}
        style={{ ...style, transition: 'opacity 0.1s' }}
        {...props}
      />
    </div>
  );
}
