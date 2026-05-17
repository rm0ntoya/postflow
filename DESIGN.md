# DESIGN.md — NovaCraft Dashboard Redesign

**Data:** 2026-05-12
**Versão:** 1.0
**Status:** Spec aprovada — pronta pra plano de implementação
**Escopo:** Identidade visual nova + redesign de 9 telas (Dashboard home, Sidebar, Modal de criar, Modo Notícia, Settings, Context, Calendar, Login, Upgrade). Editor fora (já redesenhado).

---

## 1. Filosofia & Princípios

NovaCraft é um **painel profissional de criação de carrosséis**, não um SaaS genérico. A nova identidade rejeita três clichês:

1. **Roxo/violeta padrão IA** — substituído por verde-limão elétrico contido sobre preto editorial.
2. **Gradient bonito-pra-ninguém** — banido. Cor sólida ou nada.
3. **Glassmorphism / blur exagerado** — banido. Bordas 1px translúcidas resolvem hierarquia.

### Princípios duros (não negociáveis)

| # | Princípio | Consequência prática |
|---|-----------|----------------------|
| 1 | **Densidade com respiro intencional** | Listas e dashboards densos (Linear). Modais, onboarding e Modo Notícia respiram (Vercel). Híbrido decidido por contexto, nunca por preguiça. |
| 2 | **1 acento, sempre** | Verde-limão `#C6F84E` é único. Estados de erro/sucesso/aviso usam cinzas + ícone, não cor cromática. Acento aparece em ≤8% da área visível. |
| 3 | **Tipografia carrega hierarquia, não cor** | Tamanho + peso + tracking definem importância. Cor reforça, não substitui. |
| 4 | **Bordas 1px translúcidas, não shadows** | Profundidade vem de stacking translúcido (`rgba(255,255,255,0.06)`), não de drop-shadow gordas. |
| 5 | **Motion = utilitário, não enfeite** | Transições ≤180ms, easing custom. Animação só onde comunica estado (entrada de modal, hover de card, loading). |
| 6 | **Atalhos de teclado visíveis** | `⌘K` global, `?` cheat-sheet, `g d` (go dashboard), `g n` (go news), `c` (create), `/` (focus search). Atalho aparece em tooltips. |
| 7 | **Densidade tipográfica fixa** | Escala de 8 tamanhos. Nada fora dela. Nada de `font-size: 13.5px`. |
| 8 | **Fundo nunca puro `#000`** | Preto puro é frio e burro. Usamos `#0A0A0B` (preto editorial com micro-tinta azul). |

---

## 2. Identidade Visual

### 2.1 Paleta — Tokens semânticos

Toda cor tem nome semântico. **Nunca usar hex direto em componente.** Sempre via token CSS variable.

#### Background (preto editorial, 4 níveis)
```
--bg-base:        #0A0A0B   /* fundo da app, body */
--bg-surface:     #111113   /* cards, sidebar, modal background */
--bg-surface-2:   #16161A   /* hover de card, input, dropdown */
--bg-surface-3:   #1C1C21   /* nested (modal dentro de modal, popover) */
--bg-overlay:     rgba(10,10,11,0.72)  /* backdrop de modal */
```

#### Borda (translúcidas — empilham bem)
```
--border-subtle:    rgba(255,255,255,0.06)   /* divisores, cards */
--border-default:   rgba(255,255,255,0.10)   /* inputs, botões secundários */
--border-strong:    rgba(255,255,255,0.16)   /* hover de input, foco */
--border-accent:    #C6F84E                  /* foco de input + CTA primário border */
```

#### Texto (escala de 5 — não use mais)
```
--text-primary:     #F5F5F7   /* títulos, body principal */
--text-secondary:   #A1A1AA   /* descrições, labels */
--text-tertiary:    #6B6B72   /* placeholders, metadados */
--text-disabled:    #3F3F45   /* desabilitado */
--text-inverse:     #0A0A0B   /* texto sobre acento verde */
```

#### Acento (verde-limão — único)
```
--accent:           #C6F84E   /* primário — CTA, foco, indicadores ativos */
--accent-hover:     #B5E84A   /* hover de CTA */
--accent-pressed:   #9FD63D   /* active/pressed */
--accent-muted:     rgba(198,248,78,0.12)   /* background de chip ativo */
--accent-glow:      rgba(198,248,78,0.32)   /* ring de foco, glow sutil */
```

#### Estados (acromáticos — comunicação por ícone + label)
```
--state-success:    #7BD46C   /* só usado em ícones e barras de progresso de sucesso */
--state-warning:    #E8C547
--state-danger:     #E8625A
--state-info:       --text-secondary   /* info usa cinza, não azul */
```

**Regra:** estados acromáticos preservam a disciplina de 1 acento. Verde-sucesso é diferente do verde-acento (tom distinto), só aparece em ícones pequenos.

