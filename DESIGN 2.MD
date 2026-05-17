# NovaCraft — DESIGN 2.MD
## Especificação Visual Completa: Registro + Editor de Carrosséis

> **Data:** 2026-05-17  
> **Versão:** 2.0  
> **Referência base:** DESIGN.md (v1.0, 2026-05-12) — tokens, tipografia, componentes ui/ já implementados  
> **Escopo:** Duas telas não cobertas pelo DESIGN.md original — `/register` e `/dashboard/editor/[id]`

---

## §1 · Referências do Sistema

Todas as decisões visuais abaixo usam exclusivamente os tokens de `src/styles/tokens.css`. Nenhum hex literal nos componentes. Resumo dos tokens mais usados neste documento:

| Token | Valor | Uso |
|---|---|---|
| `--bg-base` | `#0A0A0B` | Fundo da app, corpo da tela |
| `--bg-surface` | `#111113` | Painéis, cards, sidebar |
| `--bg-surface-2` | `#16161A` | Hover, inputs, fundos secundários |
| `--bg-surface-3` | `#1C1C21` | Nested (popovers, sub-painéis) |
| `--accent` | `#C6F84E` | CTA primário, foco, indicadores ativos |
| `--accent-muted` | `rgba(198,248,78,0.12)` | Background de chip ativo |
| `--text-primary` | `#F5F5F7` | Títulos e corpo principal |
| `--text-secondary` | `#A1A1AA` | Labels, descrições |
| `--text-tertiary` | `#6B6B72` | Placeholders, metadados |
| `--border-subtle` | `rgba(255,255,255,0.06)` | Divisores, cards |
| `--border-default` | `rgba(255,255,255,0.10)` | Inputs, botões secundários |
| `--border-accent` | `#C6F84E` | Foco ativo, seleção |
| `--shadow-pop` | `0 12px 32px -8px rgba(0,0,0,0.6)` | Modal, palette, toast |

### Escala tipográfica (usar apenas estas 8 classes)

| Classe CSS | Tamanho | Peso | Uso |
|---|---|---|---|
| `.text-display` | 40px / lh 44px | 600 | Heróis de página |
| `.text-h1` | 28px / lh 34px | 600 | Títulos de seção |
| `.text-h2` | 20px / lh 26px | 600 | Sub-seções |
| `.text-h3` | 16px / lh 22px | 600 | Labels de grupo |
| `.text-body-strong` | 14px / lh 20px | 500 | Corpo enfatizado |
| `.text-body` | 14px / lh 20px | 400 | Corpo padrão |
| `.text-caption` | 12px / lh 16px | 400 | Metadados, helpers |
| `.text-micro` | 11px / lh 14px | 500 | Eyebrows, badges |

---

## §2 · Página de Registro `/register`

### 2.1 · Visão Geral

Espelha exatamente o layout do Login (`DESIGN.md §4.9`) — split 40/60. Lado esquerdo contém o formulário de criação de conta. Lado direito contém um painel de marca estático com frase de valor e métricas sociais. O objetivo é transmitir confiança e velocidade logo na primeira interação do usuário com a plataforma.

**Rota:** `src/app/(auth)/register/page.tsx`  
**Auth:** POST `/api/auth/register` com `{ name, email, password, recaptchaToken }`  
**Redirect:** `/dashboard` em sucesso

---

### 2.2 · Shell da Página

```
┌───────────────────────────────────────────────────────────────────┐
│   min-h-screen  flex  bg-bg-base                                  │
│                                                                   │
│  ┌────────────────────────┐  ┌──────────────────────────────────┐ │
│  │  FORMULÁRIO (40%)      │  │  PAINEL DE MARCA (60%)           │ │
│  │  min-w-[480px]         │  │  hidden lg:flex                  │ │
│  │  px-16 py-16           │  │  bg-bg-surface                   │ │
│  │  flex items-center     │  │  items-center justify-center     │ │
│  └────────────────────────┘  └──────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────┘
```

