import { useState, useEffect, useCallback, useRef, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw, Loader2, Truck } from "lucide-react";

// Compact circular gauge
const CircularGauge = memo(({ pct, size = 40 }: { pct: number; size?: number }) => {
  const sw = 3.5;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const off = circ - (pct / 100) * circ;
  const color = pct >= 70 ? "#2563eb" : pct >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="hsl(var(--muted) / 0.3)" strokeWidth={sw} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color}
          strokeWidth={sw} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={off}
          style={{ transition: "stroke-dashoffset 0.5s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-bold text-foreground" style={{ fontSize: size < 44 ? 9 : 10 }}>{pct}%</span>
      </div>
    </div>
  );
});
CircularGauge.displayName = "CircularGauge";

// Courier logos from bdcourier API
const COURIER_LOGOS: Record<string, string> = {
  pathao: "https://api.bdcourier.com/c-logo/pathao-logo.png",
  steadfast: "https://api.bdcourier.com/c-logo/steadfast-logo.png",
  redx: "https://api.bdcourier.com/c-logo/redx-logo.png",
  paperfly: "https://api.bdcourier.com/c-logo/paperfly-logo.png",
  ecourier: "https://api.bdcourier.com/c-logo/ecourier-logo.png",
  sundarban: "https://api.bdcourier.com/c-logo/sundarban-logo.png",
  delhivery: "https://api.bdcourier.com/c-logo/delhivery-logo.png",
};

// In-memory cache
const cache: Record<string, { d: any; t: number }> = {};
const TTL = 10 * 60 * 1000;

interface Props {
  phone: string | null | undefined;
  compact?: boolean;
}

export const CourierSuccessRate = memo(function CourierSuccessRate({ phone, compact }: Props) {
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
      setData(r);
      cache[clean] = { d: r, t: Date.now() };
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
      {/* Header — slim */}
      <div className="flex items-center justify-between px-2.5 py-1.5 bg-muted/15 border-b border-border/15">
        <span className="text-[10px] font-bold text-foreground/80 flex items-center gap-1">
          <Truck className="h-3 w-3 text-primary" /> Courier Success Rate
        </span>
        <button
          className="h-5 w-5 rounded flex items-center justify-center hover:bg-primary/10 transition-colors disabled:opacity-30"
          disabled={loading}
          onClick={() => fetch_(true)}
        >
          {loading ? <Loader2 className="h-2.5 w-2.5 animate-spin text-primary" /> : <RefreshCw className="h-2.5 w-2.5 text-muted-foreground" />}
        </button>
      </div>

      <div className="px-2.5 py-2">
        {/* Loading */}
        {loading && !data && (
          <div className="flex items-center justify-center gap-3 py-1">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse flex flex-col items-center gap-1">
                <div className="rounded-full bg-muted/40" style={{ width: 36, height: 36 }} />
                <div className="h-1.5 w-8 rounded bg-muted/40" />
              </div>
            ))}
          </div>
        )}

        {err && <p className="text-[9px] text-destructive text-center">{err}</p>}

        {data?.status === "success" && data.data && (
          couriers.length === 0 && !summary?.total_parcel ? (
            <p className="text-[9px] text-muted-foreground italic text-center py-0.5">কোনো রেকর্ড নেই</p>
          ) : (
            <div className="flex flex-wrap items-start justify-center gap-3">
              {couriers.map((c: any) => (
                <div key={c.k} className="flex flex-col items-center gap-0.5 min-w-[48px]">
                  <CircularGauge pct={c.success_ratio || 0} size={38} />
                  <div className="flex items-center gap-1 mt-0.5">
                    {(c.logo || COURIER_LOGOS[c.k]) && (
                      <img src={c.logo || COURIER_LOGOS[c.k]} alt="" className="h-3 w-3 rounded-sm object-contain" loading="lazy" />
                    )}
                    <span className="text-[9px] font-bold text-foreground leading-none">{c.name}</span>
                  </div>
                  <div className="text-[8px] text-muted-foreground text-center leading-tight">
                    <span className="text-foreground font-semibold">{c.total_parcel}</span>
                    {" · "}
                    <span style={{ color: "#16a34a" }}>{c.success_parcel}✓</span>
                    {" "}
                    <span style={{ color: "#ef4444" }}>{c.cancelled_parcel}✗</span>
                  </div>
                </div>
              ))}

              {summary && summary.total_parcel > 0 && (
                <div className="flex flex-col items-center gap-0.5 min-w-[48px]">
                  <CircularGauge pct={summary.success_ratio || 0} size={44} />
                  <span className="text-[9px] font-extrabold text-foreground leading-none mt-0.5">All</span>
                  <div className="text-[8px] text-muted-foreground text-center leading-tight">
                    <span className="text-foreground font-semibold">{summary.total_parcel}</span>
                    {" · "}
                    <span style={{ color: "#16a34a" }}>{summary.success_parcel}✓</span>
                    {" "}
                    <span style={{ color: "#ef4444" }}>{summary.cancelled_parcel}✗</span>
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
