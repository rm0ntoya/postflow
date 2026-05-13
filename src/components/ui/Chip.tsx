import * as React from "react";
import { cn } from "@/lib/cn";

export function Chip({
  active = false,
  className,
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-1 text-[12px] font-medium transition-colors duration-fast",
        active
          ? "bg-accent-muted border-accent text-accent"
          : "bg-bg-surface-2 border-border text-text-secondary hover:text-text-primary hover:border-border-strong",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
