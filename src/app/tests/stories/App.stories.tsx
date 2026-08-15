import type { Meta, StoryObj } from "@storybook/react-vite";

import { useAuthStore } from "@/features/auth";

import { handlers } from "../../tests";
import App from "../../App";

const meta = {
  title: "App/App",
  component: App,
  parameters: {
    msw: {
      handlers,
    },
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
} satisfies Meta<typeof App>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
