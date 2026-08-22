import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import { handlers } from "@/app/tests";

import { useAuthStore } from "../../model/auth-store";
import { AuthLayout } from "../../ui/auth-layout";
import { VerifyCodeForm } from "../../ui/verify-code-form";
import { AuthScreens } from "../../tests/stories/auth-screens";

function VerifyCodeSurface() {
  return (
    <AuthLayout>
      <VerifyCodeForm />
    </AuthLayout>
  );
}

const meta = {
  title: "Features/Auth/VerifyCodeForm",
  component: VerifyCodeForm,
  render: () => <VerifyCodeSurface />,
  parameters: {
    initialEntry: "/verify-code?username=demo@music.store",
    msw: { handlers },
  },
  beforeEach: () => {
    useAuthStore.getState().clearSession();
    return () => {
      useAuthStore.getState().clearSession();
    };
  },
} satisfies Meta<typeof VerifyCodeForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const InvalidCode: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const otp = canvasElement.querySelector(
      'input[autocomplete="one-time-code"]',
    );
    await userEvent.type(otp as HTMLInputElement, "000000");
    await userEvent.click(canvas.getByRole("button", { name: "Подтвердить" }));
    await expect(
      canvas.findByText(/Код недействителен|Неверный код/),
    ).resolves.toBeVisible();
  },
};

export const ResendCode: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: "Отправить новый код" }),
    );
    await expect(
      canvas.findByText("Новый код отправлен на почту"),
    ).resolves.toBeVisible();
  },
};

export const SuccessfulCode: Story = {
  render: () => <AuthScreens />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText(/отправленного на demo@music.store/);
    const otp = canvasElement.querySelector(
      'input[autocomplete="one-time-code"]',
    );
    await userEvent.type(otp as HTMLInputElement, "123456");
    await userEvent.click(canvas.getByRole("button", { name: "Подтвердить" }));
    await expect(
      canvas.findByRole("button", { name: "Войти" }),
    ).resolves.toBeVisible();
  },
};
