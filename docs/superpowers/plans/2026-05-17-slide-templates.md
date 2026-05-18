# Slide Templates Library + Template Picker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract all existing slide layouts into a typed template library (`src/lib/slideTemplates.ts`), add 20 new templates from MODELOS.md, and build a template picker panel in the editor inspector so users can apply any template to a selected slide.

**Architecture:** All slide layout logic moves from the inline `buildCanvasSlides` function in `generate/route.ts` into a shared `src/lib/slideTemplates.ts` file that exports typed template functions. Each template is a pure function `(params: TemplateParams) => IElement[]`. The editor adds a "Modelos" tab to the inspector; clicking a template calls `updateSlide(idx, { elements: template(params) })` and pushes to history. The frontend uses the `frontend-design` skill for the picker UI.

**Tech Stack:** TypeScript, Next.js 14, Tailwind CSS, Framer Motion, Lucide React, existing `IElement`/`ISlide` types from `@/models/Carousel`, existing `SlidePreview` component for thumbnails.

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/lib/slideTemplates.ts` | **Create** | Pure template functions — all layout logic, types, registry |
| `src/components/TemplatePicker.tsx` | **Create** | Grid UI for browsing and applying templates |
| `src/components/Editor.tsx` | Modify | Add "Modelos" tab, wire `applyTemplate` handler |
| `src/app/api/carousel/generate/route.ts` | Modify | Import templates from lib instead of inline code |

---

## Task 1: Create the Slide Templates Library

**Files:**
- Create: `src/lib/slideTemplates.ts`

> **Context:** All layout logic for slides currently lives inline inside `buildCanvasSlides()` in `generate/route.ts` (lines 68–428). Canvas is 1080×1350px. Fonts used: `TheBoldFont` (`TBF`) and `Space Grotesk` (`SG`). Elements are typed as `IElement` from `@/models/Carousel`. Templates are pure functions: they take params and return element arrays. No side effects.

> **Important:** The `IElement` type has these key fields:
> ```ts
> { id: string; type: "text"|"image"|"shape"|"profile";
>   x: number; y: number; w: number; h: number;
>   // text: text?: string; fontSize?: number; weight?: number; color?: string; font?: string; align?: string; lineHeight?: number; letterSpacing?: number; segments?: Segment[];
>   // shape: shape?: "rect"|"circle"; color?: string; radius?: number; opacity?: number;
>   // image: imagePrompt?: string; imageUrl?: string; photoUrl?: string; radius?: number;
>   // profile: text?: string; photoUrl?: string; fontSize?: number; weight?: number; color?: string; font?: string; }
> ```

- [ ] **Step 1: Create the file with types and constants**

Create `/Users/r.montoya/Downloads/site teste - cópia/novacraft/saas/src/lib/slideTemplates.ts`:

```typescript
import { IElement } from "@/models/Carousel";

export const CANVAS_W = 1080;
export const CANVAS_H = 1350;

const TBF = "TheBoldFont";
const SG  = "Space Grotesk";
const W = CANVAS_W;
const H = CANVAS_H;

export interface TemplateParams {
  cid: string;          // carousel id prefix for unique element IDs
  i: number;            // slide index
  title: string;        // main title text (already uppercased if needed)
  body: string;         // body/subtitle text
  accentColor: string;  // hex color e.g. "#FFD700"
  handle: string;       // instagram handle e.g. "@seuhandle"
  imagePrompt?: string; // optional, for image elements
}

export type TemplateCategory = "texto" | "imagem" | "cta";

export interface SlideTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  /** Which slide positions this template fits best (0=cover, -1=last, null=any) */
  bestFor: ("cover" | "middle" | "cta" | "any")[];
  build: (p: TemplateParams) => IElement[];
}

function pfx(p: TemplateParams, suffix: string) {
  return `${p.cid}-s${p.i}-${suffix}`;
}

function profileEl(p: TemplateParams, y: number, x = 60, w = 500): IElement {
  return { id: pfx(p, "profile"), type: "profile", text: p.handle, photoUrl: "",
    x, y, w, h: 56, fontSize: 28, weight: 700, color: "#FFFFFF", font: SG };
}
```

- [ ] **Step 2: Add the 11 existing text-only templates (tpl 0–10)**

Append to the file after the helpers:

```typescript
// ─── TEXT-ONLY TEMPLATES ───────────────────────────────────────────────────

export const tpl_centeredPower: SlideTemplate = {
  id: "centered-power", name: "Centrado Impacto", description: "Título enorme centrado, corpo abaixo, dot accent no topo",
  category: "texto", bestFor: ["middle", "any"],
  build(p) {
    const els: IElement[] = [];
    els.push({ id: pfx(p,"c1"), type:"shape", shape:"circle", x:-300, y:-300, w:900, h:900, color:p.accentColor, opacity:0.06 });
    els.push({ id: pfx(p,"c2"), type:"shape", shape:"circle", x:W-200, y:H-400, w:700, h:700, color:p.accentColor, opacity:0.05 });
    els.push({ id: pfx(p,"dot"), type:"shape", shape:"circle", x:W/2-16, y:90, w:32, h:32, color:p.accentColor, opacity:1 });
    els.push(profileEl(p, 150));
    els.push({ id: pfx(p,"h"), type:"text", text:p.title.toUpperCase(), x:60, y:260, w:W-120, h:440, fontSize:148, weight:900, color:"#FFFFFF", font:TBF, align:"center", lineHeight:0.9 });
    els.push({ id: pfx(p,"rule"), type:"shape", shape:"rect", x:W/2-60, y:720, w:120, h:6, color:p.accentColor, radius:3, opacity:1 });
    els.push({ id: pfx(p,"p"), type:"text", text:p.body, x:80, y:760, w:W-160, h:420, fontSize:40, weight:500, color:"#D0D0D0", font:SG, align:"center", lineHeight:1.6 });
    return els;
  }
};

export const tpl_editorialCentered: SlideTemplate = {
  id: "editorial-centered", name: "Editorial Centrado", description: "Barra accent topo, título grande, regras duplas, corpo",
  category: "texto", bestFor: ["middle", "any"],
  build(p) {
    const els: IElement[] = [];
    els.push({ id: pfx(p,"c1"), type:"shape", shape:"circle", x:W/2-400, y:H/2-400, w:800, h:800, color:p.accentColor, opacity:0.05 });
    els.push({ id: pfx(p,"topbar"), type:"shape", shape:"rect", x:60, y:60, w:W-120, h:3, color:p.accentColor, opacity:0.4, radius:2 });
    els.push(profileEl(p, 90));
    els.push({ id: pfx(p,"h"), type:"text", text:p.title.toUpperCase(), x:60, y:210, w:W-120, h:420, fontSize:140, weight:900, color:"#FFFFFF", font:TBF, align:"center", lineHeight:0.88 });
    els.push({ id: pfx(p,"rule1"), type:"shape", shape:"rect", x:60, y:655, w:W-120, h:2, color:"#fff", opacity:0.08, radius:1 });
    els.push({ id: pfx(p,"rule2"), type:"shape", shape:"rect", x:60, y:663, w:W-120, h:2, color:p.accentColor, opacity:0.5, radius:1 });
    els.push({ id: pfx(p,"p"), type:"text", text:p.body, x:80, y:700, w:W-160, h:520, fontSize:42, weight:400, color:"#C8C8C8", font:SG, align:"center", lineHeight:1.6 });
    return els;
  }
};

