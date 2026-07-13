import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { HeaderSearch } from "@/widgets/header-search";
import { renderWithProviders } from "@/shared/testing/render";

describe("HeaderSearch", () => {
  it("initializes the input from the search query in the URL", async () => {
    renderWithProviders(<HeaderSearch />, {
      initialEntry: "/?search=metal",
    });

    await waitFor(() => {
      expect(
        screen.getByRole("searchbox", { name: "Поиск по трекам" }),
      ).toHaveValue("metal");
    });
  });

  it("trims the query and updates the URL on submit", async () => {
    const user = userEvent.setup();

    renderWithProviders(<HeaderSearch />);

    const searchbox = await screen.findByRole("searchbox", {
      name: "Поиск по трекам",
    });

    await user.type(searchbox, "  techno  ");
    await user.click(screen.getByRole("button", { name: "Искать" }));

    await waitFor(() => {
      expect(searchbox).toHaveValue("techno");
    });
  });
});