- Sem bordas externas, sem card flutuante — o split é o layout
- Mobile: apenas o formulário (painel direito `hidden lg:flex`)
- Fundo geral: `bg-bg-base` (#0A0A0B)

---

### 2.3 · Lado Esquerdo — Formulário

**Container:** `w-full max-w-[400px] flex flex-col gap-6`

**Elementos em ordem vertical:**

#### 2.3.1 · Logo
```tsx
<LogoLockup size={24} />
```
Importado de `@/components/Logo`. Sem link — usuário ainda não está logado.

#### 2.3.2 · Cabeçalho
```tsx
<div className="flex flex-col gap-1">
  <h1 className="text-display text-text-primary">Crie sua conta.</h1>
  <p className="text-body text-text-secondary">Comece grátis. Sem cartão de crédito.</p>
</div>
```

#### 2.3.3 · Mensagem de erro (condicional)
Aparece acima dos campos quando `error !== ""`:
```tsx
<div className="flex items-center gap-2 px-3 py-2.5 rounded-md border border-state-danger/40 bg-state-danger/10 text-body text-state-danger">
  <AlertCircle size={16} strokeWidth={1.5} />
  {error}
</div>
```

#### 2.3.4 · Formulário

Três campos usando componente `Input` de `@/components/ui/Input`:

**Campo Nome:**
```tsx
<Input
  label="Nome completo"
  type="text"
  inputSize="lg"
  placeholder="Seu nome"
  autoComplete="name"
  required
  value={form.name}
  onChange={(e) => setForm({ ...form, name: e.target.value })}
/>
```

**Campo Email:**
```tsx
<Input
  label="Email"
  type="email"
  inputSize="lg"
  placeholder="seu@email.com"
  autoComplete="email"
  required
  value={form.email}
  onChange={(e) => setForm({ ...form, email: e.target.value })}
/>
```

**Campo Senha:**
- Toggle show/hide com ícone `Eye` / `EyeOff` de lucide-react no `iconRight`
- Exibe indicador de força imediatamente abaixo do input (ver §2.3.5)
```tsx
<Input
  label="Senha"
  type={show ? "text" : "password"}
  inputSize="lg"
  placeholder="Mínimo 8 caracteres"
  autoComplete="new-password"
  required
  minLength={8}
  value={form.password}
  onChange={(e) => setForm({ ...form, password: e.target.value })}
  iconRight={
    <button type="button" onClick={() => setShow(s => !s)} className="text-text-tertiary hover:text-text-primary transition-colors duration-fast">
      {show ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
    </button>
  }
/>
```

#### 2.3.5 · Indicador de Força de Senha

Aparece logo abaixo do campo de senha quando `form.password.length > 0`. Quatro barrinhas horizontais, preenchidas progressivamente conforme a senha melhora.

**Lógica de força:**
- `0` → nenhuma barra acesa → força "Fraca"
- `1` → 1 barra acesa (vermelha `--state-danger`) → "Fraca"
- `2` → 2 barras (laranja `--state-warning`) → "Razoável"
- `3` → 3 barras (verde `--state-success`) → "Boa"
- `4` → 4 barras (accent `--accent`) → "Forte"

**Critérios de força (um ponto por critério):**
1. Comprimento ≥ 8 caracteres
2. Contém letras maiúsculas e minúsculas
3. Contém número
4. Contém símbolo (`!@#$%^&*`)

**Markup:**
```tsx
{form.password.length > 0 && (
  <div className="flex flex-col gap-1.5">
    <div className="flex gap-1">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={cn(
            "h-1 flex-1 rounded-pill transition-colors duration-base",
            i < strength
              ? strength === 1 ? "bg-state-danger"
              : strength === 2 ? "bg-state-warning"
              : strength === 3 ? "bg-state-success"
              : "bg-accent"
              : "bg-bg-surface-3"
          )}
        />
      ))}
    </div>
    <span className="text-caption text-text-tertiary">
      {["", "Fraca", "Razoável", "Boa", "Forte"][strength]}
    </span>
  </div>
)}
```

#### 2.3.6 · reCAPTCHA

Mantém lógica atual (v2 checkbox, `theme: "dark"`, render via ref). Apenas o posicionamento muda — renderizado dentro do form, entre a senha e o botão:

```tsx
{recaptchaEnabled && recaptchaSiteKey && (
  <div ref={recaptchaContainerRef} className="flex justify-start" />
)}
```

#### 2.3.7 · Botão de submissão

```tsx
<Button
  type="submit"
  variant="primary"
  size="lg"
  loading={loading}
  className="w-full"
>
  Criar conta gratuita
</Button>
```

#### 2.3.8 · Link de login

```tsx
<p className="text-caption text-text-secondary text-center">
  Já tem conta?{" "}
  <a href="/login" className="text-accent hover:text-accent-hover transition-colors duration-fast">
    Entrar
  </a>
</p>
```

---

### 2.4 · Lado Direito — Painel de Marca

**Container:** `hidden lg:flex w-[60%] bg-bg-surface items-center justify-center px-16`

**Conteúdo:** Estático (sem rotação — diferencia do Login que tem rotação).

```
┌─────────────────────────────────────────────┐
│                                             │
│                                             │
│   Seu primeiro carrossel                    │  ← text-primary, monospace, 56px, tracking -0.04em
│   em 30 segundos.                           │  ← text-accent, monospace, 56px
│                                             │
│   ─────────────────────────────────         │  ← divisor border-border-subtle
│                                             │
│   10k+ criadores  ·  50k+ carrosséis        │  ← text-caption text-text-tertiary font-mono
│   ·  1M+ imagens IA                         │
│                                             │
└─────────────────────────────────────────────┘
```

**Markup:**
```tsx
<div className="hidden lg:flex w-[60%] bg-bg-surface items-center justify-center px-16">
  <div className="flex flex-col gap-8 max-w-[480px]">
    <div className="font-mono leading-tight" style={{ fontSize: 56, letterSpacing: "-0.04em" }}>
      <div className="text-text-primary">Seu primeiro carrossel</div>
      <div className="text-accent">em 30 segundos.</div>
    </div>
    <div className="h-px bg-border-subtle" />
    <div className="font-mono text-caption text-text-tertiary flex flex-wrap gap-x-4 gap-y-1">
      <span>10k+ criadores</span>
      <span className="text-border-strong">·</span>
      <span>50k+ carrosséis</span>
      <span className="text-border-strong">·</span>
      <span>1M+ imagens IA</span>
    </div>
  </div>
</div>
```

---

### 2.5 · Estados e Validação

| Estado | Comportamento |
|---|---|
| Loading | Botão mostra spinner + "Criando conta..." desabilitado |
| Erro de API | Bloco de erro `state-danger` acima do form, reCAPTCHA resetado |
| Email já existe | Mensagem específica vinda da API |
| reCAPTCHA não preenchido | Erro local "Complete a verificação reCAPTCHA." antes do fetch |
| Sucesso | `router.push("/dashboard")` imediato |

---

## §3 · Editor de Carrosséis `/dashboard/editor/[id]`

### 3.1 · Visão Geral

O Editor é a tela central do produto — onde o usuário vê, edita e exporta carrosséis. O design anterior era uma mistura visual sem coerência com o sistema de tokens. O redesign aplica o sistema preto-editorial + verde-limão a **todos os elementos de chrome** (topbar, filmstrip, inspector, popups) sem tocar na lógica do canvas, do drag-and-drop ou do SlidePreview.

**Rota:** `src/app/dashboard/editor/[id]/page.tsx`  
**Canvas:** `src/components/Editor.tsx` — lógica preservada  
**Escopo do redesign:** Shell + Topbar + Filmstrip + Inspector visual  
**Fora do escopo:** Lógica de canvas, drag/resize, SlidePreview renderer, EditorPanels lógica interna

---

### 3.2 · Shell — 4 Zonas Fixas

O layout usa CSS Grid no nível da página. Zero scroll no shell — cada zona faz seu próprio scroll internamente.

```
┌──────────────────────────────────────────────────────────────────────┐
│  TOPBAR                                                     56px     │
├────────────┬─────────────────────────────────────┬───────────────────┤
│            │                                     │                   │
│ FILMSTRIP  │           CANVAS AREA               │    INSPECTOR      │
│  180px     │       (flex-1, bg-bg-base)          │    280px          │
│  overflow  │    canvas centralizado + sombra     │    overflow-y     │
│  -y-auto   │    escala dinâmica 4:5              │    -auto          │
│            │                                     │                   │
└────────────┴─────────────────────────────────────┴───────────────────┘
```

**Grid CSS:**
```css
.editor-shell {
  display: grid;
  grid-template-rows: 56px 1fr;
  grid-template-columns: 180px 1fr 280px;
  grid-template-areas:
    "topbar topbar topbar"
    "filmstrip canvas inspector";
  height: 100vh;
  overflow: hidden;
  background: var(--bg-base);
}
```

**Tailwind equivalente:**
```tsx
<div className="grid h-screen overflow-hidden bg-bg-base"
     style={{ gridTemplateRows: "56px 1fr", gridTemplateColumns: "180px 1fr 280px" }}>
```

---

### 3.3 · Topbar

**Altura:** 56px  
**Background:** `bg-bg-surface`  
**Borda inferior:** `border-b border-border-subtle`  
**Grid area:** `topbar` (span 3 colunas)

**Layout interno:** `flex items-center gap-3 px-4`

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ←  [Título editável]  [rascunho]     │ Slide 3/8 │  ↺ ↻  │  ⚡ Gerar  Salvar  ⋯ │
│ 32px  flex-1 max-w-[280px]    badge  │ caption   │ 2 btns│  secondary primary  │
└──────────────────────────────────────────────────────────────────────────────┘
```

#### 3.3.1 · Botão Voltar
```tsx
<Button variant="ghost" size="sm" onClick={onBack} iconLeft={<ArrowLeft size={16} strokeWidth={1.5} />}>
  Voltar
</Button>
```
`text-text-secondary`. Hover → `text-text-primary`.

#### 3.3.2 · Divisor vertical
```tsx
<div className="h-5 w-px bg-border-subtle" />
```

#### 3.3.3 · Título Editável (inline)
O título do carrossel é editável diretamente na topbar via `contentEditable` ou input controlado.

- **Repouso:** `text-body-strong text-text-primary`, sem borda visível, cursor `text`
- **Foco:** borda inferior `border-b border-accent`, outline removido
- **Overflow:** `max-w-[280px] truncate`
- **Blur:** salva o novo título no draft

```tsx
<input
  className="bg-transparent text-body-strong text-text-primary border-b border-transparent focus:border-accent outline-none max-w-[280px] truncate transition-colors duration-fast"
  value={draft.title}
  onChange={(e) => updateTitle(e.target.value)}
  onBlur={persistTitle}
/>
```

#### 3.3.4 · Badge de status

Imediatamente à direita do título:

```tsx
<Badge status={saving ? "gerando" : saved ? "pronto" : "rascunho"} />
```

Usa o componente `Badge` de `@/components/ui/Badge`. Status mapeado:
- `"rascunho"` → ponto cinza `text-text-tertiary` — "Rascunho"
- `"pronto"` → ponto verde `text-state-success` — "Salvo"
- `"gerando"` → ponto pulsando accent — "Salvando…"

#### 3.3.5 · Espaçador flex
```tsx
<div className="flex-1" />
```

#### 3.3.6 · Contador de slides
```tsx
<span className="text-caption text-text-tertiary tnum">
  Slide {selectedSlide + 1} de {draft.slides.length}
</span>
```

#### 3.3.7 · Divisor
```tsx
<div className="h-5 w-px bg-border-subtle" />
```

#### 3.3.8 · Undo / Redo
```tsx
<Button variant="ghost" size="sm" disabled={history.length === 0} onClick={undo} title="Desfazer (⌘Z)">
  <Undo2 size={16} strokeWidth={1.5} />
</Button>
<Button variant="ghost" size="sm" disabled={!canRedo} onClick={redo} title="Refazer (⌘⇧Z)">
  <Redo2 size={16} strokeWidth={1.5} />
</Button>
```

#### 3.3.9 · Divisor
```tsx
<div className="h-5 w-px bg-border-subtle" />
```

#### 3.3.10 · Botão Gerar Imagens

Ativa geração em lote de todas as imagens pendentes:
```tsx
<Button variant="secondary" size="sm" onClick={generateAll} loading={isGenerating} iconLeft={<Sparkles size={14} strokeWidth={1.5} />}>
  Gerar imagens
</Button>
```
Visível apenas se `pendingImages.length > 0`. Quando não há imagens pendentes: oculto.

#### 3.3.11 · Botão Salvar

```tsx
<Button variant="primary" size="sm" onClick={handleSave} loading={saving}>
  Salvar
</Button>
```

#### 3.3.12 · Menu de opções (⋯)

Dropdown com ações secundárias:
```tsx
<Button variant="ghost" size="sm" title="Mais opções">
  <MoreHorizontal size={16} strokeWidth={1.5} />
</Button>
```

Opções no dropdown (Card/popover sobre bg-bg-surface-3, shadow-pop):
- "Exportar como imagens" → aciona exportação em lote
- "Duplicar carrossel" → POST para API
- "Excluir carrossel" → confirm dialog, variant danger

---

### 3.4 · Filmstrip — Thumbnails de Slides

**Largura:** 180px  
**Background:** `bg-bg-surface`  
**Borda direita:** `border-r border-border-subtle`  
**Grid area:** `filmstrip`  
**Scroll:** `overflow-y-auto` interno

#### 3.4.1 · Header da Filmstrip

```tsx
<div className="flex items-center justify-between px-3 py-2.5 border-b border-border-subtle sticky top-0 bg-bg-surface z-10">
  <span className="text-micro text-text-tertiary">SLIDES</span>
  <span className="text-caption text-text-tertiary tnum">{draft.slides.length}</span>
</div>
```

#### 3.4.2 · Lista de Thumbnails

**Container:** `flex flex-col gap-2 p-2`

**Cada thumbnail:**
```tsx
<button
  key={i}
  onClick={() => { setSelectedSlide(i); setSelectedEl(null); }}
  className={cn(
    "relative w-full rounded-md overflow-hidden border transition-colors duration-fast cursor-pointer group",
    selectedSlide === i
      ? "border-2 border-accent"
      : "border border-border-subtle hover:border-border-default"
  )}
  style={{ aspectRatio: "1080/1350" }}
>
  {/* Slide preview em miniatura */}
  <div className="w-full h-full pointer-events-none" style={{ transform: `scale(${THUMB_SCALE})`, transformOrigin: "top left" }}>
    <SlidePreview slide={draft.slides[i]} carousel={draft} />
  </div>

  {/* Número do slide — bottom right */}
  <div className="absolute bottom-1 right-1 px-1 py-0.5 rounded-xs bg-bg-overlay text-micro text-text-secondary tnum">
    {i + 1}
  </div>

  {/* Indicador de geração em progresso */}
  {generatingSlide === i && (
    <div className="absolute inset-0 bg-bg-overlay flex items-center justify-center">
      <div className="flex flex-col items-center gap-1">
        <Sparkles size={16} className="text-accent animate-pulse" />
        <span className="text-micro text-accent tnum">{generatingProgress}%</span>
      </div>
    </div>
  )}

  {/* Menu de contexto no hover — top right */}
  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-fast">
    <button
      onClick={(e) => { e.stopPropagation(); openSlideMenu(i); }}
      className="h-5 w-5 rounded-xs bg-bg-overlay flex items-center justify-center text-text-secondary hover:text-text-primary"
    >
      <MoreHorizontal size={12} strokeWidth={1.5} />
    </button>
  </div>
</button>
```

**Proporção:** `aspectRatio: "1080/1350"` = formato portrait 4:5 (carrossel Instagram)

**Escala do thumbnail:** `THUMB_SCALE = 156 / 1080` ≈ 0.144 (thumbnail 156px wide dentro de 180px - padding 2×12px)

#### 3.4.3 · Botão Adicionar Slide

No final da lista:
```tsx
<button
  onClick={() => setShowAddSlide(true)}
  className="w-full flex items-center justify-center gap-2 py-3 rounded-md border border-dashed border-border-default text-caption text-text-tertiary hover:border-accent hover:text-accent transition-colors duration-fast"
>
  <Plus size={14} strokeWidth={1.5} />
  Adicionar slide
</button>
```

#### 3.4.4 · Slide Context Menu

Popover pequeno (bg-bg-surface-3, border-border-subtle, rounded-md, shadow-pop) com:
- "Duplicar slide" → clona o slide no índice seguinte
- "Mover para cima" → disabled se primeiro
- "Mover para baixo" → disabled se último
- Divisor
- "Excluir slide" → texto `text-state-danger`, disabled se único slide

---

### 3.5 · Canvas Area

**Background:** `bg-bg-base` (#0A0A0B) — preto editorial como fundo da área de trabalho  
**Grid area:** `canvas`  
**Scroll:** `overflow-auto` para zoom

**Layout interno:**
```tsx
<div className="flex items-center justify-center w-full h-full overflow-auto">
  <div
    className="relative rounded-sm"
    style={{
      width: CANVAS_W * zoom,
      height: CANVAS_H * zoom,
      boxShadow: "0 8px 40px -8px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.06)",
      transform: "translateZ(0)", // GPU layer
    }}
  >
    {/* Canvas real — Editor.tsx mantém sua lógica */}
  </div>
</div>
```

**Sombra do canvas:** `0 8px 40px -8px rgba(0,0,0,0.8)` — não usa `--shadow-pop` (exceção permitida para canvas)

#### 3.5.1 · Toolbar de Zoom (flutuante)

Posicionada bottom-center da canvas area, flutuante sobre ela:

```tsx
<div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-bg-surface border border-border-subtle rounded-pill px-2 py-1 shadow-pop">
  <Button variant="ghost" size="sm" onClick={() => setZoom(z => Math.max(0.2, z - 0.1))}>
    <Minus size={14} strokeWidth={1.5} />
  </Button>
  <button
    onClick={() => setZoom(fitZoom)}
    className="text-caption text-text-secondary hover:text-text-primary px-2 tnum transition-colors duration-fast"
    title="Ajustar à tela"
  >
    {Math.round(zoom * 100)}%
  </button>
  <Button variant="ghost" size="sm" onClick={() => setZoom(z => Math.min(2, z + 0.1))}>
    <Plus size={14} strokeWidth={1.5} />
  </Button>
  <div className="h-3 w-px bg-border-subtle mx-1" />
  <Button variant="ghost" size="sm" onClick={fitToScreen} title="Ajustar à tela (⌘0)">
    <Maximize2 size={14} strokeWidth={1.5} />
  </Button>
</div>
```

**Zoom inicial:** calculado para caber 90% da altura disponível — `fitZoom = (viewportH - 56 - 32) / CANVAS_H`

#### 3.5.2 · Botão AI Chat (flutuante)

Bottom-right da canvas area. Aciona o painel de AI:

```tsx
<button
  onClick={() => setChatOpen(o => !o)}
  className={cn(
    "absolute bottom-4 right-4 h-10 w-10 rounded-pill flex items-center justify-center transition-all duration-base",
    chatOpen
      ? "bg-accent text-text-inverse"
      : "bg-bg-surface border border-border-subtle text-text-secondary hover:text-text-primary hover:border-border-default"
  )}
  title="Agente de edição (⌘J)"
>
  <Sparkles size={18} strokeWidth={1.5} />
</button>
```

---

### 3.6 · Inspector — Painel de Propriedades

**Largura:** 280px  
**Background:** `bg-bg-surface`  
**Borda esquerda:** `border-l border-border-subtle`  
**Grid area:** `inspector`  
**Scroll:** `overflow-y-auto`

O Inspector é **inteiramente contextual** — o conteúdo muda conforme o elemento selecionado no canvas. A estrutura interna usa seções dobráveis.

---

#### 3.6.1 · Estado Vazio (nenhum elemento selecionado)

```tsx
<div className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center">
  <div className="h-12 w-12 rounded-lg bg-bg-surface-2 border border-border-subtle flex items-center justify-center text-text-tertiary">
    <MousePointer2 size={20} strokeWidth={1.5} />
  </div>
  <div>
    <p className="text-body-strong text-text-primary">Selecione um elemento</p>
    <p className="text-caption text-text-tertiary mt-0.5">Clique em texto, imagem ou forma para editar suas propriedades</p>
  </div>
</div>
```

---

#### 3.6.2 · Estado: Fundo do Slide Selecionado

Ativado quando o usuário clica no fundo do canvas (área sem elemento). Inspector mostra propriedades do slide atual.

**Header do inspector:**
```tsx
<InspectorHeader icon={<Layers size={14} />} label="Fundo do slide" />
```

**Seções:**

**Seção — Cor de fundo:**
```tsx
<InspectorSection label="Cor de fundo">
  <ColorSwatch value={slide.bgColor ?? "#000000"} onChange={setBgColor} />
</InspectorSection>
```

**Seção — Imagem de fundo:**
```tsx
<InspectorSection label="Imagem de fundo">
  {slide.bgImageUrl ? (
    <div className="relative rounded-md overflow-hidden border border-border-subtle h-32 w-full">
      <img src={slide.bgImageUrl} className="w-full h-full object-cover" alt="" />
      <div className="absolute inset-0 flex items-center justify-center gap-2 bg-bg-overlay opacity-0 hover:opacity-100 transition-opacity duration-fast">
        <Button variant="secondary" size="sm" onClick={regenerateBg}>
          <RefreshCw size={14} strokeWidth={1.5} />
        </Button>
        <Button variant="danger" size="sm" onClick={removeBg}>
          <Trash2 size={14} strokeWidth={1.5} />
        </Button>
      </div>
    </div>
  ) : (
    <Button variant="secondary" size="sm" className="w-full" onClick={generateBg} iconLeft={<Sparkles size={14} />}>
      Gerar com IA
    </Button>
  )}
</InspectorSection>
```

---

#### 3.6.3 · Estado: Elemento de Texto Selecionado

**Header:**
```tsx
<InspectorHeader icon={<Type size={14} />} label="Texto" />
```

**Seção — Conteúdo:**
```tsx
<InspectorSection label="Conteúdo">
  <textarea
    className="w-full bg-bg-surface-2 border border-border-default rounded-sm px-3 py-2 text-body text-text-primary resize-y outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors duration-fast"
    rows={3}
    value={el.text}
    onChange={(e) => updateElement({ text: e.target.value })}
  />
</InspectorSection>
```

**Seção — Tipografia:**

Row 1: Font size + Weight
```tsx
<InspectorSection label="Tipografia">
  <div className="flex gap-2">
    <NumberInput label="Tamanho" value={el.fontSize} min={8} max={300} onChange={v => updateElement({ fontSize: v })} />
    <NumberInput label="Altura de linha" value={el.lineHeight} min={0.8} max={3} step={0.1} onChange={v => updateElement({ lineHeight: v })} />
  </div>
  <ChipRow
    options={[
      { label: "Regular", value: 400 },
      { label: "Medium",  value: 500 },
      { label: "Bold",    value: 700 },
      { label: "Black",   value: 900 },
    ]}
    value={el.fontWeight ?? 400}
    onChange={v => updateElement({ fontWeight: v })}
  />
</InspectorSection>
```

Row 2: Alinhamento
```tsx
<InspectorSection label="Alinhamento">
  <div className="flex gap-1">
    {["left", "center", "right"].map(a => (
      <Button key={a} variant={el.align === a ? "primary" : "ghost"} size="sm"
        onClick={() => updateElement({ align: a })}>
        {a === "left" ? <AlignLeft size={14} /> : a === "center" ? <AlignCenter size={14} /> : <AlignRight size={14} />}
      </Button>
    ))}
  </div>
</InspectorSection>
```

**Seção — Cor:**
```tsx
<InspectorSection label="Cor do texto">
  <ColorSwatch value={el.color ?? "#F5F5F7"} onChange={v => updateElement({ color: v })} />
</InspectorSection>
```

**Seção — Transformação:**
```tsx
<InspectorSection label="Posição e tamanho">
  <div className="grid grid-cols-2 gap-2">
    <NumberInput label="X" value={el.x} onChange={v => updateElement({ x: v })} />
    <NumberInput label="Y" value={el.y} onChange={v => updateElement({ y: v })} />
    <NumberInput label="Largura" value={el.width} onChange={v => updateElement({ width: v })} />
    <NumberInput label="Altura" value={el.height} onChange={v => updateElement({ height: v })} />
    <NumberInput label="Rotação" value={el.rotation ?? 0} min={-180} max={180} onChange={v => updateElement({ rotation: v })} />
    <NumberInput label="Opacidade" value={(el.opacity ?? 1) * 100} min={0} max={100} onChange={v => updateElement({ opacity: v / 100 })} />
  </div>
</InspectorSection>
```

---

#### 3.6.4 · Estado: Elemento de Imagem Selecionado

**Header:**
```tsx
<InspectorHeader icon={<ImageIcon size={14} />} label="Imagem" />
```

**Seção — Preview:**
```tsx
<InspectorSection label="Imagem">
  {el.imageUrl ? (
    <div className="relative rounded-md overflow-hidden border border-border-subtle h-40 w-full group">
      <img src={el.imageUrl} className="w-full h-full object-cover" alt="" />
      <div className="absolute inset-0 flex items-center justify-center gap-2 bg-bg-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-fast">
        <Button variant="secondary" size="sm" onClick={() => setRegenTarget({ slideIndex: selectedSlide, elementId: el.id })}>
          <Sparkles size={14} /> Regerar
        </Button>
      </div>
    </div>
  ) : (
    <div className="h-40 w-full rounded-md border border-dashed border-border-default flex flex-col items-center justify-center gap-2 text-text-tertiary">
      <ImageIcon size={24} strokeWidth={1.5} />
      <span className="text-caption">Nenhuma imagem</span>
    </div>
  )}
  <Button variant="secondary" size="sm" className="w-full" onClick={() => setRegenTarget({ slideIndex: selectedSlide, elementId: el.id })} iconLeft={<Sparkles size={14} />}>
    {el.imageUrl ? "Regerar com IA" : "Gerar com IA"}
  </Button>
</InspectorSection>
```

**Seção — Aparência:**
```tsx
<InspectorSection label="Aparência">
  <NumberInput label="Opacidade" value={(el.opacity ?? 1) * 100} min={0} max={100} onChange={v => updateElement({ opacity: v / 100 })} />
  <NumberInput label="Borda arredondada" value={el.borderRadius ?? 0} min={0} max={100} onChange={v => updateElement({ borderRadius: v })} />
</InspectorSection>
```

**Seção — Transformação:** igual a §3.6.3.

---

#### 3.6.5 · Estado: Forma (Shape) Selecionada

**Header:**
```tsx
<InspectorHeader icon={<Square size={14} />} label="Forma" />
```

**Seção — Aparência:**
```tsx
<InspectorSection label="Preenchimento">
  <ColorSwatch value={el.fill ?? "#C6F84E"} onChange={v => updateElement({ fill: v })} />
  <NumberInput label="Opacidade" value={(el.opacity ?? 1) * 100} min={0} max={100} onChange={v => updateElement({ opacity: v / 100 })} />
</InspectorSection>

<InspectorSection label="Borda">
  <div className="flex gap-2">
    <ColorSwatch value={el.borderColor ?? "transparent"} onChange={v => updateElement({ borderColor: v })} />
    <NumberInput label="Espessura" value={el.borderWidth ?? 0} min={0} max={20} onChange={v => updateElement({ borderWidth: v })} />
  </div>
  <NumberInput label="Arredondamento" value={el.borderRadius ?? 0} min={0} max={200} onChange={v => updateElement({ borderRadius: v })} />
</InspectorSection>
```

**Seção — Transformação:** igual a §3.6.3.

---

#### 3.6.6 · Componentes Internos do Inspector

**InspectorHeader:**
```tsx
function InspectorHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 border-b border-border-subtle">
      <span className="text-text-tertiary">{icon}</span>
      <span className="text-body-strong text-text-primary">{label}</span>
    </div>
  );
}
```

**InspectorSection:**
```tsx
function InspectorSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-4 py-3 border-b border-border-subtle flex flex-col gap-3">
      <span className="text-micro text-text-tertiary">{label.toUpperCase()}</span>
      {children}
    </div>
  );
}
```

**NumberInput:** Input numérico com label inline e min/max:
```tsx
function NumberInput({ label, value, min, max, step = 1, onChange }: NumberInputProps) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-micro text-text-tertiary">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={e => onChange(Number(e.target.value))}
        className="bg-bg-surface-2 border border-border-default rounded-xs px-2 py-1 text-caption text-text-primary tnum outline-none focus:border-accent transition-colors duration-fast w-full"
      />
    </label>
  );
}
```

**ColorSwatch:** Botão que abre um color picker nativo:
```tsx
function ColorSwatch({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <div
        className="h-7 w-7 rounded-xs border border-border-default"
        style={{ background: value }}
      />
      <span className="text-caption text-text-secondary font-mono">{value.toUpperCase()}</span>
      <input type="color" value={value} onChange={e => onChange(e.target.value)} className="sr-only" />
    </label>
  );
}
```

**ChipRow:** Seletor de opções em linha horizontal:
```tsx
function ChipRow<T>({ options, value, onChange }: ChipRowProps<T>) {
  return (
    <div className="flex gap-1 flex-wrap">
      {options.map(o => (
        <button
          key={String(o.value)}
          onClick={() => onChange(o.value)}
          className={cn(
            "px-2 py-1 rounded-xs text-caption transition-colors duration-fast border",
            value === o.value
              ? "bg-accent-muted border-accent text-accent"
              : "bg-bg-surface-2 border-border-subtle text-text-secondary hover:border-border-default"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
```

---

### 3.7 · Painel AI Chat (slideout)

Abre via botão flutuante (§3.5.2) ou `⌘J`. Painel lateral que desliza por cima do inspector a partir da direita.

**Largura:** 320px  
**Posição:** `position: fixed; right: 0; top: 56px; bottom: 0` — sobre o inspector  
**Background:** `bg-bg-surface`  
**Borda esquerda:** `border-l border-border-subtle`  
**Sombra:** `-4px 0 24px rgba(0,0,0,0.4)`  
**Animação entrada:** `translateX(100%) → translateX(0)` em 280ms `ease-out`

**Estrutura:**
```tsx
<aside className="fixed right-0 top-14 bottom-0 w-[320px] bg-bg-surface border-l border-border-subtle flex flex-col">
  {/* Header */}
  <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
    <div className="flex items-center gap-2">
      <Sparkles size={16} className="text-accent" strokeWidth={1.5} />
      <span className="text-body-strong text-text-primary">Agente de edição</span>
    </div>
    <Button variant="ghost" size="sm" onClick={() => setChatOpen(false)}>
      <X size={16} strokeWidth={1.5} />
    </Button>
  </div>

  {/* Mensagens */}
  <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
    {chatMsgs.map((m, i) => (
      <ChatBubble key={i} msg={m} />
    ))}
    <div ref={chatEndRef} />
  </div>

  {/* Input */}
  <div className="border-t border-border-subtle p-3">
    <div className="flex gap-2">
      <input
        className="flex-1 bg-bg-surface-2 border border-border-default rounded-sm px-3 py-2 text-body text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent transition-colors duration-fast"
        placeholder="Mude o título do slide 2…"
        value={chatInput}
        onChange={e => setChatInput(e.target.value)}
        onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendChat()}
      />
      <Button variant="primary" size="sm" onClick={sendChat} loading={chatLoading}>
        <Send size={14} strokeWidth={1.5} />
      </Button>
    </div>
    <p className="text-micro text-text-tertiary mt-1.5">Enter para enviar · Shift+Enter para nova linha</p>
  </div>
</aside>
```

**ChatBubble:**
- `role: "user"` → align-right, `bg-accent-muted`, `text-text-primary`, `rounded-lg rounded-tr-xs`
- `role: "assistant"` → align-left, `bg-bg-surface-2`, `text-text-secondary`, `rounded-lg rounded-tl-xs`

---

### 3.8 · Modal de Regeneração de Imagem

Usa componente `Modal` de `@/components/ui/Modal`. Abre quando `regenTarget !== null`.

**Título:** "Gerar imagem com IA"  
**Tamanho:** `md` (480px)

**Conteúdo:**
- Prompt atual do elemento (textarea editável, 4 linhas)
- Chips de estilo rápido: "Fotorrealista", "Ilustração", "Minimalista", "Editorial", "Abstrato"
- Botão primary "Gerar" + ghost "Cancelar"

---

### 3.9 · Atalhos de Teclado do Editor

| Atalho | Ação |
|---|---|
| `⌘S` | Salvar carousel |
| `⌘Z` | Desfazer |
| `⌘⇧Z` | Refazer |
| `⌘J` | Abrir/fechar AI Chat |
| `⌘0` | Ajustar canvas à tela |
| `Delete` / `Backspace` | Deletar elemento selecionado |
| `Escape` | Desselecionar elemento |
| `←` `→` | Trocar slide anterior/próximo |
| `⌘D` | Duplicar elemento selecionado |
| `⌘[` | Mover elemento para baixo na camada |
| `⌘]` | Mover elemento para cima na camada |
| `⌘⇧[` | Mover elemento para camada mais baixa |
| `⌘⇧]` | Mover elemento para camada mais alta |

---

### 3.10 · Estados Globais do Editor

| Estado | Indicador visual |
|---|---|
| Carregando carrossel | Skeleton nos 3 painéis, spinner no canvas |
| Gerando imagem (slide N) | Overlay semitransparente no thumbnail N, progress badge |
| Salvando | Badge "Salvando…" na topbar, botão Salvar em loading |
| Salvo | Badge "Salvo" → desaparece após 2s |
| Erro ao salvar | Toast `state-danger` "Erro ao salvar. Tente novamente." |
| Exportando | Modal de progresso com lista de slides processados |

---

## §4 · Consistência com DESIGN.md v1

### 4.1 · Convenções herdadas

Todas as convenções do DESIGN.md original se aplicam aqui:

1. **Sem hex literais** em componentes — apenas `var(--token)` via Tailwind
2. **Sem `text-xs`** — usar `.text-caption` (12px) ou `.text-micro` (11px)
3. **Sem `shadow-*` Tailwind** exceto `shadow-pop` (Modal, CommandPalette, popovers)
4. **Sem `bg-gradient-*`** exceto a máscara shimmer no Skeleton
5. **Um botão primary por viewport** — no Editor, é sempre o botão Salvar
6. **Motion respeitoso** — `prefers-reduced-motion: reduce` colapsa `--dur-*` para 1ms

### 4.2 · Novos componentes definidos neste documento

| Componente | Arquivo sugerido |
|---|---|
| `InspectorHeader` | `src/components/editor/InspectorHeader.tsx` |
| `InspectorSection` | `src/components/editor/InspectorSection.tsx` |
| `NumberInput` | `src/components/editor/NumberInput.tsx` |
| `ColorSwatch` | `src/components/editor/ColorSwatch.tsx` |
| `ChipRow` | `src/components/editor/ChipRow.tsx` |
| `ChatBubble` | `src/components/editor/ChatBubble.tsx` |

Estes componentes ficam em `src/components/editor/` — separados dos primitivos de `src/components/ui/` (que são globais).

---

## §5 · Acceptance Criteria

### 5.1 · Registro
1. Split layout renderiza idêntico ao Login (mesma proporção 40/60, mesmos tokens)
2. Indicador de força de senha aparece e atualiza em tempo real
3. reCAPTCHA renderiza com `theme: "dark"` quando habilitado
4. Erro da API exibe em bloco `state-danger`, não em alert nativo
5. Sucesso redireciona para `/dashboard` imediatamente
6. Painel direito com frase estática + 3 métricas visível em lg+

### 5.2 · Editor
1. Shell usa 4 zonas fixas — topbar 56px, filmstrip 180px, inspector 280px, canvas flex-1
2. Topbar: título editável in-line, badge de status, undo/redo, save
3. Filmstrip: thumbnails com proporção 4:5, slide ativo com borda accent, scroll vertical
4. Canvas: background `bg-bg-base`, canvas centralizado com sombra, toolbar de zoom flutuante
5. Inspector vazio: estado "Selecione um elemento" com ícone e instrução
6. Inspector texto: seções Conteúdo, Tipografia, Alinhamento, Cor, Transformação
7. Inspector imagem: preview com hover overlay, botão Gerar/Regerar com IA, Transformação
8. Inspector forma: Preenchimento, Borda, Transformação
9. AI Chat: painel slideout 320px, animação 280ms ease-out, bubbles diferenciadas por role
10. Todos os tokens usados — zero hex literals fora de ColorSwatch nativo
11. `prefers-reduced-motion` desativa todas as transições
12. Atalhos `⌘S`, `⌘Z`, `⌘J`, `Delete`, `Escape`, `←`/`→` funcionam

---

## §6 · Arquivos Modificados / Criados

### Novos arquivos
```
src/components/editor/InspectorHeader.tsx
src/components/editor/InspectorSection.tsx
src/components/editor/NumberInput.tsx
src/components/editor/ColorSwatch.tsx
src/components/editor/ChipRow.tsx
src/components/editor/ChatBubble.tsx
src/components/editor/index.ts              (barrel export)
```

### Modificados
```
src/app/(auth)/register/page.tsx            Rewrite completo — split layout
src/app/dashboard/editor/[id]/page.tsx      Shell rewrite — grid 4 zonas
src/components/Editor.tsx                   Apenas estilo do chrome — lógica intacta
src/components/EditorPanels.tsx             Refactor visual para tokens — lógica intacta
```

### Fora de escopo (não tocar)
```
src/components/SlidePreview.tsx             Renderer do canvas — lógica preservada
src/models/Carousel.ts                      Schema MongoDB — sem mudança
src/app/api/**                              Sem mudança
```