### 2.2 Tipografia — Inter, escala fechada

**Família única:** Inter (variable). Pesos: 400, 500, 600, 700.
**Numerais:** sempre tabulares (`font-variant-numeric: tabular-nums`) em listas, métricas, datas.

#### Escala (8 tamanhos — fixa)

| Token | Size | Line | Weight | Tracking | Uso |
|-------|------|------|--------|----------|-----|
| `display` | 40px | 44px | 600 | -0.02em | Título de manchete (Modo Notícia preview, hero do upgrade) |
| `h1` | 28px | 34px | 600 | -0.015em | Título de página ("Meus Carrosséis") |
| `h2` | 20px | 26px | 600 | -0.01em | Título de seção, modal |
| `h3` | 16px | 22px | 600 | -0.005em | Título de card, subseção |
| `body` | 14px | 20px | 400 | 0 | Texto padrão da UI, descrições |
| `body-strong` | 14px | 20px | 500 | 0 | Ênfase em body (nomes, labels) |
| `caption` | 12px | 16px | 500 | 0.01em | Metadados, timestamps, contadores |
| `micro` | 11px | 14px | 600 | 0.06em uppercase | Labels de seção da sidebar, chips, badges |

**Ban:** font-size em px fora dessa escala. Ban: `text-xs` (10px) — vira ilegível.

### 2.3 Espaçamento — escala 4px

```
--space-0:  0
--space-1:  4px
--space-2:  8px
--space-3:  12px
--space-4:  16px
--space-5:  20px
--space-6:  24px
--space-8:  32px
--space-10: 40px
--space-12: 48px
--space-16: 64px
--space-20: 80px
--space-24: 96px
```

**Regra densidade híbrida:**
- Telas densas (Dashboard home, lista de carrosséis): padding interno `space-3` (12px), gap entre cards `space-3`.
- Telas respiradas (Modal de criar, Modo Notícia, Onboarding, Upgrade): padding interno `space-6` a `space-8`, gap `space-6`.

### 2.4 Raio de borda

```
--radius-xs:  4px    /* chips, badges */
--radius-sm:  6px    /* botões, inputs */
--radius-md:  8px    /* cards pequenos, dropdowns */
--radius-lg:  12px   /* cards grandes, modais */
--radius-xl:  16px   /* hero cards, painel notícia */
--radius-pill: 999px /* avatar, pills de status */
```

Sem `border-radius` fora dessa escala.

### 2.5 Sombras — proibidas (com 1 exceção)

Profundidade vem de **stacking translúcido + bordas**, não shadow. Única exceção: modal/popover flutuante usa shadow funcional para legibilidade:
```
--shadow-pop: 0 12px 32px -8px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04);
```

### 2.6 Motion

Todos os easings + durações tokenizados.

```
--ease-out:    cubic-bezier(0.22, 1, 0.36, 1)     /* padrão de entrada */
--ease-in:     cubic-bezier(0.4, 0, 0.84, 0)
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1)  /* uso raro: chip ativo */

--dur-fast:    120ms   /* hover, focus ring */
--dur-base:    180ms   /* abertura de dropdown, fade */
--dur-slow:    280ms   /* abertura de modal, slide de painel */
--dur-page:    420ms   /* transição entre rotas (apenas em onboarding) */
```

**Banidos:** bounces longos, parallax decorativo, autoplay de carrossel na home, loaders animados que giram pra sempre. Loader = barra de progresso ou skeleton, nunca spinner gordo.

### 2.7 Iconografia

- **Lucide React** (já em uso, manter).
- Tamanho fixo por contexto: 14px (inline body), 16px (botão), 18px (sidebar), 20px (header), 24px (estado vazio).
- Stroke width sempre `1.5`. Banido `stroke-width: 2` (vira pesado em dark).
- Ícones nunca recebem cor cromática direta. Recebem `currentColor` herdado.

### 2.8 Símbolo NovaCraft (novo)

#### Conceito
Três retângulos verticais empilhados em altura crescente (esq→dir), representando **slides do carrossel progredindo**. Acima do mais alto, um **ponto/pixel sólido em verde-acento** = a "Nova" (spark/estrela). Tudo dentro de um quadrado `24×24` ou escalável.

#### ASCII (proporção real)
```
              ●        <- spark (4×4px, --accent)
              █
        █     █
  █     █     █
  █     █     █
  █     █     █
```

Especificações:
- Quadrado de `24×24` no canônico.
- 3 barras verticais brancas (`--text-primary`):
  - Barra 1: largura 4px, altura 12px, posição x=2, y=10
  - Barra 2: largura 4px, altura 16px, posição x=10, y=6
  - Barra 3: largura 4px, altura 20px, posição x=18, y=2
