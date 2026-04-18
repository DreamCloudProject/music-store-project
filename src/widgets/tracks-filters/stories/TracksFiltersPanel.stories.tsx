import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { TracksFiltersPanel } from "../ui/TracksFiltersPanel";

function FiltersSurface() {
  return (
    <div className="min-h-screen bg-[#181818] p-9 text-white">
      <TracksFiltersPanel />
    </div>
  );
}

const meta = {
  title: "Widgets/TracksFilters/TracksFiltersPanel",
  component: TracksFiltersPanel,
  render: () => <FiltersSurface />,
} satisfies Meta<typeof TracksFiltersPanel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const UpdatesTriggerLabels: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(
      canvas.getByRole("button", {
        name: "Выбрать исполнителя, 2 в наборе",
      }),
    );

    const calvinHarrisItem = body.getByRole("menuitemcheckbox", {
      name: "Calvin Harris",
    });

    await userEvent.click(calvinHarrisItem);
    await expect(calvinHarrisItem).toHaveAttribute("aria-checked", "true");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => {
      expect(body.queryByRole("menu")).not.toBeInTheDocument();
    });

    await expect(
      canvas.getByRole("button", {
        name: "Выбрать исполнителя, 3 в наборе",
      }),
    ).toBeVisible();

    await userEvent.click(
      canvas.getByRole("button", {
        name: "Выбрать жанр",
      }),
    );

    const rockItem = body.getByRole("menuitemcheckbox", {
      name: "Рок",
    });

    await userEvent.click(rockItem);
    await expect(rockItem).toHaveAttribute("aria-checked", "true");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => {
      expect(body.queryByRole("menu")).not.toBeInTheDocument();
    });

    await expect(
      canvas.getByRole("button", {
        name: "Выбрать жанр, 1 в наборе",
      }),
    ).toBeVisible();
  },
};
