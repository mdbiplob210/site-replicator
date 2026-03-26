import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  useCourierCities,
  useCourierZones,
  useCourierAreas,
  prefetchCourierLocations,
} from "@/hooks/useCourierLocations";
import {
  extractPathaoLocationHints,
  resolvePathaoLocationMatch,
  findBestPathaoLocationMatch,
  type PathaoLocationItem,
} from "@/lib/pathaoLocationMatching";

export interface PathaoLocationValues {
  cityId: string | null;
  zoneId: string | null;
  areaId: string | null;
  cityName: string;
  zoneName: string;
  areaName: string;
}

interface Props {
  providerId: string;
  address: string;
  value?: Partial<PathaoLocationValues>;
  onChange: (values: PathaoLocationValues) => void;
  compact?: boolean;
  showLabels?: boolean;
  className?: string;
}

export function PathaoLocationSelector({
  providerId,
  address,
  value,
  onChange,
  compact = false,
  showLabels = true,
  className = "",
}: Props) {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const cityId = value?.cityId || null;
  const zoneId = value?.zoneId || null;
  const areaId = value?.areaId || null;
  const cityName = value?.cityName || "";
  const zoneName = value?.zoneName || "";
  const areaName = value?.areaName || "";

  const lastAutoCityRef = useRef<string | null>(null);
  const lastAutoZoneRef = useRef<string | null>(null);
  const lastAutoAreaRef = useRef<string | null>(null);

  // Fetch location data
  const { data: cities = [], isLoading: citiesLoading } = useCourierCities(providerId);
  const { data: zones = [], isLoading: zonesLoading } = useCourierZones(providerId, cityId);
  const { data: areas = [], isLoading: areasLoading } = useCourierAreas(providerId, zoneId);

  const emitChange = useCallback(
    (updates: Partial<PathaoLocationValues>) => {
      onChange({
        cityId: cityId,
        zoneId: zoneId,
        areaId: areaId,
        cityName: cityName,
        zoneName: zoneName,
        areaName: areaName,
        ...updates,
      });
    },
    [onChange, cityId, zoneId, areaId, cityName, zoneName, areaName],
  );

  // Prefetch cities on mount
  useEffect(() => {
    if (providerId && session?.access_token) {
      void prefetchCourierLocations(queryClient, session.access_token, providerId, "cities");
    }
  }, [providerId, session?.access_token, queryClient]);

  // Prefetch zones when city selected
  useEffect(() => {
    if (cityId && session?.access_token && providerId) {
      void prefetchCourierLocations(queryClient, session.access_token, providerId, "zones", cityId);
    }
  }, [cityId, providerId, session?.access_token, queryClient]);

  // Prefetch areas when zone selected
  useEffect(() => {
    if (zoneId && session?.access_token && providerId) {
      void prefetchCourierLocations(queryClient, session.access_token, providerId, "areas", undefined, zoneId);
    }
  }, [zoneId, providerId, session?.access_token, queryClient]);

  // Auto-detect CITY from address
  useEffect(() => {
    if (!address.trim() || citiesLoading || cities.length === 0) return;

    const canAuto = !cityId || cityId === lastAutoCityRef.current;
    if (!canAuto) return;

    const { cityHints } = extractPathaoLocationHints(address);
    const matched = resolvePathaoLocationMatch(
      address,
      cities as PathaoLocationItem[],
      cityHints,
    );

    if (matched) {
      const nextId = String(matched.id);
      if (cityId !== nextId) {
        emitChange({
          cityId: nextId,
          cityName: matched.name,
          zoneId: null,
          zoneName: "",
          areaId: null,
          areaName: "",
        });
      }
      lastAutoCityRef.current = nextId;
    } else if (cityId && cityId === lastAutoCityRef.current) {
      emitChange({ cityId: null, cityName: "", zoneId: null, zoneName: "", areaId: null, areaName: "" });
      lastAutoCityRef.current = null;
    }
  }, [address, citiesLoading, cities, cityId]);

  // Auto-detect ZONE from address
  useEffect(() => {
    if (!cityId || !address.trim() || zonesLoading || zones.length === 0) return;

    // If zone was already set and it still exists in zones list, validate
    if (zoneId && !zonesLoading && zones.length > 0 && !zones.some((z: any) => String(z.id) === zoneId)) {
      emitChange({ zoneId: null, zoneName: "", areaId: null, areaName: "" });
      lastAutoZoneRef.current = null;
      return;
    }

    const canAuto = !zoneId || zoneId === lastAutoZoneRef.current;
    if (!canAuto) return;

    const { zoneHints } = extractPathaoLocationHints(address);
    const matched = resolvePathaoLocationMatch(
      address,
      zones as PathaoLocationItem[],
      zoneHints,
    );

    if (matched) {
      const nextId = String(matched.id);
      if (zoneId !== nextId) {
        emitChange({ zoneId: nextId, zoneName: matched.name, areaId: null, areaName: "" });
      }
      lastAutoZoneRef.current = nextId;
    } else if (zoneId && zoneId === lastAutoZoneRef.current) {
      emitChange({ zoneId: null, zoneName: "", areaId: null, areaName: "" });
      lastAutoZoneRef.current = null;
    }
  }, [address, cityId, zonesLoading, zones, zoneId]);

  // Auto-detect AREA from address
  useEffect(() => {
    if (!zoneId || !address.trim() || areasLoading || areas.length === 0) return;

    const canAuto = !areaId || areaId === lastAutoAreaRef.current;
    if (!canAuto) return;

    const matched = findBestPathaoLocationMatch(address, areas as PathaoLocationItem[]);

    if (matched) {
      const nextId = String(matched.id);
      if (areaId !== nextId) {
        emitChange({ areaId: nextId, areaName: matched.name });
      }
      lastAutoAreaRef.current = nextId;
    } else if (areaId && areaId === lastAutoAreaRef.current) {
      emitChange({ areaId: null, areaName: "" });
      lastAutoAreaRef.current = null;
    }
  }, [address, zoneId, areasLoading, areas, areaId]);

  const allDetected = !!(cityId && zoneId);
  const h = compact ? "h-8" : "h-9";
  const textSize = compact ? "text-xs" : "text-sm";
  const labelSize = compact ? "text-[10px]" : "text-xs";

  return (
    <div className={`space-y-2.5 ${className}`}>
      {/* Status indicator */}
      <div className="flex items-center gap-2">
        <p className={`${labelSize} font-semibold text-muted-foreground flex items-center gap-1.5`}>
          <MapPin className="h-3.5 w-3.5" />
          পাঠাও এরিয়া সিলেক্ট
        </p>
        {citiesLoading ? (
          <Badge variant="outline" className="text-[10px] py-0 gap-1">
            <Loader2 className="h-2.5 w-2.5 animate-spin" /> লোড হচ্ছে...
          </Badge>
        ) : allDetected ? (
          <Badge variant="outline" className="text-[10px] py-0 gap-1 text-green-600 border-green-200 bg-green-50">
            <CheckCircle2 className="h-2.5 w-2.5" /> অটো ডিটেক্ট
          </Badge>
        ) : null}
      </div>

      {/* Dropdowns */}
      <div className="grid grid-cols-3 gap-2">
        {/* City */}
        <div className="space-y-1">
          {showLabels && <Label className={`${labelSize} font-semibold text-muted-foreground`}>সিটি</Label>}
          <Select
            value={cityId || ""}
            onValueChange={(v) => {
              const city = cities.find((c: any) => String(c.id) === v);
              lastAutoCityRef.current = null; // Manual override
              emitChange({
                cityId: v || null,
                cityName: (city as any)?.name || "",
                zoneId: null,
                zoneName: "",
                areaId: null,
                areaName: "",
              });
            }}
          >
            <SelectTrigger className={`rounded-lg ${h} ${textSize}`}>
              <SelectValue
                placeholder={citiesLoading ? "লোড হচ্ছে..." : "সিটি সিলেক্ট"}
              />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {cities.map((c: any) => (
                <SelectItem key={String(c.id)} value={String(c.id)} className={textSize}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Zone */}
        <div className="space-y-1">
          {showLabels && <Label className={`${labelSize} font-semibold text-muted-foreground`}>জোন</Label>}
          <Select
            value={zoneId || ""}
            onValueChange={(v) => {
              const zone = zones.find((z: any) => String(z.id) === v);
              lastAutoZoneRef.current = null; // Manual override
              emitChange({
                zoneId: v || null,
                zoneName: (zone as any)?.name || "",
                areaId: null,
                areaName: "",
              });
            }}
            disabled={!cityId}
          >
            <SelectTrigger className={`rounded-lg ${h} ${textSize}`}>
              <SelectValue
                placeholder={
                  zonesLoading ? "লোড হচ্ছে..." : !cityId ? "আগে সিটি সিলেক্ট করুন" : "জোন সিলেক্ট"
                }
              />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {zones.map((z: any) => (
                <SelectItem key={String(z.id)} value={String(z.id)} className={textSize}>
                  {z.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Area */}
        <div className="space-y-1">
          {showLabels && <Label className={`${labelSize} font-semibold text-muted-foreground`}>এরিয়া</Label>}
          <Select
            value={areaId || ""}
            onValueChange={(v) => {
              const area = areas.find((a: any) => String(a.id) === v);
              lastAutoAreaRef.current = null; // Manual override
              emitChange({
                areaId: v || null,
                areaName: (area as any)?.name || "",
              });
            }}
            disabled={!zoneId}
          >
            <SelectTrigger className={`rounded-lg ${h} ${textSize}`}>
              <SelectValue
                placeholder={
                  areasLoading ? "লোড হচ্ছে..." : !zoneId ? "আগে জোন সিলেক্ট করুন" : "এরিয়া সিলেক্ট"
                }
              />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {areas.map((a: any) => (
                <SelectItem key={String(a.id)} value={String(a.id)} className={textSize}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Auto-detected summary */}
      {(cityName || zoneName || areaName) && (
        <div className={`flex flex-wrap gap-1.5 ${labelSize}`}>
          {cityName && (
            <Badge variant="secondary" className="text-[10px] py-0 font-normal">
              🏙️ {cityName}
            </Badge>
          )}
          {zoneName && (
            <Badge variant="secondary" className="text-[10px] py-0 font-normal">
              📍 {zoneName}
            </Badge>
          )}
          {areaName && (
            <Badge variant="secondary" className="text-[10px] py-0 font-normal">
              🗺️ {areaName}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
