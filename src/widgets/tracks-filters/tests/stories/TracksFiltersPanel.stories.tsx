import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { handlers } from "@/app/tests";

import { TracksFiltersPanel } from "../../ui/TracksFiltersPanel";

function FiltersSurface() {
  return (
    <div className="min-h-screen bg-[#181818] p-9 text-white">
      <TracksFiltersPanel />
    </div>
  );
}

async function setPreviewWidth(canvasElement: HTMLElement, widthPx: number) {
  const view = canvasElement.ownerDocument.defaultView;
  const iframe = view?.frameElement as HTMLIFrameElement | null;
  if (iframe) {
    iframe.style.width = `${widthPx}px`;
  }
  await new Promise<void>((resolve) => {
    view?.requestAnimationFrame(() => resolve());
  });
}

function visibleButton(
  canvas: ReturnType<typeof within>,
  name: string,
): HTMLElement {
  const matches = canvas
    .getAllByRole("button", { name })
    .filter((el: HTMLElement) => el.getClientRects().length > 0);
  expect(matches.length).toBeGreaterThan(0);
  return matches[0]!;
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
  globals: {
    viewport: { value: "responsive", isRotated: false },
  },
  play: async ({ canvasElement }) => {
    // Desktop toolbar (`md:flex`); иначе в a11y попадают и mobile-кнопки карусели.
    await setPreviewWidth(canvasElement, 1024);

    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);

    await waitFor(() => {
      expect(visibleButton(canvas, "Выбрать исполнителя")).toBeTruthy();
    });

    await userEvent.click(visibleButton(canvas, "Выбрать исполнителя"));

    const artistItem = await waitFor(() => {
      const items = body.getAllByRole("menuitemcheckbox");
      expect(items.length).toBeGreaterThan(0);
      return items[0]!;
    });

    await userEvent.click(artistItem);
    await expect(artistItem).toHaveAttribute("aria-checked", "true");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => {
      expect(body.queryByRole("menu")).not.toBeInTheDocument();
    });

    await expect(
      visibleButton(canvas, "Выбрать исполнителя, 1 в наборе"),
    ).toBeVisible();

    await userEvent.click(visibleButton(canvas, "Выбрать жанр"));

    const genreItem = await waitFor(() => {
      const items = body.getAllByRole("menuitemcheckbox");
      expect(items.length).toBeGreaterThan(0);
      return items[0]!;
    });

    await userEvent.click(genreItem);
    await expect(genreItem).toHaveAttribute("aria-checked", "true");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => {
      expect(body.queryByRole("menu")).not.toBeInTheDocument();
    });

    await expect(
      visibleButton(canvas, "Выбрать жанр, 1 в наборе"),
    ).toBeVisible();
  },
};
