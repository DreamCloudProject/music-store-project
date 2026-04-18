import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { SearchField } from "@/shared/ui/search-field";

function SearchFieldSurface({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#181818] p-10 text-white">{children}</div>
  );
}

const meta = {
  title: "Shared/UI/SearchField",
  component: SearchField,
  render: (args) => (
    <SearchFieldSurface>
      <div className="max-w-[600px]">
        <SearchField {...args} />
      </div>
    </SearchFieldSurface>
  ),
} satisfies Meta<typeof SearchField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole("searchbox", { name: "Поиск по трекам" }),
    ).toHaveAttribute("name", "search");
    await expect(
      canvas.getByRole("button", { name: "Искать" }),
    ).toHaveAttribute("type", "submit");
  },
};

export const WithOverrides: Story = {
  args: {
    wrapperClassName: "wrapper-test-class",
    className: "input-test-class",
    iconButtonProps: {
      "aria-label": "Запустить поиск",
      className: "icon-test-class",
      type: "button",
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const searchbox = canvas.getByRole("searchbox", {
      name: "Поиск по трекам",
    });
    const button = canvas.getByRole("button", { name: "Запустить поиск" });

    await expect(searchbox).toHaveClass("input-test-class");
    await expect(searchbox.closest('[data-slot="input-group"]')).toHaveClass(
      "wrapper-test-class",
    );
    await expect(button).toHaveClass("icon-test-class");
    await expect(button).toHaveAttribute("type", "button");
  },
};
