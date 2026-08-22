import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils";

const inputVariants = cva(
  "flex w-full bg-transparent transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        underline:
          "h-auto min-h-0 rounded-none border-0 border-b border-[#d0cece] px-0 py-2 text-[18px] font-normal leading-[1.33] tracking-[-0.003em] text-foreground placeholder:text-[#d0cece] hover:border-[#3f007d] hover:shadow-[inset_0_-1px_0_0_#3f007d] focus-visible:border-[#271a58] focus-visible:shadow-[inset_0_-1px_0_0_#271a58]",
        default:
          "h-9 rounded-md border border-input px-3 py-1 text-sm text-foreground placeholder:text-placeholder focus-visible:ring-1 focus-visible:ring-ring",
      },
    },
    defaultVariants: {
      variant: "underline",
    },
  },
);

export interface InputProps
  extends React.ComponentProps<"input">, VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ variant, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