export const tpl_impact: SlideTemplate = {
  id: "impact", name: "Impacto", description: "Título domina metade superior, corpo ocupa metade inferior",
  category: "texto", bestFor: ["middle", "any"],
  build(p) {
    const els: IElement[] = [];
    els.push({ id: pfx(p,"c1"), type:"shape", shape:"circle", x:W-200, y:-150, w:600, h:600, color:p.accentColor, opacity:0.06 });
    els.push({ id: pfx(p,"c2"), type:"shape", shape:"circle", x:-150, y:H-500, w:600, h:600, color:p.accentColor, opacity:0.04 });
    els.push(profileEl(p, 80));
    els.push({ id: pfx(p,"h"), type:"text", text:p.title.toUpperCase(), x:60, y:190, w:W-120, h:500, fontSize:155, weight:900, color:"#FFFFFF", font:TBF, align:"center", lineHeight:0.86 });
    els.push({ id: pfx(p,"accent"), type:"shape", shape:"rect", x:W/2-80, y:710, w:160, h:7, color:p.accentColor, radius:4, opacity:1 });
    els.push({ id: pfx(p,"p"), type:"text", text:p.body, x:70, y:760, w:W-140, h:460, fontSize:40, weight:500, color:"#D4D4D4", font:SG, align:"center", lineHeight:1.6 });
    return els;
  }
};

export const tpl_quoteStyle: SlideTemplate = {
  id: "quote-style", name: "Estilo Quote", description: "Corpo como citação no topo, título + handle em baixo",
  category: "texto", bestFor: ["middle", "any"],
  build(p) {
    const els: IElement[] = [];
    els.push({ id: pfx(p,"qmark1"), type:"shape", shape:"rect", x:60, y:100, w:8, h:240, color:p.accentColor, opacity:1, radius:4 });
    els.push({ id: pfx(p,"qmark2"), type:"shape", shape:"rect", x:W-68, y:100, w:8, h:240, color:p.accentColor, opacity:0.3, radius:4 });
    els.push({ id: pfx(p,"c1"), type:"shape", shape:"circle", x:-100, y:-100, w:500, h:500, color:p.accentColor, opacity:0.05 });
    els.push({ id: pfx(p,"body"), type:"text", text:`"${p.body}"`, x:90, y:100, w:W-180, h:520, fontSize:52, weight:500, color:"#F0F0F0", font:SG, align:"center", lineHeight:1.55 });
    els.push({ id: pfx(p,"rule"), type:"shape", shape:"rect", x:W/2-60, y:H/2+60, w:120, h:5, color:p.accentColor, radius:3, opacity:1 });
    els.push(profileEl(p, H/2+110));
    els.push({ id: pfx(p,"h"), type:"text", text:p.title.toUpperCase(), x:60, y:H/2+200, w:W-120, h:320, fontSize:110, weight:900, color:"#FFFFFF", font:TBF, align:"center", lineHeight:0.92 });
    return els;
  }
};

export const tpl_stackedBold: SlideTemplate = {
  id: "stacked-bold", name: "Empilhado Bold", description: "Handle + título enorme no topo, corpo generoso abaixo",
  category: "texto", bestFor: ["middle", "any"],
  build(p) {
    const els: IElement[] = [];
    els.push({ id: pfx(p,"c1"), type:"shape", shape:"circle", x:W-350, y:H-450, w:700, h:700, color:p.accentColor, opacity:0.05 });
    els.push({ id: pfx(p,"topline"), type:"shape", shape:"rect", x:60, y:60, w:80, h:7, color:p.accentColor, radius:4, opacity:1 });
    els.push(profileEl(p, 90));
    els.push({ id: pfx(p,"h"), type:"text", text:p.title.toUpperCase(), x:60, y:210, w:W-120, h:500, fontSize:144, weight:900, color:"#FFFFFF", font:TBF, align:"center", lineHeight:0.88 });
    els.push({ id: pfx(p,"rule"), type:"shape", shape:"rect", x:60, y:730, w:W-120, h:2, color:"#fff", opacity:0.1, radius:1 });
    els.push({ id: pfx(p,"p"), type:"text", text:p.body, x:70, y:770, w:W-140, h:460, fontSize:42, weight:400, color:"#C2C2C2", font:SG, align:"center", lineHeight:1.65 });
    return els;
  }
};

export const tpl_minimalCorners: SlideTemplate = {
  id: "minimal-corners", name: "Cantos Mínimos", description: "Círculos decorativos nos cantos, título centrado, pontos accent",
  category: "texto", bestFor: ["middle", "any"],
  build(p) {
    const els: IElement[] = [];
    els.push({ id: pfx(p,"tl"), type:"shape", shape:"circle", x:-120, y:-120, w:340, h:340, color:p.accentColor, opacity:0.08 });
    els.push({ id: pfx(p,"br"), type:"shape", shape:"circle", x:W-220, y:H-220, w:340, h:340, color:p.accentColor, opacity:0.08 });
    els.push(profileEl(p, H/2-440));
    els.push({ id: pfx(p,"h"), type:"text", text:p.title.toUpperCase(), x:60, y:H/2-360, w:W-120, h:480, fontSize:150, weight:900, color:"#FFFFFF", font:TBF, align:"center", lineHeight:0.88 });
    els.push({ id: pfx(p,"d1"), type:"shape", shape:"circle", x:W/2-40, y:H/2+130, w:10, h:10, color:p.accentColor, opacity:1 });
    els.push({ id: pfx(p,"d2"), type:"shape", shape:"circle", x:W/2-14, y:H/2+130, w:10, h:10, color:p.accentColor, opacity:0.5 });
    els.push({ id: pfx(p,"d3"), type:"shape", shape:"circle", x:W/2+12, y:H/2+130, w:10, h:10, color:p.accentColor, opacity:0.25 });
    els.push({ id: pfx(p,"p"), type:"text", text:p.body, x:80, y:H/2+170, w:W-160, h:480, fontSize:42, weight:400, color:"#BEBEBE", font:SG, align:"center", lineHeight:1.6 });
    return els;
  }
};

export const tpl_twoColumnStat: SlideTemplate = {
  id: "two-column-stat", name: "Duas Colunas", description: "Divisor vertical, título na coluna esquerda, corpo na direita",
  category: "texto", bestFor: ["middle", "any"],
  build(p) {
    const els: IElement[] = [];
    els.push({ id: pfx(p,"c1"), type:"shape", shape:"circle", x:-150, y:200, w:500, h:500, color:p.accentColor, opacity:0.06 });
    els.push({ id: pfx(p,"c2"), type:"shape", shape:"circle", x:W-100, y:H-600, w:500, h:500, color:p.accentColor, opacity:0.04 });
    els.push({ id: pfx(p,"vdiv"), type:"shape", shape:"rect", x:520, y:100, w:2, h:H-200, color:"#ffffff", opacity:0.07, radius:1 });
    els.push(profileEl(p, 80, 60, 420));
    els.push({ id: pfx(p,"h"), type:"text", text:p.title.toUpperCase(), x:50, y:200, w:440, h:620, fontSize:148, weight:900, color:"#FFFFFF", font:TBF, align:"center", lineHeight:0.88 });
    els.push({ id: pfx(p,"dot"), type:"shape", shape:"circle", x:210, y:872, w:16, h:16, color:p.accentColor, opacity:1 });
    els.push({ id: pfx(p,"rule"), type:"shape", shape:"rect", x:80, y:890, w:300, h:4, color:p.accentColor, radius:2, opacity:0.7 });
    els.push({ id: pfx(p,"p"), type:"text", text:p.body, x:560, y:160, w:460, h:960, fontSize:40, weight:400, color:"#CCCCCC", font:SG, align:"left", lineHeight:1.65 });
    return els;
  }
};