- Spark: círculo 4px diâmetro, posição (centrado em x=20, y=-2 acima da barra 3), cor `--accent` `#C6F84E`.
- Gap entre barras: 4px.
- Versão `16×16`: 3 barras 2px de largura, spark 3px.
- Versão `48×48` (login, splash): mesma proporção, spark com leve glow `box-shadow: 0 0 8px var(--accent-glow)`.

#### Wordmark
- Família: Inter Display (ou Inter regular se Display indisponível).
- Peso: 700.
- Tracking: -0.04em.
- Texto: `NOVACRAFT` (uppercase) ou `NovaCraft` (mixed case).
- Versão lockup: símbolo + 8px gap + wordmark `NovaCraft` em 18px.

#### Uso
- Sidebar topo: símbolo `24×24` apenas (sidebar fina). Quando expandida, aparece lockup completo.
- Login/splash: lockup grande centralizado.
- Favicon: símbolo `16×16` versão simplificada (2 barras + spark).
- Nunca usar gradient, nunca rotacionar, nunca aplicar outline. Apenas full-color ou monocromático branco.

---

## 3. Sistema de Componentes

Todos os componentes têm spec fechada. **Não inventar variantes fora dessa lista.**

### 3.1 Botão

#### Variantes
| Variante | Background | Border | Texto | Quando usar |
|----------|-----------|--------|-------|-------------|
| `primary` | `--accent` | none | `--text-inverse` | CTA principal da tela. Máx 1 por viewport. |
| `secondary` | `--bg-surface-2` | `--border-default` | `--text-primary` | Ações secundárias |
| `ghost` | transparent | none | `--text-secondary` | Ações terciárias, links em toolbar |
| `danger` | `--bg-surface-2` | `rgba(232,98,90,0.4)` | `--state-danger` | Deletar, sair |

#### Tamanhos
- `sm`: altura 28px, padding 0 12px, font 13px, gap 6px
- `md` (default): altura 36px, padding 0 16px, font 14px, gap 8px
- `lg`: altura 44px, padding 0 20px, font 15px, gap 8px

#### Estados
- Hover: lighten background 4% (primary vai para `--accent-hover`).
- Focus: outline 2px `--accent-glow` offset 2px.
- Disabled: opacity 0.4, cursor not-allowed, sem hover.
- Loading: substitui ícone esquerdo por spinner 14px, label segue visível.

#### Regras
- Ícone à esquerda do label (default). Ícone-only só em toolbar densa (28px×28px square).
- Ban: 2 botões `primary` lado-a-lado.
- Ban: `text-transform: uppercase` em botão.

### 3.2 Input

```
height: 36px (md) | 44px (lg, modal e formulário longo)
padding: 0 12px
background: --bg-surface-2
border: 1px solid --border-default
border-radius: --radius-sm
font: 14px
color: --text-primary
placeholder: --text-tertiary

:focus
  border-color: --accent
  box-shadow: 0 0 0 3px --accent-glow
  background: --bg-surface
```

**Label:** sempre acima, `caption` (12px), `--text-secondary`, `margin-bottom: 6px`.
**Helper text:** abaixo, `caption`, `--text-tertiary`.
**Erro:** label + helper viram `--state-danger`, border `--state-danger`, ícone alert no canto direito do input.

### 3.3 Card

```
background: --bg-surface
border: 1px solid --border-subtle
border-radius: --radius-lg
padding: --space-4 (denso) ou --space-6 (respirado)

:hover
  border-color: --border-default
  background: --bg-surface-2
```

**Card de carrossel (na home):**
- Aspect ratio 4:5 (formato Instagram).
- Thumbnail do primeiro slide ocupa 100% topo, com overlay gradient de baixo `linear-gradient(0deg, rgba(0,0,0,0.7) 0%, transparent 40%)` apenas pra legibilidade do título.
- Título 2 linhas máx (clamp), `body-strong`.
- Footer do card: linha única com `caption` cinza: `há 2h · 8 slides · Pronto`.
- Hover: card sobe 2px (`transform: translateY(-2px)`), border vira `--accent` por 1px sutil.
- Menu de ações `⋯` aparece no canto sup. dir. apenas no hover.

### 3.4 Chip / Badge

- Chip: pill arredondada, `--bg-surface-2`, border `--border-default`, padding 4px 10px, font 12px.
- Chip ativo: background `--accent-muted`, border `--accent`, texto `--accent`.
- Badge de status: dot 6px + label.
  - `Rascunho`: dot `--text-tertiary`
  - `Pronto`: dot `--state-success`
  - `Gerando`: dot `--accent` + animação pulse 1.4s
  - `Publicado`: dot `--text-secondary`
  - `Erro`: dot `--state-danger`

### 3.5 Sidebar item

