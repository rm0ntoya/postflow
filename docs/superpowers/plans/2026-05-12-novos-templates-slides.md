# Novos Templates de Slide — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar 10 novos layouts de slide à função `buildCanvasSlides` — 5 text-only (tpl 6–10) e 5 image (imgTpl 10–14) — expandindo a variedade visual dos carrosséis gerados.

**Architecture:** Toda a mudança está em `buildCanvasSlides` dentro de `src/app/api/carousel/generate/route.ts`. O pool text-only passa de `% 6` para `% 11`; o pool image passa de `% 8` para `% 13`. Nenhum schema, API, ou modelo precisa ser alterado.

**Tech Stack:** TypeScript, Next.js 14 App Router, Canvas coordinates (1080×1350px), elementos `IElement` do Mongoose model `Carousel`.

---

## File Map

| File | Change |
|------|--------|
| `src/app/api/carousel/generate/route.ts` | Única mudança — ampliar `buildCanvasSlides` |

---

## Task 1 — Expandir pool text-only: 5 novos templates (tpl 6–10)

**Files:**
- Modify: `src/app/api/carousel/generate/route.ts`

### O que muda

1. `const tpl = textSlideCount % 6` → `% 11`
2. Adicionar 5 `else if` blocks antes do `addPageNum()` + `return` do branch text-only

---

- [ ] **Step 1.1 — Mudar o modulo do pool text-only**

Em `src/app/api/carousel/generate/route.ts`, linha `const tpl = textSlideCount % 6;`:

```typescript
const tpl = textSlideCount % 11;
```

- [ ] **Step 1.2 — Adicionar TPL 6: Big Stat / Dado**

Localizar o bloco `} else {` do `tpl === 5` (o último else) e adicionar imediatamente após seu fechamento `}`, antes de `addPageNum()`:

```typescript
      } else if (tpl === 6) {
        // Two-column stat: huge title left, body right
        els.push({ id: `${cid}-s${i}-c1`, type: "shape", shape: "circle", x: -150, y: 200, w: 500, h: 500, color: accentColor, opacity: 0.06 });
        els.push({ id: `${cid}-s${i}-c2`, type: "shape", shape: "circle", x: W-100, y: H-600, w: 500, h: 500, color: accentColor, opacity: 0.04 });
        els.push({ id: `${cid}-s${i}-vdiv`, type: "shape", shape: "rect", x: 520, y: 100, w: 2, h: H-200, color: "#ffffff", opacity: 0.07, radius: 1 });
        addProfile(80, 60, 420);
        els.push({ id: `${cid}-s${i}-h`, type: "text", text: titleText, segments, x: 50, y: 200, w: 440, h: 620, fontSize: 148, weight: 900, color: "#FFFFFF", font: TBF, align: "center", lineHeight: 0.88 });
        els.push({ id: `${cid}-s${i}-dot`, type: "shape", shape: "circle", x: 210, y: 872, w: 16, h: 16, color: accentColor, opacity: 1 });
        els.push({ id: `${cid}-s${i}-rule`, type: "shape", shape: "rect", x: 80, y: 890, w: 300, h: 4, color: accentColor, radius: 2, opacity: 0.7 });
        els.push({ id: `${cid}-s${i}-p`, type: "text", text: gs.body, x: 560, y: 160, w: 460, h: 960, fontSize: 40, weight: 400, color: "#CCCCCC", font: SG, align: "left", lineHeight: 1.65 });
```

- [ ] **Step 1.3 — Adicionar TPL 7: Checklist / Lista**

```typescript
      } else if (tpl === 7) {
        // Decorative checklist: title + accent bullets left-margin + body
        els.push({ id: `${cid}-s${i}-c1`, type: "shape", shape: "circle", x: W-300, y: -100, w: 600, h: 600, color: accentColor, opacity: 0.05 });
        addProfile(70);
        els.push({ id: `${cid}-s${i}-h`, type: "text", text: titleText, segments, x: 60, y: 170, w: W-120, h: 240, fontSize: 92, weight: 900, color: "#FFFFFF", font: TBF, align: "center", lineHeight: 0.9 });
        els.push({ id: `${cid}-s${i}-rule`, type: "shape", shape: "rect", x: W/2-80, y: 420, w: 160, h: 4, color: accentColor, radius: 2, opacity: 1 });
        const bulletYs = [460, 610, 760, 910];
        const bulletOpacities = [1, 0.8, 0.6, 0.4];
        for (let b = 0; b < 4; b++) {
          els.push({ id: `${cid}-s${i}-bx${b}`, type: "shape", shape: "rect", x: 60, y: bulletYs[b], w: 36, h: 36, color: accentColor, radius: 6, opacity: bulletOpacities[b] });
          if (b < 3) els.push({ id: `${cid}-s${i}-sep${b}`, type: "shape", shape: "rect", x: 60, y: bulletYs[b]+52, w: W-120, h: 1.5, color: "#ffffff", opacity: 0.06, radius: 1 });
        }
        els.push({ id: `${cid}-s${i}-p`, type: "text", text: gs.body, x: 120, y: 446, w: W-180, h: 580, fontSize: 36, weight: 500, color: "#D0D0D0", font: SG, align: "left", lineHeight: 1.72 });
```

