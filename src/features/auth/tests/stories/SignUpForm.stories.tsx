import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import { handlers } from "@/app/tests";

import { useAuthStore } from "../../model/auth-store";
import { AuthLayout } from "../../ui/auth-layout";
import { SignUpForm } from "../../ui/sign-up-form";
import { AuthScreens } from "../../tests/stories/auth-screens";

function SignUpSurface() {
  return (
    <AuthLayout>
      <SignUpForm />
    </AuthLayout>
  );
}

const meta = {
  title: "Features/Auth/SignUpForm",
  component: SignUpForm,
  render: () => <SignUpSurface />,
  parameters: {
    initialEntry: "/sign-up",
    msw: { handlers },
  },
  beforeEach: () => {
    useAuthStore.getState().clearSession();
    return () => {
      useAuthStore.getState().clearSession();
    };
  },
} satisfies Meta<typeof SignUpForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const PasswordMismatch: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByPlaceholderText("Имя"), "Demo");
    await userEvent.type(canvas.getByPlaceholderText("Фамилия"), "User");
    await userEvent.type(canvas.getByPlaceholderText("Логин"), "a@b.c");
    await userEvent.type(canvas.getByPlaceholderText("Пароль"), "password");
    await userEvent.type(
      canvas.getByPlaceholderText("Повторите пароль"),
      "other",
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Зарегистрироваться" }),
    );
    await expect(
      canvas.findByText("Пароли не совпадают"),
    ).resolves.toBeVisible();
  },
};

export const EmailTaken: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByPlaceholderText("Имя"), "Demo");
    await userEvent.type(canvas.getByPlaceholderText("Фамилия"), "User");
    await userEvent.type(
      canvas.getByPlaceholderText("Логин"),
      "demo@music.store",
    );
    await userEvent.type(canvas.getByPlaceholderText("Пароль"), "password");
    await userEvent.type(
      canvas.getByPlaceholderText("Повторите пароль"),
      "password",
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Зарегистрироваться" }),
    );
    await expect(
      canvas.findByText("Этот email уже занят"),
    ).resolves.toBeVisible();
  },
};

export const SuccessfulRegistration: Story = {
  render: () => <AuthScreens />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const email = `story-${crypto.randomUUID()}@music.store`;
    await userEvent.type(await canvas.findByPlaceholderText("Имя"), "Story");
    await userEvent.type(canvas.getByPlaceholderText("Фамилия"), "User");
    await userEvent.type(canvas.getByPlaceholderText("Логин"), email);
    await userEvent.type(canvas.getByPlaceholderText("Пароль"), "password");
    await userEvent.type(
      canvas.getByPlaceholderText("Повторите пароль"),
      "password",
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Зарегистрироваться" }),
    );
    await expect(
      canvas.findByText(new RegExp(`отправленного на ${email}`)),
    ).resolves.toBeVisible();
  },
};