```
height: 36px
padding: 0 10px
border-radius: --radius-sm
gap: 10px (ícone + label)
icon: 18px, --text-secondary
label: body, --text-secondary

:hover
  background: --bg-surface-2
  color: --text-primary

[data-active=true]
  background: --accent-muted
  color: --accent
  /* barra acento à esquerda 2px de largura, full height */
  box-shadow: inset 2px 0 0 --accent
```

### 3.6 Modal

- Backdrop: `--bg-overlay` com blur de 8px `backdrop-filter: blur(8px)`.
- Modal: `--bg-surface`, border `--border-subtle`, radius `--radius-lg`, `--shadow-pop`.
- Tamanhos: `sm` 400px, `md` 560px, `lg` 720px, `xl` 920px.
- Header: padding 24px, título `h2`, `×` close 20px à direita.
- Footer: padding 16px 24px, border-top `--border-subtle`, ações alinhadas direita.
- Body: padding 24px, scroll se overflow.
- Entrada: fade backdrop 180ms + scale 0.96→1 do modal, easing `--ease-out`.

### 3.7 Toast

- Posição: bottom-center, 24px do fundo.
- Background: `--bg-surface-3`, border `--border-default`, radius `--radius-md`, padding 12px 16px.
- Ícone à esquerda 16px (success/warning/danger/info).
- Largura mín 280px, máx 480px.
- Auto-dismiss 3.5s. Hover pausa timer.
- Máx 3 toasts empilhados, mais antigos saem.

### 3.8 Command Palette (`⌘K`)

- Overlay full-screen, modal centralizado top (24% do topo).
- Largura 640px, altura adaptativa (máx 560px).
- Input topo 48px sem border, font 16px, placeholder "Buscar ou executar comando…".
- Lista de resultados com seções: `Comandos`, `Carrosséis recentes`, `Páginas`, `Modo Notícia`.
- Item ativo: background `--bg-surface-2`, atalho à direita em `caption` mono-tabular.
- Footer 32px com legendas: `↑↓` navegar · `↵` selecionar · `esc` fechar.

### 3.9 Skeleton

- Background: `--bg-surface-2`.
- Animação: shimmer linear-gradient sutil, ciclo 1.6s, easing linear.
- Sem cor cromática.
- Sempre tem proporção 1:1 com o conteúdo final (mesma largura/altura/raio).

---

## 4. Layouts por Tela

### 4.1 Sidebar Global

#### Estado padrão (collapsed)
- Largura: **56px**, sticky, full-height, background `--bg-surface`, border-right `--border-subtle`.
- Topo: símbolo NovaCraft 24×24 centrado, padding 16px.
- Itens (ícone-only, 40×40 hit-area, ícone 18px centrado):
  - Dashboard (home icon)
  - Modo Notícia (newspaper icon)
  - Calendário (calendar icon)
  - Contexto (book icon)
  - Configurações (settings icon, fica ao fundo)
- Botão "Criar" central destacado: 40×40 quadrado, background `--accent`, ícone `+` 18px `--text-inverse`. Sempre visível, posição abaixo do logo.
- Tooltip ao hover: aparece à direita, `caption`, background `--bg-surface-3`, com atalho (`g d`).

#### Estado expandido (hover OU pinned)
- Largura: **240px**, transição 180ms.
- Logo vira lockup completo.
- Itens ganham label e atalho.
- Seções agrupadas por `micro` label uppercase tracking 0.06em:
  - **CRIAR**
    - `+ Novo carrossel` (atalho `c`)
    - `📰 Modo Notícia` (atalho `g n`)
  - **BIBLIOTECA**
    - `Dashboard` (`g d`)
    - `Calendário` (`g c`)
    - `Contexto` (`g x`)
  - **CONTA** (rodapé)
    - Avatar + email truncado
    - `Configurações` (`g s`)
    - `Upgrade` (chip verde se em plano free)

**Pin/unpin:** botão pequeno no rodapé `→|` que fixa a sidebar expandida. Persistido em localStorage.

**Mobile (< 768px):** sidebar vira drawer offscreen, abre por botão hambúrguer no topbar.

### 4.2 Topbar Global

Altura: **48px**, sticky, background `--bg-base`, border-bottom `--border-subtle`.
Layout 3 colunas:
- **Esquerda:** breadcrumb (`Dashboard / Modo Notícia / Nova matéria`). Clicável. Cor `--text-secondary`, item ativo `--text-primary`.
- **Centro:** input ⌘K placeholder visual. 360px, height 32px, ícone search à esquerda, atalho `⌘K` à direita em chip pequeno. Click abre Command Palette.
- **Direita:**
  - Botão `+ Criar` (primary sm) — atalho `c`
  - Ícone notificações (bell 18px) — badge `--accent` se há novas
  - Avatar 28px circular, click abre menu (perfil, configurações, sair)

### 4.3 Dashboard Home (`/dashboard`) — DENSA

