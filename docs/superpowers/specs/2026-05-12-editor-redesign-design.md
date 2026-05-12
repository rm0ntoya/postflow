# Editor Redesign — Spec

**Data:** 2026-05-12  
**Status:** Aprovado pelo usuário  
**Escopo:** `src/components/Editor.tsx`, `src/components/EditorPanels.tsx`, `src/app/dashboard/app.css`

---

## Objetivo

Reformular completamente o layout visual do editor de carrosséis. Zero mudança na lógica de edição, drag, undo, export ou APIs. Apenas layout, estrutura de componentes e CSS.

---

## Layout Geral

Grid de 3 colunas + 1 linha de topbar:

```
┌─────────────────────────────────────────────────────────┐
│  TOPBAR UNIFICADA (48px)                                │
├─────────────┬───────────────────────────┬───────────────┤
│             │                           │               │
│  SIDEBAR    │        CANVAS             │  PROPS PANEL  │
│  ESQUERDA   │                           │               │
│  200px      │        flex: 1            │  260px        │
│             │                           │               │
│  thumbnails │   [FAB chat flutuante]    │  Design/Fundo │
│  verticais  │                           │  /Camadas     │
│             │                           │               │
└─────────────┴───────────────────────────┴───────────────┘
```

CSS grid: `grid-template-rows: 48px 1fr; grid-template-columns: 200px 1fr 260px`

---

## 1. Topbar Unificada (48px)

Funde toolbar de ferramentas + topbar atual numa única barra. Elimina a segunda linha que consumia 52px extras.

**Esquerda:**
- Botão `←` (voltar ao dashboard)
- Input de título editável (inline, sem borda até hover)
- Label meta `1080 × 1350 · salvo`

**Centro (centralizado absoluto):**
- Grupo de ferramentas em pill: `Select | — | Texto | Imagem | Forma | Perfil | — | Undo`
- Background sutil `rgba(255,255,255,.03)` com borda, border-radius 10px
- Ferramenta ativa: `background: rgba(168,85,247,.18)`, cor `#C4B5FD`

**Direita:**
- Toggle de visualização (2 botões: isolado / todos) — pill estilo view-toggle atual
- Zoom control (−, %, +)
- Botão "Baixar" (ghost)
- Botão "Salvar" (gradient primário)

---

## 2. Sidebar Esquerda — Thumbnails Verticais (200px)

Substitui a `slide-list-bar` horizontal atual.

**Header:**
- Label "SLIDES" uppercase + badge com contagem

**Lista de thumbnails:**
- Aspect ratio `4/5`, largura 100% da sidebar (menos padding)
- Borda selecionada: `#A855F7` + glow `0 0 0 2px rgba(168,85,247,.2)`
- Número do slide no canto superior esquerdo (badge pequeno)
- **Hover:** aparece overlay com botões duplicar (⧉) e deletar (✕)
- Botão "Adicionar slide" ao final (dashed border, ícone +, texto "Adicionar")
- Scroll vertical independente

**Remoção:** `slide-list-bar` horizontal é completamente removida.

---

## 3. Canvas (área central)

**Modo isolado (padrão):**
- Exibe apenas o slide selecionado, centralizado vertical e horizontalmente
- Label acima: `● Slide 01 — Capa` (ponto roxo + número + tipo)
- Botão abaixo do slide: "Gerar imagem de fundo" (ghost, com ícone refresh)
- Zoom automático para caber na área disponível

**Modo todos (toggle):**
- Comportamento atual: todos os slides horizontalmente com scroll
- `editor-stage` layout horizontal existente, mantido sem mudança

**Toggle:** botão na topbar direita alterna entre os modos. Estado em `useState<'isolated' | 'all'>`.

**FAB do chat IA:**
- Posição: `position: absolute; bottom: 20px; right: 20px; z-index: 30`
- Botão circular 44px, gradient `#6C27BE → #A855F7`
- Ícone de chat (balão), dot verde (online) no canto superior direito
- Animação de glow pulsante suave (CSS keyframe)
- Click: toggle `chatOpen` state

---

## 4. Chat IA — Painel Flutuante

Substitui o painel `editor-chat` fixo de 300px.

**Posição:** `position: absolute; bottom: 54px; right: 0` dentro do canvas

**Dimensões quando aberto:** `width: 300px`, altura dinâmica (max ~360px com scroll nas mensagens)

