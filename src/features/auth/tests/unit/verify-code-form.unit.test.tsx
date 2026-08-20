import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { VerifyCodeForm, useAuthStore } from "../../";
import { renderWithProviders } from "@/shared/tests";

afterEach(() => {
  useAuthStore.getState().clearSession();
});

describe("VerifyCodeForm", () => {
  it("shows the username from search and keeps confirm disabled until 6 digits", async () => {
    renderWithProviders(<VerifyCodeForm />, {
      initialEntry: "/verify-code?username=new@music.store",
    });

    expect(
      await screen.findByText(/отправленного на new@music.store/),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Подтвердить" })).toBeDisabled();
  });

  it("shows an error for an invalid code", async () => {
    const user = userEvent.setup({ delay: null });
    renderWithProviders(<VerifyCodeForm />, {
      initialEntry: "/verify-code?username=demo@music.store",
    });

    expect(
      await screen.findByText(/отправленного на demo@music.store/),
    ).toBeInTheDocument();

    const otp = document.querySelector(
      'input[autocomplete="one-time-code"]',
    ) as HTMLInputElement | null;
    expect(otp).toBeTruthy();
    await user.type(otp!, "000000");
    await user.click(screen.getByRole("button", { name: "Подтвердить" }));

    expect(
      await screen.findByText(/Код недействителен|Неверный код/),
    ).toBeInTheDocument();
  });

  it("accepts the demo verification code", async () => {
    const user = userEvent.setup({ delay: null });
    renderWithProviders(<VerifyCodeForm />, {
      initialEntry: "/verify-code?username=demo@music.store",
    });

    expect(
      await screen.findByText(/отправленного на demo@music.store/),
    ).toBeInTheDocument();

    const otp = document.querySelector(
      'input[autocomplete="one-time-code"]',
    ) as HTMLInputElement | null;
    await user.type(otp!, "123456");
    await user.click(screen.getByRole("button", { name: "Подтвердить" }));

    await waitFor(() => {
      expect(
        screen.queryByText(/Код недействителен|Неверный код/),
      ).not.toBeInTheDocument();
    });
  });

  it("shows a success message after resending the code", async () => {
    const user = userEvent.setup({ delay: null });
    renderWithProviders(<VerifyCodeForm />, {
      initialEntry: "/verify-code?username=demo@music.store",
    });

    await user.click(
      await screen.findByRole("button", { name: "Отправить новый код" }),
    );

    expect(
      await screen.findByText("Новый код отправлен на почту"),
    ).toBeInTheDocument();
  });
});
