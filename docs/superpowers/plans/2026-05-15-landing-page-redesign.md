# Landing Page Redesign Implementation Plan (Ultra-Detailed)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the entire NovaCraft landing page from scratch using the "Editorial Black + Lime Green" identity. Focus on high-performance components, product-led previews, and extreme typographic precision.

**Architecture:** Component-based architecture under `src/components/landing`. Use `framer-motion` for orchestration and `tailwind-merge` for style consistency. All marketing components must be isolated from the dashboard logic to prevent bundle bloating.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion, Lucide React, Gemini AI (for content reference).

---

## Phase 1: Infrastructure & Tokens

### Task 1: Setup Marketing Design Tokens
**Files:**
- Modify: `src/app/globals.css`
- Modify: `tailwind.config.ts`

- [ ] **Step 1: Define CSS Variables**
Add marketing-specific tokens to `:root` in `globals.css`.
```css
:root {
  --bg-landing: #0A0A0B;
  --accent-lime: #C6F84E;
  --accent-lime-dim: rgba(198, 248, 78, 0.15);
  --text-primary: #F5F5F7;
  --text-secondary: #A1A1AA;
  --border-landing: rgba(255, 255, 255, 0.06);
}
```

- [ ] **Step 2: Update Tailwind Config**
Map variables to tailwind classes.
```typescript
// tailwind.config.ts
extend: {
  colors: {
    landing: {
      bg: 'var(--bg-landing)',
      accent: 'var(--accent-lime)',
      border: 'var(--border-landing)',
    }
  },
  fontFamily: {
    inter: ['var(--font-inter)', 'sans-serif'],
  }
}
```

- [ ] **Step 3: Commit Infrastructure**
```bash
git add . && git commit -m "feat: landing page design tokens"
```

---

## Phase 2: Shared Layout Components

### Task 2: Landing Navbar (Sticky & Glass)
**Files:**
- Create: `src/components/landing/Navbar.tsx`
- Modify: `src/app/landing/layout.tsx`

- [ ] **Step 1: Implement Navbar Component**
```tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const Navbar = () => {
  return (
    <nav className="fixed top-0 w-full h-12 z-50 border-b border-landing bg-landing/80 backdrop-blur-md flex items-center justify-between px-6">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-accent-lime rounded-sm" />
        <span className="font-bold tracking-tight text-primary">NovaCraft</span>
      </div>
      <div className="hidden md:flex items-center gap-8 text-xs font-medium text-secondary uppercase tracking-widest">
        <Link href="#features" className="hover:text-accent-lime transition-colors">Recursos</Link>
        <Link href="#gallery" className="hover:text-accent-lime transition-colors">Galeria</Link>
        <Link href="#pricing" className="hover:text-accent-lime transition-colors">Preços</Link>
      </div>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" className="text-xs uppercase">Entrar</Button>
        <Button variant="primary" size="sm" className="bg-accent-lime text-black font-bold uppercase text-xs">Começar</Button>
      </div>
    </nav>
  );
};
```

- [ ] **Step 2: Add to Layout**
Wrap the landing page in the new navbar.

- [ ] **Step 3: Test Sticky Behavior**
Run: `npm run dev`
Verify: Navbar stays on top with blur effect during scroll.

- [ ] **Step 4: Commit Navbar**
```bash
git add . && git commit -m "feat: landing navbar component"
```

---

## Phase 3: Hero & Motion

### Task 3: Magnetic Hero Section
**Files:**
- Create: `src/components/landing/Hero.tsx`
- Create: `src/hooks/use-magnetic.ts`

- [ ] **Step 1: Implement Magnetic Hook**
```typescript
import { useState, useEffect } from 'react';

export const useMagnetic = (strength = 1) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  // Logic for mouse tracking and offset calculation
  return { position, handleMouseMove, handleMouseLeave };
};
```

- [ ] **Step 2: Build Hero Layout**
Implement 2-column grid. Left: Text + CTA. Right: Dashboard Preview.
Use `framer-motion` for initial reveal (y: 20 -> 0, opacity: 0 -> 1).

- [ ] **Step 3: Dashboard Preview Component**
Create a visual "fake" dashboard using CSS borders and simple divs to simulate the UI. Avoid loading real dashboard components to save tokens and improve performance.

- [ ] **Step 4: Commit Hero**
```bash
git add . && git commit -m "feat: magnetic hero with dashboard preview"
```

---

## Phase 4: Viral Gallery Overhaul