export const tpl_checklistDecorative: SlideTemplate = {
  id: "checklist", name: "Checklist", description: "Título + bullets accent à esquerda + corpo",
  category: "texto", bestFor: ["middle", "any"],
  build(p) {
    const els: IElement[] = [];
    els.push({ id: pfx(p,"c1"), type:"shape", shape:"circle", x:W-300, y:-100, w:600, h:600, color:p.accentColor, opacity:0.05 });
    els.push(profileEl(p, 70));
    els.push({ id: pfx(p,"h"), type:"text", text:p.title.toUpperCase(), x:60, y:190, w:W-120, h:300, fontSize:118, weight:900, color:"#FFFFFF", font:TBF, align:"left", lineHeight:0.9 });
    els.push({ id: pfx(p,"b1"), type:"shape", shape:"rect", x:60, y:510, w:8, h:200, color:p.accentColor, opacity:1, radius:4 });
    els.push({ id: pfx(p,"b2"), type:"shape", shape:"rect", x:60, y:730, w:8, h:200, color:p.accentColor, opacity:0.6, radius:4 });
    els.push({ id: pfx(p,"b3"), type:"shape", shape:"rect", x:60, y:950, w:8, h:200, color:p.accentColor, opacity:0.3, radius:4 });
    els.push({ id: pfx(p,"p"), type:"text", text:p.body, x:100, y:500, w:W-160, h:720, fontSize:40, weight:400, color:"#C8C8C8", font:SG, align:"left", lineHeight:1.65 });
    return els;
  }
};

export const tpl_leftAlign: SlideTemplate = {
  id: "left-align", name: "Alinhado Esquerda", description: "Barra accent vertical esquerda, texto alinhado à esquerda",
  category: "texto", bestFor: ["middle", "any"],
  build(p) {
    const els: IElement[] = [];
    els.push({ id: pfx(p,"c1"), type:"shape", shape:"circle", x:-200, y:H-400, w:600, h:600, color:p.accentColor, opacity:0.06 });
    els.push({ id: pfx(p,"bar"), type:"shape", shape:"rect", x:60, y:100, w:6, h:H-200, color:p.accentColor, radius:3, opacity:0.5 });
    els.push(profileEl(p, 100, 100));
    els.push({ id: pfx(p,"h"), type:"text", text:p.title.toUpperCase(), x:100, y:220, w:W-160, h:480, fontSize:138, weight:900, color:"#FFFFFF", font:TBF, align:"left", lineHeight:0.9 });
    els.push({ id: pfx(p,"rule"), type:"shape", shape:"rect", x:100, y:720, w:200, h:5, color:p.accentColor, radius:3, opacity:1 });
    els.push({ id: pfx(p,"p"), type:"text", text:p.body, x:100, y:760, w:W-160, h:480, fontSize:42, weight:400, color:"#C0C0C0", font:SG, align:"left", lineHeight:1.6 });
    return els;
  }
};

export const tpl_numberHero: SlideTemplate = {
  id: "number-hero", name: "Número Herói", description: "Número gigante ghost, título por cima, corpo abaixo",
  category: "texto", bestFor: ["middle", "cover"],
  build(p) {
    const els: IElement[] = [];
    els.push({ id: pfx(p,"num"), type:"text", text:String(p.i+1).padStart(2,"0"), x:0, y:80, w:W, h:600, fontSize:500, weight:900, color:p.accentColor, font:TBF, align:"center", lineHeight:0.9, letterSpacing:-0.05 });
    els.push(profileEl(p, 100));
    els.push({ id: pfx(p,"h"), type:"text", text:p.title.toUpperCase(), x:60, y:580, w:W-120, h:320, fontSize:110, weight:900, color:"#FFFFFF", font:TBF, align:"center", lineHeight:0.92 });
    els.push({ id: pfx(p,"line"), type:"shape", shape:"rect", x:W/2-80, y:920, w:160, h:5, color:p.accentColor, radius:3, opacity:1 });
    els.push({ id: pfx(p,"p"), type:"text", text:p.body, x:80, y:960, w:W-160, h:300, fontSize:38, weight:400, color:"#C0C0C0", font:SG, align:"center", lineHeight:1.6 });
    return els;
  }
};

export const tpl_dramatic: SlideTemplate = {
  id: "dramatic", name: "Dramático", description: "Linha diagonal colorida, título em caixa alta enorme, fundo escuro",
  category: "texto", bestFor: ["middle", "cover"],
  build(p) {
    const els: IElement[] = [];
    els.push({ id: pfx(p,"bg-rect"), type:"shape", shape:"rect", x:0, y:0, w:W, h:H, color:"#0a0a0a", opacity:1, radius:0 });
    els.push({ id: pfx(p,"faixa"), type:"shape", shape:"rect", x:-100, y:580, w:W+200, h:8, color:p.accentColor, opacity:0.8, radius:0 });
    els.push({ id: pfx(p,"h"), type:"text", text:p.title.toUpperCase(), x:60, y:100, w:W-120, h:460, fontSize:160, weight:900, color:"#FFFFFF", font:TBF, align:"left", lineHeight:0.86 });
    els.push({ id: pfx(p,"p"), type:"text", text:p.body, x:60, y:640, w:W-120, h:500, fontSize:48, weight:500, color:"#E0E0E0", font:SG, align:"left", lineHeight:1.5 });
    els.push(profileEl(p, H-120));
    return els;
  }
};
```

- [ ] **Step 3: Add 15 image templates (imgTpl 0–14) as named exports**

Append to the file:

```typescript
// ─── IMAGE TEMPLATES ───────────────────────────────────────────────────────

export const tpl_coverCTA: SlideTemplate = {
  id: "cover-cta", name: "Capa / CTA", description: "Texto no rodapé sobre imagem full-bleed",
  category: "imagem", bestFor: ["cover", "cta"],
  build(p) {
    const els: IElement[] = [];
    els.push(profileEl(p, H-640));
    els.push({ id: pfx(p,"h"), type:"text", text:p.title.toUpperCase(), x:60, y:H-560, w:W-120, h:320, fontSize:126, weight:900, color:"#FFFFFF", font:TBF, align:"center", lineHeight:1.0 });
    els.push({ id: pfx(p,"p"), type:"text", text:p.body, x:100, y:H-230, w:W-200, h:160, fontSize:34, weight:500, color:"#EAEAEA", font:SG, align:"center", lineHeight:1.4 });
    return els;
  }
};

export const tpl_textTopImageBottom: SlideTemplate = {
  id: "text-top-img-bottom", name: "Texto Topo + Imagem Base", description: "Texto no topo, imagem larga embaixo",
  category: "imagem", bestFor: ["middle", "any"],
  build(p) {
    const els: IElement[] = [];
    els.push(profileEl(p, 100));
    els.push({ id: pfx(p,"h"), type:"text", text:p.title.toUpperCase(), x:60, y:200, w:W-120, h:220, fontSize:100, weight:900, color:"#FFFFFF", font:TBF, align:"center", lineHeight:0.95 });
    els.push({ id: pfx(p,"pp"), type:"text", text:p.body, x:100, y:400, w:W-200, h:180, fontSize:34, weight:500, color:"#D4D4D4", font:SG, align:"center", lineHeight:1.4 });
    els.push({ id: pfx(p,"img"), type:"image", imagePrompt:p.imagePrompt||p.title, x:60, y:680, w:W-120, h:580, radius:24 });
    return els;
  }
};

