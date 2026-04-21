import { createContext } from "react";

interface FilterOption {
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

export const defaultArtistOptions: FilterOption[] = [
  { value: "michael-jackson", label: "Michael Jackson" },
  { value: "frank-sinatra", label: "Frank Sinatra" },
  { value: "calvin-harris", label: "Calvin Harris" },
  { value: "zhu", label: "Zhu" },
  { value: "arctic-monkeys", label: "Arctic Monkeys" },
];

export const defaultGenreOptions: FilterOption[] = [
  { value: "rock", label: "Рок" },
  { value: "hiphop", label: "Хип-хоп" },
  { value: "pop", label: "Поп-музыка" },
  { value: "techno", label: "Техно" },
  { value: "indie", label: "Инди" },
];

export function getSearchQueryFromLocation(): string {
  return (
    (globalThis?.location &&
      new URLSearchParams(globalThis.location.search).get("search")) ??
    ""
  );
}
