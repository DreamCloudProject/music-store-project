import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { handlers } from "@/app/mocks/handlers";

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
  parameters: {
    msw: {
      handlers,
    },
  },
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
        name: "Выбрать исполнителя",
      }),
    );

    const artistItem = await body.findByRole("menuitemcheckbox", {
      name: "FaderX",
    });

    await userEvent.click(artistItem);
    await expect(artistItem).toHaveAttribute("aria-checked", "true");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => {
      expect(body.queryByRole("menu")).not.toBeInTheDocument();
    });

    await expect(
      canvas.getByRole("button", {
        name: "Выбрать исполнителя, 1 в наборе",
      }),
    ).toBeVisible();

    await userEvent.click(
      canvas.getByRole("button", {
        name: "Выбрать жанр",
      }),
    );

    const genreItem = await body.findByRole("menuitemcheckbox", {
      name: "EDM",
    });

    await userEvent.click(genreItem);
    await expect(genreItem).toHaveAttribute("aria-checked", "true");
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