- [ ] **Step 1.4 — Adicionar TPL 8: Antes / Depois**

```typescript
      } else if (tpl === 8) {
        // Before/After: two stacked contrast boxes
        addProfile(60);
        els.push({ id: `${cid}-s${i}-h`, type: "text", text: titleText, segments, x: 60, y: 160, w: W-120, h: 200, fontSize: 88, weight: 900, color: "#FFFFFF", font: TBF, align: "center", lineHeight: 0.9 });
        // BEFORE box
        els.push({ id: `${cid}-s${i}-box-a`, type: "shape", shape: "rect", x: 40, y: 380, w: W-80, h: 340, color: "#ef4444", opacity: 0.08, radius: 16 });
        els.push({ id: `${cid}-s${i}-box-a-border`, type: "shape", shape: "rect", x: 40, y: 380, w: 4, h: 340, color: "#ef4444", opacity: 0.6, radius: 2 });
        els.push({ id: `${cid}-s${i}-lbl-a`, type: "text", text: "❌  ANTES", x: 70, y: 405, w: 300, h: 50, fontSize: 26, weight: 700, color: "#ef4444", font: SG, align: "left" });
        els.push({ id: `${cid}-s${i}-txt-a`, type: "text", text: gs.body.split(/\n|\./).slice(0, 3).join(". ").slice(0, 200), x: 70, y: 460, w: W-150, h: 240, fontSize: 34, weight: 400, color: "#C8C8C8", font: SG, align: "left", lineHeight: 1.5 });
        // VS separator
        els.push({ id: `${cid}-s${i}-vs`, type: "shape", shape: "circle", x: W/2-28, y: 704, w: 56, h: 56, color: "#1a1a1a", opacity: 1 });
        els.push({ id: `${cid}-s${i}-vs-txt`, type: "text", text: "VS", x: W/2-28, y: 708, w: 56, h: 48, fontSize: 18, weight: 900, color: "rgba(255,255,255,0.5)", font: SG, align: "center" });
        // AFTER box
        els.push({ id: `${cid}-s${i}-box-b`, type: "shape", shape: "rect", x: 40, y: 780, w: W-80, h: 340, color: "#22c55e", opacity: 0.08, radius: 16 });
        els.push({ id: `${cid}-s${i}-box-b-border`, type: "shape", shape: "rect", x: 40, y: 780, w: 4, h: 340, color: "#22c55e", opacity: 0.7, radius: 2 });
        els.push({ id: `${cid}-s${i}-lbl-b`, type: "text", text: "✓  DEPOIS", x: 70, y: 805, w: 300, h: 50, fontSize: 26, weight: 700, color: "#22c55e", font: SG, align: "left" });
        els.push({ id: `${cid}-s${i}-txt-b`, type: "text", text: gs.body.split(/\n|\./).slice(3).join(". ").slice(0, 200) || gs.body.slice(0, 200), x: 70, y: 860, w: W-150, h: 240, fontSize: 34, weight: 400, color: "#C8C8C8", font: SG, align: "left", lineHeight: 1.5 });
```

- [ ] **Step 1.5 — Adicionar TPL 9: Timeline / Passos**

