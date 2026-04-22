import { useEffect, useState, type ReactNode } from "react";

import {
  AppContext,
  getSearchQueryFromLocation,
  type AppContextValue,
} from "@/shared/lib/app-context";

import {
  defaultArtistOptions,
  defaultGenreOptions,
} from "@/widgets/tracks-filters";

export function AppProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useState(getSearchQueryFromLocation);
  const [selectedArtists, setSelectedArtists] = useState<string[]>([
    "michael-jackson",
    "frank-sinatra",
  ]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [yearOrder, setYearOrder] =
    useState<AppContextValue["yearOrder"]>("newer");

  useEffect(() => {
    const handlePopState = () => {
      setSearchQuery(getSearchQueryFromLocation());
    };

    globalThis.addEventListener("popstate", handlePopState);
    return () => globalThis.removeEventListener("popstate", handlePopState);
  }, []);

  const value: AppContextValue = {
    searchQuery,
    setSearchQuery,
    selectedArtists,
    setSelectedArtists,
    selectedGenres,
    setSelectedGenres,
    yearOrder,
    setYearOrder,
    artistOptions: defaultArtistOptions,
    genreOptions: defaultGenreOptions,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
