import { Debouncer } from "@tanstack/pacer";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type SubmitEvent } from "react";

import { SearchField } from "@/shared/ui/search-field";

export function HeaderSearch() {
  const navigate = useNavigate({ from: "/" });
  const { search: urlSearch } = useSearch({ from: "/" });
  const [search, setSearch] = useState(urlSearch);
  const trimmed = useMemo(() => search.trim(), [search]);
  const lastSearchRef = useRef(urlSearch);
  const debounceRef = useRef<Debouncer<(value: string) => void> | null>(null);

  useEffect(() => {
    debounceRef.current?.cancel();
    debounceRef.current = new Debouncer(
      (value: string) => {
        lastSearchRef.current = value;
        void navigate({
          search: (prev) => ({ ...prev, search: value }),
          replace: true,
        });
      },
      { wait: 400, key: "header-search-url" },
    );
    return () => {
      debounceRef.current?.cancel();
      debounceRef.current = null;
    };
  }, [navigate]);

  useEffect(() => {
    if (urlSearch === lastSearchRef.current) return;
    lastSearchRef.current = urlSearch;
    setSearch(urlSearch);
  }, [urlSearch]);

  useEffect(() => {
    if (trimmed.length === 0) {
      debounceRef.current?.cancel();
      lastSearchRef.current = "";
      void navigate({
        search: (prev) => ({ ...prev, search: "" }),
        replace: true,
      });
      return;
    }
    debounceRef.current?.maybeExecute(trimmed);
  }, [trimmed, navigate]);

  const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    debounceRef.current?.cancel();
    lastSearchRef.current = search.trim();
    void navigate({
      search: (prev) => ({ ...prev, search: lastSearchRef.current }),
      replace: true,
    });
  };

  return (
    <form
      className="flex-1 flex max-w-[1200px]"
      role="search"
      onSubmit={handleSubmit}
    >
      <SearchField
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        iconButtonProps={{
          type: "submit",
          "aria-label": "Искать",
        }}
        className="text-white placeholder:text-[#4e4e4e] border-[#4e4e4e] hover:shadow-[inset_0_-1px_0_0_#4e4e4e] focus-visible:shadow-[inset_0_-1px_0_0_#4e4e4e]"
      />
    </form>
  );
}
