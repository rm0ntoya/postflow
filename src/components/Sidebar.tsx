"use client";
import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Newspaper, Calendar, BookOpen, Settings, Plus, PanelLeft, LogOut } from "lucide-react";
import { SidebarItem } from "@/components/ui/SidebarItem";
import { LogoMark, LogoLockup } from "@/components/Logo";
import { useSidebarPinned } from "@/hooks/useSidebarPinned";
import { cn } from "@/lib/cn";

const ICON = (C: any) => <C size={18} strokeWidth={1.5} />;

interface SidebarProps {
  carouselCount?: number;
  userName?: string;
  isAdmin?: boolean;
  plan?: string;
  trialEndsAt?: string;
  planExpiresAt?: string;
}

export default function Sidebar(_props: SidebarProps = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const [pinned, setPinned] = useSidebarPinned();
  const [hover, setHover] = React.useState(false);
  const expanded = pinned || hover;

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname?.startsWith(href);

  async function handleLogout() {
    try { await fetch("/api/auth/login", { method: "DELETE" }); } catch {}
    router.push("/");
  }

  return (
    <aside
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={cn(
        "sticky top-0 h-screen bg-bg-surface border-r border-border-subtle",
        "flex flex-col py-4 transition-[width] duration-base ease-out-custom z-30",
        expanded ? "w-60" : "w-14"
      )}
    >
      <div className={cn("flex items-center px-3 mb-4", expanded ? "justify-start" : "justify-center")}>
        {expanded ? <LogoLockup /> : <LogoMark />}
      </div>

      <div className={cn("px-3 mb-6", expanded ? "" : "flex justify-center")}>
        <button
          className={cn(
            "h-10 rounded-sm bg-accent text-text-inverse flex items-center justify-center font-medium",
            "hover:bg-accent-hover transition-colors duration-fast",
            expanded ? "w-full gap-2 px-3" : "w-10"
          )}
          onClick={() => window.dispatchEvent(new CustomEvent("nc:open-create"))}
          aria-label="Criar novo carrossel"
        >
          <Plus size={18} strokeWidth={2} />
          {expanded && <span className="text-body-strong">Criar</span>}
          {expanded && <span className="ml-auto text-caption text-text-inverse/60 tnum">c</span>}
        </button>
      </div>

      <nav className="flex-1 px-2 flex flex-col gap-1">
        {expanded && <div className="text-micro text-text-tertiary px-2.5 mt-1 mb-1">BIBLIOTECA</div>}
        <SidebarItem href="/dashboard" icon={ICON(LayoutDashboard)} label="Dashboard" shortcut="g d" active={pathname === "/dashboard"} expanded={expanded} />
        <SidebarItem href="/dashboard/news" icon={ICON(Newspaper)} label="Modo Notícia" shortcut="g n" active={!!isActive("/dashboard/news")} expanded={expanded} />
        <SidebarItem href="/dashboard/calendar" icon={ICON(Calendar)} label="Calendário" shortcut="g c" active={!!isActive("/dashboard/calendar")} expanded={expanded} />
        <SidebarItem href="/dashboard/context" icon={ICON(BookOpen)} label="Contexto" shortcut="g x" active={!!isActive("/dashboard/context")} expanded={expanded} />
      </nav>

      <div className="px-2 flex flex-col gap-1">
        <SidebarItem href="/dashboard/settings" icon={ICON(Settings)} label="Configurações" shortcut="g s" active={!!isActive("/dashboard/settings")} expanded={expanded} />
        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center h-9 rounded-sm transition-colors duration-fast text-text-secondary hover:bg-bg-surface-2 hover:text-text-primary",
            expanded ? "px-2.5 gap-2.5" : "justify-center w-10"
          )}
          title={!expanded ? "Sair" : undefined}
          aria-label="Sair"
        >
          <span className="w-[18px] h-[18px] flex items-center justify-center"><LogOut size={18} strokeWidth={1.5} /></span>
          {expanded && <span className="text-body flex-1 truncate text-left">Sair</span>}
        </button>
        {expanded && (
          <button
            onClick={() => setPinned(!pinned)}
            className="mt-2 h-8 px-2.5 text-caption text-text-tertiary hover:text-text-primary flex items-center gap-2 rounded-sm hover:bg-bg-surface-2"
            aria-pressed={pinned}
          >
            <PanelLeft size={14} strokeWidth={1.5} />
            {pinned ? "Desafixar" : "Fixar"}
          </button>
        )}
      </div>
    </aside>
  );
}
