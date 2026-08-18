import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils";

export const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        auth: "w-full select-none rounded-[6px] bg-auth text-[18px] font-normal leading-[1.33] tracking-[-0.003em] text-auth-foreground outline-none hover:bg-auth-hover active:bg-auth-active focus-visible:bg-auth-hover focus-visible:outline-none focus-visible:ring-0 disabled:border-transparent disabled:bg-[#d9d9d9] disabled:text-white disabled:opacity-100 disabled:shadow-none disabled:ring-0 disabled:outline-none",
        "auth-outline":
          "w-full select-none rounded-[6px] border border-[#d0cece] bg-white text-[18px] font-normal leading-[1.33] tracking-[-0.003em] text-black outline-none hover:bg-[#f4f5f6] active:bg-[#d9d9d9] focus-visible:bg-[#f4f5f6] focus-visible:outline-none focus-visible:ring-0 disabled:border-[#d9d9d9] disabled:bg-[#d9d9d9] disabled:text-white disabled:opacity-100 disabled:shadow-none disabled:ring-0 disabled:outline-none",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
        auth: "h-auto min-h-0 px-0 py-[14px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const resolvedSize =
      size ??
      (variant === "auth" || variant === "auth-outline" ? "auth" : "default");
    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size: resolvedSize, className }),
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button };
