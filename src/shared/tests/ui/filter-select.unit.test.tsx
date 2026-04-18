import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { FilterSelect } from "@/shared/ui/filter-select";

const options = [
  { value: "rock", label: "Рок" },
  { value: "pop", label: "Поп" },
];

describe("FilterSelect", () => {
  it("shows normalized multiselect count and trigger aria-label", () => {
    render(
      <FilterSelect
        multiselect
        options={options}
        triggerLabel="жанру"
        value="rock"
        selected={["pop"]}
        onValueChange={vi.fn()}
        onSelectedChange={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: "жанру, 2 в наборе" }),
    ).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("calls both callbacks when single-select value changes", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const onSelectedChange = vi.fn();

    render(
      <FilterSelect
        multiselect={false}
        options={options}
        triggerLabel="жанру"
        value="rock"
        selected={["rock"]}
        onValueChange={onValueChange}
        onSelectedChange={onSelectedChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: "жанру" }));
    await user.click(screen.getByText("Поп"));

    expect(onValueChange).toHaveBeenCalledWith("pop");
    expect(onSelectedChange).toHaveBeenCalledWith(["pop"]);
  });

  it("toggles multiselect item and keeps the first selected value synchronized", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const onSelectedChange = vi.fn();

    render(
      <FilterSelect
        multiselect
        options={options}
        triggerLabel="жанру"
        value="rock"
        selected={["rock", "pop"]}
        onValueChange={onValueChange}
        onSelectedChange={onSelectedChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: "жанру, 2 в наборе" }));
    await user.click(screen.getByText("Рок"));

    expect(onSelectedChange).toHaveBeenCalledWith(["pop"]);
    expect(onValueChange).toHaveBeenCalledWith("pop");
  });
});
