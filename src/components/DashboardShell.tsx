"use client";
import * as React from "react";
import { Topbar } from "@/components/Topbar";
import { CommandPalette } from "@/components/CommandPalette";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const [, setCreateOpen] = React.useState(false);

  React.useEffect(() => {
    const onCreate = () => setCreateOpen(true);
    window.addEventListener("nc:open-create", onCreate);
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const tag = t?.tagName ?? "";
      const typing = ["INPUT", "TEXTAREA"].includes(tag) || !!t?.isContentEditable;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      } else if (e.key === "c" && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
        setCreateOpen(true);
        window.dispatchEvent(new Event("nc:open-create"));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("nc:open-create", onCreate);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const openCreate = () => window.dispatchEvent(new Event("nc:open-create"));

  return (
    <div className="flex-1 min-w-0 flex flex-col">
      <Topbar onOpenPalette={() => setPaletteOpen(true)} onOpenCreate={openCreate} />
      <main className="flex-1 min-h-0">{children}</main>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