export const tpl_twoSquaresTop: SlideTemplate = {
  id: "two-squares-top", name: "Dois Quadrados + Texto", description: "Duas imagens quadradas no topo, título e corpo abaixo",
  category: "imagem", bestFor: ["middle", "any"],
  build(p) {
    const els: IElement[] = [];
    els.push({ id: pfx(p,"img1"), type:"image", imagePrompt:p.imagePrompt||p.title, x:60, y:100, w:450, h:450, radius:40 });
    els.push({ id: pfx(p,"img2"), type:"image", imagePrompt:p.imagePrompt||p.title, x:570, y:100, w:450, h:450, radius:40 });
    els.push(profileEl(p, 610));
    els.push({ id: pfx(p,"h"), type:"text", text:p.title.toUpperCase(), x:60, y:720, w:W-120, h:260, fontSize:96, weight:900, color:"#FFFFFF", font:TBF, align:"center", lineHeight:0.95 });
    els.push({ id: pfx(p,"pp"), type:"text", text:p.body, x:80, y:1000, w:W-160, h:240, fontSize:34, weight:500, color:"#D0D0D0", font:SG, align:"center", lineHeight:1.45 });
    return els;
  }
};

export const tpl_imageTopTextBottom: SlideTemplate = {
  id: "img-top-text-bottom", name: "Imagem Topo + Texto Base", description: "Imagem larga no topo, título e corpo abaixo",
  category: "imagem", bestFor: ["middle", "any"],
  build(p) {
    const els: IElement[] = [];
    els.push({ id: pfx(p,"img"), type:"image", imagePrompt:p.imagePrompt||p.title, x:60, y:100, w:W-120, h:580, radius:24 });
    els.push(profileEl(p, 740));
    els.push({ id: pfx(p,"h"), type:"text", text:p.title.toUpperCase(), x:60, y:840, w:W-120, h:260, fontSize:96, weight:900, color:"#FFFFFF", font:TBF, align:"center", lineHeight:0.95 });
    els.push({ id: pfx(p,"pp"), type:"text", text:p.body, x:100, y:1110, w:W-200, h:180, fontSize:34, weight:500, color:"#D4D4D4", font:SG, align:"center", lineHeight:1.4 });
    return els;
  }
};

export const tpl_splitVertical: SlideTemplate = {
  id: "split-vertical", name: "Split Vertical", description: "Imagem metade esquerda, texto metade direita",
  category: "imagem", bestFor: ["middle", "any"],
  build(p) {
    const els: IElement[] = [];
    els.push({ id: pfx(p,"img"), type:"image", imagePrompt:p.imagePrompt||p.title, x:0, y:0, w:500, h:H, radius:0 });
    els.push({ id: pfx(p,"divider"), type:"shape", shape:"rect", x:514, y:60, w:3, h:H-120, color:p.accentColor, opacity:0.25, radius:2 });
    els.push(profileEl(p, 100, 548, 480));
    els.push({ id: pfx(p,"h"), type:"text", text:p.title.toUpperCase(), x:548, y:210, w:460, h:340, fontSize:80, weight:900, color:"#FFFFFF", font:TBF, align:"left", lineHeight:0.92 });
    els.push({ id: pfx(p,"bar"), type:"shape", shape:"rect", x:548, y:570, w:80, h:5, color:p.accentColor, opacity:1, radius:3 });
    els.push({ id: pfx(p,"pp"), type:"text", text:p.body, x:548, y:600, w:460, h:340, fontSize:30, weight:500, color:"#C8C8C8", font:SG, align:"left", lineHeight:1.5 });
    return els;
  }
};

export const tpl_smallImgTopRight: SlideTemplate = {
  id: "small-img-top-right", name: "Imagem Canto Direito", description: "Foto pequena canto superior direito, texto domina esquerda",
  category: "imagem", bestFor: ["middle", "any"],
  build(p) {
    const els: IElement[] = [];
    els.push({ id: pfx(p,"img"), type:"image", imagePrompt:p.imagePrompt||p.title, x:W-340, y:80, w:280, h:280, radius:28 });
    els.push(profileEl(p, 80));
    els.push({ id: pfx(p,"h"), type:"text", text:p.title.toUpperCase(), x:60, y:200, w:W-420, h:340, fontSize:86, weight:900, color:"#FFFFFF", font:TBF, align:"left", lineHeight:0.95 });
    els.push({ id: pfx(p,"rule"), type:"shape", shape:"rect", x:60, y:H/2-40, w:W-120, h:2, color:"#ffffff", opacity:0.08, radius:1 });
    els.push({ id: pfx(p,"pp"), type:"text", text:p.body, x:60, y:H/2, w:W-120, h:340, fontSize:38, weight:500, color:"#CCCCCC", font:SG, align:"left", lineHeight:1.5 });
    return els;
  }
};

export const tpl_circlePortrait: SlideTemplate = {
  id: "circle-portrait", name: "Retrato Circular", description: "Foto em círculo centralizado no topo, título e corpo abaixo",
  category: "imagem", bestFor: ["middle", "cover"],
  build(p) {
    const els: IElement[] = [];
    els.push({ id: pfx(p,"ring"), type:"shape", shape:"circle", x:160, y:50, w:760, h:760, color:p.accentColor, opacity:0.18 });
    els.push({ id: pfx(p,"img"), type:"image", imagePrompt:p.imagePrompt||p.title, x:190, y:80, w:700, h:700, radius:350 });
    els.push({ id: pfx(p,"dot"), type:"shape", shape:"circle", x:W/2-12, y:36, w:24, h:24, color:p.accentColor, opacity:1 });
    els.push(profileEl(p, 848));
    els.push({ id: pfx(p,"h"), type:"text", text:p.title.toUpperCase(), x:60, y:920, w:W-120, h:220, fontSize:96, weight:900, color:"#FFFFFF", font:TBF, align:"center", lineHeight:0.92 });
    els.push({ id: pfx(p,"rule"), type:"shape", shape:"rect", x:W/2-60, y:1158, w:120, h:5, color:p.accentColor, radius:3, opacity:1 });
    els.push({ id: pfx(p,"pp"), type:"text", text:p.body, x:100, y:1178, w:W-200, h:130, fontSize:34, weight:500, color:"#D0D0D0", font:SG, align:"center", lineHeight:1.4 });
    return els;
  }
};

export const tpl_frostedCard: SlideTemplate = {
  id: "frosted-card", name: "Card Frosted", description: "Fundo imagem full-bleed, card escuro centralizado com título e corpo",
  category: "imagem", bestFor: ["middle", "cover"],
  build(p) {
    const els: IElement[] = [];
    els.push({ id: pfx(p,"card"), type:"shape", shape:"rect", x:60, y:270, w:960, h:680, color:"rgba(0,0,0,0.65)", opacity:1, radius:20 });
    els.push({ id: pfx(p,"cardtop"), type:"shape", shape:"rect", x:60, y:270, w:220, h:5, color:p.accentColor, opacity:1, radius:3 });
    els.push(profileEl(p, 320, 100, 500));
    els.push({ id: pfx(p,"h"), type:"text", text:p.title.toUpperCase(), x:100, y:420, w:880, h:300, fontSize:106, weight:900, color:"#FFFFFF", font:TBF, align:"center", lineHeight:0.9 });
    els.push({ id: pfx(p,"rule"), type:"shape", shape:"rect", x:W/2-50, y:740, w:100, h:4, color:p.accentColor, radius:2, opacity:1 });
    els.push({ id: pfx(p,"pp"), type:"text", text:p.body, x:120, y:760, w:840, h:160, fontSize:34, weight:500, color:"#EAEAEA", font:SG, align:"center", lineHeight:1.4 });
    return els;
  }
};
```

- [ ] **Step 4: Add 10 new templates from MODELOS.md**

Append to the file:

```typescript
// ─── NEW TEMPLATES FROM MODELOS.md ────────────────────────────────────────

