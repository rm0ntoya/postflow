import * as React from "react";
import { cn } from "@/lib/cn";

export function Skeleton({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-bg-surface-2 rounded-md",
        "before:absolute before:inset-0 before:-translate-x-full",
        "before:animate-[shimmer_1.6s_linear_infinite]",
        "before:bg-gradient-to-r before:from-transparent before:via-white/[0.04] before:to-transparent",
        className
      )}
      {...rest}
    />
  );
}
