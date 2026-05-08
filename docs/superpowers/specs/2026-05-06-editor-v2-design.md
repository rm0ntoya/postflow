# Editor v2 — Design Spec
Date: 2026-05-06

## Overview
10 improvements to the carousel editor: visual design, UX bugs, AI image regeneration, and ZIP export.

---

## 1. Pure Black Background for Text-Only Slides
**Where:** `src/app/api/carousel/generate/route.ts` → `buildCanvasSlides`  
**Change:** Replace `bgOverride: "#0A0A0A"` with `"#000000"` on non-image slides.  
**Also:** Increase body font size and add stronger accent decoration for text-only slides to increase visual emphasis.

---

## 2. Resizable Background Image
**Where:** `src/models/Carousel.ts` (ISlide), `src/components/Editor.tsx` (BackgroundPropsPanel), `src/components/SlidePreview.tsx` (resolveBgStyle)  
**Change:**
- Add `bgPositionX?: number` and `bgPositionY?: number` (0–100) and `bgScale?: number` (1.0–2.5) to `ISlide`
- `resolveBgStyle` uses these to compute `backgroundPosition` and `backgroundSize`
- `BackgroundPropsPanel` shows X/Y position sliders (0–100%) and scale slider (1x–2.5x) when `bgImageUrl` is set

---

## 3. Fix Single-Click Editing Bug
**Where:** `src/components/Editor.tsx` → `EditableElement`  
**Root cause:** `onMouseDown` stops propagation but `onClick` on the parent canvas still fires `setSelectedEl(null)`, deselecting immediately after selection.  
**Fix:** Add `onClick={e => e.stopPropagation()}` to each `EditableElement` div so clicks don't bubble up to the canvas clear handler.

---

## 4 & 5. "Generate New Image" Button + Popup
**Where:** `src/components/Editor.tsx` → `SlideCanvas`, new `RegenImageModal` component  
**Change:**
- Below each `SlideCanvas` with `slide.bgImageUrl`, render a "↺ Gerar outra imagem" button
- Button opens `RegenImageModal` (inline in Editor.tsx) with:
  - Textarea: "Descreva o que quer na imagem (opcional)"
  - Checkbox: "Deixar a IA usar a imaginação"
  - Submit button → calls `POST /api/carousel/[id]/generate-image` with `{ slideIndex, customPrompt, useFace }`
- API route already handles this; add optional `customPrompt` param that overrides `imgPrompt` when set

---

## 6. Image Box Elements — Generate from Editor
**Where:** `src/components/Editor.tsx` → props panel for `type: "image"` elements  
**Change:**
- Add `ImageProps` panel (shown when `el.type === "image"` is selected)
- Shows current image preview or placeholder
- "Gerar imagem" button → opens same `RegenImageModal` but passes `elementId`
- API already supports `elementId` to save result to `el.imageUrl`

---

## 7. Profile Element — Add via Toolbar
**Where:** `src/components/Editor.tsx`  
**Change:**
- Add "Adicionar perfil" button to tools rail (person icon)
- `addProfile()` function inserts `type: "profile"` element with default handle from carousel context
- Add `ProfileProps` panel: inputs for handle text, photo URL, font size, color

---

## 8. Highlighted Words UI
**Where:** `src/components/Editor.tsx` → `TextProps`  
**Change:**
- Add input field: "Palavras em destaque (separadas por vírgula)"
- On change → auto-parse `el.text` and build `segments[]`:
  - Words matching input → `{ text, color: accentColor }`
  - Others → `{ text, color: el.color || "#fff" }`
- `accentColor` comes from carousel prop (passed down through Editor → SlideCanvas → EditableElement)

---

## 9. Download All Slides as ZIP (html2canvas + jszip)
**Where:** `src/components/Editor.tsx` → `handleDownloadImages`  
**Dependencies:** `npm install html2canvas jszip` (client-side, lazy-imported)  
**Change:**
- Rename button: "Baixar fundos" → "Baixar fotos (ZIP)"
- Remove old per-image download logic
- New logic:
  1. For each slide index, find the `.slide-frame` DOM element by data attribute
  2. `html2canvas(el, { scale: 1080 / el.offsetWidth, useCORS: true })` → PNG blob
  3. Collect all blobs into JSZip
  4. Download zip as `{title}.zip`
- Show progress indicator during capture ("Exportando X/N…")

---

## 10. More Creative AI Image Generation
**Where:** `src/app/api/carousel/[id]/generate-image/route.ts` → `buildPromptText`  
**Change:**
- Expand variations array from 5 to 12 unique compositions (wide shots, bird's eye, extreme low angle, silhouette, Dutch tilt, etc.)
- Add explicit instruction: "NEVER repeat poses or framing from other slides. Invent a completely unique scenario."
- When `hasFaceRef`: add "Create an inventive dramatic situation — subject can be doing anything creative, not just looking at camera"
- Add diversity in background environments: studio, urban rooftop, underwater, space, forest, neon city, etc.

---

## Data Model Changes
```typescript
// ISlide additions
bgPositionX?: number;  // 0-100, maps to background-position-x %
bgPositionY?: number;  // 0-100, maps to background-position-y %
bgScale?: number;      // 1.0-2.5, maps to background-size: {scale*100}%
```

## API Changes
- `POST /api/carousel/[id]/generate-image` — add optional `customPrompt?: string` body param

## Dependencies to Install
- `html2canvas` — client DOM capture
- `jszip` — ZIP file creation

## Files Changed
1. `src/models/Carousel.ts` — add bgPositionX, bgPositionY, bgScale to ISlide
2. `src/components/SlidePreview.tsx` — resolveBgStyle uses new position/scale fields
3. `src/components/Editor.tsx` — all UX changes (bugs 3, 4/5, 6, 7, 8, 9)
4. `src/app/api/carousel/generate/route.ts` — black bg (#000), more content emphasis
5. `src/app/api/carousel/[id]/generate-image/route.ts` — customPrompt param, more creative prompts