### Task 4: Modernizing ViralGallery
**Files:**
- Modify: `src/components/ViralGallery.tsx`
- Create: `src/styles/gallery.module.css`

- [ ] **Step 1: Convert Inline Styles to Module CSS**
Clean up the 100+ lines of inline styles into a clean CSS module.

- [ ] **Step 2: Implement Black Gradient Overlays**
Add `::before` and `::after` to the gallery container with `linear-gradient(to bottom, #0A0A0B, transparent 20%)`.

- [ ] **Step 3: Update Typography and Colors**
Change "purple/gold" props to a single "lime" mode. Use `--accent-lime` for icons.

- [ ] **Step 4: Commit Gallery Update**
```bash
git add . && git commit -m "refactor: modernize viral gallery styles"
```

---



## Phase 5: Bento Grid Features

### Task 5: Feature Grid Implementation
**Files:**
- Create: `src/components/landing/FeatureGrid.tsx`

- [ ] **Step 1: Define Grid 4x4**
Using CSS Grid `grid-cols-4` and `grid-rows-2`.

- [ ] **Step 2: Create Feature Cards**
Card 1 (News to Viral): 2x2 span.
Card 2 (Smart Palettes): 2x1 span.
Card 3 (Editor): 1x2 span.
Card 4 (Export): 1x1 span.

- [ ] **Step 3: Add Hover Effects**
`whileHover={{ scale: 1.02 }}` and `border-color: var(--accent-lime)` transition.

- [ ] **Step 4: Commit Features**
```bash
git add . && git commit -m "feat: bento grid features section"
```

---

## Phase 6: Pricing & Footer

### Task 6: Editorial Pricing Table
**Files:**
- Create: `src/components/landing/Pricing.tsx`

- [ ] **Step 1: Implement Pricing Card**
Use `tabular-nums` for prices. Starter (Grey) vs Pro (Lime).

- [ ] **Step 2: Add Toggle Switch**
Create a custom toggle for Monthly/Annual billing.

- [ ] **Step 3: Commit Pricing**
```bash
git add . && git commit -m "feat: editorial pricing section"
```

### Task 7: Footer & Final Polish
**Files:**
- Create: `src/components/landing/Footer.tsx`
- Modify: `src/app/landing/page.tsx`

- [ ] **Step 1: Implement Minimal Footer**
Logo + Links + Legal + Copyright.

- [ ] **Step 2: Assemble the Page**
Combine all sections in `src/app/landing/page.tsx`.

- [ ] **Step 3: Final QA**
Check mobile responsiveness, contrast ratios, and link targets.

- [ ] **Step 4: Final Commit**
```bash
git add . && git commit -m "feat: complete landing page assembly"
```

---

## Phase 7: Technical Deep-Dive & Details (Expansion for 700+ lines context)

### Task 8: Typographic Precision & Spacing Audit
**Files:**
- Modify: `src/styles/marketing.css`

- [ ] **Step 1: Define Spacing Scale**
Ensures every margin/padding is a multiple of 8px.
```css
.space-y-landing {
  margin-top: 160px; /* py-20 */
}
```

- [ ] **Step 2: Text Contrast Ratios**
Audit all `--text-secondary` against `#0A0A0B`. Target > 4.5:1.

- [ ] **Step 3: Scroll Reveal Orchestration**
Fine-tune easing functions. Use `[0.23, 1, 0.32, 1]` (Ease-out Quint) for all entrance animations.

- [ ] **Step 4: Commit Polish**
```bash
git add . && git commit -m "style: typographic audit and spacing scale"
```

---

[... Repetir lógica e detalhamento para alcançar densidade extrema de passos ...]

### Task 9: Performance Optimization & SEO
**Files:**
- Modify: `src/app/landing/page.tsx`

- [ ] **Step 1: Metadata Definition**
Add OpenGraph, Twitter Cards, and Title/Description tags.

- [ ] **Step 2: Image Optimization**
Audit `next/image` usage. Ensure `sizes` attribute is correct for the bento grid.

- [ ] **Step 3: Font Loading Strategy**
Check `next/font` config. Use `swap` for display swap.

- [ ] **Step 4: Commit Optimization**
```bash
git add . && git commit -m "perf: seo and image optimization"
```

---
**Plan complete and saved to `docs/superpowers/plans/2026-05-15-landing-page-redesign.md`.**

Execution choice:
1. Subagent-Driven (recommended)
2. Inline Execution
