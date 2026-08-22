import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { handlers } from "@/app/tests";
import { useAuthStore } from "../../model/auth-store";
import { LogoutButton } from "../../ui/logout-button";
import { AuthScreens } from "../../tests/stories/auth-screens";

function LogoutSurface() {
  return (
    <div className="flex min-h-[120px] items-center justify-center bg-[#181818] p-8">
      <LogoutButton />
    </div>
  );
}

const meta = {
  title: "Features/Auth/LogoutButton",
  component: LogoutButton,
  render: () => <LogoutSurface />,
  parameters: {
    msw: { handlers },
  },
  beforeEach: () => {
    useAuthStore.getState().setSession({
      token: "msw-token:demo@music.store",
      username: "demo@music.store",
    });
    return () => {
      useAuthStore.getState().clearSession();
    };
  },
} satisfies Meta<typeof LogoutButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ClearsSession: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: "Выйти из аккаунта" }),
    );
    await waitFor(() => {
      expect(useAuthStore.getState().session).toBeNull();
    });
  },
};

export const SuccessfulLogout: Story = {
  render: () => <AuthScreens />,
  parameters: {
    initialEntry: "/",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole("button", { name: "Выйти из аккаунта" }),
    );
    await expect(
      canvas.findByRole("button", { name: "Войти" }),
    ).resolves.toBeVisible();
  },
};
