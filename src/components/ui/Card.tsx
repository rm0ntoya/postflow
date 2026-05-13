import * as React from "react";
import { cn } from "@/lib/cn";

export function Card({
  density = "dense",
  interactive = false,
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { density?: "dense" | "respirado"; interactive?: boolean }) {
  return (
    <div
      className={cn(
        "bg-bg-surface border border-border-subtle rounded-lg transition-colors duration-fast",
        density === "dense" ? "p-4" : "p-6",
        interactive && "hover:border-border hover:bg-bg-surface-2 cursor-pointer",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
