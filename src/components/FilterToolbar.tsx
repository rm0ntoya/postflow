"use client";
import * as React from "react";
import { Search, LayoutGrid, List } from "lucide-react";
import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";

export type FilterValue = "todos" | "rascunhos" | "prontos" | "publicados" | "noticia";
export type ViewMode = "grid" | "list";

export function FilterToolbar({
  filter, onFilter, query, onQuery, view, onView, sort, onSort,
}: {
  filter: FilterValue; onFilter: (v: FilterValue) => void;
  query: string; onQuery: (v: string) => void;
  view: ViewMode; onView: (v: ViewMode) => void;
  sort: string; onSort: (v: string) => void;
}) {
  const opts: { v: FilterValue; label: string }[] = [
    { v: "todos", label: "Todos" }, { v: "rascunhos", label: "Rascunhos" },
    { v: "prontos", label: "Prontos" }, { v: "publicados", label: "Publicados" },
    { v: "noticia", label: "Modo Notícia" },
  ];
  return (
    <div className="h-[52px] px-6 flex items-center gap-3 border-b border-border-subtle">
      <div className="flex items-center gap-1.5">
        {opts.map((o) => (
          <Chip key={o.v} active={filter === o.v} onClick={() => onFilter(o.v)}>{o.label}</Chip>
        ))}
      </div>
      <div className="ml-auto flex items-center gap-2">
        <div className="w-[200px]">
          <Input value={query} onChange={(e) => onQuery(e.target.value)} placeholder="Buscar…" iconLeft={<Search size={14} strokeWidth={1.5} />} />
        </div>
        <div className="flex items-center bg-bg-surface-2 border border-border rounded-sm h-9 overflow-hidden">
          <button onClick={() => onView("grid")} className={`h-full w-9 flex items-center justify-center ${view === "grid" ? "bg-bg-surface-3 text-text-primary" : "text-text-secondary"}`} aria-label="Grid"><LayoutGrid size={14} strokeWidth={1.5} /></button>
          <button onClick={() => onView("list")} className={`h-full w-9 flex items-center justify-center ${view === "list" ? "bg-bg-surface-3 text-text-primary" : "text-text-secondary"}`} aria-label="Lista"><List size={14} strokeWidth={1.5} /></button>
        </div>
        <select value={sort} onChange={(e) => onSort(e.target.value)}
          className="h-9 px-3 bg-bg-surface-2 border border-border rounded-sm text-body text-text-primary">
          <option value="recent">Mais recentes</option>
          <option value="oldest">Mais antigos</option>
          <option value="title">Título A→Z</option>
        </select>
      </div>
    </div>
  );
}