#### Estrutura vertical
```
┌─ Topbar (48px)
├─ Hero strip (96px) — saudação + métricas inline
├─ Toolbar (52px) — filtros + busca + view-toggle
└─ Grid de carrosséis (scroll)
```

#### Hero strip
- Padding 24px lateral, 20px vertical.
- Layout: 1 coluna texto à esq + 3 métricas à dir.
- Texto:
  - `h1` "Olá, Ruan." (nome dinâmico)
  - `body` `--text-secondary`: "Você tem **8 carrosséis** ativos e gerou **3** esta semana."
- Métricas (em linha, separadas por `border-left --border-subtle`):
  - "12 carrosséis" / "this month"
  - "47 slides" / "criados"
  - "8/100" / "imagens IA usadas" — barra de progresso 80px abaixo, fina 2px, `--accent`
- Ban: cards de métrica gigantes com ícones decorativos. Métricas são tipográficas.

#### Toolbar
- Esquerda: chips de filtro horizontais — `Todos · Rascunhos · Prontos · Publicados · Modo Notícia` (chip ativo com `--accent-muted`).
- Direita:
  - Input busca local (200px, ícone left).
  - Toggle view: `▦ Grid` / `≡ Lista` (segmented control 2 botões).
  - Sort dropdown: `Mais recentes ▾`.

#### Grid (default view)
- 4 colunas em ≥1280px, 3 em ≥1024px, 2 em ≥640px, 1 em mobile.
- Gap 16px.
- Cards de carrossel (spec 3.3).
- Cada card mostra:
  - Thumb do slide 1 (4:5)
  - Badge "Modo Notícia" no canto sup. esq. se aplicável (chip translúcido)
  - Título no overlay inferior + status badge à direita do título
  - Footer: `há 2h · 8 slides`
- **Card especial "Criar novo"** sempre primeiro: dashed border `--border-default`, ícone `+` 32px centro, label "Novo carrossel", hover deixa border `--accent`.

#### Estado vazio
- Centralizado, ícone 48px (símbolo NovaCraft em outline), `h2` "Nenhum carrossel ainda", `body` instrução, botão primary "Criar primeiro carrossel".

#### Empty filter
- Quando filtro retorna 0: mensagem inline "Nenhum carrossel com este filtro" + link "limpar filtros".

### 4.4 Modal Criar Carrossel — RESPIRADO

Tamanho: `lg` (720px). Wizard 3 passos com stepper visual.

#### Header
- Título: `h2` "Novo carrossel"
- Stepper logo abaixo: 3 dots horizontais com label inline `1. Tema → 2. Estilo → 3. Revisão`. Dot ativo `--accent`, completo `--text-secondary` com check, futuro `--text-tertiary`.

#### Passo 1 — Tema
- Input grande (44px, lg) com label "Sobre o que é o carrossel?"
- Helper: "Seja específico. Ex: '5 erros que fazem você perder seguidores no Instagram em 2026'."
- Abaixo, sugestões clicáveis em chips horizontais com scroll: `Marketing` `Vendas` `Saúde` `Tech` `Lifestyle` `Educação`.
- Toggle inline: "Usar contexto da minha marca" (Switch) — quando ON mostra preview do contexto truncado.

#### Passo 2 — Estilo
- 2 colunas:
  - **Esquerda:** select de tom (Profissional / Casual / Educativo / Provocativo / Storytelling). Cards verticais com ícone + título + descrição 1 linha. Seleção radio.
  - **Direita:** sliders e campos:
    - Quantidade de slides: slider 4–10
    - Cor de acento do carrossel: 8 swatches predefinidos + custom (color picker)
    - Toggle "Gerar imagens com IA" (cobra crédito)

#### Passo 3 — Revisão
- Resumo em formato spec-card:
  ```
  Tema
    "5 erros que fazem você perder seguidores"
  Estilo
    Educativo · 7 slides · Acento #C6F84E
  Imagens
    Gerar com IA (custa 7 imagens do plano)
  ```
- Botão `Voltar` (ghost) à esq, `Gerar agora` (primary lg) à dir.

#### Geração
Ao clicar Gerar, modal vira `GenOverlay` (já existe — repaginar):
- Background mantém modal, mas conteúdo vira animação de progresso.
- Barra de progresso 4px full-width topo (`--accent`).
- Lista de etapas (já tem em `GEN_STEPS`) com check verde aparecendo conforme progresso.
- Termina e redireciona para editor.

### 4.5 Modo Notícia (`/dashboard/news`) — RESPIRADO + EDITORIAL

**Esta é a tela mais autoral do redesign.** Identidade visual leva o conceito "jornal/redação" de forma sutil.

#### Layout macro
```
┌─ Topbar (48px)
├─ Hero editorial (140px) ── título display + tagline
├─ Workflow vertical (3 estágios em painéis sequenciais)
│    Estágio 1: URL input
│    Estágio 2: Preview da matéria (aparece após scrape)
│    Estágio 3: Configuração de geração (aparece após preview)
└─ Botão flutuante de ação ao final
```

