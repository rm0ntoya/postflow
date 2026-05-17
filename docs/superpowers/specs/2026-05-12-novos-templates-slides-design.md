# Design: 10 Novos Templates de Slide

**Data:** 2026-05-12  
**Scope:** `src/app/api/carousel/generate/route.ts` — função `buildCanvasSlides`  
**Canvas:** 1080×1350px (constantes em `src/lib/canvas.ts`)

---

## Contexto

O sistema atual gera slides usando dois pools de templates:

- **Text-only:** 6 templates (tpl 0–5), ciclados via `textSlideCount % 6`
- **Image slides:** 8 templates (imgTpl 2–9), ciclados via `2 + (i % 8)`

Este spec adiciona 5 novos text-only (TPL 6–10 internamente, novos índices 6–10) e 5 novos image (imgTpl 10–14), expandindo a variedade visual dos carrosséis gerados.

---

## Templates Text-Only (5 novos)

O pool text-only passa de `% 6` para `% 11`.

### TPL 6 — Big Stat / Dado
**Estrutura:** Número/dado gigante (left ~40% largura) + contexto descritivo (right ~50%)  
**Elementos:**
- 2 círculos decorativos bg (accentColor, opacity baixa)
- Divisor vertical sutil (center)
- `text` gigante esquerda: número/stat, fontSize ~180, font TheBoldFont, accentColor
- `shape rect` accent — regra horizontal embaixo do número
- `text` descrição do stat esquerda: fontSize 32, SpaceGrotesk, muted
- `profile` topo direita
- `text` body direita: fontSize 38, SpaceGrotesk, lineHeight 1.6
- `text` pageNum

**Uso ideal:** Slides com dado/percentual de impacto (ex: "73% dos posts...", "R$47k em 30 dias")

---

### TPL 7 — Checklist / Lista
**Estrutura:** Título topo + 4 itens com ícone quadrado accent + label + descrição curta  
**Elementos:**
- `profile` topo
- `text` título: fontSize 88, TheBoldFont, center
- `shape rect` accent rule abaixo do título
- 4× grupo: `shape rect` (ícone checkbox, 32×32, accentColor, radius 6) + `text` label (fontSize 34, bold) + `text` desc (fontSize 28, muted)
- `text` pageNum

**Espaçamento:** Itens a cada ~140px verticais, iniciando em y~380  
**Uso ideal:** Listas de erros, ferramentas, dicas, checklist de ação

---

### TPL 8 — Antes / Depois
**Estrutura:** Título topo + dois blocos empilhados: ❌ ANTES (top-half) e ✓ DEPOIS (bottom-half)  
**Elementos:**
- `profile` topo
- `text` título: fontSize 80, TheBoldFont
- Bloco ANTES: `shape rect` com fill vermelho rgba baixo + borda + `text` label "❌ ANTES" (red accent) + `text` 2–3 linhas
- Bloco DEPOIS: `shape rect` com fill verde rgba baixo + borda + `text` label "✓ DEPOIS" (green accent) + `text` 2–3 linhas
- `text` "VS" círculo separador entre os blocos
- `text` pageNum

**Cores:** ANTES usa `#ef4444` (vermelho), DEPOIS usa `#22c55e` (verde) — fixas, não accentColor  
**Uso ideal:** Transformações, comparações, resultados de mudança de comportamento

---

### TPL 9 — Timeline / Passos
**Estrutura:** Título topo + linha vertical accent + 3 steps numerados à direita  
**Elementos:**
- `text` título: fontSize 84, TheBoldFont, topo
- `profile` logo abaixo do título
- `shape rect` linha vertical (x~80, de y~320 até y~960, w=4, accentColor, opacity 0.3)
- 3× step: `shape circle` numerado (accentColor, r~36, com número sobreposto) + `text` step title (fontSize 36, bold) + `text` step desc (fontSize 30, muted)
- Circles em y≈340, 560, 780 (espaçados 220px)
- `text` pageNum

**Uso ideal:** Tutoriais, processos, metodologias passo a passo

---

### TPL 10 — Split Editorial
**Estrutura:** Coluna esquerda com título gigante + coluna direita com body denso  
**Elementos:**
- `shape rect` topbar accentColor (topo full width, h=3)
- `shape rect` label accent topo esquerda (w~120, h=6)
- `text` título: left col (~x:60, w:420), fontSize 132, TheBoldFont, lineHeight 0.88
- `shape rect` divisor vertical sutil (x~540, y~120, h~900)
- `profile` right col topo
- `text` body: right col (x~580, w~440), fontSize 36, SpaceGrotesk, lineHeight 1.65
- `shape rect` bottom rule (full width)
- `text` pageNum

**Uso ideal:** Slides com argumento principal forte + desenvolvimento textual longo

---

## Templates Image (5 novos)

O pool image passa de `i % 8` para `i % 13` (imgTpl 2–14).

### IMG TPL 10 — Retrato Circular
**Estrutura:** Imagem circular centralizada topo (~55% do canvas) + título + body embaixo  
**Elementos:**
- `image` circular: x~190, y~80, w~700, h~700, radius=350 (círculo perfeito)
- `shape circle` anel decorativo accent (mesmo centro, ligeiramente maior, opacity 0.2, fill none — simulado como dois círculos)
- `shape circle` dot accent topo (y~40, pequeno)
- `profile` abaixo da imagem (y~830)
- `text` título: centralizado, fontSize 96, TheBoldFont (y~900)
- `shape rect` rule accent (y~1010)
- `text` body: fontSize 34, SpaceGrotesk, center (y~1040)
- `text` pageNum

