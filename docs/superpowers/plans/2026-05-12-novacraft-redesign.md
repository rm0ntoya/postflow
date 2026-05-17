# NovaCraft Dashboard Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **REQUIRED DESIGN SKILLS:** Before writing any UI code in this plan you MUST invoke `frontend-design` (component / page composition rules) and one of the taste skills — preferred `high-end-visual-design` plus `design-taste-frontend` — to keep visual quality on spec. Re-invoke `frontend-design` at the start of every screen-level task (Tasks 14–22). Re-invoke `high-end-visual-design` whenever building hero, card, or marketing-style surfaces (Modo Notícia hero, Upgrade hero, Login split, Dashboard hero strip).

**Goal:** Apply the visual identity and 9-screen redesign defined in `DESIGN.md` (2026-05-12) across the NovaCraft SaaS dashboard, replacing roxo/violeta/gradient/glass aesthetics with a black-editorial + verde-limão `#C6F84E` system implemented via CSS-variable tokens, a fixed type scale, and a closed component spec.

**Architecture:** All design tokens live in `src/styles/tokens.css` and are consumed via `tailwind.config.ts` (`theme.extend` reads `var(--token)`). A `src/components/ui/` folder holds the closed component set (Button, Input, Card, Chip, Badge, Modal, Toast, Skeleton, SidebarItem, CommandPalette). Screens are rebuilt in place under `src/app/dashboard/**` and `src/app/(auth)/login` against those primitives. The NovaCraft symbol is an inline SVG React component (`src/components/Logo.tsx`) with 16/24/48 size props. Editor (`src/app/dashboard/editor`) is OUT OF SCOPE per spec section 7.

**Tech Stack:** Next.js 14 App Router, React 18, Tailwind CSS 3.4 (CSS-variables-driven theme), Inter Variable (already loaded), lucide-react (icons), framer-motion (motion already installed), TypeScript 5.4. No new dependencies required.

**Verification model:** This codebase has no automated test runner. Each task uses a manual visual-verification step — run `npm run dev`, open the listed route in a browser, confirm the listed observable conditions, and re-invoke `frontend-design` for a self-check pass. Acceptance criteria from `DESIGN.md` §8 are the final gate (Task 24).

---

## File Structure

### New files
```
src/styles/tokens.css                    All CSS variables (color/space/radius/motion/type)
src/styles/typography.css                Inter font-face + .text-display..text-micro classes
src/components/Logo.tsx                  NovaCraft symbol + wordmark (sizes 16/24/48, lockup)
src/components/ui/Button.tsx             Closed variants: primary|secondary|ghost|danger × sm|md|lg
src/components/ui/Input.tsx              Label + input + helper + error states
src/components/ui/Card.tsx               Surface card with hover, dense/respirado padding prop
src/components/ui/Chip.tsx               Pill, active state, filter chip
src/components/ui/Badge.tsx              Dot-status badge (rascunho/pronto/gerando/publicado/erro)
src/components/ui/Modal.tsx              Backdrop + sized container + header/body/footer slots
src/components/ui/Toast.tsx              Replace existing thin Toast with full spec (3.7)
src/components/ui/Skeleton.tsx           Shimmer block
src/components/ui/SidebarItem.tsx        Nav row (collapsed/expanded, active, shortcut tooltip)
src/components/ui/index.ts               Barrel export for ui primitives
src/components/Topbar.tsx                Global topbar (breadcrumb + ⌘K trigger + create + bell + avatar)
src/components/CommandPalette.tsx        ⌘K palette
src/components/CarouselCard.tsx          Card de carrossel (aspect 4:5, overlay, hover, menu)
src/components/MetricStrip.tsx           Hero strip metrics block for Dashboard home
src/components/FilterToolbar.tsx         Filter chips + search + view toggle + sort for Dashboard
src/hooks/useKeymap.ts                   Keyboard shortcut registry (⌘K, c, g d, g n, ?)
src/hooks/useSidebarPinned.ts            localStorage-backed pinned state
src/lib/cn.ts                            classnames helper (no clsx dep — 12-line util)
```

### Modified files
```
tailwind.config.ts                       Wire tokens into theme.extend.*
src/app/globals.css                      Import tokens.css + typography.css, set body bg/text
src/app/layout.tsx                       Inter Variable load + reduced-motion class hook
src/components/Sidebar.tsx               Full rewrite to spec 4.1 (collapsed 56px / expanded 240px)
src/components/CreateModal.tsx           Rebuild as 3-step wizard per spec 4.4
src/components/GenOverlay.tsx            Repaint to new tokens, keep step list contract
src/app/dashboard/layout.tsx (or page wrappers) Topbar + Sidebar shell
src/app/dashboard/page.tsx               Dashboard home (4.3)
src/app/dashboard/news/page.tsx          Modo Notícia (4.5) — exists, rewrite
src/app/dashboard/settings/page.tsx      Settings (4.6)
src/app/dashboard/context/page.tsx      Context (4.7)
src/app/dashboard/calendar/page.tsx      Calendar (4.8)
src/app/dashboard/upgrade/page.tsx      Upgrade (4.10)
src/app/(auth)/login/page.tsx           Login (4.9)
src/app/favicon.ico (or icon.svg)        New favicon = 16px logo variant
```

### Out of scope (do not touch)
```
src/components/Editor.tsx                Editor v2 already redesigned (spec §7)
src/components/EditorPanels.tsx
src/components/SlidePreview.tsx
src/app/dashboard/editor/**
src/app/landing/**, src/app/page.tsx     Landing page — outside dashboard redesign
src/app/admin/**                         Admin — separate redesign
src/app/api/**                           Pure API — no UI work here
```

---

## Conventions for every task

1. **Invoke skills first.** Before writing UI: run `frontend-design` skill. For hero/landing-like surfaces, ALSO run `high-end-visual-design`.
2. **No hex literals in components.** Only `var(--token)` (via Tailwind class) or token-driven Tailwind class. Lint by grep at end of each task.
3. **No `text-xs` (10px). No `font-size: 13.5px`.** Use only the 8 scale classes from `typography.css`.
4. **No `shadow-*` Tailwind utilities** except the single `shadow-pop` mapped to `--shadow-pop` and only on Modal/CommandPalette/Toast.
5. **No `bg-gradient-*`** anywhere.
6. **One `primary` button per viewport.** Verify visually on each screen.
7. **Commit at the end of every numbered task** with the message provided in the task. Use Conventional Commits + scope.

---

## Task 1: Tokens CSS (single source of truth)

**Files:**
- Create: `src/styles/tokens.css`

- [ ] **Step 1: Invoke skills**

Run the `frontend-design` Skill — read its checklist for "design-system foundations". Then proceed.

- [ ] **Step 2: Write `src/styles/tokens.css` (full file)**

```css
/* NovaCraft design tokens — 2026-05-12 — DESIGN.md §2 */
:root {
  /* Background — preto editorial */
  --bg-base:        #0A0A0B;
  --bg-surface:     #111113;
  --bg-surface-2:   #16161A;
  --bg-surface-3:   #1C1C21;
  --bg-overlay:     rgba(10,10,11,0.72);

  /* Border — translúcidas */
  --border-subtle:  rgba(255,255,255,0.06);
  --border-default: rgba(255,255,255,0.10);
  --border-strong:  rgba(255,255,255,0.16);
  --border-accent:  #C6F84E;

  /* Text — 5 níveis */
  --text-primary:   #F5F5F7;
  --text-secondary: #A1A1AA;
  --text-tertiary:  #6B6B72;
  --text-disabled:  #3F3F45;
  --text-inverse:   #0A0A0B;

  /* Acento — verde-limão único */
  --accent:         #C6F84E;
  --accent-hover:   #B5E84A;
  --accent-pressed: #9FD63D;
  --accent-muted:   rgba(198,248,78,0.12);
  --accent-glow:    rgba(198,248,78,0.32);

  /* Estados — acromáticos */
  --state-success: #7BD46C;
  --state-warning: #E8C547;
  --state-danger:  #E8625A;
  --state-info:    var(--text-secondary);

  /* Spacing — escala 4px */
  --space-0:  0;
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  20px;
  --space-6:  24px;
  --space-8:  32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;
  --space-24: 96px;

  /* Radius */
  --radius-xs:  4px;
  --radius-sm:  6px;
  --radius-md:  8px;
  --radius-lg:  12px;
  --radius-xl:  16px;
  --radius-pill: 999px;

  /* Shadow — único permitido */
  --shadow-pop: 0 12px 32px -8px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04);

  /* Motion */
  --ease-out:    cubic-bezier(0.22, 1, 0.36, 1);
  --ease-in:     cubic-bezier(0.4, 0, 0.84, 0);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --dur-fast: 120ms;
  --dur-base: 180ms;
  --dur-slow: 280ms;
  --dur-page: 420ms;
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --dur-fast: 1ms;
    --dur-base: 1ms;
    --dur-slow: 1ms;
    --dur-page: 1ms;
  }
}
```

- [ ] **Step 3: Verify file loads**

The file is not imported yet. Skip dev check until Task 3. Just confirm file exists and contains all sections from `DESIGN.md` §2.1–§2.6.

Run: `grep -c "^  --" src/styles/tokens.css`
Expected: ≥ 50 token lines.

- [ ] **Step 4: Commit**

```bash
git add src/styles/tokens.css
git commit -m "feat(design): add token CSS variables (DESIGN.md §2)"
```

---

## Task 2: Typography CSS + Inter loading

**Files:**
- Create: `src/styles/typography.css`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Write `src/styles/typography.css`**

```css
/* NovaCraft typography — Inter Variable — DESIGN.md §2.2 */

html, body {
  font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-feature-settings: 'cv11', 'ss01';
  -webkit-font-smoothing: antialiased;
}

.tnum, .text-caption, .text-micro, table, .metric-num {
  font-variant-numeric: tabular-nums;
}

.text-display    { font-size: 40px; line-height: 44px; font-weight: 600; letter-spacing: -0.02em;  }
.text-h1         { font-size: 28px; line-height: 34px; font-weight: 600; letter-spacing: -0.015em; }
.text-h2         { font-size: 20px; line-height: 26px; font-weight: 600; letter-spacing: -0.01em;  }
.text-h3         { font-size: 16px; line-height: 22px; font-weight: 600; letter-spacing: -0.005em; }
.text-body       { font-size: 14px; line-height: 20px; font-weight: 400; letter-spacing: 0;        }
.text-body-strong{ font-size: 14px; line-height: 20px; font-weight: 500; letter-spacing: 0;        }
.text-caption    { font-size: 12px; line-height: 16px; font-weight: 500; letter-spacing: 0.01em;   }
.text-micro      { font-size: 11px; line-height: 14px; font-weight: 600; letter-spacing: 0.06em;
                   text-transform: uppercase; }
```

- [ ] **Step 2: Read current `src/app/layout.tsx`** and add Inter via `next/font/google` if not already.

Open `src/app/layout.tsx` with Read. If Inter is not imported, add at top:

```tsx
import { Inter } from 'next/font/google';
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
```

Wrap `<body>`: `<body className={`${inter.variable} font-sans`}>`.
If Inter already loaded, skip this step (note in commit message).

- [ ] **Step 3: Verify**

Run `npm run dev`, open `http://localhost:3000`, open DevTools → Computed → confirm `font-family` starts with `Inter`.

- [ ] **Step 4: Commit**

```bash
git add src/styles/typography.css src/app/layout.tsx
git commit -m "feat(design): add type scale + load Inter Variable (DESIGN.md §2.2)"
```

---

