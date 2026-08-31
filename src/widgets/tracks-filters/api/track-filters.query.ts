import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import {
  fetchArtistProductsPage,
  fetchTrackFilters,
} from "../api/track-filters.api";
import type { TrackFiltersResponse } from "../api/track-filters.types";

export function useTrackFiltersQuery() {
  return useQuery<
    TrackFiltersResponse,
    Error,
    TrackFiltersResponse,
    readonly ["track-filters"]
  >({
    queryKey: ["track-filters"],
    queryFn: fetchTrackFilters,
    placeholderData: {
      genres: [{ value: "dance-pop", label: "Dance Pop" }],
      years: [
        { value: "newer", label: "Более новые" },
        { value: "older", label: "Более старые" },
      ],
    },
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    gcTime: 1000 * 60 * 5,
  });
}

export function useArtistProductsQuery() {
  return useInfiniteQuery({
    queryKey: ["track-filters", "artists"] as const,
    queryFn: ({ pageParam }) =>
      fetchArtistProductsPage({ offset: pageParam, limit: 5 }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
    placeholderData: {
      pages: [{ items: [], nextOffset: null }],
      pageParams: [0],
    },
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    gcTime: 1000 * 60 * 5,
  });
}
