import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { HeaderSearch } from "../ui/HeaderSearch";

function setSearchParam(value?: string) {
  const url = new URL(window.location.href);

  if (value) url.searchParams.set("search", value);
  else url.searchParams.delete("search");

  window.history.replaceState(
    {},
    "",
    `${url.pathname}${url.search}${url.hash}`,
  );
}

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

export const Default: Story = {
  loaders: [
    async () => {
      setSearchParam();
      return {};
    },
  ],
};

export const InitialFromUrl: Story = {
  loaders: [
    async () => {
      setSearchParam("metal");
      return {};
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole("searchbox", { name: "Поиск по трекам" }),
    ).toHaveValue("metal");
  },
};

export const SubmitTrimmedQuery: Story = {
  loaders: [
    async () => {
      setSearchParam();
      return {};
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const searchbox = canvas.getByRole("searchbox", {
      name: "Поиск по трекам",
    });

    await userEvent.clear(searchbox);
    await userEvent.type(searchbox, "  techno  ");
    await userEvent.click(canvas.getByRole("button", { name: "Искать" }));

    await expect(searchbox).toHaveValue("techno");
    await waitFor(() => {
      expect(new URL(window.location.href).searchParams.get("search")).toBe(
        "techno",
      );
    });
  },
};

export const SyncsAfterPopstate: Story = {
  loaders: [
    async () => {
      setSearchParam("jazz");
      return {};
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const searchbox = canvas.getByRole("searchbox", {
      name: "Поиск по трекам",
    });

    await expect(searchbox).toHaveValue("jazz");

    const url = new URL(window.location.href);
    url.searchParams.set("search", "ambient");
    window.history.pushState({}, "", `${url.pathname}${url.search}${url.hash}`);
    window.dispatchEvent(new PopStateEvent("popstate"));

    await waitFor(() => {
      expect(searchbox).toHaveValue("ambient");
    });
  },
};