**Nota:** `bgOverride: "#000000"` (sem bg image — a imagem é o elemento circular)

---

### IMG TPL 11 — Corte Diagonal
**Estrutura:** Imagem ocupa topo com borda inferior diagonal + linha accent na diagonal + título/body embaixo  
**Elementos:**
- `image` retangular topo: x~0, y~0, w~1080, h~620, radius=0 (bg do slide via bgImageUrl)
- Para simular diagonal: `bgImageUrl` com clip — na prática, usar bgImageUrl e sobrepor um `shape` trapézio (rect rotacionado via transform não suportado)
- **Abordagem prática:** `bgImageUrl` + shape rect branco/preto inclinado usando dois triângulos (shapes não suportam polygon — usar rect estreito angled)
- Implementação simplificada: imagem como bgImageUrl com gradiente de overlay (já suportado) + rect accent horizontal no corte
- `shape rect` accent faixa no corte: x~0, y~590, w~1080, h~8, accentColor
- `profile` y~650
- `text` título: fontSize 100, TheBoldFont, center (y~720)
- `text` body: fontSize 34, center (y~880)
- `text` pageNum

**Nota:** Usar `bgImageUrl` como slide background. O "corte diagonal" é simulado com a faixa accent.

---

### IMG TPL 12 — Mosaico 1+2
**Estrutura:** 1 imagem tall esquerda + 2 imagens stacked direita + título bottom overlay  
**Elementos:**
- `image` esquerda tall: x~40, y~80, w~460, h~960, radius=24 — `imagePrompt`
- `image` direita topo: x~540, y~80, w~500, h~460, radius=24 — `imagePrompt2`
- `image` direita bottom: x~540, y~580, w~500, h~460, radius=24 — usa `imagePrompt` (terceira imagem reutiliza prompt)
- `profile` sobreposição bottom (y~1060)
- `text` título: fontSize 80, TheBoldFont, center, na faixa inferior
- `text` pageNum

**Nota:** 3 elementos image, 2 prompts distintos (imagePrompt + imagePrompt2). `bgOverride: "#000000"`

---

### IMG TPL 13 — Card Flutuante
**Estrutura:** Imagem bg full-bleed + card semi-transparente centralizado com texto  
**Elementos:**
- Usar `bgImageUrl` como background full-bleed
- `shape rect` overlay card: x~60, y~300, w~960, h~600, fill `rgba(0,0,0,0.6)`, radius=20, opacity=1
- `shape rect` borda do card: mesmo size, fill none — não suportado nativo; usar shape com low opacity accent
- `shape rect` accent topline do card: x~80, y~310, w~120, h~6, accentColor
- `profile` dentro do card (y~340)
- `text` título: dentro do card, fontSize 108, TheBoldFont, center (y~420)
- `text` body: dentro do card, fontSize 34, center (y~640)
- `text` pageNum

**Nota:** `bgImageUrl` preenchido, sem `bgOverride`. A imagem vem do `imagePrompt` do slide.

---

### IMG TPL 14 — Faixa Panorâmica
**Estrutura:** Título grande topo + body + faixa horizontal de 3 imagens stacked  
**Elementos:**
- `profile` topo (y~80)
- `text` título: fontSize 96, TheBoldFont, center (y~180)
- `shape rect` accent rule (y~360)
- `text` body: fontSize 34, center (y~380)
- `image` esquerda: x~40, y~520, w~310, h~380, radius=16 — `imagePrompt`
- `image` centro: x~385, y~520, w~310, h~380, radius=16 — `imagePrompt2`
- `image` direita: x~730, y~520, w~310, h~380, radius=16 — `imagePrompt` (reutiliza)
- `shape rect` accent rule abaixo das imagens (y~920, h=3)
- `text` pageNum

**Nota:** 3 elementos image, 2 prompts. `bgOverride: "#000000"`

---

## Mudanças no Código

### `src/app/api/carousel/generate/route.ts`

1. **`buildCanvasSlides`** — text-only section:
   - `const tpl = textSlideCount % 6` → `const tpl = textSlideCount % 11`
   - Adicionar cases `tpl === 6` through `tpl === 10`

2. **`buildCanvasSlides`** — image section:
   - `imgTpl = 2 + (i % 8)` → `imgTpl = 2 + (i % 13)`
   - Adicionar cases `imgTpl === 10` through `imgTpl === 14`

### Nenhuma mudança de schema, API, ou modelos necessária.

---

## Constraints

- Todos os elementos usam tipos já suportados: `text`, `image`, `shape`, `profile`
- Shapes suportados: `rect`, `circle` — sem polygon/path
- Transforms não suportados — sem rotação de elementos
- Fontes disponíveis: `TheBoldFont`, `Space Grotesk`
- `backgroundSize` em image elements: `"cover" | "contain" | "auto"`
- Radius em image elements cria bordas arredondadas (círculo perfeito quando w=h e radius=w/2)
