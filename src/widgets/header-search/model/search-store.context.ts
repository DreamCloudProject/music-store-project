import { createContext, useContext } from "react";

export interface SearchStoreValue {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  submitSearch: (value: string) => void;
}

export const SearchStoreContext = createContext<SearchStoreValue | null>(null);

export function useSearchStore(): SearchStoreValue {
  const ctx = useContext(SearchStoreContext);
  if (!ctx) {
    throw new Error("useSearchStore must be used within SearchStoreProvider");
  }
  return ctx;
}
