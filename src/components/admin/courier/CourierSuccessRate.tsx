import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw, Loader2, Truck } from "lucide-react";

// Animated circular gauge with gradient stroke
function CircularGauge({ percentage, size = 72, strokeWidth = 6, label }: { percentage: number; size?: number; strokeWidth?: number; label?: string }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const gradId = `gauge-${label || "g"}-${percentage}`;

  const color1 = percentage >= 70 ? "#2563eb" : percentage >= 40 ? "#f59e0b" : "#ef4444";
  const color2 = percentage >= 70 ? "#3b82f6" : percentage >= 40 ? "#fbbf24" : "#f87171";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color1} />
            <stop offset="100%" stopColor={color2} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--muted) / 0.4)" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[11px] font-extrabold text-foreground">{percentage}%</span>
      </div>
    </div>
  );
}

// In-memory cache
const courierCache: Record<string, { data: any; ts: number }> = {};
const CACHE_TTL = 10 * 60 * 1000; // 10 min

interface CourierSuccessRateProps {
  phone: string | null | undefined;
  compact?: boolean;
}

export function CourierSuccessRate({ phone, compact = false }: CourierSuccessRateProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const lastPhoneRef = useRef("");

  const cleanPhone = phone?.replace(/\D/g, "") || "";
  const isValid = cleanPhone.length >= 11;

  const fetchData = useCallback(async (force = false) => {
    if (!isValid) return;

    // Instant cache hit
    const cached = courierCache[cleanPhone];
    if (!force && cached && Date.now() - cached.ts < CACHE_TTL) {
      setData(cached.data);
      setError("");
      return;
    }

    // Abort previous in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError("");
    try {
      const { data: result, error: fnError } = await supabase.functions.invoke("bd-courier-check", {
        body: { phone: cleanPhone },
      });
      if (controller.signal.aborted) return;
      if (fnError) throw fnError;
      setData(result);
      courierCache[cleanPhone] = { data: result, ts: Date.now() };
    } catch (err: any) {
      if (!controller.signal.aborted) setError(err.message || "Failed");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [cleanPhone, isValid]);

  // Auto-fetch instantly when phone changes — no debounce for speed
  useEffect(() => {
    if (isValid && lastPhoneRef.current !== cleanPhone) {
      lastPhoneRef.current = cleanPhone;
      fetchData();
    }
    if (!isValid) {
      setData(null);
      setError("");
      lastPhoneRef.current = "";
    }
    return () => { abortRef.current?.abort(); };
  }, [cleanPhone, isValid, fetchData]);

  if (!isValid) return null;

  // Parse
  const couriers = data?.status === "success" && data.data
    ? Object.entries(data.data)
        .filter(([k]) => k !== "summary")
        .map(([k, v]: [string, any]) => ({ key: k, ...v }))
        .filter((c: any) => c.total_parcel > 0)
    : [];
  const summary = data?.data?.summary;
  const gaugeSize = compact ? 56 : 72;
  const allGaugeSize = compact ? 64 : 80;

  return (
    <div className="rounded-xl border border-border/30 bg-card/80 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/20 bg-muted/20">
        <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
          <Truck className="h-3.5 w-3.5 text-primary" />
          Courier Success Rate
        </h4>
        <button
          className="h-6 w-6 rounded-md flex items-center justify-center hover:bg-primary/10 transition-colors disabled:opacity-40"
          disabled={loading}
          onClick={() => fetchData(true)}
        >
          {loading
            ? <Loader2 className="h-3 w-3 animate-spin text-primary" />
            : <RefreshCw className="h-3 w-3 text-muted-foreground hover:text-primary transition-colors" />
          }
        </button>
      </div>

      {/* Body */}
      <div className="px-3 py-3">
        {/* Loading skeleton */}
        {loading && !data && (
          <div className="flex items-center justify-center gap-4 py-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex flex-col items-center gap-1.5 animate-pulse">
                <div className="rounded-full bg-muted/60" style={{ width: gaugeSize, height: gaugeSize }} />
                <div className="h-2 w-12 rounded bg-muted/60" />
                <div className="h-2 w-10 rounded bg-muted/40" />
              </div>
            ))}
          </div>
        )}

        {error && <p className="text-[10px] text-destructive text-center py-1">{error}</p>}

        {data?.status === "success" && data.data && (
          couriers.length === 0 && !summary?.total_parcel ? (
            <p className="text-[10px] text-muted-foreground italic text-center py-1">কোনো কুরিয়ার রেকর্ড নেই</p>
          ) : (
            <div className="flex flex-wrap items-start justify-center gap-4">
              {couriers.map((c: any) => (
                <div key={c.key} className="flex flex-col items-center gap-1.5 min-w-[65px]">
                  <CircularGauge percentage={c.success_ratio || 0} size={gaugeSize} strokeWidth={5} label={c.key} />
                  <span className="text-[11px] font-bold text-foreground leading-none">{c.name}</span>
                  <div className="text-[10px] text-muted-foreground text-center leading-snug space-y-px">
                    <div><span className="font-semibold text-foreground">Total:</span> {c.total_parcel}</div>
                    <div><span className="font-semibold" style={{ color: "#16a34a" }}>Success:</span> {c.success_parcel}</div>
                    <div><span className="font-semibold" style={{ color: "#ef4444" }}>Failed:</span> {c.cancelled_parcel}</div>
                  </div>
                </div>
              ))}

              {summary && summary.total_parcel > 0 && (
                <div className="flex flex-col items-center gap-1.5 min-w-[65px]">
                  <CircularGauge percentage={summary.success_ratio || 0} size={allGaugeSize} strokeWidth={6} label="all" />
                  <span className="text-[11px] font-extrabold text-foreground leading-none">All</span>
                  <div className="text-[10px] text-muted-foreground text-center leading-snug space-y-px">
                    <div><span className="font-semibold text-foreground">Total:</span> {summary.total_parcel}</div>
                    <div><span className="font-semibold" style={{ color: "#16a34a" }}>Success:</span> {summary.success_parcel}</div>
                    <div><span className="font-semibold" style={{ color: "#ef4444" }}>Failed:</span> {summary.cancelled_parcel}</div>
                  </div>
                </div>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
}
