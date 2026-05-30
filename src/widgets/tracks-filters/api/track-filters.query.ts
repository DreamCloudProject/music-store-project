import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

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
        { value: "faderx", label: "FaderX" },
        { value: "sick-individuals", label: "Sick Individuals" },
      ],
      genres: [{ value: "edm", label: "EDM" }],
      years: [
        { value: "newer", label: "Более новые" },
        { value: "older", label: "Более старые" },
      ],
    },
    select: (raw): TrackFiltersResponse =>
      ((p) => (p.success ? p.data : { artists: [], genres: [], years: [] }))(
        z
          .object({
            artists: z.array(
              z.object({ value: z.string(), label: z.string() }),
            ),
            genres: z.array(z.object({ value: z.string(), label: z.string() })),
            years: z.array(z.object({ value: z.string(), label: z.string() })),
          })
          .safeParse(raw),
      ),
    staleTime: Number.POSITIVE_INFINITY,
  });
}
