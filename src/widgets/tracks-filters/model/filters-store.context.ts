import { createContext, useContext } from "react";

export type YearOrder = "newer" | "older";

export interface TracksFiltersStoreValue {
  selectedArtists: string[];
  setSelectedArtists: (
    value: string[] | ((prev: string[]) => string[]),
  ) => void;
  selectedGenres: string[];
  setSelectedGenres: (value: string[] | ((prev: string[]) => string[])) => void;
  yearOrder: YearOrder;
  setYearOrder: (value: YearOrder) => void;
}

export const TracksFiltersStoreContext =
  createContext<TracksFiltersStoreValue | null>(null);

export function useTracksFiltersStore(): TracksFiltersStoreValue {
  const ctx = useContext(TracksFiltersStoreContext);
  if (!ctx) {
    throw new Error(
      "useTracksFiltersStore must be used within TracksFiltersStoreProvider",
    );
  }
  return ctx;
}
