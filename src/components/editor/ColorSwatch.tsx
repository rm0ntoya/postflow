import * as React from "react";

interface ColorSwatchProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export function ColorSwatch({ value, onChange, label }: ColorSwatchProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className="flex items-center gap-2 w-full hover:opacity-80 transition-opacity duration-fast group"
      aria-label={label ?? "Selecionar cor"}
    >
      <div
        className="h-7 w-7 rounded-xs border border-border-default shrink-0 group-hover:border-border-strong transition-colors duration-fast"
        style={{ background: value === "transparent" ? "transparent" : value }}
      >
        {value === "transparent" && (
          <div
            className="w-full h-full rounded-xs"
            style={{ background: "repeating-linear-gradient(45deg, #444 0,#444 2px,transparent 0,transparent 50%) 0/8px 8px" }}
          />
        )}
      </div>
      <span className="text-caption text-text-secondary font-mono group-hover:text-text-primary transition-colors duration-fast">
        {value === "transparent" ? "transparent" : value.toUpperCase()}
      </span>
      <input
        ref={inputRef}
        type="color"
        value={value === "transparent" ? "#000000" : value}
        onChange={(e) => onChange(e.target.value)}
        className="sr-only"
        aria-hidden="true"
      />
    </button>
  );
}