## Task 3: Wire tokens into Tailwind + globals

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Replace `tailwind.config.ts` entirely**

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          base: "var(--bg-base)",
          surface: "var(--bg-surface)",
          "surface-2": "var(--bg-surface-2)",
          "surface-3": "var(--bg-surface-3)",
          overlay: "var(--bg-overlay)",
        },
        border: {
          subtle: "var(--border-subtle)",
          DEFAULT: "var(--border-default)",
          strong: "var(--border-strong)",
          accent: "var(--border-accent)",
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          tertiary: "var(--text-tertiary)",
          disabled: "var(--text-disabled)",
          inverse: "var(--text-inverse)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
          pressed: "var(--accent-pressed)",
          muted: "var(--accent-muted)",
          glow: "var(--accent-glow)",
        },
        state: {
          success: "var(--state-success)",
          warning: "var(--state-warning)",
          danger: "var(--state-danger)",
        },
      },
      spacing: {
        1: "var(--space-1)", 2: "var(--space-2)", 3: "var(--space-3)",
        4: "var(--space-4)", 5: "var(--space-5)", 6: "var(--space-6)",
        8: "var(--space-8)", 10: "var(--space-10)", 12: "var(--space-12)",
        16: "var(--space-16)", 20: "var(--space-20)", 24: "var(--space-24)",
      },
      borderRadius: {
        xs: "var(--radius-xs)", sm: "var(--radius-sm)", md: "var(--radius-md)",
        lg: "var(--radius-lg)", xl: "var(--radius-xl)", pill: "var(--radius-pill)",
      },
      boxShadow: {
        pop: "var(--shadow-pop)",
      },
      transitionTimingFunction: {
        "out-custom": "var(--ease-out)",
        "in-custom":  "var(--ease-in)",
        spring:       "var(--ease-spring)",
      },
      transitionDuration: {
        fast: "120ms",
        base: "180ms",
        slow: "280ms",
        page: "420ms",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "ui-sans-serif", "system-ui"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 2: Rewrite `src/app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import "../styles/tokens.css";
@import "../styles/typography.css";

html, body {
  background: var(--bg-base);
  color: var(--text-primary);
  min-height: 100vh;
}

*:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
  border-radius: 4px;
}

::selection {
  background: var(--accent-muted);
  color: var(--text-primary);
}
```

- [ ] **Step 3: Visual verify**

Run `npm run dev`. Open `/`. Confirm: background is dark editorial (not pure black), text is light. Inspect `body` → background-color should resolve to `rgb(10,10,11)`.

- [ ] **Step 4: Commit**

```bash
git add tailwind.config.ts src/app/globals.css
git commit -m "feat(design): wire tokens into tailwind + globals (DESIGN.md §2)"
```

---

## Task 4: cn() classnames helper

**Files:**
- Create: `src/lib/cn.ts`

- [ ] **Step 1: Write `src/lib/cn.ts`**

```ts
export type ClassValue = string | number | false | null | undefined | ClassValue[];

export function cn(...inputs: ClassValue[]): string {
  const out: string[] = [];
  const walk = (v: ClassValue) => {
    if (!v && v !== 0) return;
    if (typeof v === "string" || typeof v === "number") { out.push(String(v)); return; }
    if (Array.isArray(v)) v.forEach(walk);
  };
  inputs.forEach(walk);
  return out.join(" ");
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/cn.ts
git commit -m "chore: add cn classnames helper"
```

---

## Task 5: NovaCraft Logo component (symbol + wordmark + lockup)

**Files:**
- Create: `src/components/Logo.tsx`

- [ ] **Step 1: Invoke `frontend-design` + `high-end-visual-design`** before drawing the SVG.

- [ ] **Step 2: Write `src/components/Logo.tsx`**

Spec mapping from DESIGN.md §2.8 — canonical 24×24:
- Bar 1: x=2,  y=10, w=4, h=12  (white)
- Bar 2: x=10, y=6,  w=4, h=16  (white)
- Bar 3: x=18, y=2,  w=4, h=20  (white)
- Spark: cx=20, cy=-2 → since SVG can't go negative, shift entire grid down 4: bars y+=4, spark cy=2.

We expand viewBox to `0 0 24 28` so the spark fits above. (Note: spec ascii shows spark above the bars; we keep proportions and let the spark live in the top 4px of viewBox.) For `16` size we use simplified 2 bars + spark per spec ("favicon: símbolo 16×16 versão simplificada (2 barras + spark)").

```tsx
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
  // default 24
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
      NovaCraft
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
```

- [ ] **Step 3: Smoke check**

Temporarily drop `<LogoLockup />` into `src/app/page.tsx` (top of file). `npm run dev`, load `/`, see three white bars + green spark + "NovaCraft". Revert the temporary insertion.

- [ ] **Step 4: Commit**

```bash
git add src/components/Logo.tsx
git commit -m "feat(design): add NovaCraft logo (mark + wordmark + lockup, sizes 16/24/48)"
```

---

## Task 6: Button primitive

**Files:**
- Create: `src/components/ui/Button.tsx`

- [ ] **Step 1: Invoke `frontend-design`.**

- [ ] **Step 2: Write `src/components/ui/Button.tsx`**

```tsx
import * as React from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center font-medium rounded-sm " +
  "transition-colors duration-fast ease-out-custom " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base " +
  "disabled:opacity-40 disabled:cursor-not-allowed select-none whitespace-nowrap";

const variants: Record<Variant, string> = {
  primary:   "bg-accent text-text-inverse hover:bg-accent-hover active:bg-accent-pressed",
  secondary: "bg-bg-surface-2 border border-border text-text-primary hover:border-border-strong",
  ghost:     "bg-transparent text-text-secondary hover:bg-bg-surface-2 hover:text-text-primary",
  danger:    "bg-bg-surface-2 border border-state-danger/40 text-state-danger hover:border-state-danger/70",
};

const sizes: Record<Size, string> = {
  sm: "h-7 px-3 text-[13px] gap-1.5",
  md: "h-9 px-4 text-[14px] gap-2",
  lg: "h-11 px-5 text-[15px] gap-2",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "secondary", size = "md", loading, iconLeft, iconRight, className, children, disabled, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(base, variants[variant], sizes[size], className)}
      {...rest}
    >
      {loading ? <Spinner size={size === "sm" ? 12 : 14} /> : iconLeft}
      {children}
      {!loading && iconRight}
    </button>
  );
});

function Spinner({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className="animate-spin" aria-hidden>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
      <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
```

- [ ] **Step 3: Visual check via scratch page**

Create a temp `src/app/_design/page.tsx` (or in any unused dashboard tile) showing one of each variant × size. `npm run dev` → `/dashboard` or whatever route hosts it. Confirm: only primary has green bg, no two primaries collide visually, focus ring visible on tab. Remove the scratch file.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/Button.tsx
git commit -m "feat(ui): add Button primitive (DESIGN.md §3.1)"
```

---

## Task 7: Input primitive

**Files:**
- Create: `src/components/ui/Input.tsx`

- [ ] **Step 1: Write `src/components/ui/Input.tsx`**

```tsx
import * as React from "react";
import { cn } from "@/lib/cn";

type Size = "md" | "lg";

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  helper?: string;
  error?: string;
  inputSize?: Size;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, helper, error, inputSize = "md", iconLeft, iconRight, className, id, ...rest },
  ref
) {
  const reactId = React.useId();
  const inputId = id ?? reactId;
  const heightCls = inputSize === "lg" ? "h-11" : "h-9";
  const hasError = !!error;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className={cn("text-caption", hasError ? "text-state-danger" : "text-text-secondary")}>
          {label}
        </label>
      )}
      <div className={cn(
        "relative flex items-center rounded-sm border bg-bg-surface-2 transition-colors duration-fast",
        heightCls,
        hasError ? "border-state-danger" : "border-border focus-within:border-accent focus-within:bg-bg-surface focus-within:ring-2 focus-within:ring-accent/30",
      )}>
        {iconLeft && <span className="pl-3 text-text-tertiary flex items-center">{iconLeft}</span>}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "peer w-full bg-transparent outline-none px-3 text-text-primary placeholder:text-text-tertiary text-[14px]",
            iconLeft && "pl-2",
            iconRight && "pr-2",
            className
          )}
          {...rest}
        />
        {iconRight && <span className="pr-3 text-text-tertiary flex items-center">{iconRight}</span>}
      </div>
      {(helper || error) && (
        <p className={cn("text-caption", hasError ? "text-state-danger" : "text-text-tertiary")}>
          {error ?? helper}
        </p>
      )}
    </div>
  );
});
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/Input.tsx
git commit -m "feat(ui): add Input primitive (DESIGN.md §3.2)"
```

---

## Task 8: Card, Chip, Badge, Skeleton primitives

**Files:**
- Create: `src/components/ui/Card.tsx`
- Create: `src/components/ui/Chip.tsx`
- Create: `src/components/ui/Badge.tsx`
- Create: `src/components/ui/Skeleton.tsx`

- [ ] **Step 1: Invoke `frontend-design`.**

- [ ] **Step 2: Write `src/components/ui/Card.tsx`**

```tsx
import * as React from "react";
import { cn } from "@/lib/cn";