export const tpl_mosaicLeft: SlideTemplate = {
  id: "mosaic-left", name: "Mosaico Esquerda", description: "1 imagem alta à esquerda, 2 imagens empilhadas à direita",
  category: "imagem", bestFor: ["middle", "any"],
  build(p) {
    const els: IElement[] = [];
    els.push(profileEl(p, 44));
    els.push({ id: pfx(p,"img1"), type:"image", imagePrompt:p.imagePrompt||p.title, x:40, y:120, w:468, h:1000, radius:20 });
    els.push({ id: pfx(p,"img2"), type:"image", imagePrompt:p.imagePrompt||p.title, x:548, y:120, w:492, h:480, radius:20 });
    els.push({ id: pfx(p,"img3"), type:"image", imagePrompt:p.imagePrompt||p.title, x:548, y:620, w:492, h:500, radius:20 });
    els.push({ id: pfx(p,"rule"), type:"shape", shape:"rect", x:40, y:1140, w:W-80, h:3, color:p.accentColor, opacity:0.5, radius:2 });
    els.push({ id: pfx(p,"h"), type:"text", text:p.title.toUpperCase(), x:40, y:1145, w:W-80, h:120, fontSize:76, weight:900, color:"#FFFFFF", font:TBF, align:"center", lineHeight:0.92 });
    return els;
  }
};

export const tpl_bottomThird: SlideTemplate = {
  id: "bottom-third", name: "Bloco Base", description: "Imagem 65% superior, bloco colorido com texto no rodapé",
  category: "imagem", bestFor: ["middle", "cover"],
  build(p) {
    const els: IElement[] = [];
    els.push({ id: pfx(p,"block"), type:"shape", shape:"rect", x:0, y:880, w:W, h:H-880, color:p.accentColor, opacity:1, radius:0 });
    els.push({ id: pfx(p,"img"), type:"image", imagePrompt:p.imagePrompt||p.title, x:0, y:0, w:W, h:900, radius:0 });
    els.push({ id: pfx(p,"h"), type:"text", text:p.title.toUpperCase(), x:60, y:920, w:W-120, h:220, fontSize:86, weight:900, color:"#000000", font:TBF, align:"center", lineHeight:0.92 });
    els.push({ id: pfx(p,"pp"), type:"text", text:p.body, x:80, y:1150, w:W-160, h:160, fontSize:34, weight:600, color:"rgba(0,0,0,0.75)", font:SG, align:"center", lineHeight:1.4 });
    return els;
  }
};

export const tpl_textDominant: SlideTemplate = {
  id: "text-dominant", name: "Texto Dominante", description: "Fundo sólido, tipografia preenche o slide, sem imagem",
  category: "texto", bestFor: ["middle", "any"],
  build(p) {
    const els: IElement[] = [];
    els.push({ id: pfx(p,"dot"), type:"shape", shape:"circle", x:60, y:80, w:18, h:18, color:p.accentColor, opacity:1 });
    els.push({ id: pfx(p,"h"), type:"text", text:p.title.toUpperCase(), x:60, y:120, w:W-120, h:680, fontSize:170, weight:900, color:"#FFFFFF", font:TBF, align:"left", lineHeight:0.84 });
    els.push({ id: pfx(p,"line"), type:"shape", shape:"rect", x:60, y:820, w:W-120, h:3, color:p.accentColor, opacity:0.4, radius:2 });
    els.push({ id: pfx(p,"pp"), type:"text", text:p.body, x:60, y:850, w:W-120, h:360, fontSize:44, weight:400, color:"#C0C0C0", font:SG, align:"left", lineHeight:1.55 });
    els.push(profileEl(p, H-120));
    return els;
  }
};

export const tpl_bigQuestion: SlideTemplate = {
  id: "big-question", name: "Pergunta Grande", description: "Ponto de interrogação gigante ghost, pergunta provocativa centrada",
  category: "texto", bestFor: ["middle", "any"],
  build(p) {
    const els: IElement[] = [];
    els.push({ id: pfx(p,"qbg"), type:"text", text:"?", x:0, y:-100, w:W, h:H, fontSize:900, weight:900, color:p.accentColor, font:TBF, align:"center", lineHeight:1 });
    els.push({ id: pfx(p,"h"), type:"text", text:p.title, x:60, y:320, w:W-120, h:500, fontSize:90, weight:900, color:"#FFFFFF", font:TBF, align:"center", lineHeight:1.0 });
    els.push({ id: pfx(p,"pp"), type:"text", text:p.body, x:80, y:860, w:W-160, h:240, fontSize:38, weight:400, color:"#CCCCCC", font:SG, align:"center", lineHeight:1.5 });
    els.push(profileEl(p, H-120));
    return els;
  }
};

export const tpl_testimonial: SlideTemplate = {
  id: "testimonial", name: "Testemunho", description: "Aspas grandes, citação, avatar + nome + avaliação",
  category: "texto", bestFor: ["middle", "any"],
  build(p) {
    const els: IElement[] = [];
    els.push({ id: pfx(p,"q1"), type:"text", text:"“", x:40, y:60, w:200, h:200, fontSize:220, weight:900, color:p.accentColor, font:TBF, align:"left", lineHeight:1 });
    els.push({ id: pfx(p,"body"), type:"text", text:`"${p.body}"`, x:80, y:230, w:W-160, h:520, fontSize:52, weight:500, color:"#F0F0F0", font:SG, align:"center", lineHeight:1.55 });
    els.push({ id: pfx(p,"line"), type:"shape", shape:"rect", x:W/2-60, y:800, w:120, h:4, color:p.accentColor, radius:2, opacity:1 });
    els.push(profileEl(p, 840));
    els.push({ id: pfx(p,"name"), type:"text", text:p.title, x:60, y:950, w:W-120, h:100, fontSize:42, weight:700, color:"#FFFFFF", font:SG, align:"center", lineHeight:1 });
    els.push({ id: pfx(p,"stars"), type:"text", text:"★★★★★", x:60, y:1060, w:W-120, h:80, fontSize:48, weight:700, color:p.accentColor, font:SG, align:"center", lineHeight:1 });
    return els;
  }
};

