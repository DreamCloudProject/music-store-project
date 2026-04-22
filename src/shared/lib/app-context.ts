import { createContext } from "react";

export interface FilterOption {
  value: string;
  label: string;
}

type YearOrder = "newer" | "older";

export interface AppContextValue {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  selectedArtists: string[];
  setSelectedArtists: (
    value: string[] | ((prev: string[]) => string[]),
  ) => void;
  selectedGenres: string[];
  setSelectedGenres: (value: string[] | ((prev: string[]) => string[])) => void;
  yearOrder: YearOrder;
  setYearOrder: (value: YearOrder) => void;
  artistOptions: FilterOption[];
  genreOptions: FilterOption[];
}

export const AppContext = createContext<AppContextValue | null>(null);

export function getSearchQueryFromLocation(): string {
  return (
    (globalThis?.location &&
      new URLSearchParams(globalThis.location.search).get("search")) ??
    ""
  );
}
