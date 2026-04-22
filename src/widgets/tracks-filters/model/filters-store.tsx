import { useMemo, useState } from "react";

import {
  TracksFiltersStoreContext,
  type TracksFiltersStoreValue,
  type YearOrder,
} from "./filters-store.context";

export function TracksFiltersStoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [selectedArtists, setSelectedArtists] = useState<string[]>([
    "michael-jackson",
    "frank-sinatra",
  ]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [yearOrder, setYearOrder] = useState<YearOrder>("newer");

  const value = useMemo<TracksFiltersStoreValue>(
    () => ({
      selectedArtists,
      setSelectedArtists,
      selectedGenres,
      setSelectedGenres,
      yearOrder,
      setYearOrder,
    }),
    [selectedArtists, selectedGenres, yearOrder],
  );

  return (
    <TracksFiltersStoreContext.Provider value={value}>
      {children}
    </TracksFiltersStoreContext.Provider>
  );
}