export const tpl_ctaDirect: SlideTemplate = {
  id: "cta-direct", name: "CTA Direto", description: "Slide final com ações claras: curtir, salvar, comentar",
  category: "cta", bestFor: ["cta"],
  build(p) {
    const els: IElement[] = [];
    els.push({ id: pfx(p,"h"), type:"text", text:p.title.toUpperCase(), x:60, y:120, w:W-120, h:280, fontSize:110, weight:900, color:"#FFFFFF", font:TBF, align:"center", lineHeight:0.92 });
    els.push({ id: pfx(p,"line"), type:"shape", shape:"rect", x:60, y:420, w:W-120, h:3, color:p.accentColor, opacity:0.5, radius:2 });
    els.push({ id: pfx(p,"a1"), type:"text", text:"❤️  Curte o post", x:80, y:480, w:W-160, h:100, fontSize:44, weight:600, color:"#FFFFFF", font:SG, align:"left", lineHeight:1 });
    els.push({ id: pfx(p,"a2"), type:"text", text:"🔁  Salva pra depois", x:80, y:600, w:W-160, h:100, fontSize:44, weight:600, color:"#FFFFFF", font:SG, align:"left", lineHeight:1 });
    els.push({ id: pfx(p,"a3"), type:"text", text:"💬  Comenta aqui", x:80, y:720, w:W-160, h:100, fontSize:44, weight:600, color:"#FFFFFF", font:SG, align:"left", lineHeight:1 });
    els.push({ id: pfx(p,"line2"), type:"shape", shape:"rect", x:60, y:860, w:W-120, h:3, color:p.accentColor, opacity:0.4, radius:2 });
    els.push({ id: pfx(p,"handle"), type:"text", text:p.handle, x:60, y:900, w:W-120, h:120, fontSize:72, weight:900, color:p.accentColor, font:TBF, align:"center", lineHeight:1 });
    els.push({ id: pfx(p,"pp"), type:"text", text:p.body, x:80, y:1040, w:W-160, h:200, fontSize:36, weight:400, color:"#AAAAAA", font:SG, align:"center", lineHeight:1.4 });
    return els;
  }
};

export const tpl_ctaQuestion: SlideTemplate = {
  id: "cta-question", name: "CTA Pergunta", description: "Pergunta de engajamento nos comentários, fundo accent vibrante",
  category: "cta", bestFor: ["cta"],
  build(p) {
    const els: IElement[] = [];
    els.push({ id: pfx(p,"h"), type:"text", text:p.title, x:60, y:200, w:W-120, h:560, fontSize:108, weight:900, color:"#000000", font:TBF, align:"center", lineHeight:0.95 });
    els.push({ id: pfx(p,"line"), type:"shape", shape:"rect", x:W/2-80, y:800, w:160, h:6, color:"rgba(0,0,0,0.3)", radius:3, opacity:1 });
    els.push({ id: pfx(p,"pp"), type:"text", text:p.body, x:80, y:840, w:W-160, h:200, fontSize:42, weight:500, color:"rgba(0,0,0,0.7)", font:SG, align:"center", lineHeight:1.5 });
    els.push({ id: pfx(p,"emoji"), type:"text", text:"👇", x:0, y:1050, w:W, h:120, fontSize:90, weight:400, color:"#000000", font:SG, align:"center", lineHeight:1 });
    els.push({ id: pfx(p,"handle"), type:"text", text:p.handle, x:60, y:1180, w:W-120, h:80, fontSize:38, weight:600, color:"rgba(0,0,0,0.5)", font:SG, align:"center", lineHeight:1 });
    return els;
  }
};

export const tpl_frameWithSummary: SlideTemplate = {
  id: "frame-summary", name: "Resumo Final", description: "Lista de checkmarks com tópicos aprendidos + teaser próximo",
  category: "cta", bestFor: ["cta"],
  build(p) {
    const els: IElement[] = [];
    els.push({ id: pfx(p,"eyebrow"), type:"text", text:"VOCÊ APRENDEU:", x:60, y:80, w:W-120, h:80, fontSize:28, weight:600, color:p.accentColor, font:SG, align:"left", lineHeight:1 });
    els.push({ id: pfx(p,"h"), type:"text", text:p.title.toUpperCase(), x:60, y:180, w:W-120, h:260, fontSize:100, weight:900, color:"#FFFFFF", font:TBF, align:"left", lineHeight:0.92 });
    els.push({ id: pfx(p,"c1"), type:"text", text:"✓", x:60, y:480, w:60, h:80, fontSize:52, weight:700, color:p.accentColor, font:SG, align:"left", lineHeight:1 });
    els.push({ id: pfx(p,"c2"), type:"text", text:"✓", x:60, y:590, w:60, h:80, fontSize:52, weight:700, color:p.accentColor, font:SG, align:"left", lineHeight:1 });
    els.push({ id: pfx(p,"c3"), type:"text", text:"✓", x:60, y:700, w:60, h:80, fontSize:52, weight:700, color:p.accentColor, font:SG, align:"left", lineHeight:1 });
    els.push({ id: pfx(p,"pp"), type:"text", text:p.body, x:130, y:470, w:W-190, h:360, fontSize:40, weight:400, color:"#CCCCCC", font:SG, align:"left", lineHeight:1.65 });
    els.push({ id: pfx(p,"line"), type:"shape", shape:"rect", x:60, y:880, w:W-120, h:3, color:p.accentColor, opacity:0.4, radius:2 });
    els.push({ id: pfx(p,"next"), type:"text", text:"Siga para o próximo →", x:60, y:910, w:W-120, h:100, fontSize:40, weight:600, color:"#AAAAAA", font:SG, align:"left", lineHeight:1 });
    els.push(profileEl(p, H-120));
    return els;
  }
};
```

- [ ] **Step 5: Build the template registry**

Append to the file:

```typescript
// ─── REGISTRY ──────────────────────────────────────────────────────────────

export const ALL_TEMPLATES: SlideTemplate[] = [
  // Text-only
  tpl_centeredPower,
  tpl_editorialCentered,
  tpl_impact,
  tpl_quoteStyle,
  tpl_stackedBold,
  tpl_minimalCorners,
  tpl_twoColumnStat,
  tpl_checklistDecorative,
  tpl_leftAlign,
  tpl_numberHero,
  tpl_dramatic,
  tpl_textDominant,
  tpl_bigQuestion,
  tpl_testimonial,
  // Image
  tpl_coverCTA,
  tpl_textTopImageBottom,
  tpl_twoSquaresTop,
  tpl_imageTopTextBottom,
  tpl_splitVertical,
  tpl_smallImgTopRight,
  tpl_circlePortrait,
  tpl_frostedCard,
  tpl_mosaicLeft,
  tpl_bottomThird,
  // CTAs
  tpl_ctaDirect,
  tpl_ctaQuestion,
  tpl_frameWithSummary,
];

export const TEXT_TEMPLATES = ALL_TEMPLATES.filter(t => t.category === "texto");
export const IMAGE_TEMPLATES = ALL_TEMPLATES.filter(t => t.category === "imagem");
export const CTA_TEMPLATES = ALL_TEMPLATES.filter(t => t.category === "cta");

export function getTemplate(id: string): SlideTemplate | undefined {
  return ALL_TEMPLATES.find(t => t.id === id);
}

