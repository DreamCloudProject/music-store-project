import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { LogoutButton, useAuthStore } from "../../";
import { renderWithProviders } from "@/shared/tests";

afterEach(() => {
  useAuthStore.getState().clearSession();
});

describe("LogoutButton", () => {
  it("clears the session on click", async () => {
    const user = userEvent.setup({ delay: null });
    useAuthStore.getState().setSession({
      token: "msw-token:demo@music.store",
      username: "demo@music.store",
    });

    renderWithProviders(<LogoutButton />);

    await user.click(
      await screen.findByRole("button", { name: "Выйти из аккаунта" }),
    );

    await waitFor(() => {
      expect(useAuthStore.getState().session).toBeNull();
    });
  });
});
