import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "../lib/utils";

export interface SliderProps extends React.ComponentPropsWithoutRef<
  typeof SliderPrimitive.Root
> {
  trackClassName?: string;
  rangeClassName?: string;
  thumbClassName?: string;
}

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(
  (
    {
      className,
      trackClassName,
      rangeClassName,
      thumbClassName,
      orientation = "horizontal",
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      ...props
    },
    ref,
  ) => {
    const vertical = orientation === "vertical";

    return (
      <SliderPrimitive.Root
        ref={ref}
        data-slot="slider"
        orientation={orientation}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        className={cn(
          "relative flex touch-none select-none cursor-pointer",
          vertical
            ? "h-full w-[36px] flex-col items-center justify-center"
            : "h-[36px] w-full flex-row items-center",
          className,
        )}
        {...props}
      >
        <SliderPrimitive.Track
          data-slot="slider-track"
          className={cn(
            "relative cursor-pointer overflow-hidden rounded-full bg-primary/20",
            vertical ? "h-full w-[2px]" : "h-[2px] w-full",
            trackClassName,
          )}
        >
          <SliderPrimitive.Range
            data-slot="slider-range"
            className={cn(
              "absolute bg-primary",
              vertical ? "w-full" : "h-full",
              rangeClassName,
            )}
          />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          className={cn(
            "block size-4 cursor-pointer rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
            thumbClassName,
          )}
        />
      </SliderPrimitive.Root>
    );
  },
);
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
