import type { FormEvent } from "react";

import { SearchField } from "@/shared/ui/search-field";

import { useAppContext } from "../context/AppContext";

export function HeaderSearch() {
  const { searchQuery, setSearchQuery } = useAppContext();

  const submitSearch = (query: string) => {
    const url = new URL(window.location.href);

    if (query) url.searchParams.set("search", query);
    else url.searchParams.delete("search");

    const nextUrl = `${url.pathname}${url.search}${url.hash}`;
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;

    if (nextUrl !== currentUrl) {
      window.history.pushState({}, "", nextUrl);
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const nextQuery = searchQuery.trim();
    setSearchQuery(nextQuery);
    submitSearch(nextQuery);
  };

  return (
    <form
      className="flex-1 flex max-w-[1200px]"
      role="search"
      onSubmit={handleSubmit}
    >
      <SearchField
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        iconButtonProps={{
          type: "submit",
          "aria-label": "Искать",
        }}
        className="text-white placeholder:text-[#4e4e4e] border-[#4e4e4e] hover:shadow-[inset_0_-1px_0_0_#4e4e4e] focus-visible:shadow-[inset_0_-1px_0_0_#4e4e4e]"
      />
    </form>
  );
}
