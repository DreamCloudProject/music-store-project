import { useCallback, useMemo, useState } from "react";

import { usePopState } from "@/shared/lib/use-pop-state";

import {
  SearchStoreContext,
  type SearchStoreValue,
} from "../model/search-store.context";

function getSearchQueryFromLocation(): string {
  return (
    (globalThis?.location &&
      new URLSearchParams(globalThis.location.search).get("search")) ??
    ""
  );
}

export function SearchStoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [searchQuery, setSearchQuery] = useState(getSearchQueryFromLocation);

  const submitSearch = useCallback((query: string) => {
    const url = new URL(globalThis.location.href);

    if (query) url.searchParams.set("search", query);
    else url.searchParams.delete("search");

    const nextUrl = `${url.pathname}${url.search}${url.hash}`;
    const currentUrl = `${globalThis.location.pathname}${globalThis.location.search}${globalThis.location.hash}`;

    if (nextUrl !== currentUrl) {
      globalThis.history.pushState({}, "", nextUrl);
    }
  }, []);

  usePopState(
    useCallback(() => {
      setSearchQuery(getSearchQueryFromLocation());
    }, []),
  );

  const value = useMemo<SearchStoreValue>(
    () => ({ searchQuery, setSearchQuery, submitSearch }),
    [searchQuery, submitSearch],
  );

  return (
    <SearchStoreContext.Provider value={value}>
      {children}
    </SearchStoreContext.Provider>
  );
}
