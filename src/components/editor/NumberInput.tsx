import * as React from "react";

interface NumberInputProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
}

export function NumberInput({ label, value, min, max, step = 1, onChange }: NumberInputProps) {
  return (
    <label className="flex flex-col gap-1 w-full">
      <span className="text-micro text-text-tertiary">{label}</span>
      <input
        type="number"
        value={Math.round(value * 100) / 100}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const parsed = parseFloat(e.target.value);
          if (!isNaN(parsed)) onChange(parsed);
        }}
        className="w-full bg-bg-surface-2 border border-border-default rounded-xs px-2 py-1 text-caption text-text-primary tnum outline-none focus:border-accent transition-colors duration-fast"
      />
    </label>
  );
}
