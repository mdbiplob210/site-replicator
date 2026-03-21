import { useState, useEffect, useCallback, useRef, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw, Loader2, Truck } from "lucide-react";

// Compact circular gauge
const CircularGauge = memo(({ pct, size = 36 }: { pct: number; size?: number }) => {
  const sw = 3;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const off = circ - (pct / 100) * circ;
  const color = pct >= 70 ? "#2563eb" : pct >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="hsl(var(--muted) / 0.3)" strokeWidth={sw} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color}
          strokeWidth={sw} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={off}
          style={{ transition: "stroke-dashoffset 0.5s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-bold text-foreground" style={{ fontSize: size < 40 ? 8 : 10 }}>{pct}%</span>
      </div>
    </div>
  );
});
CircularGauge.displayName = "CircularGauge";

const COURIER_LOGOS: Record<string, string> = {
  pathao: "https://api.bdcourier.com/c-logo/pathao-logo.png",
  steadfast: "https://api.bdcourier.com/c-logo/steadfast-logo.png",
  redx: "https://api.bdcourier.com/c-logo/redx-logo.png",
  paperfly: "https://api.bdcourier.com/c-logo/paperfly-logo.png",
  ecourier: "https://api.bdcourier.com/c-logo/ecourier-logo.png",
  sundarban: "https://api.bdcourier.com/c-logo/sundarban-logo.png",
};

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
    if (ok && lastRef.current !== clean) { lastRef.current = clean; fetch_(); }
    if (!ok) { setData(null); setErr(""); lastRef.current = ""; }
    return () => { abortRef.current?.abort(); };
  }, [clean, ok, fetch_]);

  if (!ok) return null;

  const couriers = data?.status === "success" && data.data
    ? Object.entries(data.data).filter(([k]) => k !== "summary").map(([k, v]: [string, any]) => ({ k, ...v })).filter((c: any) => c.total_parcel > 0)
    : [];
  const summary = data?.data?.summary;

  return (
    <div className="rounded-lg border border-border/30 bg-card/60 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-muted/15 border-b border-border/15">
        <span className="text-[10px] font-bold text-foreground/80 flex items-center gap-1">
          <Truck className="h-3 w-3 text-primary" /> Courier Success Rate
        </span>
        <button
          className="h-5 w-5 rounded flex items-center justify-center hover:bg-primary/10 transition-colors disabled:opacity-30"
          disabled={loading} onClick={() => fetch_(true)}
        >
          {loading ? <Loader2 className="h-2.5 w-2.5 animate-spin text-primary" /> : <RefreshCw className="h-2.5 w-2.5 text-muted-foreground" />}
        </button>
      </div>

      <div className="px-3 py-2 space-y-1">
        {/* Loading */}
        {loading && !data && (
          <div className="space-y-1.5 animate-pulse">
            {[1, 2].map(i => <div key={i} className="h-8 rounded-md bg-muted/30" />)}
          </div>
        )}

        {err && <p className="text-[9px] text-destructive text-center">{err}</p>}

        {data?.status === "success" && data.data && (
          couriers.length === 0 && !summary?.total_parcel ? (
            <p className="text-[9px] text-muted-foreground italic text-center py-0.5">কোনো রেকর্ড নেই</p>
          ) : (
            <div className="space-y-1">
              {/* Each courier as a horizontal row */}
              {couriers.map((c: any) => (
                <div key={c.k} className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-muted/10 hover:bg-muted/20 transition-colors">
                  <CircularGauge pct={c.success_ratio || 0} size={34} />
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    {(c.logo || COURIER_LOGOS[c.k]) && (
                      <img src={c.logo || COURIER_LOGOS[c.k]} alt="" className="h-4 w-4 rounded object-contain shrink-0" loading="lazy" />
                    )}
                    <span className="text-xs font-bold text-foreground truncate">{c.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] shrink-0">
                    <span className="font-bold text-foreground">{c.total_parcel}</span>
                    <span className="text-muted-foreground">·</span>
                    <span style={{ color: "#16a34a" }} className="font-semibold">{c.success_parcel}✓</span>
                    <span style={{ color: "#ef4444" }} className="font-semibold">{c.cancelled_parcel}✗</span>
                  </div>
                </div>
              ))}

              {/* All summary row — slightly highlighted */}
              {summary && summary.total_parcel > 0 && (
                <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-primary/5 border border-primary/10">
                  <CircularGauge pct={summary.success_ratio || 0} size={38} />
                  <span className="text-xs font-extrabold text-foreground flex-1">All</span>
                  <div className="flex items-center gap-2 text-[10px] shrink-0">
                    <span className="font-bold text-foreground">{summary.total_parcel}</span>
                    <span className="text-muted-foreground">·</span>
                    <span style={{ color: "#16a34a" }} className="font-bold">{summary.success_parcel}✓</span>
                    <span style={{ color: "#ef4444" }} className="font-bold">{summary.cancelled_parcel}✗</span>
                  </div>
                </div>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
});