#### Hero editorial
- Padding 48px lateral, 40px vertical.
- Layout 2 colunas:
  - **Esq (60%):**
    - Eyebrow `micro` uppercase: `MODO NOTÍCIA`
    - Título `display` (40px) **com serif fallback opcional**: "Transforme **qualquer matéria** em carrossel viral."
      - Palavra "qualquer matéria" recebe `--accent` underline 2px.
    - Subtítulo `body` `--text-secondary`: "Cole o link, escolha o tom. Em 30 segundos você tem 8 slides prontos pra postar."
  - **Dir (40%):** ilustração tipográfica monoespaçada — bloco ASCII ou texto sobreposto que simula uma "manchete sendo reescrita". Ex:
    ```
    [ ARTIGO ORIGINAL ]
    Lula sanciona lei que…
        ↓ ↓ ↓
    [ CARROSSEL NOVACRAFT ]
    GENTE!! Saiu agora a
    nova lei que muda TUDO
    ```
    Em fonte mono `caption`, `--text-tertiary` para o original, `--text-primary` para o resultado, com setas verde-acento.

#### Estágio 1 — URL
- Painel `--bg-surface`, padding 32px, radius `--radius-xl`.
- Eyebrow `micro` uppercase: `01 · LINK DA MATÉRIA`
- Input grande (height 56px, font 16px) full width, placeholder "https://g1.globo.com/…"
- Helper text discreto abaixo: "Funciona em sites de notícia como G1, UOL, Folha, BBC, CNN."
- Botão `Analisar matéria →` (primary lg) à direita do input ou abaixo full-width em mobile.
- Estado loading: input bloqueado, botão vira spinner + "Lendo matéria…" texto, cursor wait.
- Erros inline acima do input: ícone + texto `--state-danger`. Mensagens reais:
  - `URL inválida — confirme o link.`
  - `Não conseguimos ler essa matéria. Tente outro link.`
  - `Esse site bloqueia leitura automática.`

#### Estágio 2 — Preview da matéria
Aparece com slide-down 280ms após scrape success.

- Painel `--bg-surface`, padding 32px, radius `--radius-xl`, border-top destacada `--accent` 2px (separa visualmente do estágio anterior).
- Eyebrow: `02 · MATÉRIA ENCONTRADA`
- Conteúdo em **layout de cabeçalho de jornal**:
  - Linha 1: chip `--bg-surface-2` com favicon do source + nome do domínio. Ex: `🌐 g1.globo.com`. Ao lado: `caption` "publicado há 2h" se data extraída.
  - Linha 2: título da matéria em `h1`, `--text-primary`, max 3 linhas com clamp.
  - Linha 3: descrição/lead em `body` `--text-secondary`, max 2 linhas.
  - Linha 4: separador horizontal `--border-subtle` 1px.
  - Linha 5: galeria de imagens extraídas — grid horizontal com scroll-snap, 6 thumbs visíveis, cada uma 96×96, radius `--radius-md`. Toggle: `[ usar todas ] [ escolher ]`. Quando "escolher", clicks marcam/desmarcam thumbs (border `--accent` quando selecionada). Contador `3 de 8 selecionadas`.
- Botão `Re-analisar` (ghost) e `Continuar →` (primary) no rodapé do painel.

#### Estágio 3 — Configurar geração
Aparece após confirmação do preview.

- Painel `--bg-surface`, padding 32px, radius `--radius-xl`.
- Eyebrow: `03 · COMO QUER QUE FIQUE?`
- Layout 2 colunas:

**Esquerda — Tom:** 3 cards verticais grandes (selecionável radio).

```
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│  📰  NOTÍCIA        │  │  🗣️  FOFOCA         │  │  🔥  VIRAL          │
│                     │  │                     │  │                     │
│  Direto, factual,   │  │  Drama, reações,    │  │  Ganchos fortes,    │
│  sem floreio. Como  │  │  linguagem popular  │  │  curiosidade, prova │
│  CNN ou G1.         │  │  tipo @choquei.     │  │  social explícita.  │
│                     │  │                     │  │                     │
│  Exemplo:           │  │  Exemplo:           │  │  Exemplo:           │
│  "STF decide hoje   │  │  "GENTE não acredi- │  │  "O que ninguém te  │
│  a constituciona-   │  │  to no que o STF    │  │  contou sobre essa  │
│  lidade da lei X."  │  │  acabou de fazer!"  │  │  decisão do STF."   │
└─────────────────────┘  └─────────────────────┘  └─────────────────────┘
```

Cards: padding 20px, height 200px, ícone 24px topo, título `h3`, descrição `body` cinza, exemplo em `caption` mono dentro de bloco `--bg-surface-2` radius sm. Selecionado: border `--accent`, background `--accent-muted`, ícone vira `--accent`.

