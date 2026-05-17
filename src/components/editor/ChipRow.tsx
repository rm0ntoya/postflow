import * as React from "react";
import { cn } from "@/lib/cn";

interface ChipOption<T> {
  label: string;
  value: T;
}

interface ChipRowProps<T> {
  options: ChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function ChipRow<T>({ options, value, onChange }: ChipRowProps<T>) {
  return (
    <div className="flex flex-wrap gap-1">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "px-2 py-1 rounded-xs text-caption transition-colors duration-fast border",
            value === o.value
              ? "bg-accent-muted border-accent text-accent"
              : "bg-bg-surface-2 border-border-subtle text-text-secondary hover:border-border-default hover:text-text-primary"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