```typescript
      } else if (tpl === 9) {
        // Vertical timeline with 3 numbered steps
        els.push({ id: `${cid}-s${i}-c1`, type: "shape", shape: "circle", x: W-250, y: H-350, w: 500, h: 500, color: accentColor, opacity: 0.05 });
        els.push({ id: `${cid}-s${i}-h`, type: "text", text: titleText, segments, x: 60, y: 70, w: W-120, h: 200, fontSize: 88, weight: 900, color: "#FFFFFF", font: TBF, align: "center", lineHeight: 0.9 });
        addProfile(310);
        // Timeline vertical line
        els.push({ id: `${cid}-s${i}-line`, type: "shape", shape: "rect", x: 96, y: 420, w: 4, h: 680, color: accentColor, opacity: 0.25, radius: 2 });
        // Steps
        const stepYs = [420, 650, 880];
        const stepOpacities = [1, 0.75, 0.5];
        const bodyLines = gs.body.split(/\n|[.!?]\s+/).filter(Boolean);
        for (let s = 0; s < 3; s++) {
          els.push({ id: `${cid}-s${i}-sc${s}`, type: "shape", shape: "circle", x: 62, y: stepYs[s], w: 72, h: 72, color: accentColor, opacity: stepOpacities[s] });
          els.push({ id: `${cid}-s${i}-sn${s}`, type: "text", text: String(s + 1), x: 62, y: stepYs[s]+4, w: 72, h: 64, fontSize: 28, weight: 900, color: "#000000", font: TBF, align: "center" });
          els.push({ id: `${cid}-s${i}-st${s}`, type: "text", text: bodyLines[s] || gs.body.slice(s * 80, (s + 1) * 80), x: 160, y: stepYs[s]+4, w: W-220, h: 60, fontSize: 34, weight: 600, color: "#FFFFFF", font: SG, align: "left" });
          if (bodyLines[s + 3]) els.push({ id: `${cid}-s${i}-sd${s}`, type: "text", text: bodyLines[s + 3], x: 160, y: stepYs[s]+52, w: W-220, h: 50, fontSize: 28, weight: 400, color: "#A0A0A0", font: SG, align: "left" });
        }
```

- [ ] **Step 1.6 — Adicionar TPL 10: Split Editorial**

```typescript
      } else if (tpl === 10) {
        // Editorial split: giant title left column, body right column
        els.push({ id: `${cid}-s${i}-topbar`, type: "shape", shape: "rect", x: 60, y: 60, w: W-120, h: 3, color: accentColor, opacity: 0.5, radius: 2 });
        els.push({ id: `${cid}-s${i}-label`, type: "shape", shape: "rect", x: 60, y: 75, w: 100, h: 6, color: accentColor, opacity: 0.35, radius: 3 });
        els.push({ id: `${cid}-s${i}-h`, type: "text", text: titleText, segments, x: 60, y: 110, w: 440, h: 900, fontSize: 138, weight: 900, color: "#FFFFFF", font: TBF, align: "left", lineHeight: 0.87 });
        els.push({ id: `${cid}-s${i}-vdiv`, type: "shape", shape: "rect", x: 540, y: 110, w: 1, h: 960, color: "#ffffff", opacity: 0.07, radius: 1 });
        addProfile(100, 580, 460);
        els.push({ id: `${cid}-s${i}-p`, type: "text", text: gs.body, x: 580, y: 200, w: 440, h: 860, fontSize: 38, weight: 400, color: "#C0C0C0", font: SG, align: "left", lineHeight: 1.68 });
        els.push({ id: `${cid}-s${i}-botbar`, type: "shape", shape: "rect", x: 60, y: H-100, w: W-120, h: 2, color: "#ffffff", opacity: 0.07, radius: 1 });
```

- [ ] **Step 1.7 — Verificar que todos os 5 novos blocos fecham corretamente**

Após o último `else if (tpl === 10)`, deve existir (sem modificação) o bloco:

```typescript
      addPageNum();
      return {
        id: `${cid}-s${i}`,
        bgKey: "noir",
        bgOverride: "#000000",
        bgImageUrl: undefined,
        imagePrompt: undefined,
        elements: els,
      };
    }
```

Confirme visualmente que cada `else if` abre e fecha com `{` `}` balanceados.

- [ ] **Step 1.8 — Build rápido**

```bash
cd "/Users/r.montoya/Downloads/site teste - cópia/novacraft/saas"
npx tsc --noEmit 2>&1
```

Esperado: **sem output** (zero erros). Se houver erro de tipo, corrigir antes de continuar.

- [ ] **Step 1.9 — Commit**

```bash
cd "/Users/r.montoya/Downloads/site teste - cópia/novacraft/saas"
git add src/app/api/carousel/generate/route.ts
git commit -m "feat: add 5 new text-only slide templates (tpl 6-10)"
```

