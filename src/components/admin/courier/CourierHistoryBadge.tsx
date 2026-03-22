import { useState, useEffect, useCallback, useRef, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
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

// In-memory cache shared across all instances
const cache: Record<string, { d: any; t: number }> = {};
const TTL = 10 * 60 * 1000;

interface Props {
  phone: string | null | undefined;
}

export const CourierHistoryBadge = memo(function CourierHistoryBadge({ phone }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const lastRef = useRef("");

  const clean = phone?.replace(/\D/g, "") || "";
  const ok = clean.length >= 11;

  const fetchData = useCallback(async () => {
    if (!ok) return;
    const c = cache[clean];
    if (c && Date.now() - c.t < TTL) { setData(c.d); return; }
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    try {
      const { data: r, error: e } = await supabase.functions.invoke("bd-courier-check", { body: { phone: clean } });
      if (ctrl.signal.aborted) return;
      if (e) throw e;
      setData(r); cache[clean] = { d: r, t: Date.now() };
    } catch {
      // silently fail
    } finally {
      if (!ctrl.signal.aborted) setLoading(false);
    }
  }, [clean, ok]);

  useEffect(() => {
    if (ok && lastRef.current !== clean) { lastRef.current = clean; fetchData(); }
    if (!ok) { setData(null); lastRef.current = ""; }
    return () => { abortRef.current?.abort(); };
  }, [clean, ok, fetchData]);

  if (!ok) return <span className="text-[10px] text-muted-foreground">—</span>;
  if (loading && !data) return <Loader2 className="h-3 w-3 animate-spin text-muted-foreground mx-auto" />;

  const SHOW_COURIERS = new Set(["pathao", "steadfast"]);
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
    <div className="space-y-0.5" onClick={(e) => e.stopPropagation()}>
      {couriers.filter((c: any) => c.total_parcel > 0).map((c: any) => (
        <div key={c.k} className="flex items-center justify-center gap-1">
          {COURIER_LOGOS[c.k] ? (
            <img src={COURIER_LOGOS[c.k]} alt={c.k} className="h-3.5 w-auto max-w-[40px] object-contain" loading="lazy" />
          ) : (
            <span className="text-[9px] font-semibold text-foreground">{c.name || c.k}</span>
          )}
          <span className="text-[10px] font-bold text-foreground">{c.total_parcel}</span>
          <span className="text-[10px] font-semibold text-emerald-600">{c.success_parcel}✓</span>
          <span className="text-[10px] font-semibold text-destructive">{c.cancelled_parcel}✗</span>
        </div>
      ))}
      {/* Total row */}
      {summary && (
        <div className="flex items-center justify-center gap-1 border-t border-border/30 pt-0.5">
          <span className="text-[9px] font-bold text-muted-foreground">Total</span>
          <span className="text-[10px] font-bold text-foreground">{summary.total_parcel}</span>
          <span className="text-[10px] font-semibold text-emerald-600">{summary.success_parcel}✓</span>
          <span className="text-[10px] font-semibold text-destructive">{summary.cancelled_parcel}✗</span>
        </div>
      )}
    </div>
  );
});
