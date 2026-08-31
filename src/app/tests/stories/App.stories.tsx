import type { Meta, StoryObj } from "@storybook/react-vite";

import { useAuthStore } from "@/features/auth";
import { TracksPage } from "@/pages/tracks";

import { handlers } from "../../tests";

const meta = {
  title: "Pages/Tracks",
  component: TracksPage,
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
} satisfies Meta<typeof TracksPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