export function getCompatibleTemplates(isFirst: boolean, isLast: boolean, hasImage: boolean): SlideTemplate[] {
  if (isFirst || isLast) {
    return ALL_TEMPLATES.filter(t =>
      t.bestFor.includes("cover") || t.bestFor.includes("cta") || t.bestFor.includes("any")
    );
  }
  if (hasImage) {
    return ALL_TEMPLATES.filter(t =>
      t.category === "imagem" || t.bestFor.includes("any")
    );
  }
  return ALL_TEMPLATES.filter(t =>
    t.category === "texto" || t.bestFor.includes("any")
  );
}
```

- [ ] **Step 6: Verify TypeScript compiles**

```bash
cd "/Users/r.montoya/Downloads/site teste - cópia/novacraft/saas"
npx tsc --noEmit 2>&1 | grep "slideTemplates\|error TS" | head -20
```

Expected: zero errors.

- [ ] **Step 7: Commit**

```bash
git add src/lib/slideTemplates.ts
git commit -m "feat(templates): add slideTemplates library — 27 typed template functions with registry"
```

---

## Task 2: Refactor `generate/route.ts` to Use the Template Library

**Files:**
- Modify: `src/app/api/carousel/generate/route.ts:28-428`

> **Context:** Currently `buildCanvasSlides()` has 400 lines of inline template code. After Task 1, that code lives in `src/lib/slideTemplates.ts`. This task replaces the inline code with imports. The function signature stays exactly the same so callers are unaffected. The route handles text-only slides (tpl % 11) and image slides (imgTpl 0–14).

> **Important:** Template params require `{ cid, i, title, body, accentColor, handle, imagePrompt }`. The existing `addProfile` helper and `titleText` / `gs.body` variables must be mapped to these params.

- [ ] **Step 1: Add import to the route file**

Open `src/app/api/carousel/generate/route.ts`. Find the existing imports (lines 1–10). Add after them:

```typescript
import {
  TemplateParams,
  tpl_centeredPower, tpl_editorialCentered, tpl_impact, tpl_quoteStyle,
  tpl_stackedBold, tpl_minimalCorners, tpl_twoColumnStat, tpl_checklistDecorative,
  tpl_leftAlign, tpl_numberHero, tpl_dramatic,
  tpl_coverCTA, tpl_textTopImageBottom, tpl_twoSquaresTop, tpl_imageTopTextBottom,
  tpl_splitVertical, tpl_smallImgTopRight, tpl_circlePortrait,
  tpl_frostedCard, tpl_mosaicLeft,
} from "@/lib/slideTemplates";
```

- [ ] **Step 2: Replace text-only template block (tpl 0–10)**

Inside `buildCanvasSlides`, find the comment `// ─── TEXT-ONLY SLIDES` (line ~68). Replace the entire `if (!hasImage && !isFirst && !isLast)` block with:

```typescript
if (!hasImage && !isFirst && !isLast) {
  const tplFns = [
    tpl_centeredPower, tpl_editorialCentered, tpl_impact, tpl_quoteStyle,
    tpl_stackedBold, tpl_minimalCorners, tpl_twoColumnStat, tpl_checklistDecorative,
    tpl_leftAlign, tpl_numberHero, tpl_dramatic,
  ];
  const tplFn = tplFns[randomTpl % tplFns.length];
  const params: TemplateParams = {
    cid, i, title: titleText, body: gs.body,
    accentColor, handle, imagePrompt: gs.imagePrompt,
  };
  els.push(...tplFn.build(params));
}
```

- [ ] **Step 3: Replace image slide template block (imgTpl 0–14)**

Find the comment `// ─── IMAGE SLIDES` (line ~220). Replace the entire `let imgTpl` block and its if/else chain with:

```typescript
const imgTplFns = [
  tpl_coverCTA, tpl_coverCTA, // 0=cover, 1=cta (same layout)
  tpl_textTopImageBottom, tpl_twoSquaresTop, tpl_imageTopTextBottom,
  tpl_imageTopTextBottom, tpl_splitVertical, tpl_smallImgTopRight,
  tpl_twoSquaresTop, tpl_textTopImageBottom, tpl_circlePortrait,
  tpl_frostedCard, tpl_mosaicLeft, tpl_frostedCard, tpl_textTopImageBottom,
];
let imgTplIdx: number;
if (isFirst) imgTplIdx = 0;
else if (isLast) imgTplIdx = 1;
else imgTplIdx = 2 + (randomTpl % 13);

const imgParams: TemplateParams = {
  cid, i, title: titleText, body: gs.body,
  accentColor, handle, imagePrompt: gs.imagePrompt,
};
els.push(...imgTplFns[imgTplIdx].build(imgParams));
```

- [ ] **Step 4: Verify route still compiles**

```bash
npx tsc --noEmit 2>&1 | grep "generate/route\|error TS" | head -20
```

Expected: zero errors.

- [ ] **Step 5: Quick smoke test — generate a carousel**

With `npm run dev` running, navigate to `http://localhost:3000/dashboard` and generate a new carousel. Verify slides render correctly in the editor.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/carousel/generate/route.ts
git commit -m "refactor(generate): use slideTemplates library — remove 350 lines of inline layout code"
```

---

## Task 3: Build the Template Picker Component

**Files:**
- Create: `src/components/TemplatePicker.tsx`

> **Context:** This component shows a scrollable grid of template previews. The user sees 3 tabs (Texto / Imagem / CTA). Each template shows a `SlidePreview` thumbnail rendered at scale=0.16 (1080×0.16=173px wide, 1350×0.16=216px tall). Clicking a template calls `onApply(template)`. Use the `frontend-design` skill BEFORE writing any JSX to ensure premium, editorial visual quality. The component receives the current slide's data to populate preview params.

**⚠️ REQUIRED: Invoke `frontend-design` skill before writing any JSX.**

- [ ] **Step 1: Invoke `frontend-design` skill**

Before writing any JSX, invoke the `frontend-design` skill and read its principles. Apply them to the template picker: editorial tab design, hover states with accent border, selected state with accent fill, smooth transitions.

- [ ] **Step 2: Create `src/components/TemplatePicker.tsx`**

```typescript
"use client";
import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ISlide } from "@/models/Carousel";
import SlidePreview from "@/components/SlidePreview";
import {
  SlideTemplate, TemplateParams, TemplateCategory,
  TEXT_TEMPLATES, IMAGE_TEMPLATES, CTA_TEMPLATES,
} from "@/lib/slideTemplates";

interface TemplatePickerProps {
  slide: ISlide;
  slideIndex: number;
  totalSlides: number;
  accentColor: string;
  handle: string;
  onApply: (template: SlideTemplate) => void;
}

const CATEGORIES: { key: TemplateCategory; label: string; templates: SlideTemplate[] }[] = [
  { key: "texto",  label: "Texto",  templates: TEXT_TEMPLATES  },
  { key: "imagem", label: "Imagem", templates: IMAGE_TEMPLATES },
  { key: "cta",    label: "CTA",    templates: CTA_TEMPLATES   },
];

