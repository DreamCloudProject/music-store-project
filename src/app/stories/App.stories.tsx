import type { Meta, StoryObj } from "@storybook/react-vite";

import { handlers } from "../mocks/handlers";
import App from "../App";

const meta = {
  title: "App/App",
  component: App,
  parameters: {
    msw: {
      handlers,
    },
  },
} satisfies Meta<typeof App>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
