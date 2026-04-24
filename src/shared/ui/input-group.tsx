import * as React from "react";

import { cn } from "../lib/utils";

import { Input } from "../ui/input";

type InputGroupAddonAlign =
  | "inline-start"
  | "inline-end"
  | "block-start"
  | "block-end";

const addonAlignClassName: Record<InputGroupAddonAlign, string> = {
  "inline-start": "left-0 top-1/2 -translate-y-1/2",
  "inline-end": "right-0 top-1/2 -translate-y-1/2",
  "block-start": "left-0 top-0",
  "block-end": "left-0 bottom-0",
};

const InputGroup = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-slot="input-group"
      className={cn(
        "group relative flex w-full min-w-0 items-center",
        className,
      )}
      {...props}
    />
  );
});
InputGroup.displayName = "InputGroup";

const InputGroupInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentPropsWithoutRef<typeof Input>
>(({ className, ...props }, ref) => {
  return (
    <Input
      ref={ref}
      data-slot="input-group-control"
      className={cn("min-w-0", className)}
      {...props}
    />
  );
});
InputGroupInput.displayName = "InputGroupInput";

interface InputGroupAddonProps extends React.ComponentPropsWithoutRef<"div"> {
  align?: InputGroupAddonAlign;
}

const InputGroupAddon = React.forwardRef<HTMLDivElement, InputGroupAddonProps>(
  ({ align = "inline-start", className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="input-group-addon"
        data-align={align}
        className={cn(
          "absolute z-10 flex items-center justify-center",
          addonAlignClassName[align],
          className,
        )}
        {...props}
      />
    );
  },
);
InputGroupAddon.displayName = "InputGroupAddon";

export { InputGroup, InputGroupAddon, InputGroupInput };
