"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { useKeymap } from "@/hooks/useKeymap";

type Cmd = { id: string; label: string; group: string; shortcut?: string; run: () => void };

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  useKeymap();
  const router = useRouter();
  const [q, setQ] = React.useState("");
  const [idx, setIdx] = React.useState(0);

  const cmds: Cmd[] = React.useMemo(() => [
    { id: "new",      group: "Comandos", label: "Novo carrossel",   shortcut: "c",   run: () => window.dispatchEvent(new CustomEvent("nc:open-create")) },
    { id: "news",     group: "Páginas",  label: "Modo Notícia",     shortcut: "g n", run: () => router.push("/dashboard/news") },
    { id: "newsPro",  group: "Páginas",  label: "Notícia PRO",      shortcut: "g p", run: () => router.push("/dashboard/news-pro") },
    { id: "home",     group: "Páginas",  label: "Dashboard",        shortcut: "g d", run: () => router.push("/dashboard") },
    { id: "calendar", group: "Páginas",  label: "Calendário",       shortcut: "g c", run: () => router.push("/dashboard/calendar") },
    { id: "context",  group: "Páginas",  label: "Contexto",         shortcut: "g x", run: () => router.push("/dashboard/context") },
    { id: "settings", group: "Páginas",  label: "Configurações",    shortcut: "g s", run: () => router.push("/dashboard/settings") },
    { id: "upgrade",  group: "Páginas",  label: "Upgrade de plano", run: () => router.push("/dashboard/upgrade") },
  ], [router]);

  const filtered = React.useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? cmds.filter((c) => c.label.toLowerCase().includes(s)) : cmds;
  }, [q, cmds]);

  React.useEffect(() => { setIdx(0); }, [q, open]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown") { e.preventDefault(); setIdx((i) => Math.min(i + 1, filtered.length - 1)); }
      if (e.key === "ArrowUp")   { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)); }
      if (e.key === "Enter")     { e.preventDefault(); filtered[idx]?.run(); onClose(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, filtered, idx, onClose]);

  if (!open) return null;

  const groups: Record<string, Cmd[]> = {};
  filtered.forEach((c) => { (groups[c.group] ||= []).push(c); });

  let globalIdx = -1;

  return (
    <div
      className="fixed inset-0 z-[55] flex justify-center pt-[24vh]"
      style={{ background: "var(--bg-overlay)", backdropFilter: "blur(8px)" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-[640px] max-h-[560px] bg-bg-surface border border-border-subtle rounded-lg shadow-pop flex flex-col overflow-hidden">
        <div className="flex items-center gap-2 px-4 h-12 border-b border-border-subtle">
          <Search size={16} strokeWidth={1.5} className="text-text-tertiary" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar ou executar comando…"
            className="flex-1 bg-transparent outline-none text-text-primary placeholder:text-text-tertiary text-[16px]"
          />
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {Object.entries(groups).map(([g, items]) => (
            <div key={g} className="mb-2">
              <div className="px-4 py-1 text-micro text-text-tertiary">{g}</div>
              {items.map((c) => {
                globalIdx++;
                const active = globalIdx === idx;
                return (
                  <button
                    key={c.id}
                    onMouseEnter={() => setIdx(globalIdx)}
                    onClick={() => { c.run(); onClose(); }}
                    className={cn(
                      "w-full flex items-center justify-between px-4 h-9 text-body",
                      active ? "bg-bg-surface-2 text-text-primary" : "text-text-secondary"
                    )}
                  >
                    <span>{c.label}</span>
                    {c.shortcut && <kbd className="text-caption tnum text-text-tertiary">{c.shortcut}</kbd>}
                  </button>
                );
              })}
            </div>
          ))}
          {filtered.length === 0 && <div className="px-4 py-6 text-body text-text-tertiary">Nada encontrado.</div>}
        </div>
        <div className="h-8 px-4 text-caption text-text-tertiary flex items-center gap-3 border-t border-border-subtle">
          <span>↑↓ navegar</span><span>↵ selecionar</span><span>esc fechar</span>
        </div>
      </div>
    </div>
  );
}
