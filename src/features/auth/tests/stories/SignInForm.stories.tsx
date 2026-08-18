import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import { handlers } from "@/app/tests";

import { useAuthStore } from "../../model/auth-store";
import { AuthLayout } from "../../ui/auth-layout";
import { SignInForm } from "../../ui/sign-in-form";
import { AuthScreens } from "../../tests/stories/auth-screens";

function SignInSurface() {
  return (
    <AuthLayout>
      <SignInForm />
    </AuthLayout>
  );
}

const meta = {
  title: "Features/Auth/SignInForm",
  component: SignInForm,
  render: () => <SignInSurface />,
  parameters: {
    initialEntry: "/sign-in",
    msw: { handlers },
  },
  beforeEach: () => {
    useAuthStore.getState().clearSession();
    return () => {
      useAuthStore.getState().clearSession();
    };
  },
} satisfies Meta<typeof SignInForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WrongPassword: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByPlaceholderText("Логин"), "nobody@x.y");
    await userEvent.type(canvas.getByPlaceholderText("Пароль"), "wrong");
    await userEvent.click(canvas.getByRole("button", { name: "Войти" }));
    await expect(
      canvas.findByText("Неверный email или пароль"),
    ).resolves.toBeVisible();
  },
};

export const SuccessfulLogin: Story = {
  render: () => <AuthScreens />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(
      await canvas.findByPlaceholderText("Логин"),
      "demo@music.store",
    );
    await userEvent.type(canvas.getByPlaceholderText("Пароль"), "password");
    await userEvent.click(canvas.getByRole("button", { name: "Войти" }));
    await expect(
      canvas.findByRole("heading", { name: "Треки" }),
    ).resolves.toBeVisible();
  },
};
