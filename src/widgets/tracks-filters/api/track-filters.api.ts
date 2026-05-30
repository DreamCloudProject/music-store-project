import type { TrackFiltersResponse } from "../api/track-filters.types";

export async function fetchTrackFilters(): Promise<TrackFiltersResponse> {
  const response = await fetch(
    new URL(
      "tracks/filters",
      new URL(import.meta.env.VITE_API_BASE_URL, location.origin),
    ),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Site-Context": "site",
        "Lang-Context": "ru",
      },
      body: JSON.stringify({
        beanId: "searchManagerServiceImpl",
        scope: "PROTOTYPE",
        functionName: "filters",
        args: [{}],
      }),
    },
  );
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP ${response.status}`);
  }
  return response.json() as Promise<TrackFiltersResponse>;
}
