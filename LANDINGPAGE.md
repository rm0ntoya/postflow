# LANDINGPAGE.md — NovaCraft Landing Page Technical Spec

**Data:** 2026-05-15
**Versão:** 1.0
**Status:** Spec Técnica Full
**Scope:** Redesign completo da interface pública, componentes interativos e engine de animação.

---

## 1. Fundamentos Visuais & Design System
A Landing Page compartilha os mesmos tokens do dashboard, mas com utilitários de exibição (marketing) expandidos.

### 1.1 Tokens de Cor (Marketing Extension)
| Token | Valor | Uso |
|---|---|---|
| `--bg-base` | `#0A0A0B` | Fundo principal da página |
| `--bg-surface` | `#141416` | Cards do Bento Grid e Seção Pricing |
| `--accent` | `#C6F84E` | CTAs, Títulos críticos, Ícones ativos |
| `--accent-dim` | `rgba(198, 248, 78, 0.15)` | Background de badges e hovers sutil |
| `--border-subtle` | `rgba(255, 255, 255, 0.06)` | Divisores e bordas de cards |
| `--text-primary` | `#F5F5F7` | Headlines e labels de botões |
| `--text-secondary` | `#A1A1AA` | Parágrafos e descrições |

### 1.2 Tipografia (Escala Marketing)
- **Display 1:** `size: 72px / weight: 800 / tracking: -0.04em` (Apenas Hero Mobile-Scale: 48px)
- **H2 Section:** `size: 40px / weight: 700 / tracking: -0.02em`
- **Feature Title:** `size: 20px / weight: 600`
- **Caption Caps:** `size: 11px / weight: 700 / tracking: 0.12em / uppercase`

---

## 2. Estrutura de Componentes (React/Next.js)

### 2.1 Navigation (`LandingNav.tsx`)
- **Structure:**
  - `LogoLockup`: SVG inline com `--accent` no símbolo.
  - `NavLinks`: Array de `href`. Hover: transition `opacity 0.2s`.
  - `Actions`: `Button variant="ghost" size="sm"` (Login) + `Button variant="primary" size="sm"` (Start).
- **Behavior:** Glassmorphism sutil (`backdrop-filter: blur(12px)`) ao scrollar > 20px.

### 2.2 Hero Section (`HeroSection.tsx`)
- **Left Column (Content):**
  - Badge: "NovaCraft 2.0 is live".
  - Headline: "Design viral em velocidade de pensamento."
  - CTA Group: Botão magnético primário + link "Ver demonstração".
- **Right Column (Interactive Preview):**
  - `DashboardWindow`: Um frame CSS que simula a interface do dashboard.
  - Animação: Slides do carrossel trocando sozinhos via `framer-motion` (Auto-play simulado).

### 2.3 Viral Gallery Redux (`ViralGallery.tsx`)
- **Refactor Necessário:**
  - Remover estilos inline. Mover para `gallery.module.css`.
  - **Overlays:** Gradiente linear `to bottom` de `#0A0A0B` para transparente (30%) e vice-versa.
  - **Filtros:** Imagens iniciam com `grayscale(40%)`, ficando `grayscale(0%)` no hover do card.
- **Data Source:** Manter `ALL_IMGS` array, mas usar `priority` loading no Next Image para a primeira linha.

### 2.4 Bento Features (`BentoGrid.tsx`)
Layout 4x4 fr:
- **Card 1 (2x2):** "Modo Notícia". Vídeo/GIF loop sutil de um carrossel sendo gerado a partir de uma URL.
- **Card 2 (2x1):** "Smart Palettes". Seletor de cores interativo que muda a cor de um "mini-slide" ao lado.
- **Card 3 (1x2):** "Typography Engine". Mostra o controle de pesos da fonte Inter.
- **Card 4 (1x1):** "Export". Ícones de Instagram/LinkedIn com checkmark verde.

### 2.5 Pricing Engine (`PricingTable.tsx`)
- **Switch Anual/Mensal:** Estilo editorial, pílula preta com acento verde.
- **Pro Card Tier:**
  - `box-shadow: 0 0 40px rgba(198, 248, 78, 0.03)`.
  - Borda full-bleed verde.
  - Button `variant="accent"` (Verde com texto preto).

---

## 3. Motion & UX

### 3.1 Scroll Orchestration
- Uso de `framer-motion` `whileInView`.
- **Efeito:** `y: 40` -> `y: 0`, `opacity: 0` -> `opacity: 1`.
- `staggerChildren: 0.1` para cards dentro do bento grid.

### 3.2 Magnetic Cursor (Hero Only)
- Hook `useMagnetic` aplicado ao botão principal.
- Raio de influência: 100px.
- Spring settings: `stiffness: 150, damping: 15`.

---

## 4. Assets & Performance
- **Fontes:** Inter Google Font (Woff2).
- **Images:** WebP nativo via `next/image`.
- **Icons:** Lucide React (Stroke width 1.5px fixo).
- **Bundle Target:** < 50kb CSS, < 150kb JS total (Landing).

---

## 5. Mapeamento de Arquivos a Criar/Alterar
- `src/app/landing/page.tsx`: Reconstrução total usando os novos componentes.
- `src/components/landing/*`: Pasta nova para componentes isolados da landing.
- `src/styles/landing.css`: Definições globais de layout e keyframes.

---
**Instruções de Implementação:**
- NUNCA usar `p-4`, `m-2`. Usar escala de 8px: `gap-8` (64px), `py-20` (160px).
- Hierarquia visual deve ser: Hero (Acento) -> Galeria (Visual) -> Bento (Funcional) -> Pricing (Conversão).
