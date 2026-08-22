import { useQuery } from "@tanstack/react-query";

import { fetchTrackFilters } from "../api/track-filters.api";
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
      artists: [
        { value: "Ed Sheeran", label: "Ed Sheeran" },
        { value: "Maroon 5", label: "Maroon 5" },
      ],
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
