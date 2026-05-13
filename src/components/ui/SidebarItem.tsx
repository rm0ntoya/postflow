import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

export function SidebarItem({
  href, icon, label, shortcut, active = false, expanded,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  active?: boolean;
  expanded: boolean;
}) {
  const content = (
    <div
      className={cn(
        "group relative flex items-center h-9 rounded-sm transition-colors duration-fast",
        expanded ? "px-2.5 gap-2.5" : "justify-center w-10",
        active
          ? "bg-accent-muted text-accent before:absolute before:left-0 before:top-0 before:bottom-0 before:w-0.5 before:bg-accent"
          : "text-text-secondary hover:bg-bg-surface-2 hover:text-text-primary"
      )}
      title={!expanded ? `${label}${shortcut ? ` (${shortcut})` : ""}` : undefined}
    >
      <span className="w-[18px] h-[18px] flex items-center justify-center">{icon}</span>
      {expanded && (
        <>
          <span className="text-body flex-1 truncate">{label}</span>
          {shortcut && <span className="text-caption text-text-tertiary tnum">{shortcut}</span>}
        </>
      )}
    </div>
  );
  return <Link href={href} aria-label={label}>{content}</Link>;
}
