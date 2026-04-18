import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { HeaderSearch } from "@/widgets/header-search";

function HeaderSearchSurface() {
  return (
    <div className="min-h-screen bg-[#181818] px-9 pt-[23px] text-white">
      <header className="flex items-center justify-between gap-4 pb-0">
        <HeaderSearch />
      </header>
    </div>
  );
}

const meta = {
  title: "App/HeaderSearch",
  component: HeaderSearch,
  render: () => <HeaderSearchSurface />,
} satisfies Meta<typeof HeaderSearch>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SubmitTrimmedQuery: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const searchbox = canvas.getByRole("searchbox", {
      name: "Поиск по трекам",
    });

    await userEvent.clear(searchbox);
    await userEvent.type(searchbox, "  techno  ");
    await userEvent.click(canvas.getByRole("button", { name: "Искать" }));

    await waitFor(() => {
      expect(searchbox).toHaveValue("techno");
    });
  },
};
