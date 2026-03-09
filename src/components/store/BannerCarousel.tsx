import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useActiveBanners } from "@/hooks/useBanners";

const BannerCarousel = () => {
  const { data: banners = [] } = useActiveBanners();
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % banners.length);
  }, [banners.length]);

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + banners.length) % banners.length);
  }, [banners.length]);

  // Auto-slide every 4s
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(next, 4000);
    return () => clearInterval(interval);
  }, [next, banners.length]);

  if (banners.length === 0) return null;

  const banner = banners[current];

  const Wrapper = banner?.link_url
    ? ({ children }: { children: React.ReactNode }) => (
        <a href={banner.link_url} target="_blank" rel="noopener noreferrer" className="block">
          {children}
        </a>
      )
    : ({ children }: { children: React.ReactNode }) => <>{children}</>;

  return (
    <div className="relative w-full overflow-hidden bg-gray-100">
      <Wrapper>
        <div className="relative w-full" style={{ aspectRatio: "16/5" }}>
          <img
            src={banner.image_url}
            alt={`Banner ${current + 1}`}
            className="w-full h-full object-cover transition-opacity duration-500"
          />
        </div>
      </Wrapper>

      {banners.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/80 hover:bg-white shadow flex items-center justify-center transition"
          >
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700" />
          </button>
          <button
            onClick={next}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/80 hover:bg-white shadow flex items-center justify-center transition"
          >
            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition ${
                  i === current ? "bg-white scale-110" : "bg-white/50"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default BannerCarousel;