**Direita — Parâmetros:**
- Slider quantidade slides 4–10, default 7, label "7 slides".
- Color picker acento (8 swatches + custom). Default verde-acento da marca.
- Toggle "Gerar imagens faltantes com IA" — só ativo se imagens extraídas < slideCount. Mostra: "Faltam 3 imagens — gerar com IA usa 3 créditos."
- Toggle "Adicionar fonte da matéria no último slide" (default ON). Helper: "Aparece como crédito discreto: 'Fonte: g1.globo.com'."

#### CTA final
- Sticky bottom-right ao scrollar para fora do estágio 3.
- Botão primary lg `Gerar carrossel →` com micro-loader inline ao clicar.
- Em estado normal (não-sticky), botão alinhado à direita do painel 3.

#### Pós-geração
Mesma overlay do `CreateModal`, mas com etapas adaptadas:
- "Lendo a matéria…"
- "Reescrevendo no tom escolhido…"
- "Distribuindo nos slides…"
- "Aplicando design e imagens…"
- "Pronto. Abrindo editor…"

### 4.6 Settings (`/dashboard/settings`) — DENSA

#### Layout
- Sidebar interna 220px à esq com seções:
  - `Perfil`
  - `Conta`
  - `API & Integrações`
  - `Plano & Cobrança`
  - `Aparência`
  - `Atalhos`
- Conteúdo à direita, max-width 720px, padding 32px, gap 32px entre seções.

#### Padrão de form
- Cada item: linha com label + input/control à direita.
- Layout de 2 colunas: label (40%) + control (60%).
- Helper sempre abaixo do label.
- Salvamento: button "Salvar" sticky no rodapé direito quando há mudança não salva, com texto `body-strong` "Você tem alterações não salvas".

#### Aparência
- Toggle Tema (forçar dark — sem light mode no v1, deixar claro: "Modo claro em breve" disabled).
- Toggle "Densidade compacta" (afeta padding global).
- Toggle "Reduzir motion".

#### Atalhos
- Tabela `keymap` com colunas `Ação | Atalho | Editar`.
- Atalho mostrado em chip mono `--bg-surface-2` border `--border-default`.

### 4.7 Context (`/dashboard/context`) — DENSA

Página de contexto da marca (já existe, repaginar).

#### Layout
- 2 colunas: form (50%) + preview de como Gemini "verá" o contexto (50%).

**Esquerda:**
- Textareas grandes:
  - Sobre a marca (8 linhas)
  - Tom de voz (4 linhas)
  - Público-alvo (4 linhas)
  - O que evitar (3 linhas)
- Cada textarea com contador de caracteres bottom-right `--text-tertiary`.

**Direita:**
- Card `--bg-surface-2` que mostra o "system prompt" final que será injetado no Gemini, em fonte mono 12px, com syntax highlight discreto (chaves em `--accent`, valores em branco).
- Header do card: ícone code + "Como a IA verá:".
- Botão pequeno `Copiar` no canto sup. dir.

### 4.8 Calendar (`/dashboard/calendar`) — DENSA

#### Layout
- Header: mês atual `h2`, botões `‹` `›` para navegar, botão `Hoje` ghost, botão `+ Agendar` primary à direita.
- Toggle view: `Mês · Semana · Lista`.

#### View Mês (default)
- Grid 7×6, dias 32px alt mín (responsivo até 96px em telas grandes).
- Dia: número topo-esq, eventos como pills `--accent-muted` dentro do dia.
- Hover do dia: background `--bg-surface-2`.
- Dia atual: dot `--accent` 6px ao lado do número.
- Dia selecionado: border `--accent` 1px.

#### Sidebar lateral direita 320px
- Quando dia selecionado, mostra lista de carrosséis agendados pra esse dia.
- Cada item: thumb 48×48 + título + horário + status.

### 4.9 Login (`/login`) — RESPIRADO

#### Layout split 50/50

**Esquerda (40% min 480px):** form
- Padding 64px.
- Logo lockup completo no topo.
- `display` "Bem-vindo de volta."
- `body` `--text-secondary`: "Entre na sua conta NovaCraft."
- Form:
  - Input email (lg, 44px)
  - Input senha (lg, 44px) com botão "mostrar/ocultar"
  - Link "Esqueci a senha" alinhado à direita do input senha
  - Botão `Entrar` primary lg full-width
  - Divisor `ou`
  - Botão `Continuar com Google` secondary lg full-width (ícone Google esq)
- Footer: `caption` "Não tem conta? **Criar conta gratuita**" — link em `--accent`.

