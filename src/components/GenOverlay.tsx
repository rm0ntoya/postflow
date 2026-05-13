"use client";
import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

export const GEN_STEPS = [
  "Preparando contexto…",
  "Gerando títulos…",
  "Distribuindo nos slides…",
  "Aplicando design…",
  "Pronto. Abrindo editor…",
];

type GenOverlayProps = {
  stepIndex?: number;
  /** Alias for stepIndex (legacy callsites). */
  progress?: number;
  /** Optional status text shown above the steps (legacy). */
  statusText?: string;
  total?: number;
  steps?: string[];
};

export function GenOverlay({
  stepIndex,
  progress,
  statusText,
  total,
  steps = GEN_STEPS,
}: GenOverlayProps) {
  const idx = typeof stepIndex === "number" ? stepIndex : typeof progress === "number" ? progress : 0;
  const totalCount = total ?? steps.length;
  const pct = Math.min(100, ((idx + 1) / totalCount) * 100);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center"
      style={{ background: "var(--bg-overlay)", backdropFilter: "blur(8px)" }}
    >
      <div className="w-[480px] bg-bg-surface border border-border-subtle rounded-lg shadow-pop overflow-hidden">
        <div className="h-1 w-full bg-bg-surface-2">
          <div
            className="h-full bg-accent transition-[width] duration-base"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="p-6 flex flex-col gap-2">
          {statusText && (
            <div className="text-body text-text-secondary mb-2">{statusText}</div>
          )}
          {steps.map((s, i) => {
            const done = i < idx;
            const active = i === idx;
            return (
              <div
                key={s}
                className={cn(
                  "flex items-center gap-2 text-body transition-colors duration-fast",
                  done ? "text-text-secondary" : active ? "text-text-primary" : "text-text-tertiary"
                )}
              >
                <span
                  className={cn(
                    "w-4 h-4 rounded-pill border flex items-center justify-center",
                    done ? "border-accent bg-accent-muted" : active ? "border-accent" : "border-border"
                  )}
                >
                  {done && <Check size={10} strokeWidth={2} className="text-accent" />}
                  {active && <span className="w-1.5 h-1.5 rounded-pill bg-accent animate-pulse" />}
                </span>
                <span>{s}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default GenOverlay;
