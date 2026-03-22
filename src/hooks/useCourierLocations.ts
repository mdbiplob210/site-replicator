import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type LocationItem = { id: string | number; name: string };

async function fetchCourierLocations(
  accessToken: string,
  providerId: string,
  action: "cities" | "zones" | "areas",
  cityId?: string | number,
  zoneId?: string | number
): Promise<LocationItem[]> {
  if (!accessToken) {
    throw new Error("Not authenticated");
  }

  const params = new URLSearchParams({
    provider_id: providerId,
    action,
  });
  if (cityId) params.set("city_id", String(cityId));
  if (zoneId) params.set("zone_id", String(zoneId));

  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/courier-locations?${params.toString()}`;

  const resp = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
  });

  if (!resp.ok) {
    const errData = await resp.json().catch(() => ({}));
    throw new Error(errData.error || `Failed to load courier ${action}`);
  }

  const result = await resp.json();
  return result.data || [];
}

export function useCourierCities(providerId: string | null) {
  const { session, loading } = useAuth();

  return useQuery({
    queryKey: ["courier-cities", providerId, session?.access_token],
    queryFn: () => fetchCourierLocations(session!.access_token, providerId!, "cities"),
    enabled: !!providerId && !!session?.access_token && !loading,
    staleTime: 60 * 1000,
    retry: 2,
  });
}

export function useCourierZones(providerId: string | null, cityId: string | number | null) {
  const { session, loading } = useAuth();

  return useQuery({
    queryKey: ["courier-zones", providerId, cityId, session?.access_token],
    queryFn: () => fetchCourierLocations(session!.access_token, providerId!, "zones", cityId!),
    enabled: !!providerId && !!cityId && !!session?.access_token && !loading,
    staleTime: 60 * 1000,
    retry: 2,
  });
}

export function useCourierAreas(providerId: string | null, zoneId: string | number | null) {
  const { session, loading } = useAuth();

  return useQuery({
    queryKey: ["courier-areas", providerId, zoneId, session?.access_token],
    queryFn: () => fetchCourierLocations(session!.access_token, providerId!, "areas", undefined, zoneId!),
    enabled: !!providerId && !!zoneId && !!session?.access_token && !loading,
    staleTime: 60 * 1000,
    retry: 2,
  });
}
