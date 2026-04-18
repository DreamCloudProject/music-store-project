import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SearchField } from "@/shared/ui/search-field";

describe("SearchField", () => {
  it("renders a searchbox with default labels and submit button", () => {
    render(<SearchField />);

    expect(
      screen.getByRole("searchbox", { name: "Поиск по трекам" }),
    ).toHaveAttribute("name", "search");

    expect(screen.getByRole("button", { name: "Искать" })).toHaveAttribute(
      "type",
      "submit",
    );
  });

  it("applies wrapper, input and icon button overrides separately", () => {
    render(
      <SearchField
        wrapperClassName="wrapper-test-class"
        className="input-test-class"
        iconButtonProps={{
          "aria-label": "Запустить поиск",
          className: "icon-test-class",
          type: "button",
        }}
      />,
    );

    const searchbox = screen.getByRole("searchbox", {
      name: "Поиск по трекам",
    });
    const button = screen.getByRole("button", { name: "Запустить поиск" });

    expect(searchbox).toHaveClass("input-test-class");
    expect(searchbox.closest('[data-slot="input-group"]')).toHaveClass(
      "wrapper-test-class",
    );

    expect(button).toHaveClass("icon-test-class");
    expect(button).toHaveAttribute("type", "button");
  });
});
