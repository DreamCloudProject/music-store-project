export interface FilterOption {
  value: string;
  label: string;
}

export interface TrackFiltersResponse {
  artists: FilterOption[];
  genres: FilterOption[];
  years: FilterOption[];
}
