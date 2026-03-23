import { useQuery, type QueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

type LocationItem = { id: string | number; name: string };
type CourierLocationAction = "cities" | "zones" | "areas";

const LOCATION_STALE_TIME = 30 * 60 * 1000;
const LOCATION_GC_TIME = 6 * 60 * 60 * 1000;

const getCourierLocationQueryKey = (
  providerId: string | null,
  action: CourierLocationAction,
  cityId?: string | number | null,
  zoneId?: string | number | null,
  hasAccessToken?: boolean,
) => ["courier-location", providerId, action, cityId ?? null, zoneId ?? null, Boolean(hasAccessToken)] as const;

async function fetchCourierLocations(
  accessToken: string,
  providerId: string,
  action: CourierLocationAction,
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

export async function prefetchCourierLocations(
  queryClient: QueryClient,
  accessToken: string,
  providerId: string,
  action: CourierLocationAction,
  cityId?: string | number | null,
  zoneId?: string | number | null,
) {
  if (!accessToken || !providerId) return;
  if (action === "zones" && !cityId) return;
  if (action === "areas" && !zoneId) return;

  await queryClient.prefetchQuery({
    queryKey: getCourierLocationQueryKey(providerId, action, cityId, zoneId),
    queryFn: () =>
      fetchCourierLocations(
        accessToken,
        providerId,
        action,
        cityId ?? undefined,
        zoneId ?? undefined,
      ),
    staleTime: LOCATION_STALE_TIME,
    gcTime: LOCATION_GC_TIME,
  });
}

export function useCourierCities(providerId: string | null) {
  const { session, loading } = useAuth();

  return useQuery({
    queryKey: getCourierLocationQueryKey(providerId, "cities"),
    queryKey: getCourierLocationQueryKey(providerId, "cities", null, null, Boolean(session?.access_token)),
    queryFn: () => fetchCourierLocations(session!.access_token, providerId!, "cities"),
    enabled: !!providerId && !!session?.access_token && !loading,
    staleTime: LOCATION_STALE_TIME,
    gcTime: LOCATION_GC_TIME,
    retry: 2,
  });
}

export function useCourierZones(providerId: string | null, cityId: string | number | null) {
  const { session, loading } = useAuth();

  return useQuery({
    queryKey: getCourierLocationQueryKey(providerId, "zones", cityId, null, Boolean(session?.access_token)),
    queryFn: () => fetchCourierLocations(session!.access_token, providerId!, "zones", cityId!),
    enabled: !!providerId && !!cityId && !!session?.access_token && !loading,
    staleTime: LOCATION_STALE_TIME,
    gcTime: LOCATION_GC_TIME,
    retry: 2,
  });
}

export function useCourierAreas(providerId: string | null, zoneId: string | number | null) {
  const { session, loading } = useAuth();

  return useQuery({
    queryKey: getCourierLocationQueryKey(providerId, "areas", null, zoneId, Boolean(session?.access_token)),
    queryFn: () => fetchCourierLocations(session!.access_token, providerId!, "areas", undefined, zoneId!),
    enabled: !!providerId && !!zoneId && !!session?.access_token && !loading,
    staleTime: LOCATION_STALE_TIME,
    gcTime: LOCATION_GC_TIME,
    retry: 2,
  });
}
