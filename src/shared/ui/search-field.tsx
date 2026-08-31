import * as React from "react";
import { Search } from "lucide-react";

import { cn } from "../lib/utils";
import { Button } from "../ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "../ui/input-group";

export interface SearchFieldProps extends React.ComponentPropsWithoutRef<
  typeof InputGroupInput
> {
  "aria-label"?: string;
  wrapperClassName?: string;
  iconButtonProps?: React.ComponentPropsWithoutRef<"button">;
}

const SearchField = React.forwardRef<HTMLInputElement, SearchFieldProps>(
  (
    {
      className,
      wrapperClassName,
      iconButtonProps,
      "aria-label": ariaLabel = "Поиск по трекам",
      ...props
    },
    ref,
  ) => {
    return (
      <InputGroup className={cn("search-field flex flex-1", wrapperClassName)}>
        <InputGroupInput
          ref={ref}
          type="search"
          name="search"
          placeholder="Поиск"
          aria-label={ariaLabel}
          className={cn(
            "h-auto min-h-0 w-full rounded-none border-0 border-b border-border-muted bg-transparent px-0 py-[15px] pl-[28px] text-[16px] font-normal leading-[1.15] tracking-[0.001em] text-fg shadow-none transition-shadow placeholder:text-fg-muted hover:shadow-[inset_0_-1px_0_0_var(--border-muted)] focus-visible:shadow-[inset_0_-1px_0_0_var(--border-muted)] focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none dark:[&::-webkit-search-cancel-button]:[filter:brightness(0)_invert(1)] [&::-webkit-search-cancel-button]:cursor-pointer",
            className,
          )}
          {...props}
        />
        <InputGroupAddon
          align="inline-start"
          className={cn(
            "text-fg-muted transition-colors group-focus-within:text-fg",
            props.value && "text-fg",
          )}
        >
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            aria-label="Искать"
            {...iconButtonProps}
            className={cn(
              "h-auto w-auto cursor-pointer rounded-none bg-transparent p-0 text-current hover:bg-transparent hover:text-current focus-visible:ring-0 focus-visible:ring-offset-0",
              iconButtonProps?.className,
            )}
          >
            <Search
              className="ml-[8px] mt-[-0.5px] size-4 shrink-0 stroke-current pointer-events-none"
              aria-hidden
            />
          </Button>
        </InputGroupAddon>
      </InputGroup>
    );
  },
);
SearchField.displayName = "SearchField";

export { SearchField };
