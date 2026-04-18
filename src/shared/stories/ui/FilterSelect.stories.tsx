import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import {
  FilterSelect,
  type FilterSelectPropsMulti,
  type FilterSelectPropsSingle,
} from "@/shared/ui/filter-select";

const options = [
  { value: "rock", label: "Рок" },
  { value: "pop", label: "Поп" },
];

function FilterSelectSurface({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#181818] p-10 text-white">{children}</div>
  );
}

function ControlledMultiSelect(args: FilterSelectPropsMulti) {
  const [selected, setSelected] = useState(args.selected);
  const [value, setValue] = useState(args.value);

  return (
    <FilterSelectSurface>
      <FilterSelect
        {...args}
        selected={selected}
        value={value}
        onSelectedChange={(nextSelected) => {
          setSelected(nextSelected);
          args.onSelectedChange(nextSelected);
        }}
        onValueChange={(nextValue) => {
          setValue(nextValue);
          args.onValueChange?.(nextValue);
        }}
      />
    </FilterSelectSurface>
  );
}

function ControlledSingleSelect(args: FilterSelectPropsSingle) {
  const [selected, setSelected] = useState(args.selected ?? [args.value]);
  const [value, setValue] = useState(args.value);

  return (
    <FilterSelectSurface>
      <FilterSelect
        {...args}
        selected={selected}
        value={value}
        onSelectedChange={(nextSelected) => {
          setSelected(nextSelected);
          args.onSelectedChange?.(nextSelected);
        }}
        onValueChange={(nextValue) => {
          setValue(nextValue);
          args.onValueChange(nextValue);
        }}
      />
    </FilterSelectSurface>
  );
}

const meta = {
  title: "Shared/UI/FilterSelect",
  component: FilterSelect,
} satisfies Meta<typeof FilterSelect>;

export default meta;

type Story = StoryObj<typeof meta>;

export const MultiselectNormalized: Story = {
  args: {
    multiselect: true,
    options,
    triggerLabel: "жанру",
    value: "rock",
    selected: ["pop"],
    onValueChange: fn(),
    onSelectedChange: fn(),
  },
  render: (args) => (
    <ControlledMultiSelect {...(args as FilterSelectPropsMulti)} />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole("button", { name: "жанру, 2 в наборе" }),
    ).toBeInTheDocument();
    await expect(canvas.getByText("2")).toBeVisible();
  },
};

export const SingleSelectInteraction: Story = {
  args: {
    multiselect: false,
    options,
    triggerLabel: "жанру",
    value: "rock",
    selected: ["rock"],
    onValueChange: fn(),
    onSelectedChange: fn(),
  },
  render: (args) => (
    <ControlledSingleSelect {...(args as FilterSelectPropsSingle)} />
  ),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole("button", { name: "жанру" }));
    await userEvent.click(body.getByText("Поп"));

    await expect(args.onValueChange).toHaveBeenCalledWith("pop");
    await expect(args.onSelectedChange).toHaveBeenCalledWith(["pop"]);
  },
};

export const MultiselectToggle: Story = {
  args: {
    multiselect: true,
    options,
    triggerLabel: "жанру",
    value: "rock",
    selected: ["rock", "pop"],
    onValueChange: fn(),
    onSelectedChange: fn(),
  },
  render: (args) => (
    <ControlledMultiSelect {...(args as FilterSelectPropsMulti)} />
  ),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(
      canvas.getByRole("button", { name: "жанру, 2 в наборе" }),
    );
    await userEvent.click(body.getByText("Рок"));

    await expect(args.onSelectedChange).toHaveBeenCalledWith(["pop"]);
    await expect(args.onValueChange).toHaveBeenCalledWith("pop");
  },
};
