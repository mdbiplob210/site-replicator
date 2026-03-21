import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw, Loader2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";

// Simple circular gauge component
function CircularGauge({ percentage, size = 64, strokeWidth = 5 }: { percentage: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={percentage >= 80 ? "hsl(var(--primary))" : percentage >= 50 ? "hsl(38 92% 50%)" : "hsl(0 84% 60%)"}
          strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-foreground">{percentage}%</span>
      </div>
    </div>
  );
}

// Cache for courier data by phone
const courierCache: Record<string, { data: any; timestamp: number }> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CourierSuccessRateProps {
  phone: string | null | undefined;
  compact?: boolean;
}

export function CourierSuccessRate({ phone, compact = false }: CourierSuccessRateProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fetchedRef = useRef<string>("");

  const cleanPhone = phone?.replace(/\D/g, "") || "";
  const isValidPhone = cleanPhone.length >= 11;

  const fetchData = useCallback(async (force = false) => {
    if (!isValidPhone) return;
    
    // Check cache
    if (!force && courierCache[cleanPhone] && Date.now() - courierCache[cleanPhone].timestamp < CACHE_TTL) {
      setData(courierCache[cleanPhone].data);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const { data: result, error: fnError } = await supabase.functions.invoke("bd-courier-check", {
        body: { phone: cleanPhone },
      });
      if (fnError) throw fnError;
      setData(result);
      courierCache[cleanPhone] = { data: result, timestamp: Date.now() };
    } catch (err: any) {
      setError(err.message || "Failed");
    } finally {
      setLoading(false);
    }
  }, [cleanPhone, isValidPhone]);

  // Auto-fetch when phone changes
  useEffect(() => {
    if (isValidPhone && fetchedRef.current !== cleanPhone) {
      fetchedRef.current = cleanPhone;
      fetchData();
    }
  }, [cleanPhone, isValidPhone, fetchData]);

  if (!isValidPhone) return null;

  // Parse courier data
  const couriers = data?.status === "success" && data.data
    ? Object.entries(data.data)
        .filter(([key]) => key !== "summary")
        .map(([key, val]: [string, any]) => ({ key, ...val }))
    : [];
  const activeCouriers = couriers.filter((c: any) => c.total_parcel > 0);
  const summary = data?.data?.summary;

  return (
    <div className="p-3 rounded-xl border border-border/40 bg-secondary/10 space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
          <Truck className="h-3.5 w-3.5 text-primary" />
          Courier Success Rate
        </h4>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 rounded-lg hover:bg-primary/10"
          disabled={loading}
          onClick={() => fetchData(true)}
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" /> : <RefreshCw className="h-3 w-3 text-muted-foreground" />}
        </Button>
      </div>

      {loading && !data && (
        <div className="flex items-center justify-center py-3">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}

      {error && <p className="text-[10px] text-destructive">{error}</p>}

      {data?.status === "success" && data.data && (
        <>
          {activeCouriers.length === 0 && !summary?.total_parcel ? (
            <p className="text-[10px] text-muted-foreground italic py-1">কোনো কুরিয়ার রেকর্ড নেই</p>
          ) : (
            <div className="flex flex-wrap items-start gap-3 justify-center">
              {/* Individual couriers */}
              {couriers.filter((c: any) => c.total_parcel > 0).map((c: any) => (
                <div key={c.key} className="flex flex-col items-center gap-1 min-w-[60px]">
                  <CircularGauge percentage={c.success_ratio || 0} size={compact ? 48 : 56} strokeWidth={4} />
                  <span className="text-[10px] font-bold text-foreground leading-tight text-center">{c.name}</span>
                  <div className="text-[9px] text-muted-foreground text-center leading-tight">
                    <div><span className="font-semibold">Total:</span> {c.total_parcel}</div>
                    <div><span className="font-semibold text-emerald-600">Success:</span> {c.success_parcel}</div>
                    <div><span className="font-semibold text-red-500">Failed:</span> {c.cancelled_parcel}</div>
                  </div>
                </div>
              ))}

              {/* All summary */}
              {summary && (
                <div className="flex flex-col items-center gap-1 min-w-[60px]">
                  <CircularGauge percentage={summary.success_ratio || 0} size={compact ? 56 : 64} strokeWidth={5} />
                  <span className="text-[10px] font-bold text-foreground leading-tight">All</span>
                  <div className="text-[9px] text-muted-foreground text-center leading-tight">
                    <div><span className="font-semibold">Total:</span> {summary.total_parcel}</div>
                    <div><span className="font-semibold text-emerald-600">Success:</span> {summary.success_parcel}</div>
                    <div><span className="font-semibold text-red-500">Failed:</span> {summary.cancelled_parcel}</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
