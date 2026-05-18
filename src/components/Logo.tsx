import { cn } from "@/lib/cn";

type LogoSize = 16 | 24 | 48;

export function LogoMark({ size = 24, withGlow = false, className }: {
  size?: LogoSize;
  withGlow?: boolean;
  className?: string;
}) {
  if (size === 16) {
    return (
      <svg width={16} height={16} viewBox="0 0 16 16" className={className} aria-hidden>
        <rect x={2}  y={7}  width={2} height={7}  rx={0.5} fill="currentColor" />
        <rect x={7}  y={3}  width={2} height={11} rx={0.5} fill="currentColor" />
        <circle cx={12} cy={2} r={1.5} fill="var(--accent)" />
      </svg>
    );
  }
  if (size === 48) {
    return (
      <svg width={48} height={56} viewBox="0 0 24 28" className={className} aria-hidden>
        {withGlow && (
          <circle cx={20} cy={2} r={3} fill="var(--accent-glow)" />
        )}
        <rect x={2}  y={14} width={4} height={12} rx={1} fill="currentColor" />
        <rect x={10} y={10} width={4} height={16} rx={1} fill="currentColor" />
        <rect x={18} y={6}  width={4} height={20} rx={1} fill="currentColor" />
        <circle cx={20} cy={2} r={2} fill="var(--accent)" />
      </svg>
    );
  }
  return (
    <svg width={24} height={28} viewBox="0 0 24 28" className={cn(className)} aria-hidden>
      <rect x={2}  y={14} width={4} height={12} rx={1} fill="currentColor" />
      <rect x={10} y={10} width={4} height={16} rx={1} fill="currentColor" />
      <rect x={18} y={6}  width={4} height={20} rx={1} fill="currentColor" />
      <circle cx={20} cy={2} r={2} fill="var(--accent)" />
    </svg>
  );
}

export function LogoWordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(className)}
      style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, letterSpacing: "-0.04em", fontSize: 18 }}
    >
      Carrossel AI
    </span>
  );
}

export function LogoLockup({ size = 24, className }: { size?: LogoSize; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-text-primary", className)}>
      <LogoMark size={size} />
      <LogoWordmark />
    </span>
  );
}
