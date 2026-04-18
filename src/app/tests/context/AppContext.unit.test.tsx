import { render, screen } from "@testing-library/react";
import { act } from "react";
import { describe, expect, it } from "vitest";

import { AppProvider, useAppContext } from "@/app/context/AppContext";

function SearchQueryProbe() {
  const { searchQuery } = useAppContext();

  return <output>{searchQuery}</output>;
}

describe("AppContext", () => {
  it("reads the initial search query from the URL", () => {
    window.history.replaceState({}, "", "/?search=jazz");

    render(
      <AppProvider>
        <SearchQueryProbe />
      </AppProvider>,
    );

    expect(screen.getByText("jazz")).toBeInTheDocument();
  });

  it("updates the search query when popstate fires", () => {
    window.history.replaceState({}, "", "/?search=jazz");

    render(
      <AppProvider>
        <SearchQueryProbe />
      </AppProvider>,
    );

    act(() => {
      window.history.pushState({}, "", "/?search=ambient");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    expect(screen.getByText("ambient")).toBeInTheDocument();
  });
});
