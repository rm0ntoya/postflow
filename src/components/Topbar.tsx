"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Plus, Bell } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

const labels: Record<string, string> = {
  dashboard: "Dashboard",
  news: "Modo Notícia",
  calendar: "Calendário",
  context: "Contexto",
  settings: "Configurações",
  upgrade: "Upgrade",
};

export function Topbar({ onOpenPalette, onOpenCreate }: { onOpenPalette: () => void; onOpenCreate: () => void; }) {
  const pathname = usePathname() ?? "";
  const segs = pathname.split("/").filter(Boolean);
  return (
    <header className="sticky top-0 z-20 h-12 bg-bg-base border-b border-border-subtle flex items-center px-4 gap-4">
      <nav className="flex items-center gap-1.5 text-body text-text-secondary min-w-0">
        {segs.map((s, i) => {
          const href = "/" + segs.slice(0, i + 1).join("/");
          const last = i === segs.length - 1;
          return (
            <React.Fragment key={href}>
              {i > 0 && <span className="text-text-tertiary">/</span>}
              <Link href={href} className={cn("truncate hover:text-text-primary", last && "text-text-primary")}>
                {labels[s] ?? s}
              </Link>
            </React.Fragment>
          );
        })}
      </nav>

      <button
        onClick={onOpenPalette}
        className="mx-auto h-8 w-[360px] max-w-[40vw] bg-bg-surface-2 border border-border rounded-sm flex items-center gap-2 px-3 text-text-tertiary hover:border-border-strong transition-colors duration-fast"
        aria-label="Abrir busca de comandos"
      >
        <Search size={14} strokeWidth={1.5} />
        <span className="text-body flex-1 text-left">Buscar ou executar comando…</span>
        <kbd className="text-caption px-1.5 py-0.5 bg-bg-surface-3 border border-border rounded-xs tnum">⌘K</kbd>
      </button>

      <div className="flex items-center gap-2">
        <Button variant="primary" size="sm" iconLeft={<Plus size={14} strokeWidth={2} />} onClick={onOpenCreate}>
          Criar
          <span className="ml-1 text-text-inverse/60 text-caption tnum">c</span>
        </Button>
        <button className="h-9 w-9 rounded-sm hover:bg-bg-surface-2 flex items-center justify-center text-text-secondary" aria-label="Notificações">
          <Bell size={18} strokeWidth={1.5} />
        </button>
        <div className="h-7 w-7 rounded-pill bg-bg-surface-2 border border-border" aria-label="Avatar" />
      </div>
    </header>
  );
}
