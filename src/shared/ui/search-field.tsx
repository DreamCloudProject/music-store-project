import * as React from "react";
import { Search } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/shared/ui/input-group";

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
            "w-full h-auto min-h-0 py-[15px] px-0 pl-[1.5em] rounded-none border-0 border-b border-[#4e4e4e] bg-transparent shadow-none text-[16px] font-normal leading-[1.15] tracking-[0.001em] text-white placeholder:text-[#4e4e4e] focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 hover:shadow-[inset_0_-1px_0_0_#4e4e4e] focus-visible:shadow-[inset_0_-1px_0_0_#4e4e4e] transition-shadow [&::-webkit-search-cancel-button]:[filter:brightness(0)_invert(1)] [&::-webkit-search-cancel-button]:cursor-pointer",
            className,
          )}
          {...props}
        />
        <InputGroupAddon
          align="inline-start"
          className="text-[#4e4e4e] transition-colors group-focus-within:text-white"
        >
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            aria-label="Искать"
            {...iconButtonProps}
            className={cn(
              "h-auto w-auto rounded-none bg-transparent p-0 text-current hover:bg-transparent hover:text-current focus-visible:ring-0 focus-visible:ring-offset-0",
              iconButtonProps?.className,
            )}
          >
            <Search
              className="size-4 shrink-0 stroke-current pointer-events-none"
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
