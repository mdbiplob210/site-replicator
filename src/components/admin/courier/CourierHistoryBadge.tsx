import { useState, useEffect, useRef, memo } from "react";
import { fetchCourierCheck, getCourierCacheEntry } from "@/lib/courierCheckCache";
import { Loader2 } from "lucide-react";

const COURIER_LOGOS: Record<string, string> = {
  pathao: "https://api.bdcourier.com/c-logo/pathao-logo.png",
  steadfast: "https://api.bdcourier.com/c-logo/steadfast-logo.png",
  redx: "https://api.bdcourier.com/c-logo/redx-logo.png",
  ecourier: "https://api.bdcourier.com/c-logo/ecourier-logo.png",
  paperfly: "https://api.bdcourier.com/c-logo/paperfly-logo.png",
  sundarban: "https://api.bdcourier.com/c-logo/sundarban-logo.png",
  deshbideshe: "https://api.bdcourier.com/c-logo/deshbideshe-logo.png",
};

const SHOW_COURIERS = new Set(["pathao", "steadfast"]);

interface Props {
  phone: string | null | undefined;
}

export const CourierHistoryBadge = memo(function CourierHistoryBadge({ phone }: Props) {
  const clean = phone?.replace(/\D/g, "") || "";
  const ok = clean.length >= 11;
  
  // Try instant cache hit for initial render
  const [data, setData] = useState<any>(() => ok ? getCourierCacheEntry(clean) : null);
  const [loading, setLoading] = useState(false);
  const lastRef = useRef("");
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!ok) { setData(null); setLoading(false); lastRef.current = ""; return; }
    if (lastRef.current === clean) return;
    lastRef.current = clean;
    
    // Instant cache check
    const cached = getCourierCacheEntry(clean);
    if (cached) { setData(cached); setLoading(false); return; }
    
    setData(null);
    setLoading(true);
    fetchCourierCheck(clean).then((r) => {
      if (mountedRef.current && lastRef.current === clean) {
        setData(r);
        setLoading(false);
      }
    });
  }, [clean, ok]);

  if (!ok) return <span className="text-[10px] text-muted-foreground">—</span>;
  if (loading && !data) return <Loader2 className="h-3 w-3 animate-spin text-muted-foreground mx-auto" />;

  const couriers = data?.status === "success" && data.data
    ? Object.entries(data.data).filter(([k]) => k !== "summary" && SHOW_COURIERS.has(k)).map(([k, v]: [string, any]) => ({ k, ...v }))
    : [];
  const summary = data?.data?.summary;

  if (!summary || summary.total_parcel === 0) {
    return (
      <span className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-700 rounded px-1.5 py-0.5 text-[10px] font-medium">
        New
      </span>
    );
  }

  return (
    <div className="rounded border border-border/40 overflow-hidden text-[10px]" onClick={(e) => e.stopPropagation()}>
      <div className="grid grid-cols-[1fr_28px_28px_28px] items-center bg-muted/50 px-1.5 py-0.5">
        <span className="font-bold text-muted-foreground text-[8px] uppercase">Courier</span>
        <span className="font-bold text-muted-foreground text-[8px] text-center">T</span>
        <span className="font-bold text-emerald-600 text-[8px] text-center">S</span>
        <span className="font-bold text-destructive text-[8px] text-center">C</span>
      </div>
      {couriers.filter((c: any) => c.total_parcel > 0).map((c: any, i: number) => (
        <div key={c.k} className={`grid grid-cols-[1fr_28px_28px_28px] items-center px-1.5 py-[3px] ${i % 2 === 0 ? "bg-background" : "bg-muted/20"}`}>
          <div className="flex items-center">
            {COURIER_LOGOS[c.k] ? (
              <img src={COURIER_LOGOS[c.k]} alt={c.k} className="h-3 w-auto max-w-[36px] object-contain" loading="lazy" />
            ) : (
              <span className="font-bold text-foreground text-[9px]">{c.name || c.k}</span>
            )}
          </div>
          <span className="font-extrabold text-foreground text-center">{c.total_parcel}</span>
          <span className="font-extrabold text-emerald-600 text-center">{c.success_parcel}</span>
          <span className="font-extrabold text-destructive text-center">{c.cancelled_parcel}</span>
        </div>
      ))}
      {summary && (
        <div className="grid grid-cols-[1fr_28px_28px_28px] items-center px-1.5 py-[3px] bg-muted/40 border-t border-border/40">
          <span className="font-extrabold text-foreground text-[9px]">Total</span>
          <span className="font-extrabold text-foreground text-center">{summary.total_parcel}</span>
          <span className="font-extrabold text-emerald-600 text-center">{summary.success_parcel}</span>
          <span className="font-extrabold text-destructive text-center">{summary.cancelled_parcel}</span>
        </div>
      )}
    </div>
  );
});
