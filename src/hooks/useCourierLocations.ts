import { useQuery } from "@tanstack/react-query";

type LocationItem = { id: string | number; name: string };

async function fetchCourierLocations(
  providerId: string,
  action: "cities" | "zones" | "areas",
  cityId?: string | number,
  zoneId?: string | number
): Promise<LocationItem[]> {
  const params = new URLSearchParams({
    provider_id: providerId,
    action,
  });
  if (cityId) params.set("city_id", String(cityId));
  if (zoneId) params.set("zone_id", String(zoneId));

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const url = `https://${projectId}.supabase.co/functions/v1/courier-locations?${params.toString()}`;

  const resp = await fetch(url, {
    headers: {
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
  });

  if (!resp.ok) {
    const errData = await resp.json().catch(() => ({}));
    console.warn(`Courier locations [${action}]:`, errData.error || resp.status);
    return []; // Return empty instead of throwing to avoid blank screen
  }

  const result = await resp.json();
  return result.data || [];
}

export function useCourierCities(providerId: string | null) {
  return useQuery({
    queryKey: ["courier-cities", providerId],
    queryFn: () => fetchCourierLocations(providerId!, "cities"),
    enabled: !!providerId,
    staleTime: 10 * 60 * 1000, // Cache 10 minutes
  });
}

export function useCourierZones(providerId: string | null, cityId: string | number | null) {
  return useQuery({
    queryKey: ["courier-zones", providerId, cityId],
    queryFn: () => fetchCourierLocations(providerId!, "zones", cityId!),
    enabled: !!providerId && !!cityId,
    staleTime: 10 * 60 * 1000,
  });
}

export function useCourierAreas(providerId: string | null, zoneId: string | number | null) {
  return useQuery({
    queryKey: ["courier-areas", providerId, zoneId],
    queryFn: () => fetchCourierLocations(providerId!, "areas", undefined, zoneId!),
    enabled: !!providerId && !!zoneId,
    staleTime: 10 * 60 * 1000,
  });
}
