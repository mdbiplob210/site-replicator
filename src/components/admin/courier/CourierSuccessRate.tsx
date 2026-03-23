import { useState, useEffect, useRef, memo } from "react";
import { fetchCourierCheck, getCourierCacheEntry, clearCourierCache } from "@/lib/courierCheckCache";
import { RefreshCw, Loader2, Truck } from "lucide-react";

const COURIER_LOGOS: Record<string, string> = {
  pathao: "https://api.bdcourier.com/c-logo/pathao-logo.png",
  steadfast: "https://api.bdcourier.com/c-logo/steadfast-logo.png",
};

const ALLOWED_COURIERS = new Set(["pathao", "steadfast"]);

interface Props { phone: string | null | undefined; compact?: boolean; }

export const CourierSuccessRate = memo(function CourierSuccessRate({ phone }: Props) {
  const clean = phone?.replace(/\D/g, "") || "";
  const ok = clean.length >= 11;

  const [data, setData] = useState<any>(() => ok ? getCourierCacheEntry(clean) : null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const lastRef = useRef("");
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const doFetch = (force = false) => {
    if (!ok) return;
    if (force) clearCourierCache(clean);
    
    const cached = getCourierCacheEntry(clean);
    if (!force && cached) { setData(cached); setErr(""); setLoading(false); return; }
    
    setLoading(true); setErr("");
    fetchCourierCheck(clean).then((r) => {
      if (mountedRef.current && lastRef.current === clean) {
        if (r) { setData(r); setErr(""); }
        else setErr("Error");
        setLoading(false);
      }
    });
  };

  useEffect(() => {
    if (!ok) { setData(null); setErr(""); setLoading(false); lastRef.current = ""; return; }
    if (lastRef.current === clean) return;
    lastRef.current = clean;
    
    const cached = getCourierCacheEntry(clean);
    if (cached) { setData(cached); setLoading(false); return; }
    
    setData(null); setLoading(true); setErr("");
    fetchCourierCheck(clean).then((r) => {
      if (mountedRef.current && lastRef.current === clean) {
        if (r) { setData(r); setErr(""); }
        else setErr("Error");
        setLoading(false);
      }
    });
  }, [clean, ok]);

  if (!ok) return null;

  const allCouriers = data?.status === "success" && data.data
    ? Object.entries(data.data).filter(([k]) => k !== "summary" && ALLOWED_COURIERS.has(k)).map(([k, v]: [string, any]) => ({ k, ...v }))
    : [];
  // Calculate summary from filtered couriers only (not API summary which includes all couriers)
  const summary = allCouriers.length > 0 ? {
    total_parcel: allCouriers.reduce((s: number, c: any) => s + (Number(c.total_parcel) || 0), 0),
    success_parcel: allCouriers.reduce((s: number, c: any) => s + (Number(c.success_parcel) || 0), 0),
    cancelled_parcel: allCouriers.reduce((s: number, c: any) => s + (Number(c.cancelled_parcel) || 0), 0),
  } : null;

  return (
    <div className="rounded-lg border border-border/30 overflow-hidden">
      <div className="grid grid-cols-[1fr_60px_60px_60px] items-center bg-primary px-3 py-1.5">
        <span className="text-[10px] font-bold text-primary-foreground uppercase tracking-wide flex items-center gap-1">
          <Truck className="h-3 w-3" /> Courier
        </span>
        <span className="text-[10px] font-bold text-primary-foreground text-center uppercase">Total</span>
        <span className="text-[10px] font-bold text-primary-foreground text-center uppercase">Success</span>
        <span className="text-[10px] font-bold text-primary-foreground text-center uppercase">Cancel</span>
      </div>

      {loading && !data && (
        <div className="px-3 py-4 flex items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}

      {err && <div className="px-3 py-2 text-[9px] text-destructive text-center">{err}</div>}

      {data?.status === "success" && data.data && (
        <>
          {allCouriers.length === 0 ? (
            <div className="px-3 py-3 text-[10px] text-muted-foreground text-center italic">কোনো রেকর্ড নেই</div>
          ) : (
            <div className="divide-y divide-border/20">
              {allCouriers.map((c: any) => (
                <div key={c.k} className="grid grid-cols-[1fr_60px_60px_60px] items-center px-3 py-2 hover:bg-muted/10 transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    {(c.logo || COURIER_LOGOS[c.k]) && (
                      <img src={c.logo || COURIER_LOGOS[c.k]} alt="" className="h-5 w-auto max-w-[60px] object-contain shrink-0" loading="lazy" />
                    )}
                    {!c.logo && !COURIER_LOGOS[c.k] && (
                      <span className="text-[10px] font-bold text-foreground">{c.name}</span>
                    )}
                  </div>
                  <span className="text-xs font-bold text-foreground text-center">{c.total_parcel}</span>
                  <span className="text-xs font-bold text-center text-emerald-600">{c.success_parcel}</span>
                  <span className="text-xs font-bold text-center text-destructive">{c.cancelled_parcel}</span>
                </div>
              ))}
            </div>
          )}

          {summary && (
            <div className="grid grid-cols-[1fr_60px_60px_60px] items-center px-3 py-2 bg-muted/20 border-t border-border/30">
              <span className="text-xs font-extrabold text-foreground flex items-center gap-1">
                Total
                <button
                  className="ml-1 h-4 w-4 rounded flex items-center justify-center hover:bg-primary/10 transition-colors disabled:opacity-30"
                  disabled={loading} onClick={() => doFetch(true)}
                >
                  {loading ? <Loader2 className="h-2.5 w-2.5 animate-spin text-primary" /> : <RefreshCw className="h-2.5 w-2.5 text-muted-foreground" />}
                </button>
              </span>
              <span className="text-xs font-extrabold text-foreground text-center">{summary.total_parcel}</span>
              <span className="text-xs font-extrabold text-center text-emerald-600">{summary.success_parcel}</span>
              <span className="text-xs font-extrabold text-center text-destructive">{summary.cancelled_parcel}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
});