**Direita (60%):** painel visual
- Background `--bg-surface`, sem imagem fotográfica genérica.
- Composição autoral:
  - Em fonte mono massiva centralizada, animação sutil de palavras trocando (typing effect):
    ```
    Crie carrosséis
    em segundos.
    ```
  - Ou: 3 mockups de carrossel sobrepostos com stagger sutil em rotação 0°, leve parallax 2px no mouse.
- Ban: foto stock de pessoa sorrindo no laptop. Ban: gradient roxo-azul.

### 4.10 Upgrade (`/dashboard/upgrade`) — RESPIRADO

#### Layout
- Hero centralizado:
  - Eyebrow `PLANOS NOVACRAFT`
  - Título `display` "Pague pelo que usa. Cresça quando precisar."
  - Subtítulo `body` `--text-secondary`.
- Toggle mensal/anual (anual = -20%) com chip `-20%` ao lado.
- Grid 3 colunas com cards de plano: `Free / Pro / Studio`.

#### Card de plano
- Card padrão `--bg-surface`, padding 32px, radius `--radius-lg`.
- Card destacado (Pro): border `--accent`, badge "MAIS POPULAR" no topo (`--accent-muted` chip).
- Estrutura:
  - Nome do plano `h2`
  - Preço `display` (40px) + `/mês` em `body` `--text-secondary`
  - Descrição 1 linha
  - Divisor
  - Lista de features com check `--accent` 14px à esquerda
  - Botão `Assinar Pro` primary lg full-width (no plano atual: `Plano atual` disabled)

#### FAQ embaixo
- Acordeão simples, max-width 720px centralizado.
- Itens: pergunta `body-strong` + chevron à direita, expand mostra resposta `body` `--text-secondary`.

---

## 5. Acessibilidade

- Contraste mínimo: WCAG AA. Texto primary sobre `--bg-base` = 17:1 ✓. Texto secondary = 6.2:1 ✓. Acento sobre preto = 14:1 ✓.
- Foco sempre visível: ring `--accent-glow` 3px em todos elementos interativos.
- Alvos toque mín 36px (controles padrão), 44px em mobile.
- Reduced motion: respeitar `prefers-reduced-motion` — desativar todas transições > 120ms, slide-ins viram fade.
- Teclado: tab order linear, atalhos documentados, modal trap focus, esc fecha.
- Screen reader: `aria-label` em todo botão ícone-only, `aria-live` em toasts e em estágios do Modo Notícia.
- Cor não é único portador de informação: estados sempre acompanham ícone + label.

---

## 6. Tokens — arquivo único de verdade

Implementação futura: `src/styles/tokens.css` exporta todos os tokens como CSS variables (`:root`). Tailwind config consome via `theme.extend.colors/spacing/borderRadius/fontSize` referenciando as variables. Componentes só usam `var(--token)` ou classes Tailwind mapeadas.

**Migração da paleta atual:** roxo `#7C3AED` → remover. Verde antigo (se houver) → remover. Background `#0F0F12` ou similar → trocar por `#0A0A0B`. Inputs com background sólido escuro → mover para `--bg-surface-2`.

---

## 7. Itens fora de escopo

- Editor de carrossel (`/dashboard/editor/[id]`) — já redesenhado em commit recente.
- Light mode (postergado pra v2).
- Internacionalização do design system (PT-BR fixo agora).
- Animações decorativas tipo Lottie ou Three.js.
- Mascote/ilustração personagem.
- Custom font fora de Inter.
- Dashboard mobile-first (mobile suportado mas não otimizado neste v1).

---

## 8. Critérios de aceitação visual

A implementação está pronta quando:

1. Nenhuma cor hex aparece direto em componente — só tokens.
2. Nenhuma sombra além de `--shadow-pop` em modais.
3. Nenhum gradient em qualquer lugar.
4. Apenas verde-limão `#C6F84E` aparece como cor cromática (fora estados).
5. Toda tipografia respeita a escala de 8 tamanhos.
6. Sidebar collapsa/expande com 180ms easing correto.
7. ⌘K abre Command Palette de qualquer tela.
8. Modo Notícia tem hero editorial autoral, não card-genérico.
9. Cards de carrossel respeitam aspect 4:5 e overlay correto.
10. Símbolo NovaCraft novo aparece em sidebar, login, favicon.
11. Foco de teclado visível em 100% dos elementos interativos.
12. `prefers-reduced-motion` desativa animações.

---

## 9. Próximo passo

Esta spec é base pro **plano de implementação** (skill `writing-plans`). O plano vai quebrar em tarefas ordenadas:
1. Tokens CSS + Tailwind config
2. Componentes base (Button, Input, Card, Chip, Modal, Toast, Sidebar item)
3. Sidebar global + Topbar + Command Palette
4. Telas (ordem sugerida): Dashboard → Modo Notícia → Modal Criar → Settings → Context → Calendar → Login → Upgrade
5. Símbolo NovaCraft (SVG inline)
6. Favicon + meta tags
7. QA visual contra os 12 critérios