---

## Task 2 — Expandir pool image: 5 novos templates (imgTpl 10–14)

**Files:**
- Modify: `src/app/api/carousel/generate/route.ts`

### O que muda

1. `imgTpl = 2 + (i % 8)` → `% 13`
2. Adicionar 5 `else if` cases para imgTpl 10–14
3. Atualizar `bgOverride` e `imagePrompt` no `return` para incluir `imgTpl === 13`

---

- [ ] **Step 2.1 — Mudar o modulo do pool image**

```typescript
else imgTpl = 2 + (i % 13); // templates 2–14 for middle image slides
```

- [ ] **Step 2.2 — Adicionar IMG TPL 10: Retrato Circular**

Após o bloco `} else {` do `imgTpl === 9` (o último else existente), inserir:

```typescript
    } else if (imgTpl === 10) {
      // Circular portrait image centered top + title/body below
      els.push({ id: `${cid}-s${i}-ring`, type: "shape", shape: "circle", x: 160, y: 50, w: 760, h: 760, color: accentColor, opacity: 0.18 });
      els.push({ id: `${cid}-s${i}-img1`, type: "image", imagePrompt: gs.imagePrompt, x: 190, y: 80, w: 700, h: 700, radius: 350 });
      els.push({ id: `${cid}-s${i}-dot`, type: "shape", shape: "circle", x: W/2-12, y: 36, w: 24, h: 24, color: accentColor, opacity: 1 });
      addProfile(848);
      els.push({ id: `${cid}-s${i}-h`, type: "text", text: titleText, segments, x: 60, y: 940, w: W-120, h: 260, fontSize: 96, weight: 900, color: "#FFFFFF", font: TBF, align: "center", lineHeight: 0.92 });
      els.push({ id: `${cid}-s${i}-rule`, type: "shape", shape: "rect", x: W/2-60, y: 1092, w: 120, h: 5, color: accentColor, radius: 3, opacity: 1 });
      els.push({ id: `${cid}-s${i}-p`, type: "text", text: gs.body, x: 100, y: 1112, w: W-200, h: 180, fontSize: 34, weight: 500, color: "#D0D0D0", font: SG, align: "center", lineHeight: 1.4 });
```

- [ ] **Step 2.3 — Adicionar IMG TPL 11: Corte Diagonal**

```typescript
    } else if (imgTpl === 11) {
      // Full-bleed bg image + diagonal accent faixa + text bottom
      // bgImageUrl will be set via imagePrompt at slide level (handled in return)
      els.push({ id: `${cid}-s${i}-faixa`, type: "shape", shape: "rect", x: 0, y: 576, w: W, h: 10, color: accentColor, opacity: 0.75, radius: 0 });
      els.push({ id: `${cid}-s${i}-overlay`, type: "shape", shape: "rect", x: 0, y: 586, w: W, h: H-586, color: "rgba(0,0,0,0.72)", opacity: 1, radius: 0 });
      addProfile(640);
      els.push({ id: `${cid}-s${i}-h`, type: "text", text: titleText, segments, x: 60, y: 730, w: W-120, h: 280, fontSize: 104, weight: 900, color: "#FFFFFF", font: TBF, align: "center", lineHeight: 0.92 });
      els.push({ id: `${cid}-s${i}-p`, type: "text", text: gs.body, x: 100, y: 1024, w: W-200, h: 220, fontSize: 36, weight: 500, color: "#E0E0E0", font: SG, align: "center", lineHeight: 1.4 });
```

**Nota:** Este template usa `bgImageUrl` (não `bgOverride`). O `return` no Step 2.7 já cobre isso.

- [ ] **Step 2.4 — Adicionar IMG TPL 12: Mosaico 1+2**

```typescript
    } else if (imgTpl === 12) {
      // 3-image mosaic: 1 tall left + 2 stacked right
      addProfile(44);
      els.push({ id: `${cid}-s${i}-img1`, type: "image", imagePrompt: gs.imagePrompt, x: 40, y: 120, w: 468, h: 1000, radius: 20 });
      els.push({ id: `${cid}-s${i}-img2`, type: "image", imagePrompt: gs.imagePrompt2 || gs.imagePrompt, x: 548, y: 120, w: 492, h: 480, radius: 20 });
      els.push({ id: `${cid}-s${i}-img3`, type: "image", imagePrompt: gs.imagePrompt, x: 548, y: 620, w: 492, h: 500, radius: 20 });
      els.push({ id: `${cid}-s${i}-rule`, type: "shape", shape: "rect", x: 40, y: 1140, w: W-80, h: 3, color: accentColor, opacity: 0.5, radius: 2 });
      els.push({ id: `${cid}-s${i}-h`, type: "text", text: titleText, segments, x: 40, y: 1160, w: W-80, h: 140, fontSize: 76, weight: 900, color: "#FFFFFF", font: TBF, align: "center", lineHeight: 0.92 });
```

