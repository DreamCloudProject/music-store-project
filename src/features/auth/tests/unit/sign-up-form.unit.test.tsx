import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { SignUpForm, useAuthStore } from "../../";
import { renderWithProviders } from "@/shared/tests";

afterEach(() => {
  useAuthStore.getState().clearSession();
});

describe("SignUpForm", () => {
  it("shows an error when passwords do not match", async () => {
    const user = userEvent.setup({ delay: null });
    renderWithProviders(<SignUpForm />, { initialEntry: "/sign-up" });

    await user.type(await screen.findByPlaceholderText("Имя"), "Demo");
    await user.type(screen.getByPlaceholderText("Фамилия"), "User");
    await user.type(screen.getByPlaceholderText("Логин"), "new@music.store");
    await user.type(screen.getByPlaceholderText("Пароль"), "password");
    await user.type(screen.getByPlaceholderText("Повторите пароль"), "other");
    await user.click(
      screen.getByRole("button", { name: "Зарегистрироваться" }),
    );

    expect(await screen.findByText("Пароли не совпадают")).toBeInTheDocument();
  });

  it("rejects an already active email", async () => {
    const user = userEvent.setup({ delay: null });
    renderWithProviders(<SignUpForm />, { initialEntry: "/sign-up" });

    await user.type(await screen.findByPlaceholderText("Имя"), "Demo");
    await user.type(screen.getByPlaceholderText("Фамилия"), "User");
    await user.type(screen.getByPlaceholderText("Логин"), "demo@music.store");
    await user.type(screen.getByPlaceholderText("Пароль"), "password");
    await user.type(
      screen.getByPlaceholderText("Повторите пароль"),
      "password",
    );
    await user.click(
      screen.getByRole("button", { name: "Зарегистрироваться" }),
    );

    expect(await screen.findByText("Этот email уже занят")).toBeInTheDocument();
  });
});
