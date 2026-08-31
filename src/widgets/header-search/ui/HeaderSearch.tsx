import { Debouncer } from "@tanstack/pacer";
import { useMatch, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type SubmitEvent } from "react";

import { SearchField } from "@/shared/ui/search-field";

export function HeaderSearch() {
  const navigate = useNavigate();
  const catalogMatch = useMatch({ from: "/_studio/", shouldThrow: false });
  const myTracksMatch = useMatch({
    from: "/_studio/my-tracks",
    shouldThrow: false,
  });
  const catalogSearch = useSearch({ from: "/_studio/", shouldThrow: false });
  const myTracksSearch = useSearch({
    from: "/_studio/my-tracks",
    shouldThrow: false,
  });
  const urlSearch =
    (myTracksMatch ? myTracksSearch?.search : catalogSearch?.search) ?? "";
  const [search, setSearch] = useState(urlSearch);
  const trimmed = useMemo(() => search.trim(), [search]);
  const lastSearchRef = useRef(urlSearch);
  const debounceRef = useRef<Debouncer<(value: string) => void> | null>(null);

  useEffect(() => {
    debounceRef.current?.cancel();
    debounceRef.current = new Debouncer(
      (value: string) => {
        lastSearchRef.current = value;
        if (myTracksMatch) {
          void navigate({
            to: "/my-tracks",
            search: { search: value },
            replace: true,
          });
          return;
        }
        void navigate({
          to: ".",
          search: ((prev: Record<string, unknown>) => ({
            ...prev,
            search: value,
          })) as never,
          replace: true,
        });
      },
      { wait: 400, key: "header-search-url" },
    );
    return () => {
      debounceRef.current?.cancel();
      debounceRef.current = null;
    };
  }, [myTracksMatch, navigate]);

  useEffect(() => {
    if (urlSearch === lastSearchRef.current) return;
    lastSearchRef.current = urlSearch;
    setSearch(urlSearch);
  }, [urlSearch]);

  useEffect(() => {
    if (trimmed.length === 0) {
      debounceRef.current?.cancel();
      lastSearchRef.current = "";
      if (myTracksMatch) {
        if (!(myTracksSearch?.search ?? "")) return;
        void navigate({
          to: "/my-tracks",
          search: { search: "" },
          replace: true,
        });
        return;
      }
      if (!catalogMatch || !(catalogSearch?.search ?? "")) return;
      void navigate({
        to: ".",
        search: ((prev: Record<string, unknown>) => ({
          ...prev,
          search: "",
        })) as never,
        replace: true,
      });
      return;
    }
    debounceRef.current?.maybeExecute(trimmed);
  }, [
    catalogMatch,
    catalogSearch,
    myTracksMatch,
    myTracksSearch?.search,
    trimmed,
    navigate,
  ]);

  const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    debounceRef.current?.cancel();
    lastSearchRef.current = search.trim();
    setSearch(lastSearchRef.current);
    if (myTracksMatch) {
      void navigate({
        to: "/my-tracks",
        search: { search: lastSearchRef.current },
        replace: false,
      });
      return;
    }
    void navigate({
      to: ".",
      search: ((prev: Record<string, unknown>) => ({
        ...prev,
        search: lastSearchRef.current,
      })) as never,
      replace: false,
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
        className="border-border-muted text-fg placeholder:text-fg-muted hover:shadow-[inset_0_-1px_0_0_var(--border-muted)] focus-visible:shadow-[inset_0_-1px_0_0_var(--border-muted)]"
      />
    </form>
  );
}
