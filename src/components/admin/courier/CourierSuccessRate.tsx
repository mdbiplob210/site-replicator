import { useState, useEffect, useCallback, useRef, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw, Loader2, Truck } from "lucide-react";

const COURIER_LOGOS: Record<string, string> = {
  pathao: "https://api.bdcourier.com/c-logo/pathao-logo.png",
  steadfast: "https://api.bdcourier.com/c-logo/steadfast-logo.png",
};

const ALLOWED_COURIERS = new Set(["pathao", "steadfast"]);

const cache: Record<string, { d: any; t: number }> = {};
const TTL = 10 * 60 * 1000;

interface Props { phone: string | null | undefined; compact?: boolean; }

export const CourierSuccessRate = memo(function CourierSuccessRate({ phone }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const lastRef = useRef("");

  const clean = phone?.replace(/\D/g, "") || "";
  const ok = clean.length >= 11;

  const fetch_ = useCallback(async (force = false) => {
    if (!ok) return;
    const c = cache[clean];
    if (!force && c && Date.now() - c.t < TTL) { setData(c.d); setErr(""); return; }
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true); setErr("");
    try {
      const { data: r, error: e } = await supabase.functions.invoke("bd-courier-check", { body: { phone: clean } });
      if (ctrl.signal.aborted) return;
      if (e) throw e;
      setData(r); cache[clean] = { d: r, t: Date.now() };
    } catch (e: any) {
      if (!ctrl.signal.aborted) setErr(e.message || "Error");
    } finally {
      if (!ctrl.signal.aborted) setLoading(false);
    }
  }, [clean, ok]);

  useEffect(() => {
    if (ok && lastRef.current !== clean) { lastRef.current = clean; setData(null); setLoading(true); setErr(""); fetch_(); }
    if (!ok) { setData(null); setErr(""); setLoading(false); lastRef.current = ""; }
    return () => { abortRef.current?.abort(); };
  }, [clean, ok, fetch_]);

  if (!ok) return null;

  const allCouriers = data?.status === "success" && data.data
    ? Object.entries(data.data).filter(([k]) => k !== "summary" && ALLOWED_COURIERS.has(k)).map(([k, v]: [string, any]) => ({ k, ...v }))
    : [];
  const summary = data?.data?.summary;

  return (
    <div className="rounded-lg border border-border/30 overflow-hidden">
      {/* Blue header row */}
      <div className="grid grid-cols-[1fr_60px_60px_60px] items-center bg-primary px-3 py-1.5">
        <span className="text-[10px] font-bold text-primary-foreground uppercase tracking-wide flex items-center gap-1">
          <Truck className="h-3 w-3" /> Courier
        </span>
        <span className="text-[10px] font-bold text-primary-foreground text-center uppercase">Total</span>
        <span className="text-[10px] font-bold text-primary-foreground text-center uppercase">Success</span>
        <span className="text-[10px] font-bold text-primary-foreground text-center uppercase">Cancel</span>
      </div>

      {/* Loading */}
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
                  <span className="text-xs font-bold text-center" style={{ color: "#16a34a" }}>{c.success_parcel}</span>
                  <span className="text-xs font-bold text-center" style={{ color: "#ef4444" }}>{c.cancelled_parcel}</span>
                </div>
              ))}
            </div>
          )}

          {/* Total footer row */}
          {summary && (
            <div className="grid grid-cols-[1fr_60px_60px_60px] items-center px-3 py-2 bg-muted/20 border-t border-border/30">
              <span className="text-xs font-extrabold text-foreground flex items-center gap-1">
                Total
                <button
                  className="ml-1 h-4 w-4 rounded flex items-center justify-center hover:bg-primary/10 transition-colors disabled:opacity-30"
                  disabled={loading} onClick={() => fetch_(true)}
                >
                  {loading ? <Loader2 className="h-2.5 w-2.5 animate-spin text-primary" /> : <RefreshCw className="h-2.5 w-2.5 text-muted-foreground" />}
                </button>
              </span>
              <span className="text-xs font-extrabold text-foreground text-center">{summary.total_parcel}</span>
              <span className="text-xs font-extrabold text-center" style={{ color: "#16a34a" }}>{summary.success_parcel}</span>
              <span className="text-xs font-extrabold text-center" style={{ color: "#ef4444" }}>{summary.cancelled_parcel}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
});
