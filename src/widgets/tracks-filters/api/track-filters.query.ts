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
    initialData: {
      artists: [
        { value: "FaderX", label: "FaderX" },
        { value: "Sick Individuals", label: "Sick Individuals" },
      ],
      genres: [{ value: "edm", label: "EDM" }],
      years: [
        { value: "newer", label: "Более новые" },
        { value: "older", label: "Более старые" },
      ],
    },
    staleTime: 0,
    gcTime: 1000 * 60 * 5,
  });
}