**Animação de abertura:** `transform-origin: bottom right`, escala de `0` → `1` com `cubic-bezier(.34,1.56,.64,1)`

**Estrutura interna:**
- Header: ícone + "Agente IA" + "Edite por texto" + botão fechar
- Área de mensagens com scroll: bubbles user (roxo) e assistant (dark)
- Action badges verdes para ações aplicadas
- Cursor pulsante durante streaming
- Input textarea + botão send gradient

**Estado:** `chatOpen: boolean` em `useState`. FAB sempre visível no canvas.

---

## 5. Props Panel Direito (260px)

Mantém mesmas 3 abas: **Design / Fundo / Camadas**

**Visual refinado:**
- Tabs: fundo mais escuro, tab ativa com underline `#A855F7` + `background: rgba(168,85,247,.05)`
- Seções com `padding: 14px 16px`, separador `rgba(255,255,255,.04)`
- Labels de seção: `10px`, `letter-spacing: .1em`, `rgba(255,255,255,.25)` (mais discreto)
- Inputs: `background: rgba(255,255,255,.04)`, borda `rgba(255,255,255,.07)`, border-radius 7px
- Sliders: thumb 13px roxo, track 3px altura
- Color swatches: 8 colunas, border-radius 6px, hover scale 1.1, ativo com double ring
- Delete button: ghost vermelho sutil

**Conteúdo:** sem mudança funcional — mesmos campos de `TextProps`, `ShapeProps`, `ImageProps`, `ProfileProps`, `BackgroundPropsPanel`, `LayersList`.

---

## 6. CSS — Variáveis e Tokens

Sem mudança nas variáveis CSS `--bg`, `--bg2`, etc. Novas classes substituem as antigas do editor:

| Classe antiga | Classe nova |
|---|---|
| `.editor` | `.editor` — grid atualizado |
| `.editor-tools` | removida (fundida na topbar) |
| `.editor-chat` | removida (virou `.chat-popup` flutuante) |
| `.editor-canvas-bar` | `.editor-topbar` (novo) |
| `.slide-list-bar` | removida |
| `.slide-thumb-mini` | `.slide-thumb` (sidebar vertical) |

---

## 7. Componentes — Mudanças de Estrutura

### `Editor.tsx`
- Adicionar state: `viewMode: 'isolated' | 'all'` (default `'isolated'`)
- Adicionar state: `chatOpen: boolean` (default `false`)
- Remover: bloco JSX `editor-chat` (300px fixo)
- Adicionar: `<ChatFAB>` dentro da área do canvas
- Adicionar: `<ChatPopup>` dentro da área do canvas (posição absoluta)
- Atualizar: topbar para layout unificado (3 zonas: left / center tools / right)
- Atualizar: substituir `slide-list-bar` por sidebar vertical
- Atualizar: canvas renderiza modo isolado ou todos conforme `viewMode`

### `EditorPanels.tsx`
- Sem mudança de lógica
- Ajustes cosméticos nas classes CSS usadas

### `app.css`
- Remover: `.editor-tools`, `.editor-chat`, `.slide-list-bar`, `.slide-thumb-mini`
- Adicionar: `.editor-topbar`, `.tb-tools`, `.tool`, `.sidebar-left`, `.slide-thumb`, `.chat-popup`, `.fab-btn`, `.view-toggle`
- Atualizar: `.props`, `.props-tabs`, `.props-tab`, `.props-section`

---

## 8. O que NÃO muda

- Toda lógica de `updateEl`, `updateSlide`, `pushHistory`, `undo`, `deleteEl`, `addSlide`
- Export ZIP com `html2canvas`
- Drag & drop de elementos
- Edição inline de texto (double click)
- Resize handles
- API calls (`/chat`, `/generate-image`, `/add-slide`)
- `SlideCanvas`, `EditableElement`, `ResizeHandles` — sem toque
- `SlidePreview` — sem toque
- `EditorPage` (`/dashboard/editor/[id]/page.tsx`) — sem toque

---

## Arquivos Afetados

1. `src/components/Editor.tsx` — refatoração de layout JSX + novos states
2. `src/components/EditorPanels.tsx` — ajustes cosméticos de classes CSS
3. `src/app/dashboard/app.css` — remoção de classes antigas, adição das novas
