import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export interface FilterOption {
  value: string;
  label: string;
}

const defaultArtistOptions: FilterOption[] = [
  { value: "michael-jackson", label: "Michael Jackson" },
  { value: "frank-sinatra", label: "Frank Sinatra" },
  { value: "calvin-harris", label: "Calvin Harris" },
  { value: "zhu", label: "Zhu" },
  { value: "arctic-monkeys", label: "Arctic Monkeys" },
];

const defaultGenreOptions: FilterOption[] = [
  { value: "rock", label: "Рок" },
  { value: "hiphop", label: "Хип-хоп" },
  { value: "pop", label: "Поп-музыка" },
  { value: "techno", label: "Техно" },
  { value: "indie", label: "Инди" },
];

export type YearOrder = "newer" | "older";

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

const AppContext = createContext<AppContextValue | null>(null);

function getSearchQueryFromLocation(): string {
  return (
    (globalThis?.location &&
      new URLSearchParams(globalThis.location.search).get("search")) ??
    ""
  );
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useState(getSearchQueryFromLocation);
  const [selectedArtists, setSelectedArtists] = useState<string[]>([
    "michael-jackson",
    "frank-sinatra",
  ]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [yearOrder, setYearOrder] = useState<YearOrder>("newer");

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

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
}