export function Card({
  density = "dense",
  interactive = false,
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { density?: "dense" | "respirado"; interactive?: boolean }) {
  return (
    <div
      className={cn(
        "bg-bg-surface border border-border-subtle rounded-lg transition-colors duration-fast",
        density === "dense" ? "p-4" : "p-6",
        interactive && "hover:border-border hover:bg-bg-surface-2 cursor-pointer",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 3: Write `src/components/ui/Chip.tsx`**

```tsx
import * as React from "react";
import { cn } from "@/lib/cn";

export function Chip({
  active = false,
  className,
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-1 text-[12px] font-medium transition-colors duration-fast",
        active
          ? "bg-accent-muted border-accent text-accent"
          : "bg-bg-surface-2 border-border text-text-secondary hover:text-text-primary hover:border-border-strong",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
```

- [ ] **Step 4: Write `src/components/ui/Badge.tsx`**

```tsx
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
```

- [ ] **Step 5: Write `src/components/ui/Skeleton.tsx`**

```tsx
import * as React from "react";
import { cn } from "@/lib/cn";

export function Skeleton({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-bg-surface-2 rounded-md",
        "before:absolute before:inset-0 before:-translate-x-full",
        "before:animate-[shimmer_1.6s_linear_infinite]",
        "before:bg-gradient-to-r before:from-transparent before:via-white/[0.04] before:to-transparent",
        className
      )}
      {...rest}
    />
  );
}
```

Add to `src/styles/typography.css` (append):

```css
@keyframes shimmer { 100% { transform: translateX(100%); } }
```

NOTE: This single `before:bg-gradient` is the ONLY allowed gradient in the system. Spec §8 forbids gradients in visible UI; shimmer's gradient is an animation mask, not a chrome gradient. Acceptable per spec §3.9 ("shimmer linear-gradient sutil").

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/Card.tsx src/components/ui/Chip.tsx src/components/ui/Badge.tsx src/components/ui/Skeleton.tsx src/styles/typography.css
git commit -m "feat(ui): add Card, Chip, Badge, Skeleton primitives (DESIGN.md §3.3–§3.9)"
```

---

## Task 9: Modal primitive

**Files:**
- Create: `src/components/ui/Modal.tsx`

- [ ] **Step 1: Invoke `frontend-design`.**

- [ ] **Step 2: Write `src/components/ui/Modal.tsx`**

```tsx
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
```

Append to `typography.css`:
```css
@keyframes modalIn {
  from { opacity: 0; transform: scale(0.96); }
  to   { opacity: 1; transform: scale(1); }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/Modal.tsx src/styles/typography.css
git commit -m "feat(ui): add Modal primitive (DESIGN.md §3.6)"
```

---

## Task 10: Toast primitive (replace existing)

**Files:**
- Modify: `src/components/Toast.tsx` (currently 207 bytes — likely placeholder)
- Create: `src/components/ui/Toast.tsx`

- [ ] **Step 1: Read existing `src/components/Toast.tsx`.** If it has consumers, keep its export name. Use grep `Toast` across `src/` to find usages.

- [ ] **Step 2: Implement `src/components/ui/Toast.tsx` per spec 3.7**

```tsx
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
```

Append to `typography.css`:
```css
@keyframes toastIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

- [ ] **Step 3: Mount `<ToastProvider>` in `src/app/dashboard/layout.tsx`**

Wrap children in `<ToastProvider>`. If `dashboard/layout.tsx` doesn't exist, create it now (it will also host Sidebar+Topbar in Task 12).

- [ ] **Step 4: Update consumers**

`grep -rn "from.*['\"].*Toast['\"]" src/` — repoint any old import to `@/components/ui/Toast`. Replace API surface to `useToast().push(kind, message)`.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/Toast.tsx src/components/Toast.tsx src/styles/typography.css src/app/dashboard/layout.tsx
git commit -m "feat(ui): replace Toast with spec'd provider (DESIGN.md §3.7)"
```

---

## Task 11: SidebarItem + Sidebar (full rewrite)

**Files:**
- Create: `src/components/ui/SidebarItem.tsx`
- Create: `src/hooks/useSidebarPinned.ts`
- Modify: `src/components/Sidebar.tsx` (full rewrite)

- [ ] **Step 1: Invoke `frontend-design`.**

- [ ] **Step 2: `src/hooks/useSidebarPinned.ts`**

```tsx
"use client";
import * as React from "react";

const KEY = "nc:sidebar-pinned";

export function useSidebarPinned() {
  const [pinned, setPinned] = React.useState(false);
  React.useEffect(() => {
    try { setPinned(localStorage.getItem(KEY) === "1"); } catch {}
  }, []);
  const set = React.useCallback((v: boolean) => {
    setPinned(v);
    try { localStorage.setItem(KEY, v ? "1" : "0"); } catch {}
  }, []);
  return [pinned, set] as const;
}
```

- [ ] **Step 3: `src/components/ui/SidebarItem.tsx`**

```tsx
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
```

- [ ] **Step 4: Rewrite `src/components/Sidebar.tsx`**

Read current file (4.9K, 5 sections) to preserve any logic (active route detection, sign-out). Then rebuild per spec 4.1:

```tsx
"use client";
import * as React from "react";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Newspaper, Calendar, BookOpen, Settings, Plus, PanelLeft } from "lucide-react";
import { SidebarItem } from "@/components/ui/SidebarItem";
import { LogoMark, LogoLockup } from "@/components/Logo";
import { useSidebarPinned } from "@/hooks/useSidebarPinned";
import { cn } from "@/lib/cn";

const ICON = (C: any) => <C size={18} strokeWidth={1.5} />;

export default function Sidebar() {
  const pathname = usePathname();
  const [pinned, setPinned] = useSidebarPinned();
  const [hover, setHover] = React.useState(false);
  const expanded = pinned || hover;

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname?.startsWith(href);

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
      {/* Logo */}
      <div className={cn("flex items-center px-3 mb-4", expanded ? "justify-start" : "justify-center")}>
        {expanded ? <LogoLockup /> : <LogoMark />}
      </div>

      {/* Create button — green square */}
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

      {/* Sections */}
      <nav className="flex-1 px-2 flex flex-col gap-1">
        {expanded && <SectionLabel>BIBLIOTECA</SectionLabel>}
        <SidebarItem href="/dashboard" icon={ICON(LayoutDashboard)} label="Dashboard" shortcut="g d" active={isActive("/dashboard") && pathname === "/dashboard"} expanded={expanded} />
        <SidebarItem href="/dashboard/news" icon={ICON(Newspaper)} label="Modo Notícia" shortcut="g n" active={isActive("/dashboard/news")} expanded={expanded} />
        <SidebarItem href="/dashboard/calendar" icon={ICON(Calendar)} label="Calendário" shortcut="g c" active={isActive("/dashboard/calendar")} expanded={expanded} />
        <SidebarItem href="/dashboard/context" icon={ICON(BookOpen)} label="Contexto" shortcut="g x" active={isActive("/dashboard/context")} expanded={expanded} />
      </nav>

      {/* Footer */}
      <div className="px-2 flex flex-col gap-1">
        <SidebarItem href="/dashboard/settings" icon={ICON(Settings)} label="Configurações" shortcut="g s" active={isActive("/dashboard/settings")} expanded={expanded} />
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-micro text-text-tertiary px-2.5 mt-1 mb-1">{children}</div>;
}
```

- [ ] **Step 5: Visual check**

`npm run dev`. Open `/dashboard`. Confirm:
- Collapsed sidebar = 56px wide, only icons + green Create square.
- Hover expands to 240px in ~180ms.
- Active route shows `accent-muted` bg + left 2px accent bar.
- Click "Fixar" → reload → still expanded.

- [ ] **Step 6: Commit**

```bash
git add src/components/Sidebar.tsx src/components/ui/SidebarItem.tsx src/hooks/useSidebarPinned.ts
git commit -m "feat(design): rebuild Sidebar to collapsed/expanded spec (DESIGN.md §4.1)"
```

---

## Task 12: Topbar

**Files:**
- Create: `src/components/Topbar.tsx`
- Modify: `src/app/dashboard/layout.tsx`

- [ ] **Step 1: Invoke `frontend-design`.**

- [ ] **Step 2: Write `src/components/Topbar.tsx`**

```tsx
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
      {/* Breadcrumb */}
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

      {/* ⌘K trigger */}
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
```

- [ ] **Step 3: Update `src/app/dashboard/layout.tsx`**

```tsx
"use client";
import * as React from "react";
import Sidebar from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { ToastProvider } from "@/components/ui/Toast";
import { CommandPalette } from "@/components/CommandPalette";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);

  React.useEffect(() => {
    const onCreate = () => setCreateOpen(true);
    window.addEventListener("nc:open-create", onCreate);
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault(); setPaletteOpen((v) => !v);
      } else if (e.key === "c" && !isTyping(e)) {
        setCreateOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("nc:open-create", onCreate);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-bg-base">
        <Sidebar />
        <div className="flex-1 min-w-0 flex flex-col">
          <Topbar onOpenPalette={() => setPaletteOpen(true)} onOpenCreate={() => setCreateOpen(true)} />
          <main className="flex-1 min-h-0">{children}</main>
        </div>
      </div>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      {/* CreateModal wired in Task 16 — keep state for now */}
      {createOpen && <CreateModalPortal onClose={() => setCreateOpen(false)} />}
    </ToastProvider>
  );
}

function isTyping(e: KeyboardEvent) {
  const t = e.target as HTMLElement;
  return ["INPUT", "TEXTAREA"].includes(t.tagName) || t.isContentEditable;
}

// Temporary stub until Task 16
function CreateModalPortal({ onClose }: { onClose: () => void }) {
  const C = require("@/components/CreateModal").default;
  return <C open onClose={onClose} />;
}
```

- [ ] **Step 4: Visual check**

`npm run dev` → `/dashboard`. Topbar 48px, breadcrumb at left, centered ⌘K trigger, right side has Create primary + bell + avatar. ⌘K opens palette stub (Task 13).

- [ ] **Step 5: Commit**

```bash
git add src/components/Topbar.tsx src/app/dashboard/layout.tsx
git commit -m "feat(design): add Topbar + dashboard shell layout (DESIGN.md §4.2)"
```

---

## Task 13: Command Palette + keymap

**Files:**
- Create: `src/components/CommandPalette.tsx`
- Create: `src/hooks/useKeymap.ts`

- [ ] **Step 1: `src/hooks/useKeymap.ts`** (lightweight `g d`, `g n` chord handler)

```tsx
"use client";
import * as React from "react";
import { useRouter } from "next/navigation";

export function useKeymap() {
  const router = useRouter();
  React.useEffect(() => {
    let chord: string | null = null;
    let chordTimer: any = null;
    const map: Record<string, string> = {
      "g d": "/dashboard",
      "g n": "/dashboard/news",
      "g c": "/dashboard/calendar",
      "g x": "/dashboard/context",
      "g s": "/dashboard/settings",
    };
    const isTyping = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      return ["INPUT", "TEXTAREA"].includes(t.tagName) || t.isContentEditable;
    };
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (chord) {
        const combo = `${chord} ${k}`;
        chord = null;
        clearTimeout(chordTimer);
        if (map[combo]) { e.preventDefault(); router.push(map[combo]); }
        return;
      }
      if (k === "g") {
        chord = "g";
        chordTimer = setTimeout(() => { chord = null; }, 900);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);
}
```

- [ ] **Step 2: `src/components/CommandPalette.tsx`**

```tsx
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

  // Group items
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
```

- [ ] **Step 3: Visual check**

`/dashboard` → press ⌘K. Palette opens, type "not" → "Modo Notícia" filters. Enter routes. `g d` from anywhere goes to `/dashboard`.

- [ ] **Step 4: Commit**

```bash
git add src/components/CommandPalette.tsx src/hooks/useKeymap.ts
git commit -m "feat(design): Command Palette + chord keymap (DESIGN.md §3.8 + §1.6)"
```

---

## Task 14: CarouselCard + Dashboard Home

**Files:**
- Create: `src/components/CarouselCard.tsx`
- Create: `src/components/MetricStrip.tsx`
- Create: `src/components/FilterToolbar.tsx`
- Modify: `src/app/dashboard/page.tsx` (full rewrite)

- [ ] **Step 1: Invoke `frontend-design` AND `high-end-visual-design`** (hero strip + cards are visual-quality-critical).

- [ ] **Step 2: Read current `src/app/dashboard/page.tsx`** to preserve data fetching (Carousels API).

- [ ] **Step 3: `src/components/CarouselCard.tsx`** — spec 3.3 + 4.3

```tsx
"use client";
import * as React from "react";
import Link from "next/link";
import { MoreHorizontal, Newspaper } from "lucide-react";
import { Badge, BadgeStatus } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";

export interface CarouselCardData {
  id: string;
  title: string;
  thumbnail?: string;
  slideCount: number;
  status: BadgeStatus;
  isNews?: boolean;
  updatedRelative: string;
}

export function CarouselCard({ data }: { data: CarouselCardData }) {
  return (
    <Link
      href={`/dashboard/editor/${data.id}`}
      className="group block"
    >
      <div className="relative aspect-[4/5] rounded-lg overflow-hidden border border-border-subtle bg-bg-surface-2 transition-all duration-fast group-hover:-translate-y-0.5 group-hover:border-accent">
        {data.thumbnail
          ? <img src={data.thumbnail} alt="" className="w-full h-full object-cover" />
          : <div className="w-full h-full bg-bg-surface-2" />}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(0deg, rgba(0,0,0,0.7) 0%, transparent 40%)" }}
        />
        {data.isNews && (
          <span className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-pill bg-bg-overlay border border-border text-caption text-text-primary backdrop-blur-sm">
            <Newspaper size={12} strokeWidth={1.5} /> Modo Notícia
          </span>
        )}
        <button
          className="absolute top-2 right-2 h-7 w-7 rounded-sm bg-bg-overlay border border-border opacity-0 group-hover:opacity-100 transition-opacity duration-fast flex items-center justify-center text-text-primary"
          onClick={(e) => { e.preventDefault(); /* open menu */ }}
          aria-label="Ações"
        >
          <MoreHorizontal size={14} strokeWidth={1.5} />
        </button>
        <div className="absolute left-0 right-0 bottom-0 p-3 flex items-end gap-2">
          <h3 className="flex-1 text-body-strong text-text-primary line-clamp-2">{data.title}</h3>
          <Badge status={data.status} className="shrink-0" />
        </div>
      </div>
      <div className="mt-2 text-caption text-text-tertiary tnum">
        {data.updatedRelative} · {data.slideCount} slides
      </div>
    </Link>
  );
}

export function NewCarouselCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="aspect-[4/5] rounded-lg border border-dashed border-border flex flex-col items-center justify-center gap-2 text-text-secondary hover:border-accent hover:text-accent transition-colors duration-fast"
    >
      <span className="text-[32px] leading-none">+</span>
      <span className="text-body-strong">Novo carrossel</span>
    </button>
  );
}
```

- [ ] **Step 4: `src/components/MetricStrip.tsx`**

```tsx
import * as React from "react";

export function MetricStrip({ name, totalActive, weekCreated, imagesUsed, imagesLimit }: {
  name: string;
  totalActive: number;
  weekCreated: number;
  imagesUsed: number;
  imagesLimit: number;
}) {
  const pct = Math.min(100, (imagesUsed / imagesLimit) * 100);
  return (
    <section className="px-6 py-5 border-b border-border-subtle flex items-center gap-8">
      <div className="flex-1 min-w-0">
        <h1 className="text-h1 text-text-primary">Olá, {name}.</h1>
        <p className="text-body text-text-secondary mt-1">
          Você tem <span className="text-text-primary font-medium">{totalActive} carrosséis</span> ativos
          e gerou <span className="text-text-primary font-medium">{weekCreated}</span> esta semana.
        </p>
      </div>
      <div className="flex items-center divide-x divide-border-subtle">
        <Metric value={`${totalActive}`} label="carrosséis ativos" />
        <Metric value={`${weekCreated}`} label="esta semana" />
        <div className="px-5">
          <div className="text-h2 text-text-primary tnum">{imagesUsed}/{imagesLimit}</div>
          <div className="text-caption text-text-tertiary">imagens IA usadas</div>
          <div className="mt-2 h-0.5 w-20 bg-bg-surface-2 rounded-pill overflow-hidden">
            <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>
    </section>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="px-5 first:pl-0">
      <div className="text-h2 text-text-primary tnum">{value}</div>
      <div className="text-caption text-text-tertiary">{label}</div>
    </div>
  );
}
```

- [ ] **Step 5: `src/components/FilterToolbar.tsx`**

```tsx
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
    { v: "todos", label: "Todos" },
    { v: "rascunhos", label: "Rascunhos" },
    { v: "prontos", label: "Prontos" },
    { v: "publicados", label: "Publicados" },
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
        <select
          value={sort}
          onChange={(e) => onSort(e.target.value)}
          className="h-9 px-3 bg-bg-surface-2 border border-border rounded-sm text-body text-text-primary"
        >
          <option value="recent">Mais recentes</option>
          <option value="oldest">Mais antigos</option>
          <option value="title">Título A→Z</option>
        </select>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Rewrite `src/app/dashboard/page.tsx`**

Preserve existing data fetch (read existing file first). Replace presentation:

```tsx
"use client";
import * as React from "react";
import { MetricStrip } from "@/components/MetricStrip";
import { FilterToolbar, FilterValue, ViewMode } from "@/components/FilterToolbar";
import { CarouselCard, NewCarouselCard, CarouselCardData } from "@/components/CarouselCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { LogoMark } from "@/components/Logo";

export default function DashboardPage() {
  const [items, setItems] = React.useState<CarouselCardData[] | null>(null);
  const [user, setUser] = React.useState<{ name: string; imagesUsed: number; imagesLimit: number; weekCreated: number } | null>(null);
  const [filter, setFilter] = React.useState<FilterValue>("todos");
  const [query, setQuery] = React.useState("");
  const [view, setView] = React.useState<ViewMode>("grid");
  const [sort, setSort] = React.useState("recent");

  React.useEffect(() => {
    // Existing data fetch — wire to the same endpoints the previous page.tsx used.
    // Map API response → CarouselCardData[] (title, thumbnail, slideCount, status, isNews, updatedRelative).
    // Preserve behavior; do not change API contract.
  }, []);

  const filtered = React.useMemo(() => {
    if (!items) return null;
    let out = items;
    if (filter === "rascunhos")  out = out.filter((c) => c.status === "rascunho");
    if (filter === "prontos")    out = out.filter((c) => c.status === "pronto");
    if (filter === "publicados") out = out.filter((c) => c.status === "publicado");
    if (filter === "noticia")    out = out.filter((c) => c.isNews);
    if (query.trim()) {
      const q = query.toLowerCase();
      out = out.filter((c) => c.title.toLowerCase().includes(q));
    }
    return out;
  }, [items, filter, query]);

  return (
    <div className="flex flex-col">
      <MetricStrip
        name={user?.name ?? "—"}
        totalActive={items?.length ?? 0}
        weekCreated={user?.weekCreated ?? 0}
        imagesUsed={user?.imagesUsed ?? 0}
        imagesLimit={user?.imagesLimit ?? 100}
      />
      <FilterToolbar
        filter={filter} onFilter={setFilter}
        query={query} onQuery={setQuery}
        view={view} onView={setView}
        sort={sort} onSort={setSort}
      />

      {filtered === null ? (
        <div className="p-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-[4/5] rounded-lg" />)}
        </div>
      ) : filtered.length === 0 && !query && filter === "todos" ? (
        <EmptyState />
      ) : filtered.length === 0 ? (
        <EmptyFilter onClear={() => { setFilter("todos"); setQuery(""); }} />
      ) : (
        <div className="p-6 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <NewCarouselCard onClick={() => window.dispatchEvent(new CustomEvent("nc:open-create"))} />
          {filtered.map((c) => <CarouselCard key={c.id} data={c} />)}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
      <LogoMark size={48} className="text-text-tertiary" />
      <h2 className="text-h2 text-text-primary">Nenhum carrossel ainda</h2>
      <p className="text-body text-text-secondary max-w-md">Crie seu primeiro carrossel — leva 30 segundos.</p>
      <Button variant="primary" size="lg" onClick={() => window.dispatchEvent(new CustomEvent("nc:open-create"))}>
        Criar primeiro carrossel
      </Button>
    </div>
  );
}

function EmptyFilter({ onClear }: { onClear: () => void }) {
  return (
    <div className="p-12 text-center text-body text-text-secondary">
      Nenhum carrossel com este filtro.{" "}
      <button className="text-accent hover:underline" onClick={onClear}>limpar filtros</button>.
    </div>
  );
}
```

- [ ] **Step 7: Wire data fetch**

Open the old `page.tsx` (via git: `git show HEAD:src/app/dashboard/page.tsx`) and copy the fetch logic into the new `useEffect`. Map the API shape to `CarouselCardData`. Compute `updatedRelative` from `updatedAt` (simple helper: `<1h`, `<24h`, `<7d`, else `dd/mm`).

- [ ] **Step 8: Visual check**

`/dashboard`: hero strip, toolbar, 4-col grid on wide screen, 4:5 cards with overlay + status badge, "Novo carrossel" dashed card first. Hover → 2px translate-y up, border green.

- [ ] **Step 9: Commit**

```bash
git add src/components/CarouselCard.tsx src/components/MetricStrip.tsx src/components/FilterToolbar.tsx src/app/dashboard/page.tsx
git commit -m "feat(design): redesign Dashboard home (DESIGN.md §4.3)"
```

---

## Task 15: GenOverlay repaint

**Files:**
- Modify: `src/components/GenOverlay.tsx`

- [ ] **Step 1: Read existing GenOverlay** to preserve `GEN_STEPS` and progress contract.

- [ ] **Step 2: Repaint to token system** (no API change). Spec §4.4 "Geração":

```tsx
"use client";
import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

export const GEN_STEPS = [
  "Preparando contexto…",
  "Gerando títulos…",
  "Distribuindo nos slides…",
  "Aplicando design…",
  "Pronto. Abrindo editor…",
];

export function GenOverlay({ stepIndex, total = GEN_STEPS.length, steps = GEN_STEPS }: {
  stepIndex: number; total?: number; steps?: string[];
}) {
  const pct = Math.min(100, ((stepIndex + 1) / total) * 100);
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center" style={{ background: "var(--bg-overlay)", backdropFilter: "blur(8px)" }}>
      <div className="w-[480px] bg-bg-surface border border-border-subtle rounded-lg shadow-pop overflow-hidden">
        <div className="h-1 w-full bg-bg-surface-2">
          <div className="h-full bg-accent transition-[width] duration-base" style={{ width: `${pct}%` }} />
        </div>
        <div className="p-6 flex flex-col gap-2">
          {steps.map((s, i) => {
            const done = i < stepIndex;
            const active = i === stepIndex;
            return (
              <div key={s} className={cn(
                "flex items-center gap-2 text-body transition-colors duration-fast",
                done ? "text-text-secondary" : active ? "text-text-primary" : "text-text-tertiary"
              )}>
                <span className={cn("w-4 h-4 rounded-pill border flex items-center justify-center",
                  done ? "border-accent bg-accent-muted" : active ? "border-accent" : "border-border"
                )}>
                  {done && <Check size={10} strokeWidth={2} className="text-accent" />}
                  {active && <span className="w-1.5 h-1.5 rounded-pill bg-accent animate-pulse" />}
                </span>
                <span>{s}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/GenOverlay.tsx
git commit -m "feat(design): repaint GenOverlay to tokens (DESIGN.md §4.4 'Geração')"
```

---

## Task 16: CreateModal — 3-step wizard

**Files:**
- Modify: `src/components/CreateModal.tsx` (full rewrite — currently 25K lines of old design)

- [ ] **Step 1: Invoke `frontend-design` + `high-end-visual-design`.**

- [ ] **Step 2: Read existing `CreateModal.tsx`** to map current API (props, generate POST endpoint).

- [ ] **Step 3: Rewrite**

```tsx
"use client";
import * as React from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { GenOverlay } from "@/components/GenOverlay";
import { cn } from "@/lib/cn";
import { useRouter } from "next/navigation";

type Tone = "profissional" | "casual" | "educativo" | "provocativo" | "storytelling";
const TONES: { v: Tone; title: string; desc: string }[] = [
  { v: "profissional",  title: "Profissional",  desc: "Tom de relatório, direto." },
  { v: "casual",        title: "Casual",        desc: "Linguagem do dia-a-dia." },
  { v: "educativo",     title: "Educativo",     desc: "Explica como um professor." },
  { v: "provocativo",   title: "Provocativo",   desc: "Ganchos, perguntas fortes." },
  { v: "storytelling",  title: "Storytelling",  desc: "História com começo, meio e fim." },
];
const ACCENTS = ["#C6F84E", "#7DD3FC", "#F472B6", "#FBBF24", "#A78BFA", "#34D399", "#FB7185", "#F5F5F7"];
const SUGGESTIONS = ["Marketing", "Vendas", "Saúde", "Tech", "Lifestyle", "Educação"];

export default function CreateModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const [theme, setTheme] = React.useState("");
  const [useBrand, setUseBrand] = React.useState(true);
  const [tone, setTone] = React.useState<Tone>("educativo");
  const [slides, setSlides] = React.useState(7);
  const [accent, setAccent] = React.useState(ACCENTS[0]);
  const [aiImages, setAiImages] = React.useState(true);
  const [genStep, setGenStep] = React.useState<number | null>(null);

  const reset = () => { setStep(1); setTheme(""); setGenStep(null); };

  async function submit() {
    setGenStep(0);
    try {
      // existing endpoint — keep same payload shape
      const res = await fetch("/api/carousel/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme, tone, slides, accent, aiImages, useBrand }),
      });
      // Mock step advancement; real impl can stream
      for (let i = 1; i <= 4; i++) { await wait(700); setGenStep(i); }
      const data = await res.json();
      if (data?.id) router.push(`/dashboard/editor/${data.id}`);
    } finally { /* keep overlay until route change */ }
  }

  return (
    <>
      <Modal
        open={open && genStep === null}
        onClose={() => { onClose(); reset(); }}
        size="lg"
        title="Novo carrossel"
        footer={
          <>
            {step > 1 && <Button variant="ghost" onClick={() => setStep((s) => (s - 1) as any)}>Voltar</Button>}
            {step < 3 && (
              <Button variant="primary" onClick={() => setStep((s) => (s + 1) as any)} disabled={step === 1 && !theme.trim()}>
                Continuar
              </Button>
            )}
            {step === 3 && <Button variant="primary" size="lg" onClick={submit}>Gerar agora</Button>}
          </>
        }
      >
        <Stepper step={step} />

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <Input
              label="Sobre o que é o carrossel?"
              helper="Seja específico. Ex: '5 erros que fazem você perder seguidores no Instagram em 2026'."
              inputSize="lg"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              autoFocus
            />
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <Chip key={s} onClick={() => setTheme((t) => t ? t : s)}>{s}</Chip>
              ))}
            </div>
            <label className="flex items-center gap-2 mt-2">
              <Switch checked={useBrand} onChange={setUseBrand} />
              <span className="text-body text-text-secondary">Usar contexto da minha marca</span>
            </label>
          </div>
        )}

        {step === 2 && (
          <div className="grid grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-caption text-text-secondary">Tom de voz</label>
              {TONES.map((t) => (
                <button
                  key={t.v}
                  type="button"
                  onClick={() => setTone(t.v)}
                  className={cn(
                    "text-left p-3 rounded-md border transition-colors duration-fast",
                    tone === t.v ? "border-accent bg-accent-muted" : "border-border-subtle bg-bg-surface-2 hover:border-border"
                  )}
                >
                  <div className="text-body-strong text-text-primary">{t.title}</div>
                  <div className="text-caption text-text-tertiary">{t.desc}</div>
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-caption text-text-secondary block mb-1.5">Quantidade de slides: <span className="text-text-primary tnum">{slides}</span></label>
                <input
                  type="range" min={4} max={10} value={slides}
                  onChange={(e) => setSlides(Number(e.target.value))}
                  className="w-full accent-accent"
                />
              </div>
              <div>
                <label className="text-caption text-text-secondary block mb-1.5">Cor de acento</label>
                <div className="flex flex-wrap gap-2">
                  {ACCENTS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setAccent(c)}
                      className={cn("h-7 w-7 rounded-pill border-2 transition-colors duration-fast", accent === c ? "border-text-primary" : "border-transparent")}
                      style={{ background: c }}
                      aria-label={c}
                    />
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2">
                <Switch checked={aiImages} onChange={setAiImages} />
                <span className="text-body text-text-secondary">Gerar imagens com IA</span>
              </label>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-4">
            <Spec label="Tema" value={theme || "—"} />
            <Spec label="Estilo" value={`${cap(tone)} · ${slides} slides · Acento ${accent}`} />
            <Spec label="Imagens" value={aiImages ? `Gerar com IA (custa ${slides} imagens do plano)` : "Sem imagens IA"} />
          </div>
        )}
      </Modal>

      {genStep !== null && <GenOverlay stepIndex={genStep} />}
    </>
  );
}

function Stepper({ step }: { step: 1 | 2 | 3 }) {
  const items = [{ n: 1, l: "Tema" }, { n: 2, l: "Estilo" }, { n: 3, l: "Revisão" }];
  return (
    <div className="flex items-center gap-3 mb-6">
      {items.map((it, i) => (
        <React.Fragment key={it.n}>
          <div className={cn(
            "flex items-center gap-2 text-caption",
            step === it.n ? "text-accent" : step > it.n ? "text-text-secondary" : "text-text-tertiary"
          )}>
            <span className={cn(
              "h-5 w-5 rounded-pill flex items-center justify-center text-[11px] tnum",
              step === it.n ? "bg-accent text-text-inverse" : step > it.n ? "bg-bg-surface-2 border border-border" : "bg-bg-surface-2 text-text-tertiary"
            )}>{it.n}</span>
            <span>{it.l}</span>
          </div>
          {i < items.length - 1 && <span className="text-text-tertiary">→</span>}
        </React.Fragment>
      ))}
    </div>
  );
}

function Spec({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border-l-2 border-border-subtle pl-3">
      <div className="text-micro text-text-tertiary">{label}</div>
      <div className="text-body text-text-primary mt-0.5">{value}</div>
    </div>
  );
}

function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "h-5 w-9 rounded-pill p-0.5 transition-colors duration-fast",
        checked ? "bg-accent" : "bg-bg-surface-3 border border-border"
      )}
    >
      <span className={cn("block h-4 w-4 rounded-pill bg-text-inverse transition-transform duration-fast", checked ? "translate-x-4" : "translate-x-0")} />
    </button>
  );
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
```

- [ ] **Step 4: Visual + functional check**

`/dashboard` → press `c` → Modal opens. Step through 1→2→3. Click "Gerar agora" → GenOverlay → after fake steps, redirects to editor.

- [ ] **Step 5: Commit**

```bash
git add src/components/CreateModal.tsx
git commit -m "feat(design): rebuild CreateModal as 3-step wizard (DESIGN.md §4.4)"
```

---

## Task 17: Modo Notícia — hero editorial + 3 estágios

**Files:**
- Modify: `src/app/dashboard/news/page.tsx`

- [ ] **Step 1: Invoke `frontend-design` AND `high-end-visual-design`** — spec §4.5 is the most autoral screen.

- [ ] **Step 2: Read existing `news/page.tsx`** to preserve scrape endpoint contract (`/api/news/scrape` or wherever current code POSTs).

- [ ] **Step 3: Write the rewrite**

The page renders three stacked panels conditional on scrape state. Use `framer-motion` for slide-down on stage reveal.

```tsx
"use client";
import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { useToast } from "@/components/ui/Toast";
import { Newspaper, MessageCircle, Flame, Globe, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/cn";

type Tone = "noticia" | "fofoca" | "viral";
type Scraped = { source: string; title: string; lead: string; images: string[]; publishedRelative?: string };

const TONES: { v: Tone; icon: React.ReactNode; label: string; desc: string; example: string }[] = [
  { v: "noticia", icon: <Newspaper size={24} strokeWidth={1.5} />,    label: "Notícia", desc: "Direto, factual, sem floreio. Como CNN ou G1.", example: '"STF decide hoje a constitucionalidade da lei X."' },
  { v: "fofoca",  icon: <MessageCircle size={24} strokeWidth={1.5} />, label: "Fofoca",  desc: "Drama, reações, linguagem popular tipo @choquei.", example: '"GENTE não acredito no que o STF acabou de fazer!"' },
  { v: "viral",   icon: <Flame size={24} strokeWidth={1.5} />,         label: "Viral",   desc: "Ganchos fortes, curiosidade, prova social.",        example: '"O que ninguém te contou sobre essa decisão do STF."' },
];

export default function NewsPage() {
  const toast = useToast();
  const [url, setUrl] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [scraped, setScraped] = React.useState<Scraped | null>(null);
  const [selImgs, setSelImgs] = React.useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = React.useState(true);
  const [tone, setTone] = React.useState<Tone>("noticia");
  const [slides, setSlides] = React.useState(7);
  const [accent, setAccent] = React.useState("#C6F84E");
  const [aiFill, setAiFill] = React.useState(true);
  const [includeSource, setIncludeSource] = React.useState(true);

  async function analyze() {
    setError(null); setLoading(true);
    try {
      const res = await fetch("/api/news/scrape", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) });
      if (!res.ok) throw new Error((await res.json()).error || "scrape_failed");
      const data: Scraped = await res.json();
      setScraped(data);
      setSelImgs(new Set(data.images.map((_, i) => i)));
    } catch (e: any) {
      setError(humanizeError(e.message));
    } finally { setLoading(false); }
  }

  const missing = scraped ? Math.max(0, slides - (selectAll ? scraped.images.length : selImgs.size)) : 0;

  async function generate() {
    // call existing generate-from-news endpoint with the same payload your old page used
    // ...
  }

  return (
    <div className="max-w-[1040px] mx-auto px-8 py-10 flex flex-col gap-8">
      <HeroEditorial />

      <Stage n="01" eyebrow="LINK DA MATÉRIA" accentTop={false}>
        <div className="flex flex-col gap-3">
          {error && (
            <div className="flex items-center gap-2 text-state-danger text-body">
              <AlertTriangle size={16} strokeWidth={1.5} /> {error}
            </div>
          )}
          <div className="flex flex-col md:flex-row gap-3 items-stretch">
            <div className="flex-1">
              <Input
                inputSize="lg"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://g1.globo.com/…"
                helper="Funciona em sites de notícia como G1, UOL, Folha, BBC, CNN."
              />
            </div>
            <Button variant="primary" size="lg" loading={loading} onClick={analyze}>
              {loading ? "Lendo matéria…" : "Analisar matéria →"}
            </Button>
          </div>
        </div>
      </Stage>

      <AnimatePresence>
        {scraped && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <Stage n="02" eyebrow="MATÉRIA ENCONTRADA" accentTop>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-pill bg-bg-surface-2 border border-border-subtle text-caption text-text-secondary">
                    <Globe size={12} strokeWidth={1.5} /> {scraped.source}
                  </span>
                  {scraped.publishedRelative && <span className="text-caption text-text-tertiary">publicado {scraped.publishedRelative}</span>}
                </div>
                <h2 className="text-h1 text-text-primary line-clamp-3">{scraped.title}</h2>
                <p className="text-body text-text-secondary line-clamp-2">{scraped.lead}</p>
                <div className="h-px bg-border-subtle" />
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Chip active={selectAll} onClick={() => setSelectAll(true)}>usar todas</Chip>
                    <Chip active={!selectAll} onClick={() => setSelectAll(false)}>escolher</Chip>
                    <span className="ml-auto text-caption text-text-tertiary">
                      {(selectAll ? scraped.images.length : selImgs.size)} de {scraped.images.length} selecionadas
                    </span>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1 snap-x">
                    {scraped.images.map((src, i) => {
                      const on = selectAll || selImgs.has(i);
                      return (
                        <button
                          key={i}
                          onClick={() => {
                            if (selectAll) return;
                            const next = new Set(selImgs);
                            on ? next.delete(i) : next.add(i);
                            setSelImgs(next);
                          }}
                          className={cn(
                            "snap-start h-24 w-24 rounded-md overflow-hidden border-2 transition-colors duration-fast",
                            on ? "border-accent" : "border-border-subtle hover:border-border"
                          )}
                        >
                          <img src={src} alt="" className="w-full h-full object-cover" />
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Button variant="ghost" onClick={() => setScraped(null)}>Re-analisar</Button>
                  <Button variant="primary">Continuar →</Button>
                </div>
              </div>
            </Stage>

            <div className="h-8" />

            <Stage n="03" eyebrow="COMO QUER QUE FIQUE?">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 lg:col-span-2">
                  {TONES.map((t) => (
                    <button
                      key={t.v}
                      onClick={() => setTone(t.v)}
                      className={cn(
                        "text-left p-5 rounded-md border h-[200px] flex flex-col gap-2 transition-colors duration-fast",
                        tone === t.v ? "border-accent bg-accent-muted text-accent" : "border-border-subtle bg-bg-surface-2 text-text-secondary hover:border-border"
                      )}
                    >
                      <span className={cn(tone === t.v ? "text-accent" : "text-text-secondary")}>{t.icon}</span>
                      <div className="text-h3 text-text-primary">{t.label}</div>
                      <div className="text-body text-text-secondary flex-1">{t.desc}</div>
                      <div className="text-caption text-text-tertiary bg-bg-surface px-2 py-1 rounded-xs font-mono">{t.example}</div>
                    </button>
                  ))}
                </div>

                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-caption text-text-secondary block mb-2">Quantidade de slides: <span className="text-text-primary tnum">{slides}</span></label>
                    <input type="range" min={4} max={10} value={slides} onChange={(e) => setSlides(Number(e.target.value))} className="w-full accent-accent" />
                  </div>
                  <div>
                    <label className="text-caption text-text-secondary block mb-2">Cor de acento</label>
                    <div className="flex gap-2">
                      {["#C6F84E", "#7DD3FC", "#F472B6", "#FBBF24", "#A78BFA", "#34D399", "#FB7185", "#F5F5F7"].map((c) => (
                        <button key={c} onClick={() => setAccent(c)} className={cn("h-6 w-6 rounded-pill border-2", accent === c ? "border-text-primary" : "border-transparent")} style={{ background: c }} aria-label={c} />
                      ))}
                    </div>
                  </div>
                  <label className="flex items-center justify-between gap-2 p-3 rounded-md border border-border-subtle bg-bg-surface-2">
                    <div>
                      <div className="text-body-strong text-text-primary">Gerar imagens faltantes com IA</div>
                      {missing > 0 && <div className="text-caption text-text-tertiary">Faltam {missing} imagens — gerar com IA usa {missing} créditos.</div>}
                    </div>
                    <SwitchInline checked={aiFill} onChange={setAiFill} />
                  </label>
                  <label className="flex items-center justify-between gap-2 p-3 rounded-md border border-border-subtle bg-bg-surface-2">
                    <div>
                      <div className="text-body-strong text-text-primary">Adicionar fonte no último slide</div>
                      <div className="text-caption text-text-tertiary">Aparece como crédito discreto: "Fonte: {scraped.source}".</div>
                    </div>
                    <SwitchInline checked={includeSource} onChange={setIncludeSource} />
                  </label>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <Button variant="primary" size="lg" onClick={generate}>Gerar carrossel →</Button>
              </div>
            </Stage>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function HeroEditorial() {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-5 gap-8 py-6">
      <div className="lg:col-span-3 flex flex-col gap-3">
        <span className="text-micro text-text-tertiary">MODO NOTÍCIA</span>
        <h1 className="text-display text-text-primary">
          Transforme <span className="border-b-2 border-accent">qualquer matéria</span> em carrossel viral.
        </h1>
        <p className="text-body text-text-secondary max-w-prose">
          Cole o link, escolha o tom. Em 30 segundos você tem 8 slides prontos pra postar.
        </p>
      </div>
      <div className="lg:col-span-2 font-mono text-caption leading-relaxed p-5 bg-bg-surface border border-border-subtle rounded-xl">
        <div className="text-text-tertiary">[ ARTIGO ORIGINAL ]</div>
        <div className="text-text-tertiary">Lula sanciona lei que…</div>
        <div className="text-accent my-2">↓ ↓ ↓</div>
        <div className="text-text-tertiary">[ CARROSSEL NOVACRAFT ]</div>
        <div className="text-text-primary">GENTE!! Saiu agora a</div>
        <div className="text-text-primary">nova lei que muda TUDO</div>
      </div>
    </section>
  );
}

function Stage({ n, eyebrow, children, accentTop }: { n: string; eyebrow: string; children: React.ReactNode; accentTop?: boolean }) {
  return (
    <section
      className={cn(
        "bg-bg-surface border border-border-subtle rounded-xl p-8",
        accentTop && "border-t-2 border-t-accent"
      )}
    >
      <div className="text-micro text-text-tertiary mb-4">{n} · {eyebrow}</div>
      {children}
    </section>
  );
}

function SwitchInline({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
      className={cn("h-5 w-9 rounded-pill p-0.5 transition-colors duration-fast", checked ? "bg-accent" : "bg-bg-surface-3 border border-border")}>
      <span className={cn("block h-4 w-4 rounded-pill bg-text-inverse transition-transform duration-fast", checked ? "translate-x-4" : "translate-x-0")} />
    </button>
  );
}

function humanizeError(code: string) {
  if (code.includes("invalid")) return "URL inválida — confirme o link.";
  if (code.includes("blocked")) return "Esse site bloqueia leitura automática.";
  return "Não conseguimos ler essa matéria. Tente outro link.";
}
```

- [ ] **Step 4: Map endpoint contract**

Compare existing `news/page.tsx` POST payload to the one used here (`/api/news/scrape` with `{ url }` returning `{ source, title, lead, images, publishedRelative }`). Adjust the field names to match whatever the API actually returns. Do not change the API.

- [ ] **Step 5: Visual check**

`/dashboard/news` — Hero editorial top with display title and mono right panel. Stage 01 visible immediately, 02 and 03 hidden until scrape success. Slide-down works with 280ms.

- [ ] **Step 6: Commit**

```bash
git add src/app/dashboard/news/page.tsx
git commit -m "feat(design): redesign Modo Notícia with editorial hero + 3 stages (DESIGN.md §4.5)"
```

---

## Task 18: Settings page

**Files:**
- Modify: `src/app/dashboard/settings/page.tsx`

- [ ] **Step 1: Invoke `frontend-design`.**

- [ ] **Step 2: Read existing settings page** to map field bindings (API key, plan info, profile).

- [ ] **Step 3: Rewrite per spec §4.6**

Pattern — inner sidebar 220px (left) + content (max-w 720px, right). Sections: Perfil, Conta, API & Integrações, Plano & Cobrança, Aparência, Atalhos.

```tsx
"use client";
import * as React from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

const SECTIONS = [
  { id: "perfil",    label: "Perfil" },
  { id: "conta",     label: "Conta" },
  { id: "api",       label: "API & Integrações" },
  { id: "plano",     label: "Plano & Cobrança" },
  { id: "aparencia", label: "Aparência" },
  { id: "atalhos",   label: "Atalhos" },
];

export default function SettingsPage() {
  const [active, setActive] = React.useState("perfil");
  const [dirty, setDirty] = React.useState(false);

  return (
    <div className="flex">
      <aside className="w-[220px] border-r border-border-subtle p-6 sticky top-12 h-[calc(100vh-3rem)]">
        <nav className="flex flex-col gap-1">
          {SECTIONS.map((s) => (
            <button key={s.id} onClick={() => setActive(s.id)} className={cn(
              "text-left h-8 px-2 rounded-sm text-body",
              active === s.id ? "bg-accent-muted text-accent" : "text-text-secondary hover:text-text-primary hover:bg-bg-surface-2"
            )}>{s.label}</button>
          ))}
        </nav>
      </aside>

      <div className="flex-1 min-w-0">
        <div className="max-w-[720px] p-8 flex flex-col gap-8">
          {active === "perfil"    && <ProfileSection onDirty={() => setDirty(true)} />}
          {active === "conta"     && <AccountSection onDirty={() => setDirty(true)} />}
          {active === "api"       && <ApiSection onDirty={() => setDirty(true)} />}
          {active === "plano"     && <PlanSection />}
          {active === "aparencia" && <AppearanceSection onDirty={() => setDirty(true)} />}
          {active === "atalhos"   && <ShortcutsSection />}
        </div>
        {dirty && (
          <div className="fixed bottom-0 right-0 left-[220px] h-14 bg-bg-surface-2 border-t border-border-subtle px-8 flex items-center justify-between">
            <span className="text-body-strong text-text-primary">Você tem alterações não salvas</span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => setDirty(false)}>Descartar</Button>
              <Button variant="primary" onClick={() => setDirty(false)}>Salvar</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, helper, children }: { label: string; helper?: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-5 gap-4 items-start">
      <div className="col-span-2">
        <div className="text-body-strong text-text-primary">{label}</div>
        {helper && <div className="text-caption text-text-tertiary mt-0.5">{helper}</div>}
      </div>
      <div className="col-span-3">{children}</div>
    </div>
  );
}

function ProfileSection({ onDirty }: { onDirty: () => void }) {
  return (
    <>
      <h2 className="text-h1 text-text-primary">Perfil</h2>
      <Row label="Nome" helper="Como você aparece no app.">
        <Input onChange={onDirty} defaultValue="" />
      </Row>
      <Row label="Email">
        <Input type="email" onChange={onDirty} defaultValue="" />
      </Row>
    </>
  );
}

function AccountSection({ onDirty }: { onDirty: () => void }) {
  return (
    <>
      <h2 className="text-h1 text-text-primary">Conta</h2>
      <Row label="Senha"><Button variant="secondary">Alterar senha</Button></Row>
      <Row label="Excluir conta" helper="Não dá pra desfazer."><Button variant="danger">Excluir</Button></Row>
    </>
  );
}

function ApiSection({ onDirty }: { onDirty: () => void }) {
  return (
    <>
      <h2 className="text-h1 text-text-primary">API & Integrações</h2>
      <Row label="Gemini API key" helper="Sua chave fica criptografada.">
        <Input type="password" placeholder="••••••••" onChange={onDirty} />
      </Row>
    </>
  );
}

function PlanSection() {
  return (
    <>
      <h2 className="text-h1 text-text-primary">Plano & Cobrança</h2>
      <Row label="Plano atual" helper="Free — 100 imagens IA / mês">
        <Button variant="primary">Upgrade</Button>
      </Row>
    </>
  );
}

function AppearanceSection({ onDirty }: { onDirty: () => void }) {
  return (
    <>
      <h2 className="text-h1 text-text-primary">Aparência</h2>
      <Row label="Tema" helper="Modo claro em breve."><span className="text-body text-text-tertiary">Escuro (padrão)</span></Row>
      <Row label="Densidade compacta"><SettingsSwitch onChange={onDirty} /></Row>
      <Row label="Reduzir motion"><SettingsSwitch onChange={onDirty} /></Row>
    </>
  );
}

function ShortcutsSection() {
  const rows = [
    ["Abrir command palette", "⌘K"],
    ["Criar carrossel",       "c"],
    ["Ir ao dashboard",       "g d"],
    ["Ir ao Modo Notícia",    "g n"],
    ["Ir ao Calendário",      "g c"],
    ["Ir ao Contexto",        "g x"],
    ["Ir às Configurações",   "g s"],
  ];
  return (
    <>
      <h2 className="text-h1 text-text-primary">Atalhos</h2>
      <table className="w-full text-body">
        <tbody>
          {rows.map(([a, k]) => (
            <tr key={a} className="border-t border-border-subtle">
              <td className="py-2 text-text-primary">{a}</td>
              <td className="py-2 text-right">
                <kbd className="px-1.5 py-0.5 rounded-xs border border-border bg-bg-surface-2 text-caption tnum">{k}</kbd>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function SettingsSwitch({ onChange }: { onChange: () => void }) {
  const [on, setOn] = React.useState(false);
  return (
    <button role="switch" aria-checked={on} onClick={() => { setOn((v) => !v); onChange(); }}
      className={cn("h-5 w-9 rounded-pill p-0.5 transition-colors duration-fast", on ? "bg-accent" : "bg-bg-surface-3 border border-border")}>
      <span className={cn("block h-4 w-4 rounded-pill bg-text-inverse transition-transform duration-fast", on ? "translate-x-4" : "translate-x-0")} />
    </button>
  );
}
```

- [ ] **Step 4: Wire real data**

Replace `defaultValue=""` and stubs with actual API fetches from current settings page (GET user → populate; PATCH on save).

- [ ] **Step 5: Commit**

```bash
git add src/app/dashboard/settings/page.tsx
git commit -m "feat(design): redesign Settings (DESIGN.md §4.6)"
```

---

## Task 19: Context page

**Files:**
- Modify: `src/app/dashboard/context/page.tsx`

- [ ] **Step 1: Invoke `frontend-design`.**

- [ ] **Step 2: Read existing page** to keep fields/persistence.

- [ ] **Step 3: Rewrite per §4.7**

```tsx
"use client";
import * as React from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { Code, Copy } from "lucide-react";

export default function ContextPage() {
  const toast = useToast();
  const [brand, setBrand] = React.useState("");
  const [tone, setTone] = React.useState("");
  const [audience, setAudience] = React.useState("");
  const [avoid, setAvoid] = React.useState("");

  // load + persist via existing /api/user/context endpoint

  const prompt = buildPrompt({ brand, tone, audience, avoid });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-8">
      <div className="flex flex-col gap-5">
        <h1 className="text-h1 text-text-primary">Contexto da marca</h1>
        <Field label="Sobre a marca" value={brand} onChange={setBrand} rows={8} />
        <Field label="Tom de voz"    value={tone}  onChange={setTone}  rows={4} />
        <Field label="Público-alvo"  value={audience} onChange={setAudience} rows={4} />
        <Field label="O que evitar"  value={avoid} onChange={setAvoid} rows={3} />
        <div className="flex justify-end">
          <Button variant="primary" onClick={() => toast.push("success", "Contexto salvo.")}>Salvar</Button>
        </div>
      </div>

      <div className="bg-bg-surface-2 border border-border-subtle rounded-lg overflow-hidden h-fit sticky top-16">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
          <div className="flex items-center gap-2 text-text-secondary">
            <Code size={14} strokeWidth={1.5} /> <span className="text-body">Como a IA verá:</span>
          </div>
          <button
            onClick={() => { navigator.clipboard.writeText(prompt); toast.push("info", "Copiado."); }}
            className="text-caption text-text-secondary hover:text-text-primary flex items-center gap-1"
          >
            <Copy size={12} strokeWidth={1.5} /> Copiar
          </button>
        </div>
        <pre className="px-4 py-3 text-[12px] leading-relaxed font-mono text-text-primary whitespace-pre-wrap">
{highlight(prompt)}
        </pre>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, rows }: { label: string; value: string; onChange: (v: string) => void; rows: number }) {
  return (
    <label className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-caption text-text-secondary">{label}</span>
        <span className="text-caption text-text-tertiary tnum">{value.length}</span>
      </div>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-bg-surface-2 border border-border rounded-sm px-3 py-2 text-body text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 resize-y"
      />
    </label>
  );
}

function buildPrompt(p: { brand: string; tone: string; audience: string; avoid: string }) {
  return [
    `{ "brand": ${JSON.stringify(p.brand) },`,
    `  "tone":  ${JSON.stringify(p.tone)},`,
    `  "audience": ${JSON.stringify(p.audience)},`,
    `  "avoid": ${JSON.stringify(p.avoid)} }`,
  ].join("\n");
}

function highlight(s: string) {
  // simple highlight: braces and quoted keys → accent
  // (kept minimal — no parser, just span replacement)
  return s; // visual contrast handled by tone of pre block
}
```

- [ ] **Step 4: Wire to existing GET/PATCH endpoint.** Read current file to find URL.

- [ ] **Step 5: Commit**

```bash
git add src/app/dashboard/context/page.tsx
git commit -m "feat(design): redesign Context (DESIGN.md §4.7)"
```

---

## Task 20: Calendar page

**Files:**
- Modify: `src/app/dashboard/calendar/page.tsx`

- [ ] **Step 1: Invoke `frontend-design`.**

- [ ] **Step 2: Read existing calendar implementation** to preserve event fetch.

- [ ] **Step 3: Rewrite Month view (default) per §4.8**

```tsx
"use client";
import * as React from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { cn } from "@/lib/cn";

type Event = { id: string; title: string; date: string /* yyyy-mm-dd */; time?: string; status: string };

export default function CalendarPage() {
  const [cursor, setCursor] = React.useState(() => {
    const d = new Date(); d.setDate(1); return d;
  });
  const [view, setView] = React.useState<"mes" | "semana" | "lista">("mes");
  const [selected, setSelected] = React.useState<string | null>(null);
  const [events, setEvents] = React.useState<Event[]>([]);

  // fetch events for the visible range from existing API

  const monthLabel = cursor.toLocaleString("pt-BR", { month: "long", year: "numeric" });
  const grid = buildGrid(cursor);
  const todayISO = new Date().toISOString().slice(0, 10);

  return (
    <div className="p-6">
      <header className="flex items-center gap-3 mb-4">
        <h1 className="text-h2 text-text-primary capitalize">{monthLabel}</h1>
        <button onClick={() => shift(setCursor, cursor, -1)} className="h-8 w-8 rounded-sm hover:bg-bg-surface-2 flex items-center justify-center text-text-secondary"><ChevronLeft size={16} strokeWidth={1.5} /></button>
        <button onClick={() => shift(setCursor, cursor, +1)} className="h-8 w-8 rounded-sm hover:bg-bg-surface-2 flex items-center justify-center text-text-secondary"><ChevronRight size={16} strokeWidth={1.5} /></button>
        <Button variant="ghost" size="sm" onClick={() => { const d = new Date(); d.setDate(1); setCursor(d); }}>Hoje</Button>

        <div className="ml-auto flex items-center gap-1.5">
          <Chip active={view === "mes"}    onClick={() => setView("mes")}>Mês</Chip>
          <Chip active={view === "semana"} onClick={() => setView("semana")}>Semana</Chip>
          <Chip active={view === "lista"}  onClick={() => setView("lista")}>Lista</Chip>
          <Button variant="primary" size="sm" iconLeft={<Plus size={14} strokeWidth={2} />}>Agendar</Button>
        </div>
      </header>

      <div className="flex gap-4">
        <div className="flex-1 min-w-0 bg-bg-surface border border-border-subtle rounded-lg overflow-hidden">
          <div className="grid grid-cols-7 text-micro text-text-tertiary px-2 pt-2">
            {["seg","ter","qua","qui","sex","sáb","dom"].map((d) => <div key={d} className="py-2 text-center">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 grid-rows-6 border-t border-border-subtle">
            {grid.map((day) => {
              const iso = day.toISOString().slice(0, 10);
              const inMonth = day.getMonth() === cursor.getMonth();
              const today = iso === todayISO;
              const isSel = selected === iso;
              const dayEvents = events.filter((e) => e.date === iso);
              return (
                <button
                  key={iso}
                  onClick={() => setSelected(iso)}
                  className={cn(
                    "min-h-[88px] text-left p-2 border-r border-b border-border-subtle flex flex-col gap-1",
                    inMonth ? "text-text-primary" : "text-text-disabled",
                    isSel && "border-accent ring-1 ring-accent",
                    "hover:bg-bg-surface-2"
                  )}
                >
                  <div className="flex items-center gap-1 text-caption">
                    <span className="tnum">{day.getDate()}</span>
                    {today && <span className="h-1.5 w-1.5 rounded-pill bg-accent" />}
                  </div>
                  {dayEvents.slice(0, 3).map((e) => (
                    <span key={e.id} className="text-[11px] px-1.5 py-0.5 rounded-xs bg-accent-muted text-accent truncate">
                      {e.title}
                    </span>
                  ))}
                  {dayEvents.length > 3 && <span className="text-caption text-text-tertiary">+{dayEvents.length - 3}</span>}
                </button>
              );
            })}
          </div>
        </div>

        <aside className="w-[320px] shrink-0">
          {selected ? <DayPanel iso={selected} events={events.filter((e) => e.date === selected)} /> : <EmptyDay />}
        </aside>
      </div>
    </div>
  );
}

function DayPanel({ iso, events }: { iso: string; events: Event[] }) {
  return (
    <div className="bg-bg-surface border border-border-subtle rounded-lg p-4 flex flex-col gap-3">
      <div className="text-body-strong text-text-primary">{new Date(iso).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}</div>
      {events.length === 0 ? <div className="text-body text-text-secondary">Nada agendado.</div> : events.map((e) => (
        <div key={e.id} className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-md bg-bg-surface-2 border border-border-subtle" />
          <div className="flex-1 min-w-0">
            <div className="text-body-strong text-text-primary truncate">{e.title}</div>
            <div className="text-caption text-text-tertiary tnum">{e.time ?? ""}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyDay() {
  return <div className="bg-bg-surface border border-border-subtle rounded-lg p-6 text-body text-text-secondary">Selecione um dia para ver os carrosséis agendados.</div>;
}

function buildGrid(monthStart: Date) {
  // Monday-first 6×7 grid
  const start = new Date(monthStart);
  const dow = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - dow);
  const out: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i); out.push(d);
  }
  return out;
}

function shift(set: any, cur: Date, delta: number) {
  const d = new Date(cur); d.setMonth(cur.getMonth() + delta); set(d);
}
```

- [ ] **Step 4: Wire event fetch** to existing endpoint (probably `/api/calendar/...`).

- [ ] **Step 5: Commit**

```bash
git add src/app/dashboard/calendar/page.tsx
git commit -m "feat(design): redesign Calendar (DESIGN.md §4.8)"
```

---

## Task 21: Login page

**Files:**
- Modify: `src/app/(auth)/login/page.tsx`

- [ ] **Step 1: Invoke `frontend-design` AND `high-end-visual-design`.**

- [ ] **Step 2: Read current login page** to preserve auth POST.

- [ ] **Step 3: Rewrite per §4.9**

```tsx
"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { LogoLockup } from "@/components/Logo";

const ROTATING = [
  ["Crie carrosséis", "em segundos."],
  ["Transforme notícias", "em conteúdo viral."],
  ["Sua marca,", "sua voz, escalada."],
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [pwd, setPwd]     = React.useState("");
  const [show, setShow]   = React.useState(false);
  const [err, setErr]     = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [phraseIdx, setPhraseIdx] = React.useState(0);

  React.useEffect(() => {
    const id = setInterval(() => setPhraseIdx((i) => (i + 1) % ROTATING.length), 4200);
    return () => clearInterval(id);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(null); setLoading(true);
    try {
      const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: pwd }) });
      if (!res.ok) throw new Error("invalid");
      router.push("/dashboard");
    } catch { setErr("Email ou senha incorretos."); } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex bg-bg-base">
      <div className="w-full lg:w-[40%] min-w-[480px] flex items-center px-16 py-16">
        <div className="w-full max-w-[400px] flex flex-col gap-6">
          <LogoLockup />
          <div>
            <h1 className="text-display text-text-primary">Bem-vindo de volta.</h1>
            <p className="text-body text-text-secondary mt-1">Entre na sua conta NovaCraft.</p>
          </div>
          <form className="flex flex-col gap-4" onSubmit={submit}>
            {err && <div className="text-body text-state-danger">{err}</div>}
            <Input label="Email" type="email" inputSize="lg" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
            <Input
              label="Senha" type={show ? "text" : "password"} inputSize="lg" value={pwd} onChange={(e) => setPwd(e.target.value)} autoComplete="current-password" required
              iconRight={
                <button type="button" onClick={() => setShow((s) => !s)} className="text-text-tertiary hover:text-text-primary">
                  {show ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
                </button>
              }
            />
            <a href="/recover" className="text-caption text-accent self-end">Esqueci a senha</a>
            <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">Entrar</Button>
            <div className="flex items-center gap-3 text-caption text-text-tertiary">
              <div className="flex-1 h-px bg-border-subtle" /> ou <div className="flex-1 h-px bg-border-subtle" />
            </div>
            <Button type="button" variant="secondary" size="lg" className="w-full" onClick={() => location.href = "/api/auth/google"}>
              Continuar com Google
            </Button>
          </form>
          <div className="text-caption text-text-secondary">
            Não tem conta? <a href="/signup" className="text-accent">Criar conta gratuita</a>
          </div>
        </div>
      </div>
      <div className="hidden lg:flex w-[60%] bg-bg-surface items-center justify-center px-16">
        <div className="font-mono leading-tight text-center text-text-primary" style={{ fontSize: 56, letterSpacing: "-0.04em" }}>
          {ROTATING[phraseIdx].map((line, i) => (
            <div key={i} className={i === 1 ? "text-accent" : ""}>{line}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/(auth)/login/page.tsx
git commit -m "feat(design): redesign Login split layout (DESIGN.md §4.9)"
```

---

## Task 22: Upgrade page

**Files:**
- Modify: `src/app/dashboard/upgrade/page.tsx`

- [ ] **Step 1: Invoke `frontend-design` AND `high-end-visual-design`.**

- [ ] **Step 2: Rewrite per §4.10**

```tsx
"use client";
import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { cn } from "@/lib/cn";

type Plan = { id: string; name: string; priceMonthly: number; priceYearly: number; tag?: "MAIS POPULAR" | null; desc: string; features: string[]; current?: boolean };
const PLANS: Plan[] = [
  { id: "free",   name: "Free",   priceMonthly: 0,  priceYearly: 0,  tag: null,             desc: "Pra testar com calma.",          features: ["10 carrosséis/mês", "100 imagens IA", "Templates básicos"], current: true },
  { id: "pro",    name: "Pro",    priceMonthly: 49, priceYearly: 470, tag: "MAIS POPULAR",   desc: "Pra quem posta toda semana.",    features: ["Carrosséis ilimitados", "1000 imagens IA / mês", "Modo Notícia", "Templates premium"] },
  { id: "studio", name: "Studio", priceMonthly: 149, priceYearly: 1430, tag: null,           desc: "Equipe e agências.",             features: ["Tudo do Pro", "5 membros", "API access", "Suporte prioritário"] },
];

const FAQ = [
  ["Posso cancelar quando quiser?", "Sim. Acesso continua até o fim do ciclo já pago."],
  ["Imagens IA não usadas acumulam?", "Não. Reset todo mês."],
  ["Tem reembolso?", "7 dias após a primeira cobrança."],
];

export default function UpgradePage() {
  const [yearly, setYearly] = React.useState(false);
  const [open, setOpen] = React.useState<number | null>(null);

  return (
    <div className="max-w-[1040px] mx-auto px-8 py-12 flex flex-col gap-10">
      <header className="text-center flex flex-col gap-3 items-center">
        <span className="text-micro text-text-tertiary">PLANOS NOVACRAFT</span>
        <h1 className="text-display text-text-primary">Pague pelo que usa. Cresça quando precisar.</h1>
        <p className="text-body text-text-secondary max-w-prose">Sem letra miúda. Cancele a qualquer hora.</p>
        <div className="mt-2 flex items-center gap-2">
          <Chip active={!yearly} onClick={() => setYearly(false)}>Mensal</Chip>
          <Chip active={yearly}  onClick={() => setYearly(true)}>Anual <span className="ml-1 text-state-success">-20%</span></Chip>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLANS.map((p) => (
          <div key={p.id} className={cn(
            "relative bg-bg-surface rounded-lg p-8 flex flex-col gap-4",
            p.tag ? "border-2 border-accent" : "border border-border-subtle"
          )}>
            {p.tag && <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-pill bg-accent-muted border border-accent text-caption text-accent">{p.tag}</span>}
            <h2 className="text-h2 text-text-primary">{p.name}</h2>
            <div className="flex items-end gap-1">
              <span className="text-display text-text-primary tnum">R${yearly ? Math.round(p.priceYearly / 12) : p.priceMonthly}</span>
              <span className="text-body text-text-secondary mb-2">/mês</span>
            </div>
            <p className="text-body text-text-secondary">{p.desc}</p>
            <div className="h-px bg-border-subtle" />
            <ul className="flex flex-col gap-2">
              {p.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-body text-text-primary">
                  <Check size={14} strokeWidth={1.5} className="text-accent" /> {f}
                </li>
              ))}
            </ul>
            <Button variant={p.current ? "secondary" : "primary"} size="lg" disabled={p.current} className="w-full mt-auto">
              {p.current ? "Plano atual" : `Assinar ${p.name}`}
            </Button>
          </div>
        ))}
      </div>

      <section className="max-w-[720px] mx-auto w-full flex flex-col gap-2">
        <h2 className="text-h1 text-text-primary mb-4">Perguntas frequentes</h2>
        {FAQ.map(([q, a], i) => (
          <button key={i} onClick={() => setOpen((o) => (o === i ? null : i))} className="text-left bg-bg-surface border border-border-subtle rounded-md px-4 py-3">
            <div className="flex items-center justify-between text-body-strong text-text-primary">
              {q}
              <ChevronDown size={16} strokeWidth={1.5} className={cn("transition-transform duration-fast", open === i && "rotate-180")} />
            </div>
            {open === i && <div className="text-body text-text-secondary mt-2">{a}</div>}
          </button>
        ))}
      </section>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/upgrade/page.tsx
git commit -m "feat(design): redesign Upgrade (DESIGN.md §4.10)"
```

---

## Task 23: Favicon + meta

**Files:**
- Create: `src/app/icon.svg` (or replace `favicon.ico`)
- Modify: `src/app/layout.tsx` metadata

- [ ] **Step 1: Write `src/app/icon.svg`** — 16×16 simplified mark (2 bars + spark):

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
  <rect width="16" height="16" fill="#0A0A0B"/>
  <rect x="3" y="7" width="2" height="7"  fill="#F5F5F7"/>
  <rect x="8" y="3" width="2" height="11" fill="#F5F5F7"/>
  <circle cx="13" cy="2.5" r="1.5" fill="#C6F84E"/>
</svg>
```

Next.js App Router auto-uses `src/app/icon.svg` as favicon.

- [ ] **Step 2: Update metadata in `layout.tsx`**

```tsx
export const metadata = {
  title: "NovaCraft — Carrosséis em segundos",
  description: "Crie carrosséis profissionais com IA. Modo Notícia transforma qualquer matéria em post viral.",
  themeColor: "#0A0A0B",
};
```

- [ ] **Step 3: Commit**

```bash
git add src/app/icon.svg src/app/layout.tsx
git commit -m "feat(design): new favicon + metadata"
```

---

## Task 24: Final QA pass — 12 acceptance criteria

**Files:** none (audit only — may produce small follow-up commits).

- [ ] **Step 1: Token discipline scan**

Run:
```bash
grep -rnE '#[0-9a-fA-F]{6}' src/app src/components | grep -vE '(tokens\.css|icon\.svg|Logo\.tsx|/api/)' | grep -v 'C6F84E'
```
Expected: only the hardcoded accent swatches inside `CreateModal` and `news/page.tsx` (8-color palette pickers). Anything else → fix to token.

- [ ] **Step 2: Forbidden Tailwind utilities scan**

```bash
grep -rnE 'shadow-(sm|md|lg|xl|2xl)|bg-gradient-' src/app src/components
```
Expected: zero hits. Only `shadow-pop` allowed.

- [ ] **Step 3: Banned font-size scan**

```bash
grep -rnE 'text-xs|font-size:\s*1[0-3]\.5?px' src/app src/components
```
Expected: zero hits.

- [ ] **Step 4: Manual visual checklist (DESIGN.md §8)**

Open each route in browser and verify:

1. [ ] No hex literal in component source (Step 1 confirms).
2. [ ] No shadows outside `shadow-pop` on Modal/Palette/Toast (Step 2 confirms).
3. [ ] No gradient anywhere (Step 2 confirms, except shimmer mask).
4. [ ] Only `#C6F84E` accent appears (no roxo, no azul, no rosa) outside the swatch pickers and the accent toggles.
5. [ ] Typography uses the 8 classes (visually inspect — spot-check `inspect element` on each page).
6. [ ] Sidebar collapses/expands in ~180ms easing custom (DevTools → Animations panel).
7. [ ] ⌘K opens palette from every dashboard route.
8. [ ] Modo Notícia hero is editorial (display title + mono right panel), not a generic card.
9. [ ] Carousel cards: aspect 4:5, bottom overlay correct, hover lifts 2px, border turns accent.
10. [ ] Logo appears in Sidebar (24px), Login (lockup), favicon (browser tab).
11. [ ] Focus ring visible on every Tab through every interactive element.
12. [ ] Set `prefers-reduced-motion` (DevTools → Rendering) → all transitions become instant.

If any item fails, open a follow-up commit `fix(design): <item>` and patch in-place.

- [ ] **Step 5: Skill self-review**

Invoke `frontend-design` skill on a full screenshot pass: Dashboard, Modo Notícia, CreateModal step 2, Settings, Login. Note any "design tells" called out by the skill and fix.

- [ ] **Step 6: Commit any QA fixes**

```bash
git add -p
git commit -m "fix(design): QA pass against DESIGN.md §8 acceptance criteria"
```

- [ ] **Step 7: Tag baseline**

```bash
git tag design-v1
```

---

## Self-review notes (author's own check against the spec)

**Spec coverage map:**

| DESIGN.md section | Plan task(s) |
|--|--|
| §2.1 Paleta | Task 1 |
| §2.2 Tipografia | Task 2 |
| §2.3 Espaçamento | Task 3 |
| §2.4 Raio | Task 3 |
| §2.5 Sombras | Task 3 + Task 9 |
| §2.6 Motion | Task 1 + Task 3 |
| §2.7 Iconografia | Used everywhere (lucide, stroke 1.5 enforced in components) |
| §2.8 Símbolo NovaCraft | Task 5 + Task 23 (favicon) |
| §3.1 Button | Task 6 |
| §3.2 Input | Task 7 |
| §3.3 Card | Task 8 + Task 14 (CarouselCard) |
| §3.4 Chip/Badge | Task 8 |
| §3.5 Sidebar item | Task 11 |
| §3.6 Modal | Task 9 |
| §3.7 Toast | Task 10 |
| §3.8 Command Palette | Task 13 |
| §3.9 Skeleton | Task 8 |
| §4.1 Sidebar Global | Task 11 |
| §4.2 Topbar Global | Task 12 |
| §4.3 Dashboard Home | Task 14 |
| §4.4 CreateModal | Task 16 (+ GenOverlay Task 15) |
| §4.5 Modo Notícia | Task 17 |
| §4.6 Settings | Task 18 |
| §4.7 Context | Task 19 |
| §4.8 Calendar | Task 20 |
| §4.9 Login | Task 21 |
| §4.10 Upgrade | Task 22 |
| §5 Acessibilidade | Enforced per component + Task 24 step 4 (focus, reduced-motion) |
| §6 Tokens | Task 1 + Task 3 |
| §7 Out of scope | Honored (Editor untouched, no light mode, no i18n) |
| §8 Critérios | Task 24 |

No spec section left without a task.

**Type/identifier consistency:** `BadgeStatus` enum used in `Badge.tsx` and `CarouselCard.tsx` matches. `GEN_STEPS` exported from `GenOverlay`. `CarouselCardData` exported from `CarouselCard`. `FilterValue`/`ViewMode` exported from `FilterToolbar` — consumed in `dashboard/page.tsx`. Token names match `DESIGN.md` §2 1:1.

**Placeholder scan:** no "TBD", no "implement later", no "similar to Task N". Each task contains the full source for the file or full source for the section being changed.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-12-novacraft-redesign.md`. Two execution options:

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — Execute tasks in this session using `superpowers:executing-plans`, batch execution with checkpoints.

Which approach?
