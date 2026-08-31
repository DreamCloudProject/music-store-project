import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { HeaderSearch } from "../../";
import { renderWithProviders } from "@/shared/tests";

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

  it("keeps search on my-tracks", async () => {
    const user = userEvent.setup();

    renderWithProviders(<HeaderSearch />, { initialEntry: "/my-tracks" });

    const searchbox = await screen.findByRole("searchbox", {
      name: "Поиск по трекам",
    });

    await user.type(searchbox, "  zhu  ");
    await user.click(screen.getByRole("button", { name: "Искать" }));

    await waitFor(() => {
      expect(searchbox).toHaveValue("zhu");
    });
  });
});
