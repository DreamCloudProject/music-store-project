export interface FilterOption {
  value: string;
  label: string;
}

export interface TrackFiltersResponse {
  genres: FilterOption[];
  years: FilterOption[];
}

export interface ArtistProductsPage {
  items: FilterOption[];
  nextOffset: number | null;
}