export function TemplatePicker({ slide, slideIndex, totalSlides, accentColor, handle, onApply }: TemplatePickerProps) {
  const [tab, setTab] = React.useState<TemplateCategory>("texto");
  const [hovered, setHovered] = React.useState<string | null>(null);

  const previewParams: TemplateParams = React.useMemo(() => ({
    cid: "preview",
    i: slideIndex,
    title: (slide.elements.find(e => e.type === "text" && e.fontSize && e.fontSize > 60)?.text || "TÍTULO DO SLIDE"),
    body: (slide.elements.find(e => e.type === "text" && e.fontSize && e.fontSize <= 60 && e.fontSize >= 28)?.text || "Texto do corpo aqui."),
    accentColor,
    handle,
    imagePrompt: "beautiful editorial photo",
  }), [slide, slideIndex, accentColor, handle]);

  const activeCategory = CATEGORIES.find(c => c.key === tab)!;

  const previewSlide = React.useCallback((template: SlideTemplate): ISlide => {
    const elements = template.build(previewParams);
    return {
      ...slide,
      elements,
      // Remove bgImageUrl so preview uses background color, not potentially missing image
      bgImageUrl: template.category === "imagem" ? slide.bgImageUrl : undefined,
    };
  }, [slide, previewParams]);

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-border-subtle shrink-0">
        {CATEGORIES.map(cat => (
          <button
            key={cat.key}
            onClick={() => setTab(cat.key)}
            className={`flex-1 py-2 text-caption font-medium transition-colors ${
              tab === cat.key
                ? "text-accent border-b-2 border-accent -mb-px"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {cat.label}
            <span className="ml-1 text-text-tertiary">({cat.templates.length})</span>
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="grid grid-cols-2 gap-3"
          >
            {activeCategory.templates.map(template => (
              <button
                key={template.id}
                onClick={() => onApply(template)}
                onMouseEnter={() => setHovered(template.id)}
                onMouseLeave={() => setHovered(null)}
                className={`group relative flex flex-col gap-1.5 text-left rounded-lg overflow-hidden border-2 transition-all duration-150 ${
                  hovered === template.id
                    ? "border-accent shadow-lg shadow-accent/10"
                    : "border-border-subtle hover:border-border-strong"
                }`}
                title={template.description}
              >
                {/* Thumbnail */}
                <div className="overflow-hidden bg-bg-base" style={{ height: 216 }}>
                  <SlidePreview slide={previewSlide(template)} scale={0.16} style={{ borderRadius: 0 }} />
                </div>
                {/* Label */}
                <div className="px-2 pb-2">
                  <div className={`text-caption font-medium truncate ${hovered === template.id ? "text-accent" : "text-text-primary"}`}>
                    {template.name}
                  </div>
                  <div className="text-micro text-text-tertiary truncate">{template.description}</div>
                </div>
              </button>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep "TemplatePicker\|error TS" | head -10
```

Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/TemplatePicker.tsx
git commit -m "feat(editor): add TemplatePicker component with template preview thumbnails"
```

---

## Task 4: Wire Template Picker into the Editor Inspector

**Files:**
- Modify: `src/components/Editor.tsx`

> **Context:** The editor inspector currently has 3 tabs: Design / Fundo / Camadas (lines 936–974). We add a 4th tab "Modelos". When active, it renders `<TemplatePicker>`. Clicking a template calls a new `applyTemplate(template)` function that pushes history, replaces `draft.slides[selectedSlide].elements` with the template's elements, and resets `selectedEl` to null.

- [ ] **Step 1: Add TemplatePicker import**

Open `src/components/Editor.tsx`. Find line with all the component imports. Add:

```typescript
import { TemplatePicker } from "@/components/TemplatePicker";
import { SlideTemplate, TemplateParams } from "@/lib/slideTemplates";
```

- [ ] **Step 2: Add `applyTemplate` function**

Find the `handleDeleteCarousel` function (after `handleSave`). Add after it:

```typescript
const applyTemplate = (template: SlideTemplate) => {
  if (!slide) return;
  pushHistory();
  const params: TemplateParams = {
    cid: draft._id || `c${Date.now()}`,
    i: selectedSlide,
    title: (slide.elements.find(e => e.type === "text" && e.fontSize && (e.fontSize as number) > 60)?.text || "TÍTULO DO SLIDE").toUpperCase(),
    body: slide.elements.find(e => e.type === "text" && e.fontSize && (e.fontSize as number) <= 60 && (e.fontSize as number) >= 28)?.text || "Texto do corpo aqui.",
    accentColor: accentColor,
    handle: slide.elements.find(e => e.type === "profile")?.text || "@seuhandle",
    imagePrompt: slide.elements.find(e => e.type === "image")?.imagePrompt || "",
  };
  const newElements = template.build(params);
  setDraft(d => ({
    ...d,
    slides: d.slides.map((s, i) => i === selectedSlide ? { ...s, elements: newElements } : s),
  }));
  setSelectedEl(null);
  showToast(`Modelo "${template.name}" aplicado.`);
};
```

- [ ] **Step 3: Add "Modelos" tab to the inspector**

Find the inspector tabs array (line ~937):
```tsx
{["design", "background", "layers"].map((tab) => (
```

Replace with:
```tsx
{["design", "background", "layers", "modelos"].map((tab) => (
```

And update the label mapping:
```tsx
{tab === "design" ? "Design" : tab === "background" ? "Fundo" : tab === "layers" ? "Camadas" : "Modelos"}
```

- [ ] **Step 4: Render TemplatePicker in the inspector**

Inside the inspector `<div className="p-4">`, add at the end, after the `layers` section:

```tsx
{propsTab === "modelos" && slide && (
  <div className="-mx-4 -mt-4 h-full">
    <TemplatePicker
      slide={slide}
      slideIndex={selectedSlide}
      totalSlides={draft.slides.length}
      accentColor={accentColor}
      handle={slide.elements.find(e => e.type === "profile")?.text || "@seuhandle"}
      onApply={applyTemplate}
    />
  </div>
)}
```

Note: The `<div className="p-4">` wrapper adds padding. The `TemplatePicker` has its own internal padding, so we use `-mx-4 -mt-4` to break out of it.

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep "Editor.tsx\|error TS" | head -10
```

Expected: zero errors.

- [ ] **Step 6: Test in browser**

With `npm run dev` running:
1. Open any carousel in the editor (`http://localhost:3000/dashboard/editor/[id]`)
2. Click any slide in the filmstrip
3. Click the "Modelos" tab in the inspector (right panel)
4. Verify the template picker shows 3 tabs (Texto / Imagem / CTA)
5. Verify template thumbnails render in a 2-column grid
6. Click a template — verify the slide's elements update in the canvas
7. Verify toast "Modelo X aplicado." appears briefly
8. Verify Ctrl+Z / undo reverts the template change (history was pushed)

- [ ] **Step 7: Commit**

```bash
git add src/components/Editor.tsx
git commit -m "feat(editor): add Modelos tab with template picker — apply any template to selected slide"
```

---

## Task 5: Visual QA with `frontend-design` Skill

**Files:** Minor Tailwind fixes only.

> **Context:** After all functionality works, do a visual pass on the template picker. The thumbnails must be clearly legible at scale=0.16. The tab bar must match the Design/Fundo/Camadas style exactly. Hover and click states must feel crisp.

- [ ] **Step 1: Invoke `frontend-design` skill**

Invoke the `frontend-design` skill and use its visual QA checklist.

- [ ] **Step 2: Fix visual issues found**

Common issues to check:
- Template card hover border must be exactly `border-accent` (not a diluted version)
- Tab active state must use `border-b-2 border-accent` consistent with other tabs
- Template name text must be `text-caption font-medium` — not a larger size that doesn't fit
- Grid gap must be `gap-3` — tighter gaps make the grid feel cramped
- SlidePreview at scale=0.16 (173×216px): verify text is visible even at tiny size. If not, increase scale to 0.18 (194×243px) and use `grid-cols-2`
- Scrollbar in picker must be styled or hidden: `overflow-y-auto [&::-webkit-scrollbar]:hidden`
- When `propsTab === "modelos"`, `selectedEl` should be reset to null since element-level editing doesn't apply

- [ ] **Step 3: Commit visual fixes**

```bash
git add src/components/TemplatePicker.tsx src/components/Editor.tsx
git commit -m "fix(editor): visual QA template picker — scale, spacing, tab consistency"
```

---

## Summary of New Files

| File | Purpose |
|------|---------|
| `src/lib/slideTemplates.ts` | 27 template functions + registry + type definitions |
| `src/components/TemplatePicker.tsx` | Template browser UI with thumbnail previews |

## Summary of Modified Files

| File | Change |
|------|--------|
| `src/app/api/carousel/generate/route.ts` | Replace inline template code with library calls |
| `src/components/Editor.tsx` | Add "Modelos" tab + `applyTemplate` function |
