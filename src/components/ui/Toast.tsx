"use client";
import * as React from "react";
import { cn } from "@/lib/cn";
import { CheckCircle2, AlertTriangle, XCircle, Info } from "lucide-react";

export type ToastKind = "success" | "warning" | "danger" | "info";
export interface ToastItem { id: string; kind: ToastKind; message: string; }

const icons: Record<ToastKind, React.ReactNode> = {
  success: <CheckCircle2 size={16} strokeWidth={1.5} className="text-state-success" />,
  warning: <AlertTriangle size={16} strokeWidth={1.5} className="text-state-warning" />,
  danger:  <XCircle size={16} strokeWidth={1.5} className="text-state-danger" />,
  info:    <Info size={16} strokeWidth={1.5} className="text-text-secondary" />,
};

const Ctx = React.createContext<{ push: (kind: ToastKind, message: string) => void } | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([]);
  const push = React.useCallback((kind: ToastKind, message: string) => {
    const id = Math.random().toString(36).slice(2);
    setItems((s) => [...s.slice(-2), { id, kind, message }]);
    setTimeout(() => setItems((s) => s.filter((t) => t.id !== id)), 3500);
  }, []);
  return (
    <Ctx.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center gap-2">
        {items.map((t) => (
          <div
            key={t.id}
            className={cn(
              "min-w-[280px] max-w-[480px] bg-bg-surface-3 border border-border rounded-md shadow-pop",
              "px-4 py-3 flex items-center gap-2 text-body text-text-primary",
              "animate-[toastIn_180ms_var(--ease-out)]"
            )}
            role="status"
            aria-live="polite"
          >
            {icons[t.kind]}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
