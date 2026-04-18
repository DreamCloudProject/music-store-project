import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { AppProvider } from "@/app/context/AppContext";
import { HeaderSearch } from "@/app/ui/HeaderSearch";

describe("HeaderSearch", () => {
  it("initializes the input from the search query in the URL", () => {
    window.history.replaceState({}, "", "/?search=metal");

    render(
      <AppProvider>
        <HeaderSearch />
      </AppProvider>,
    );

    expect(
      screen.getByRole("searchbox", { name: "Поиск по трекам" }),
    ).toHaveValue("metal");
  });

  it("trims the query and pushes the updated URL on submit", async () => {
    const user = userEvent.setup();
    const pushStateSpy = vi.spyOn(window.history, "pushState");

    render(
      <AppProvider>
        <HeaderSearch />
      </AppProvider>,
    );

    const searchbox = screen.getByRole("searchbox", {
      name: "Поиск по трекам",
    });

    await user.type(searchbox, "  techno  ");
    await user.click(screen.getByRole("button", { name: "Искать" }));

    expect(searchbox).toHaveValue("techno");
    expect(window.location.search).toBe("?search=techno");
    expect(pushStateSpy).toHaveBeenCalledWith({}, "", "/?search=techno");
  });
});
