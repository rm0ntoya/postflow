import * as React from "react";
import { cn } from "@/lib/cn";

export type BadgeStatus = "rascunho" | "pronto" | "gerando" | "publicado" | "erro";

const map: Record<BadgeStatus, { dot: string; label: string; pulse?: boolean }> = {
  rascunho:  { dot: "bg-text-tertiary",  label: "Rascunho" },
  pronto:    { dot: "bg-state-success",  label: "Pronto" },
  gerando:   { dot: "bg-accent",         label: "Gerando", pulse: true },
  publicado: { dot: "bg-text-secondary", label: "Publicado" },
  erro:      { dot: "bg-state-danger",   label: "Erro" },
};

export function Badge({ status, className }: { status: BadgeStatus; className?: string }) {
  const m = map[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-caption text-text-secondary", className)}>
      <span className={cn("h-1.5 w-1.5 rounded-pill", m.dot, m.pulse && "animate-pulse")} />
      {m.label}
    </span>
  );
}