- [ ] **Step 2.5 — Adicionar IMG TPL 13: Card Flutuante**

```typescript
    } else if (imgTpl === 13) {
      // Full-bleed bg + frosted card overlay with title/body centered
      // bgImageUrl set via imagePrompt at slide level (handled in return)
      els.push({ id: `${cid}-s${i}-card`, type: "shape", shape: "rect", x: 60, y: 270, w: 960, h: 680, color: "rgba(0,0,0,0.65)", opacity: 1, radius: 20 });
      els.push({ id: `${cid}-s${i}-cardtop`, type: "shape", shape: "rect", x: 60, y: 270, w: 220, h: 5, color: accentColor, opacity: 1, radius: 3 });
      addProfile(320, 100, 500);
      els.push({ id: `${cid}-s${i}-h`, type: "text", text: titleText, segments, x: 100, y: 420, w: 880, h: 300, fontSize: 106, weight: 900, color: "#FFFFFF", font: TBF, align: "center", lineHeight: 0.9 });
      els.push({ id: `${cid}-s${i}-rule`, type: "shape", shape: "rect", x: W/2-50, y: 740, w: 100, h: 4, color: accentColor, radius: 2, opacity: 1 });
      els.push({ id: `${cid}-s${i}-p`, type: "text", text: gs.body, x: 120, y: 760, w: 840, h: 160, fontSize: 34, weight: 500, color: "#EAEAEA", font: SG, align: "center", lineHeight: 1.4 });
```

- [ ] **Step 2.6 — Adicionar IMG TPL 14: Faixa Panorâmica**

```typescript
    } else if (imgTpl === 14) {
      // Title + body top + panoramic 3-image strip bottom
      addProfile(60);
      els.push({ id: `${cid}-s${i}-h`, type: "text", text: titleText, segments, x: 60, y: 160, w: W-120, h: 260, fontSize: 100, weight: 900, color: "#FFFFFF", font: TBF, align: "center", lineHeight: 0.92 });
      els.push({ id: `${cid}-s${i}-rule`, type: "shape", shape: "rect", x: W/2-60, y: 430, w: 120, h: 4, color: accentColor, radius: 2, opacity: 1 });
      els.push({ id: `${cid}-s${i}-p`, type: "text", text: gs.body, x: 100, y: 450, w: W-200, h: 140, fontSize: 34, weight: 500, color: "#D0D0D0", font: SG, align: "center", lineHeight: 1.4 });
      els.push({ id: `${cid}-s${i}-img1`, type: "image", imagePrompt: gs.imagePrompt, x: 40, y: 610, w: 316, h: 400, radius: 16 });
      els.push({ id: `${cid}-s${i}-img2`, type: "image", imagePrompt: gs.imagePrompt2 || gs.imagePrompt, x: 382, y: 610, w: 316, h: 400, radius: 16 });
      els.push({ id: `${cid}-s${i}-img3`, type: "image", imagePrompt: gs.imagePrompt, x: 724, y: 610, w: 316, h: 400, radius: 16 });
      els.push({ id: `${cid}-s${i}-accrule`, type: "shape", shape: "rect", x: 40, y: 1028, w: W-80, h: 3, color: accentColor, opacity: 0.35, radius: 2 });
```

- [ ] **Step 2.7 — Atualizar o `return` do branch image para imgTpl 11 e 13**

Localizar as linhas:

```typescript
      bgOverride: (imgTpl === 0 || imgTpl === 1) ? undefined : "#000000",
      bgImageUrl: undefined,
      imagePrompt: (imgTpl === 0 || imgTpl === 1) ? gs.imagePrompt : undefined,
```

Substituir por:

```typescript
      bgOverride: (imgTpl === 0 || imgTpl === 1 || imgTpl === 11 || imgTpl === 13) ? undefined : "#000000",
      bgImageUrl: undefined,
      imagePrompt: (imgTpl === 0 || imgTpl === 1 || imgTpl === 11 || imgTpl === 13) ? gs.imagePrompt : undefined,
```

