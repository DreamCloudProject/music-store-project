import * as React from "react";

import { cn } from "../lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "relative overflow-hidden bg-skeleton after:pointer-events-none after:absolute after:inset-0 after:z-[1] after:animate-skeleton-shimmer after:bg-[linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,0.15),rgba(255,255,255,0))] after:content-['']",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
