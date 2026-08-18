import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { SignInForm, useAuthStore } from "../../";
import { renderWithProviders } from "@/shared/tests";

afterEach(() => {
  useAuthStore.getState().clearSession();
});

describe("SignInForm", () => {
  it("keeps submit disabled until email and password are filled", async () => {
    renderWithProviders(<SignInForm />, { initialEntry: "/sign-in" });

    expect(await screen.findByRole("button", { name: "Войти" })).toBeDisabled();
  });

  it("shows an error for unknown credentials", async () => {
    const user = userEvent.setup({ delay: null });
    renderWithProviders(<SignInForm />, { initialEntry: "/sign-in" });

    await user.type(
      await screen.findByPlaceholderText("Логин"),
      "nobody@music.store",
    );
    await user.type(screen.getByPlaceholderText("Пароль"), "wrong");
    await user.click(screen.getByRole("button", { name: "Войти" }));

    expect(
      await screen.findByText("Неверный email или пароль"),
    ).toBeInTheDocument();
    expect(useAuthStore.getState().session).toBeNull();
  });

  it("stores the session after a successful demo login", async () => {
    const user = userEvent.setup({ delay: null });
    renderWithProviders(<SignInForm />, { initialEntry: "/sign-in" });

    await user.type(
      await screen.findByPlaceholderText("Логин"),
      "demo@music.store",
    );
    await user.type(screen.getByPlaceholderText("Пароль"), "password");
    await user.click(screen.getByRole("button", { name: "Войти" }));

    await waitFor(() => {
      expect(useAuthStore.getState().session).toEqual({
        token: "msw-token:demo@music.store",
        username: "demo@music.store",
      });
    });
  });
});