**Por quê:** `imgTpl === 11` (Corte Diagonal) e `imgTpl === 13` (Card Flutuante) usam a imagem como fundo do slide via `bgImageUrl`, assim como os templates de capa (0) e CTA (1).

- [ ] **Step 2.8 — Type check**

```bash
cd "/Users/r.montoya/Downloads/site teste - cópia/novacraft/saas"
npx tsc --noEmit 2>&1
```

Esperado: **sem output**. Se houver erro, verificar que todos `els.push({...})` usam propriedades válidas de `IElement` (`id`, `type`, `x`, `y`, `w`, `h`, `color`, `opacity`, `radius`, `font`, `fontSize`, `weight`, `align`, `lineHeight`, `text`, `segments`, `imagePrompt`, `shape`).

- [ ] **Step 2.9 — Build de produção**

```bash
cd "/Users/r.montoya/Downloads/site teste - cópia/novacraft/saas"
npm run build 2>&1 | tail -10
```

Esperado: última linha com `ƒ (Dynamic)` listings sem "Build error".

- [ ] **Step 2.10 — Commit**

```bash
cd "/Users/r.montoya/Downloads/site teste - cópia/novacraft/saas"
git add src/app/api/carousel/generate/route.ts
git commit -m "feat: add 5 new image slide templates (imgTpl 10-14)"
```

---

## Task 3 — Smoke test manual

**Files:** nenhum — teste em desenvolvimento

- [ ] **Step 3.1 — Iniciar servidor dev**

```bash
cd "/Users/r.montoya/Downloads/site teste - cópia/novacraft/saas"
npm run dev
```

- [ ] **Step 3.2 — Gerar carrossel com 12 slides**

No dashboard, criar carrossel com **12 slides** e **sem imagens** (imageSlides vazio). Isso garante que os 11 text-only templates rodem pelo menos uma vez completa.

Verificar no editor que os slides 2–11 (content slides) apresentam variedade visual — cada um com layout diferente.

- [ ] **Step 3.3 — Gerar carrossel com 15 slides e imagens em todos**

Criar carrossel com **15 slides** e **todos os slides com imagem**. Isso força `imgTpl` a percorrer 2 até 14 (13 templates, 13 slides de conteúdo = cobertura completa).

Verificar no editor:
- TPL 10 (Circular): slide com imagem redonda centralizada
- TPL 11 (Diagonal): slide com imagem de fundo + faixa accent horizontal
- TPL 12 (Mosaico): slide com 3 imagens (2 elementos na direita)
- TPL 13 (Card Flutuante): slide com fundo de imagem + caixa overlay
- TPL 14 (Faixa Panorâmica): slide com 3 imagens horizontais embaixo

- [ ] **Step 3.4 — Commit de encerramento (se nenhum ajuste necessário)**

```bash
cd "/Users/r.montoya/Downloads/site teste - cópia/novacraft/saas"
git add -p
git commit -m "chore: smoke test verified — 10 new slide templates functional"
```

---

## Notas de implementação

### `addProfile` assinatura
```typescript
const addProfile = (y: number, x = 60, w = 500) => { ... }
```
Usar `addProfile(y)` para perfil padrão left. Usar `addProfile(y, x, w)` quando precisar posicionar na coluna direita (ex: TPL 10 Split Editorial usa `addProfile(100, 580, 460)`).

### TPL 8 (Antes/Depois) — split de texto
O body text é dividido usando `.split(/\n|\./).filter(Boolean)`. Se o AI retornar um parágrafo contínuo sem quebras, o segundo bloco cai para `gs.body.slice(0, 200)`. O template permanece funcional em ambos os casos.

### TPL 9 (Timeline) — step texts
`bodyLines[s]` usa o array de frases do body. Se o body tiver menos de 3 frases, o fallback `gs.body.slice(s * 80, (s+1) * 80)` garante conteúdo. `bodyLines[s+3]` é para subtítulo opcional — se ausente, o elemento simplesmente não é adicionado.

### imgTpl 11 e 13 — bgImageUrl
Nesses templates, o `bgImageUrl` do slide será preenchido pela rota `/api/carousel/[id]/generate-image` quando chamada sem `elementId`. O `imagePrompt` do slide (definido no `return`) é o prompt usado para essa geração de fundo.
