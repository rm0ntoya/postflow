"use client";
import * as React from "react";
import { cn } from "@/lib/cn";
import { X } from "lucide-react";

type ModalSize = "sm" | "md" | "lg" | "xl";
const sizes: Record<ModalSize, string> = {
  sm: "w-[400px]", md: "w-[560px]", lg: "w-[720px]", xl: "w-[920px]",
};

export function Modal({
  open, onClose, size = "md", title, children, footer,
}: {
  open: boolean;
  onClose: () => void;
  size?: ModalSize;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[10vh] pb-8 overflow-y-auto"
      style={{ background: "var(--bg-overlay)", backdropFilter: "blur(8px)" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={cn(
          "bg-bg-surface border border-border-subtle rounded-lg shadow-pop",
          "animate-[modalIn_180ms_var(--ease-out)] max-h-[80vh] flex flex-col",
          sizes[size]
        )}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-5 border-b border-border-subtle">
            <h2 className="text-h2 text-text-primary">{title}</h2>
            <button
              onClick={onClose}
              className="text-text-secondary hover:text-text-primary transition-colors duration-fast"
              aria-label="Fechar"
            >
              <X size={20} strokeWidth={1.5} />
            </button>
          </div>
        )}
        <div className="px-6 py-6 overflow-y-auto">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-border-subtle flex items-center justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
