# DESIGN 2.MD — Register + Editor Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **REQUIRED DESIGN SKILLS — OBRIGATÓRIO EM CADA TASK DE UI:**
> Antes de escrever QUALQUER código de componente ou página, você DEVE invocar a skill `frontend-design` via a ferramenta Skill. Faça isso no Step 1 de cada Task que produza código de UI. Para superfícies de hero/marca (Register, Topbar principal), TAMBÉM invoque `high-end-visual-design`. Isso não é opcional — é um requisito arquitetural desta spec.

**Goal:** Aplicar o sistema de design preto-editorial + verde-limão `#C6F84E` definido em `DESIGN 2.MD` nas duas telas restantes: página de **Registro** (`/register`) e **Editor de Carrosséis** (`/dashboard/editor/[id]`), substituindo a estética antiga (classes CSS legacy, hex hardcoded, `var(--bg2)`) por tokens CSS via Tailwind.

**Architecture:**
- Registro: rewrite completo de `src/app/(auth)/register/page.tsx` como split layout 40/60, espelhando a estrutura do Login já redesenhado.
- Editor: o `src/components/Editor.tsx` tem 1097 linhas de lógica de estado que NÃO serão tocadas. Apenas o JSX do `return()` é reescrito para o grid de 4 zonas (topbar/filmstrip/canvas/inspector). Novos subcomponentes de UI ficam em `src/components/editor/`.
- Tokens: todos em `src/styles/tokens.css`. Nenhum hex literal nos componentes novos (exceto o `ColorSwatch` que usa `input[type=color]` nativo).

**Tech Stack:** Next.js 14 App Router, React 18, TypeScript 5.4, Tailwind CSS 3.4 com tokens CSS, lucide-react (ícones), framer-motion (animação do chat), Inter Variable (já carregado). Nenhuma dependência nova.

**Verificação:** Este projeto não tem test runner. Cada task inclui um passo de verificação visual manual — rode `npm run dev` e navegue até a rota indicada. O critério de aceitação é a lista de 12 itens do `DESIGN 2.MD §5`.

---

## Estrutura de Arquivos

### Novos arquivos criados neste plano
```
src/components/editor/InspectorHeader.tsx   Header contextual do painel direito
src/components/editor/InspectorSection.tsx  Seção dobrável do inspector
src/components/editor/NumberInput.tsx       Input numérico com label inline
src/components/editor/ColorSwatch.tsx       Seletor de cor via input[type=color]
src/components/editor/ChipRow.tsx           Seletor de opções em chips horizontais
src/components/editor/ChatBubble.tsx        Bolha de mensagem do AI chat
src/components/editor/index.ts              Barrel export de todos os acima
```

### Arquivos modificados
```
src/app/(auth)/register/page.tsx            Rewrite completo — split layout 40/60
src/components/Editor.tsx                   Apenas o return() JSX — lógica intacta acima da linha ~670
```

### Arquivos NÃO tocados
```
src/components/EditorPanels.tsx             Lógica de painéis preservada (usada no Inspector via wrappers)
src/components/SlidePreview.tsx             Renderer canvas — zero mudança
src/models/Carousel.ts                      Schema MongoDB — zero mudança
src/app/api/**                              APIs — zero mudança
src/styles/tokens.css                       Tokens já implementados — apenas leitura
src/components/ui/**                        Componentes UI já redesenhados — apenas consumo
```

---

## Convenções obrigatórias para todos os tasks

1. **Invoke `frontend-design`** via Skill tool no Step 1 de cada task de UI — sem exceção.
2. **Nenhum hex literal** nos componentes — apenas classes Tailwind que mapeiam tokens, ou `var(--token)` inline.
3. **Nenhum `text-xs`** — usar `text-caption` (12px) ou `text-micro` (11px).
4. **Nenhum `shadow-sm|md|lg|xl|2xl`** — usar apenas `shadow-pop` (Modal/Palette/Toast).
5. **Nenhum `bg-gradient-*`** — proibido.
6. **Componentes de `src/components/ui/`** — usar Button, Input, Card, Chip, Badge, Modal, Toast existentes.
7. **Commit ao final de cada task** numerada com a mensagem exata indicada.

---

## Task 1: Primitivos de UI do Editor — componentes base

**Contexto:** Antes de redesenhar o Editor, precisamos criar os componentes de UI que o Inspector vai usar. Esses componentes ficam em `src/components/editor/` (separados dos globais em `src/components/ui/`).

**Files:**
- Create: `src/components/editor/InspectorHeader.tsx`
- Create: `src/components/editor/InspectorSection.tsx`
- Create: `src/components/editor/NumberInput.tsx`
- Create: `src/components/editor/ColorSwatch.tsx`
- Create: `src/components/editor/ChipRow.tsx`
- Create: `src/components/editor/ChatBubble.tsx`
- Create: `src/components/editor/index.ts`

---

- [ ] **Step 1: Invoke `frontend-design` skill**

Use a ferramenta Skill com `skill: "frontend-design"`. Leia o checklist para "component primitives". Depois prossiga.

---

- [ ] **Step 2: Criar `src/components/editor/InspectorHeader.tsx`**

Este componente renderiza o cabeçalho de um estado do Inspector (ex: "Texto", "Imagem", "Forma"). Tem ícone à esquerda, label em `text-body-strong`, e uma linha divisória embaixo.

```tsx
import * as React from "react";

interface InspectorHeaderProps {
  icon: React.ReactNode;
  label: string;
}

export function InspectorHeader({ icon, label }: InspectorHeaderProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 border-b border-border-subtle sticky top-0 bg-bg-surface z-10">
      <span className="text-text-tertiary" aria-hidden="true">{icon}</span>
      <span className="text-body-strong text-text-primary">{label}</span>
    </div>
  );
}
```

---

- [ ] **Step 3: Criar `src/components/editor/InspectorSection.tsx`**

Seção de propriedades com label em `text-micro` uppercase + conteúdo com gap-3. Borda inferior separa seções.

```tsx
import * as React from "react";

interface InspectorSectionProps {
  label: string;
  children: React.ReactNode;
}

export function InspectorSection({ label, children }: InspectorSectionProps) {
  return (
    <div className="px-4 py-3 border-b border-border-subtle flex flex-col gap-3 last:border-b-0">
      <span className="text-micro text-text-tertiary">{label.toUpperCase()}</span>
      {children}
    </div>
  );
}
```

---

- [ ] **Step 4: Criar `src/components/editor/NumberInput.tsx`**

Input numérico compacto com label inline, tnum (tabular numbers), e foco accent. Usado para X/Y/W/H/rotação/opacidade.

```tsx
import * as React from "react";

interface NumberInputProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
}

export function NumberInput({ label, value, min, max, step = 1, onChange }: NumberInputProps) {
  return (
    <label className="flex flex-col gap-1 w-full">
      <span className="text-micro text-text-tertiary">{label}</span>
      <input
        type="number"
        value={Math.round(value * 100) / 100}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const parsed = parseFloat(e.target.value);
          if (!isNaN(parsed)) onChange(parsed);
        }}
        className="w-full bg-bg-surface-2 border border-border-default rounded-xs px-2 py-1 text-caption text-text-primary tnum outline-none focus:border-accent transition-colors duration-fast"
      />
    </label>
  );
}
```

---

- [ ] **Step 5: Criar `src/components/editor/ColorSwatch.tsx`**

Seletor de cor: quadrado colorido + código hex em mono + input[type=color] oculto. O hex hardcoded aqui é uma exceção permitida — é o valor de cor do elemento, não um token de design.

```tsx
import * as React from "react";

interface ColorSwatchProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export function ColorSwatch({ value, onChange, label }: ColorSwatchProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className="flex items-center gap-2 w-full hover:opacity-80 transition-opacity duration-fast group"
      aria-label={label ?? "Selecionar cor"}
    >
      <div
        className="h-7 w-7 rounded-xs border border-border-default shrink-0 group-hover:border-border-strong transition-colors duration-fast"
        style={{ background: value === "transparent" ? "transparent" : value }}
      >
        {value === "transparent" && (
          <div className="w-full h-full rounded-xs"
            style={{ background: "repeating-linear-gradient(45deg, #444 0,#444 2px,transparent 0,transparent 50%) 0/8px 8px" }}
          />
        )}
      </div>
      <span className="text-caption text-text-secondary font-mono group-hover:text-text-primary transition-colors duration-fast">
        {value === "transparent" ? "transparent" : value.toUpperCase()}
      </span>
      <input
        ref={inputRef}
        type="color"
        value={value === "transparent" ? "#000000" : value}
        onChange={(e) => onChange(e.target.value)}
        className="sr-only"
        aria-hidden="true"
      />
    </button>
  );
}
```

---

- [ ] **Step 6: Criar `src/components/editor/ChipRow.tsx`**

Row de chips horizontais para seleção de uma opção (ex: peso da fonte, alinhamento). Chip ativo usa `bg-accent-muted border-accent text-accent`.

```tsx
import * as React from "react";
import { cn } from "@/lib/cn";

interface ChipOption<T> {
  label: string;
  value: T;
}

interface ChipRowProps<T> {
  options: ChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function ChipRow<T>({ options, value, onChange }: ChipRowProps<T>) {
  return (
    <div className="flex flex-wrap gap-1">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "px-2 py-1 rounded-xs text-caption transition-colors duration-fast border",
            value === o.value
              ? "bg-accent-muted border-accent text-accent"
              : "bg-bg-surface-2 border-border-subtle text-text-secondary hover:border-border-default hover:text-text-primary"
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

- [ ] **Step 7: Criar `src/components/editor/ChatBubble.tsx`**

Bolha de mensagem do agente de IA. `role: "user"` alinha à direita com fundo accent-muted. `role: "assistant"` alinha à esquerda com fundo surface-2.

```tsx
import * as React from "react";
import { cn } from "@/lib/cn";

interface ChatBubbleProps {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

export function ChatBubble({ role, content, streaming }: ChatBubbleProps) {
  return (
    <div className={cn("flex w-full", role === "user" ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] px-3 py-2 text-body text-text-primary rounded-lg",
          role === "user"
            ? "bg-accent-muted rounded-tr-xs"
            : "bg-bg-surface-2 rounded-tl-xs border border-border-subtle"
        )}
      >
        {content}
        {streaming && (
          <span className="inline-block ml-0.5 w-0.5 h-3.5 bg-accent animate-pulse align-middle" />
        )}
      </div>
    </div>
  );
}
```

---

- [ ] **Step 8: Criar `src/components/editor/index.ts`**

Barrel export de todos os primitivos criados:

```ts
export { InspectorHeader } from "./InspectorHeader";
export { InspectorSection } from "./InspectorSection";
export { NumberInput } from "./NumberInput";
export { ColorSwatch } from "./ColorSwatch";
export { ChipRow } from "./ChipRow";
export { ChatBubble } from "./ChatBubble";
```

---

- [ ] **Step 9: Verificar que TypeScript compila sem erros**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Esperado: sem erros relacionados aos arquivos em `src/components/editor/`.

---

- [ ] **Step 10: Commit**

```bash
git add src/components/editor/
git commit -m "feat(editor): add inspector primitive components (DESIGN 2.MD §3.6)"
```

---

## Task 2: Página de Registro — Split Layout 40/60

**Contexto:** A página atual em `src/app/(auth)/register/page.tsx` usa classes CSS legacy (`card`, `input`, `btn-primary`) e layout centralizado simples. O redesign aplica o split layout 40/60 idêntico ao Login redesenhado (DESIGN.md §4.9), com formulário na esquerda e painel de marca na direita. A lógica de submit, reCAPTCHA e redirecionamento é preservada — apenas o JSX do return é reescrito.

**Files:**
- Modify: `src/app/(auth)/register/page.tsx`

---

- [ ] **Step 1: Invoke `frontend-design` E `high-end-visual-design`**

Use a ferramenta Skill com `skill: "frontend-design"`. Leia o checklist para "auth / split layout pages". Em seguida, invoque `skill: "high-end-visual-design"` para superfícies de marca. Depois prossiga.

---

- [ ] **Step 2: Leia o arquivo atual para mapear a lógica de submit que deve ser preservada**

Leia `src/app/(auth)/register/page.tsx`. Confirme:
- `form` state com `{ name, email, password }`
- `recaptchaSiteKey`, `recaptchaEnabled`, `recaptchaWidgetId`, `recaptchaContainerRef`
- `handleSubmit(e)` faz POST para `/api/auth/register` com `{ ...form, recaptchaToken }`
- Em sucesso: `router.push("/dashboard")`

Todo esse estado e lógica devem ser copiados para o novo arquivo sem modificação.

---

- [ ] **Step 3: Implementar função de força de senha**

Esta função retorna 0-4 com base em 4 critérios. Adicione antes do componente:

```ts
function getPasswordStrength(password: string): number {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++;
  return score;
}

const STRENGTH_LABELS = ["", "Fraca", "Razoável", "Boa", "Forte"];
const STRENGTH_COLORS = [
  "",
  "bg-state-danger",
  "bg-state-warning",
  "bg-state-success",
  "bg-accent",
];
```

---

- [ ] **Step 4: Reescrever `src/app/(auth)/register/page.tsx` completo**

Substitua o arquivo inteiro pelo conteúdo abaixo. **Preserve toda a lógica de estado e submit do arquivo atual** — apenas o JSX do return é novo:

```tsx
"use client";

import { useState, useEffect, FormEvent, useRef } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { LogoLockup } from "@/components/Logo";
import { cn } from "@/lib/cn";

declare global {
  interface Window {
    grecaptcha: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, opts: { action: string }) => Promise<string>;
      render: (el: HTMLElement | string, opts: object) => number;
      getResponse: (widgetId?: number) => string;
      reset: (widgetId?: number) => void;
    };
  }
}

function getPasswordStrength(password: string): number {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++;
  return score;
}

const STRENGTH_LABELS = ["", "Fraca", "Razoável", "Boa", "Forte"];
const STRENGTH_COLORS = [
  "",
  "bg-state-danger",
  "bg-state-warning",
  "bg-state-success",
  "bg-accent",
];

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [recaptchaSiteKey, setRecaptchaSiteKey] = useState("");
  const [recaptchaEnabled, setRecaptchaEnabled] = useState(false);
  const [recaptchaWidgetId, setRecaptchaWidgetId] = useState<number | null>(null);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);

  const strength = getPasswordStrength(form.password);

  useEffect(() => {
    fetch("/api/public/config")
      .then(async (r) => {
        if (!r.ok) return;
        const d = await r.json();
        if (d.recaptchaEnabled && d.recaptchaSiteKey) {
          setRecaptchaEnabled(true);
          setRecaptchaSiteKey(d.recaptchaSiteKey);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!recaptchaEnabled || !recaptchaSiteKey || !recaptchaContainerRef.current) return;
    if (typeof window === "undefined" || !window.grecaptcha) return;
    const id = window.grecaptcha.render(recaptchaContainerRef.current, {
      sitekey: recaptchaSiteKey,
      theme: "dark",
    });
    setRecaptchaWidgetId(id);
  }, [recaptchaEnabled, recaptchaSiteKey]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    let recaptchaToken = "";
    if (recaptchaEnabled && recaptchaSiteKey) {
      recaptchaToken = window.grecaptcha?.getResponse(recaptchaWidgetId ?? undefined) ?? "";
      if (!recaptchaToken) {
        setError("Complete a verificação reCAPTCHA.");
        setLoading(false);
        return;
      }
    }

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, recaptchaToken }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Erro ao criar conta.");
      window.grecaptcha?.reset(recaptchaWidgetId ?? undefined);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <>
      {recaptchaEnabled && recaptchaSiteKey && (
        <Script src="https://www.google.com/recaptcha/api.js" strategy="lazyOnload" />
      )}

      <div className="min-h-screen flex bg-bg-base">
        {/* ── ESQUERDA — Formulário ── */}
        <div className="w-full lg:w-[40%] min-w-0 lg:min-w-[480px] flex items-center px-8 lg:px-16 py-16">
          <div className="w-full max-w-[400px] mx-auto flex flex-col gap-6">
            <LogoLockup size={24} />

            <div className="flex flex-col gap-1">
              <h1 className="text-display text-text-primary">Crie sua conta.</h1>
              <p className="text-body text-text-secondary">Comece grátis. Sem cartão de crédito.</p>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-md border border-state-danger/40 bg-state-danger/10 text-body text-state-danger">
                <AlertCircle size={16} strokeWidth={1.5} aria-hidden />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

              <div className="flex flex-col gap-1.5">
                <Input
                  label="Senha"
                  type={showPwd ? "text" : "password"}
                  inputSize="lg"
                  placeholder="Mínimo 8 caracteres"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  iconRight={
                    <button
                      type="button"
                      onClick={() => setShowPwd((s) => !s)}
                      className="text-text-tertiary hover:text-text-primary transition-colors duration-fast"
                      aria-label={showPwd ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {showPwd ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
                    </button>
                  }
                />

                {form.password.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex gap-1">
                      {[0, 1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={cn(
                            "h-1 flex-1 rounded-pill transition-colors duration-base",
                            i < strength ? STRENGTH_COLORS[strength] : "bg-bg-surface-3"
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-caption text-text-tertiary">
                      {STRENGTH_LABELS[strength]}
                    </span>
                  </div>
                )}
              </div>

              {recaptchaEnabled && recaptchaSiteKey && (
                <div ref={recaptchaContainerRef} className="flex justify-start" />
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full"
              >
                Criar conta gratuita
              </Button>
            </form>

            <p className="text-caption text-text-secondary text-center">
              Já tem conta?{" "}
              <a
                href="/login"
                className="text-accent hover:text-accent-hover transition-colors duration-fast"
              >
                Entrar
              </a>
            </p>
          </div>
        </div>

        {/* ── DIREITA — Painel de marca ── */}
        <div className="hidden lg:flex w-[60%] bg-bg-surface items-center justify-center px-16">
          <div className="flex flex-col gap-8 max-w-[480px]">
            <div
              className="font-mono leading-tight"
              style={{ fontSize: 56, letterSpacing: "-0.04em" }}
            >
              <div className="text-text-primary">Seu primeiro carrossel</div>
              <div className="text-accent">em 30 segundos.</div>
            </div>

            <div className="h-px bg-border-subtle" />

            <div className="font-mono text-caption text-text-tertiary flex flex-wrap gap-x-4 gap-y-1">
              <span>10k+ criadores</span>
              <span>·</span>
              <span>50k+ carrosséis</span>
              <span>·</span>
              <span>1M+ imagens IA</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
```

---

- [ ] **Step 5: Verificação visual — `/register`**

```bash
npm run dev
```

Abra `http://localhost:3000/register` (ou a porta que o Next usar).

Verifique:
- [ ] Split layout 40/60 visível em tela ≥ 1024px
- [ ] Mobile (< 1024px): apenas o formulário, painel direito oculto
- [ ] Logo aparece no topo esquerdo
- [ ] Título "Crie sua conta." em `text-display` (40px)
- [ ] Campo senha tem botão olho funcional (toggle show/hide)
- [ ] Indicador de força aparece quando senha tem ao menos 1 caractere e muda de cor conforme cresce
- [ ] Painel direito: frase monospace 56px + divisor + 3 métricas
- [ ] Fundo geral preto `#0A0A0B`, painel direito cinza escuro `#111113`
- [ ] Nenhuma cor roxa, nenhum gradiente

---

- [ ] **Step 6: Verificar TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep "register"
```

Esperado: sem erros.

---

- [ ] **Step 7: Commit**

```bash
git add src/app/\(auth\)/register/page.tsx
git commit -m "feat(design): redesign Register as split layout 40/60 (DESIGN 2.MD §2)"
```

---

## Task 3: Editor Shell — CSS Grid 4 Zonas

**Contexto:** O arquivo `src/app/dashboard/editor/[id]/page.tsx` é um wrapper fino que carrega o carrossel da API e passa para `<Editor />`. O `src/components/Editor.tsx` é onde o layout real vive — 1097 linhas, com state/lógica de canvas acima da linha ~670 e o JSX do return abaixo. Esta task foca em **entender a estrutura** do Editor.tsx atual e preparar o refactor do return JSX que acontece nas Tasks 4-11. Não escreva código de UI ainda — apenas o grid shell.

**Files:**
- Modify: `src/components/Editor.tsx` (apenas o início do return JSX — o wrapper mais externo)

---

- [ ] **Step 1: Invoke `frontend-design` skill**

Use a ferramenta Skill com `skill: "frontend-design"`. Leia o checklist para "editor shells / canvas layouts". Depois prossiga.

---

- [ ] **Step 2: Localizar o início do return JSX no Editor.tsx**

Leia `src/components/Editor.tsx` a partir da linha ~670. O return atual começa com algo como:

```tsx
return (
  <div className="editor-root" ...>
    <Toast ... />
    {/* topbar */}
    ...
  </div>
)
```

Você vai substituir APENAS este `return(...)` nas Tasks 3-11. TODO o código acima do return (useState, useEffect, useCallback, handlers) permanece intocado.

---

- [ ] **Step 3: Substituir o wrapper mais externo do return por CSS Grid 4 zonas**

Localize o `return (` do Editor e substitua o div mais externo pelo grid shell. O conteúdo interno (topbar, filmstrip, canvas, inspector) será preenchido nas Tasks seguintes com placeholders por enquanto:

```tsx
return (
  <>
    {/* ── Toast global ── */}
    {toast && <Toast message={toast} />}

    {/* ── Regen Modal ── */}
    {regenTarget && (
      <RegenImageModal
        onClose={() => setRegenTarget(null)}
        onConfirm={handleRegenImage}
      />
    )}

    {/* ── Add Slide Modal ── */}
    {showAddSlide && (
      <AddSlideModal
        onClose={() => setShowAddSlide(false)}
        onAdd={handleAddSlideAI}
        adding={addingSlide}
      />
    )}

    {/* ── Shell 4 zonas ── */}
    <div
      className="h-screen overflow-hidden bg-bg-base"
      style={{
        display: "grid",
        gridTemplateRows: "56px 1fr",
        gridTemplateColumns: "180px 1fr 280px",
        gridTemplateAreas: `"topbar topbar topbar" "filmstrip canvas inspector"`,
      }}
    >
      {/* Task 4: TOPBAR */}
      <header style={{ gridArea: "topbar" }} className="flex items-center gap-2 px-4 bg-bg-surface border-b border-border-subtle">
        <span className="text-caption text-text-tertiary">Topbar — Task 4</span>
      </header>

      {/* Task 5: FILMSTRIP */}
      <aside style={{ gridArea: "filmstrip" }} className="bg-bg-surface border-r border-border-subtle overflow-y-auto">
        <span className="text-caption text-text-tertiary p-4 block">Filmstrip — Task 5</span>
      </aside>

      {/* Task 6: CANVAS */}
      <main style={{ gridArea: "canvas" }} className="relative overflow-auto bg-bg-base flex items-center justify-center">
        <span className="text-caption text-text-tertiary">Canvas — Task 6</span>
      </main>

      {/* Task 7-10: INSPECTOR */}
      <aside style={{ gridArea: "inspector" }} className="bg-bg-surface border-l border-border-subtle overflow-y-auto">
        <span className="text-caption text-text-tertiary p-4 block">Inspector — Tasks 7-10</span>
      </aside>
    </div>
  </>
);
```

**IMPORTANTE:** Ao substituir o return, remova qualquer CSS antigo referenciado (classes como `editor-root`, `editor-left`, `editor-right`, `editor-canvas-isolated`, etc.) mas NÃO remova os imports — eles serão necessários nas tasks seguintes.

---

- [ ] **Step 4: Verificação visual — `/dashboard/editor/[id]`**

```bash
npm run dev
```

Faça login, crie ou abra um carrossel existente. Vá para `/dashboard/editor/[algum-id]`.

Verifique:
- [ ] A tela tem 4 zonas visíveis com o texto de placeholder de cada zona
- [ ] Topbar: barra horizontal de 56px no topo
- [ ] Filmstrip: coluna de 180px à esquerda
- [ ] Canvas: área central com fundo preto
- [ ] Inspector: coluna de 280px à direita
- [ ] Nenhum scroll vertical no shell (o grid ocupa 100vh)
- [ ] Sem erros de JavaScript no console

---

- [ ] **Step 5: Commit**

```bash
git add src/components/Editor.tsx
git commit -m "feat(editor): add 4-zone CSS grid shell (DESIGN 2.MD §3.2)"
```

---

## Task 4: Editor Topbar

**Contexto:** A topbar tem 56px de altura e contém: botão Voltar, divisor, título editável inline, badge de status, espaçador, contador de slides, divisor, undo/redo, divisor, botão Gerar Imagens (condicional), botão Salvar, menu ⋯. Substitua o placeholder "Topbar — Task 4" da Task 3 pelo conteúdo completo.

**Files:**
- Modify: `src/components/Editor.tsx` (apenas a section `{/* Task 4: TOPBAR */}`)

---

- [ ] **Step 1: Invoke `frontend-design` skill**

Use a ferramenta Skill com `skill: "frontend-design"`. Leia o checklist para "topbars / navigation bars". Depois prossiga.

---

- [ ] **Step 2: Adicionar imports necessários na seção de imports do Editor.tsx**

No topo do arquivo, certifique-se que estes imports estão presentes (adicione apenas os que faltam):

```tsx
import {
  ArrowLeft, Undo2, Redo2, Sparkles, MoreHorizontal,
  Save, ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
```

---

- [ ] **Step 3: Adicionar estado `saved` e `titleEditing` ao Editor**

Encontre a lista de useStates existentes e adicione logo após `const [saving, setSaving]`:

```tsx
const [saved, setSaved] = useState(false);
const [titleEditing, setTitleEditing] = useState(false);
```

Modifique o handler de salvar para setar `saved`:

```tsx
// No handler handleSave ou onSave, após salvar com sucesso:
setSaved(true);
setTimeout(() => setSaved(false), 2000);
```

---

- [ ] **Step 4: Calcular imagens pendentes**

Adicione esta derivação junto às outras derivações (`const slide = ...`, `const el = ...`):

```tsx
const pendingImages = draft.slides.flatMap((s, sIdx) => {
  const pending: { slideIndex: number; elementId?: string }[] = [];
  if (s.imagePrompt && !s.bgImageUrl) pending.push({ slideIndex: sIdx });
  s.elements.forEach((e) => {
    if (e.type === "image" && e.imagePrompt && !e.imageUrl) {
      pending.push({ slideIndex: sIdx, elementId: e.id });
    }
  });
  return pending;
});
```

---

- [ ] **Step 5: Substituir o placeholder da Topbar pela implementação completa**

Localize `{/* Task 4: TOPBAR */}` e substitua o `<header>` inteiro:

```tsx
{/* ── TOPBAR ── */}
<header
  style={{ gridArea: "topbar" }}
  className="flex items-center gap-2 px-4 bg-bg-surface border-b border-border-subtle shrink-0"
>
  {/* Voltar */}
  <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
    <ArrowLeft size={15} strokeWidth={1.5} />
    Voltar
  </Button>

  <div className="h-5 w-px bg-border-subtle mx-1" />

  {/* Título editável */}
  <input
    className="bg-transparent text-body-strong text-text-primary border-b border-transparent focus:border-accent outline-none max-w-[260px] truncate transition-colors duration-fast"
    value={draft.title ?? "Sem título"}
    onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
    onFocus={() => setTitleEditing(true)}
    onBlur={() => setTitleEditing(false)}
    aria-label="Título do carrossel"
  />

  {/* Badge status */}
  <span className={cn(
    "text-micro px-1.5 py-0.5 rounded-xs",
    saving
      ? "text-accent bg-accent-muted"
      : saved
        ? "text-state-success bg-state-success/10"
        : "text-text-tertiary bg-bg-surface-2"
  )}>
    {saving ? "Salvando…" : saved ? "Salvo" : "Rascunho"}
  </span>

  {/* Espaçador */}
  <div className="flex-1" />

  {/* Contador de slides */}
  <span className="text-caption text-text-tertiary tnum">
    Slide {selectedSlide + 1} de {draft.slides.length}
  </span>

  <div className="h-5 w-px bg-border-subtle mx-1" />

  {/* Undo / Redo */}
  <Button
    variant="ghost"
    size="sm"
    disabled={history.length === 0}
    onClick={undo}
    title="Desfazer (⌘Z)"
    className="px-2"
  >
    <Undo2 size={15} strokeWidth={1.5} />
  </Button>
  <Button
    variant="ghost"
    size="sm"
    title="Refazer"
    className="px-2"
  >
    <Redo2 size={15} strokeWidth={1.5} />
  </Button>

  <div className="h-5 w-px bg-border-subtle mx-1" />

  {/* Gerar imagens — só aparece se houver pendentes */}
  {pendingImages.length > 0 && (
    <Button
      variant="secondary"
      size="sm"
      onClick={() => setRegenTarget({ slideIndex: pendingImages[0].slideIndex, elementId: pendingImages[0].elementId })}
      className="gap-1.5"
    >
      <Sparkles size={14} strokeWidth={1.5} />
      Gerar imagens
    </Button>
  )}

  {/* Salvar */}
  <Button
    variant="primary"
    size="sm"
    loading={saving}
    onClick={async () => {
      setSaving(true);
      try {
        await onSave(draft);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } finally {
        setSaving(false);
      }
    }}
  >
    Salvar
  </Button>

  {/* Menu ⋯ */}
  <Button variant="ghost" size="sm" className="px-2" title="Mais opções">
    <MoreHorizontal size={15} strokeWidth={1.5} />
  </Button>
</header>
```

---

- [ ] **Step 6: Verificação visual — Topbar**

```bash
npm run dev
```

Abra um carrossel no editor.

Verifique:
- [ ] "Voltar" com ícone ArrowLeft à esquerda
- [ ] Título clicável — foco cria linha inferior accent
- [ ] Badge "Rascunho" / "Salvo" / "Salvando…" muda de cor
- [ ] Contador "Slide 1 de N" no centro-direito
- [ ] Undo/Redo desabilitados quando sem histórico
- [ ] Botão "Salvar" (primary) — um único botão primary na viewport
- [ ] Topbar ocupa exatamente 56px de altura

---

- [ ] **Step 7: Commit**

```bash
git add src/components/Editor.tsx
git commit -m "feat(editor): redesign Topbar (DESIGN 2.MD §3.3)"
```

---

## Task 5: Editor Filmstrip — Thumbnails de Slides

**Contexto:** A filmstrip fica na coluna esquerda de 180px. Mostra thumbnails de todos os slides na proporção 4:5 (1080:1350). O slide ativo tem borda accent de 2px. Ao clicar, seleciona o slide e limpa a seleção de elemento. Tem botão de adicionar slide no final e um menu de contexto por slide.

**Files:**
- Modify: `src/components/Editor.tsx` (apenas a section `{/* Task 5: FILMSTRIP */}`)

---

- [ ] **Step 1: Invoke `frontend-design` skill**

Use a ferramenta Skill com `skill: "frontend-design"`. Leia o checklist para "sidebars / vertical lists". Depois prossiga.

---

- [ ] **Step 2: Calcular escala dos thumbnails**

O `THUMB_SCALE` já existe no Editor.tsx (`const THUMB_SCALE = 176 / CANVAS_W`). Use-o para a escala dos thumbnails dentro do filmstrip. O thumbnail tem 156px de largura (180px - 2×12px de padding).

Adicione uma constante derivada para o tamanho real do thumbnail:

```tsx
const FILMSTRIP_THUMB_W = 156; // 180px coluna - 2*12px padding
const FILMSTRIP_THUMB_H = Math.round(FILMSTRIP_THUMB_W * (CANVAS_H / CANVAS_W)); // ~195px
const FILMSTRIP_SCALE = FILMSTRIP_THUMB_W / CANVAS_W; // ~0.144
```

---

- [ ] **Step 3: Substituir o placeholder da Filmstrip pela implementação completa**

Localize `{/* Task 5: FILMSTRIP */}` e substitua o `<aside>`:

```tsx
{/* ── FILMSTRIP ── */}
<aside
  style={{ gridArea: "filmstrip" }}
  className="bg-bg-surface border-r border-border-subtle flex flex-col overflow-hidden"
>
  {/* Header fixo */}
  <div className="flex items-center justify-between px-3 py-2.5 border-b border-border-subtle shrink-0">
    <span className="text-micro text-text-tertiary">SLIDES</span>
    <span className="text-caption text-text-tertiary tnum">{draft.slides.length}</span>
  </div>

  {/* Lista de thumbnails scrollável */}
  <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
    {draft.slides.map((s, i) => {
      const isActive = selectedSlide === i;
      const isGenerating = generatingSlide === i;

      return (
        <button
          key={s.id ?? i}
          type="button"
          onClick={() => { setSelectedSlide(i); setSelectedEl(null); }}
          className={cn(
            "relative w-full rounded-md overflow-hidden border transition-colors duration-fast cursor-pointer group shrink-0",
            isActive
              ? "border-2 border-accent"
              : "border border-border-subtle hover:border-border-default"
          )}
          style={{ height: FILMSTRIP_THUMB_H }}
          aria-label={`Slide ${i + 1}`}
          aria-pressed={isActive}
        >
          {/* Thumbnail do slide em escala */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              width: CANVAS_W,
              height: CANVAS_H,
              transform: `scale(${FILMSTRIP_SCALE})`,
              transformOrigin: "top left",
            }}
          >
            <SlidePreview
              slide={{ ...s, ...(externallyGeneratedImages[i] ? { bgImageUrl: externallyGeneratedImages[i] } : {}) }}
              carousel={draft}
            />
          </div>

          {/* Número do slide */}
          <div className="absolute bottom-1 right-1 px-1 py-0.5 rounded-xs bg-bg-overlay text-micro text-text-secondary tnum pointer-events-none">
            {i + 1}
          </div>

          {/* Overlay de geração em progresso */}
          {isGenerating && (
            <div className="absolute inset-0 bg-bg-overlay flex flex-col items-center justify-center gap-1 pointer-events-none">
              <Sparkles size={16} className="text-accent animate-pulse" strokeWidth={1.5} />
              <span className="text-micro text-accent tnum">{generatingProgress}%</span>
            </div>
          )}

          {/* Reloading de imagem individual */}
          {regenLoading && regenLoading.startsWith(`${i}-`) && !isGenerating && (
            <div className="absolute inset-0 bg-bg-overlay flex items-center justify-center pointer-events-none">
              <Sparkles size={14} className="text-accent animate-spin" strokeWidth={1.5} />
            </div>
          )}
        </button>
      );
    })}

    {/* Botão adicionar slide */}
    <button
      type="button"
      onClick={() => setShowAddSlide(true)}
      className="w-full flex items-center justify-center gap-2 rounded-md border border-dashed border-border-default text-caption text-text-tertiary hover:border-accent hover:text-accent transition-colors duration-fast shrink-0"
      style={{ height: 44 }}
    >
      <span className="text-base leading-none">+</span>
      Adicionar slide
    </button>
  </div>
</aside>
```

---

- [ ] **Step 4: Verificação visual — Filmstrip**

Abra um carrossel com múltiplos slides no editor.

Verifique:
- [ ] Todos os slides aparecem como thumbnails na proporção 4:5 (portrait)
- [ ] Slide ativo tem borda verde accent de 2px
- [ ] Clicar em slide inativo → muda slide ativo + remove seleção de elemento
- [ ] Thumbnails renderizam o conteúdo real do slide (texto, imagem, fundo)
- [ ] Botão "+ Adicionar slide" no final da lista
- [ ] Se slidecount > viewport: scroll vertical aparece
- [ ] Overlay de progresso aparece durante geração de imagem

---

- [ ] **Step 5: Commit**

```bash
git add src/components/Editor.tsx
git commit -m "feat(editor): redesign Filmstrip with thumbnails (DESIGN 2.MD §3.4)"
```

---

## Task 6: Editor Canvas Area + Zoom Toolbar

**Contexto:** A área do canvas fica na célula central do grid. Fundo `bg-bg-base` (preto editorial). O canvas real (`SlideCanvas`) fica centralizado com sombra. Uma toolbar de zoom flutua no bottom-center. O botão do AI Chat flutua no bottom-right.

**Files:**
- Modify: `src/components/Editor.tsx` (apenas a section `{/* Task 6: CANVAS */}`)

---

- [ ] **Step 1: Invoke `frontend-design` skill**

Use a ferramenta Skill com `skill: "frontend-design"`. Leia o checklist para "canvas / workspace areas". Depois prossiga.

---

- [ ] **Step 2: Localizar o componente SlideCanvas no arquivo**

O `SlideCanvas` já existe no Editor.tsx — ele renderiza o canvas interativo com handles de drag/resize. Localize onde ele é usado no return atual (antes da sua substituição na Task 3). Copie o JSX completo do `<SlideCanvas ... />` para reusar na nova zona de canvas.

---

- [ ] **Step 3: Adicionar estado de zoom fit**

```tsx
const canvasContainerRef = useRef<HTMLDivElement>(null);

const fitZoom = () => {
  if (!canvasContainerRef.current) return;
  const containerH = canvasContainerRef.current.clientHeight - 64; // padding
  const containerW = canvasContainerRef.current.clientWidth - 64;
  const scaleH = containerH / CANVAS_H;
  const scaleW = containerW / CANVAS_W;
  setZoom(Math.min(scaleH, scaleW));
};
```

---

- [ ] **Step 4: Substituir o placeholder da Canvas Area pela implementação completa**

Localize `{/* Task 6: CANVAS */}` e substitua o `<main>`:

```tsx
{/* ── CANVAS AREA ── */}
<main
  style={{ gridArea: "canvas" }}
  className="relative bg-bg-base overflow-auto"
  ref={canvasContainerRef}
  onClick={() => setSelectedEl(null)}
>
  {/* Canvas centralizado */}
  <div className="min-h-full min-w-full flex items-center justify-center p-8">
    <div
      className="relative shrink-0"
      style={{
        width: CANVAS_W * zoom,
        height: CANVAS_H * zoom,
        boxShadow: "0 8px 40px -8px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.06)",
        borderRadius: 2,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {slide && (
        <SlideCanvas
          slide={{ ...slide, ...(externallyGeneratedImages[selectedSlide] ? { bgImageUrl: externallyGeneratedImages[selectedSlide] } : {}) }}
          index={selectedSlide}
          selected={true}
          selectedEl={selectedEl}
          zoom={zoom}
          isGenerating={generatingSlide === selectedSlide}
          generatingProgress={generatingProgress}
          regenLoading={regenLoading === `${selectedSlide}-bg`}
          onSlideClick={() => setSelectedEl(null)}
          onElMouseDown={onElMouseDown}
          onElDblClick={(elId) => setSelectedEl(elId)}
          onTextChange={(elId, text) => updateEl(selectedSlide, elId, { text })}
          onRegenBg={() => setRegenTarget({ slideIndex: selectedSlide })}
        />
      )}
    </div>
  </div>

  {/* Toolbar de zoom — flutuante bottom-center */}
  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-0.5 bg-bg-surface border border-border-subtle rounded-pill px-2 py-1 shadow-pop pointer-events-auto">
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); setZoom((z) => Math.max(0.1, parseFloat((z - 0.1).toFixed(1)))); }}
      className="h-6 w-6 rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-surface-2 transition-colors duration-fast text-base leading-none"
      aria-label="Diminuir zoom"
    >
      −
    </button>
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); fitZoom(); }}
      className="px-2 text-caption text-text-secondary hover:text-text-primary tnum transition-colors duration-fast"
      title="Ajustar à tela"
    >
      {Math.round(zoom * 100)}%
    </button>
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); setZoom((z) => Math.min(2, parseFloat((z + 0.1).toFixed(1)))); }}
      className="h-6 w-6 rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-surface-2 transition-colors duration-fast text-base leading-none"
      aria-label="Aumentar zoom"
    >
      +
    </button>
  </div>

  {/* Botão AI Chat — flutuante bottom-right */}
  <button
    type="button"
    onClick={(e) => { e.stopPropagation(); setChatOpen((o) => !o); }}
    className={cn(
      "absolute bottom-4 right-4 h-10 w-10 rounded-pill flex items-center justify-center transition-all duration-base shadow-pop",
      chatOpen
        ? "bg-accent text-text-inverse"
        : "bg-bg-surface border border-border-subtle text-text-secondary hover:text-text-primary hover:border-border-default"
    )}
    title="Agente de edição (⌘J)"
    aria-label="Abrir agente de edição"
  >
    <Sparkles size={18} strokeWidth={1.5} />
  </button>

  {/* Export progress overlay */}
  {exportProgress && (
    <div className="absolute inset-0 bg-bg-overlay flex items-center justify-center">
      <div className="bg-bg-surface border border-border-subtle rounded-lg px-8 py-6 shadow-pop flex flex-col gap-2 items-center">
        <Sparkles size={24} className="text-accent animate-pulse" strokeWidth={1.5} />
        <span className="text-body-strong text-text-primary">{exportProgress}</span>
      </div>
    </div>
  )}
</main>
```

---

- [ ] **Step 5: Verificação visual — Canvas**

Abra um carrossel.

Verifique:
- [ ] Canvas centralizado na área com fundo preto
- [ ] Canvas tem sombra sutil ao redor
- [ ] Toolbar de zoom flutuante no bottom-center com − / % / +
- [ ] Clicar no % ajusta o zoom para caber na tela
- [ ] Botão AI Chat flutuante no bottom-right — verde quando aberto
- [ ] Clicar no fundo (fora do canvas) desseleciona o elemento

---

- [ ] **Step 6: Commit**

```bash
git add src/components/Editor.tsx
git commit -m "feat(editor): redesign Canvas area + zoom toolbar (DESIGN 2.MD §3.5)"
```

---

## Task 7: Inspector — Estado Vazio + Estado Fundo do Slide

**Contexto:** O Inspector (coluna direita, 280px) tem estado vazio quando nenhum elemento está selecionado. Quando o usuário clica no fundo do canvas (setSelectedEl(null)), aparece o estado vazio com ícone e instrução. Para esta task, também implementamos o estado de "Fundo do Slide" que aparece quando o usuário interage com o fundo diretamente.

**Files:**
- Modify: `src/components/Editor.tsx` (apenas a section `{/* Task 7-10: INSPECTOR */}`)

---

- [ ] **Step 1: Invoke `frontend-design` skill**

Use a ferramenta Skill com `skill: "frontend-design"`. Leia o checklist para "inspector panels / property panels". Depois prossiga.

---

- [ ] **Step 2: Adicionar imports dos primitivos do editor**

No topo do Editor.tsx, adicione:

```tsx
import {
  InspectorHeader,
  InspectorSection,
  NumberInput,
  ColorSwatch,
  ChipRow,
  ChatBubble,
} from "@/components/editor";
import { MousePointer2, Type, ImageIcon, Square, Layers } from "lucide-react";
```

---

- [ ] **Step 3: Substituir o placeholder do Inspector pela estrutura base com roteamento de estado**

Localize `{/* Task 7-10: INSPECTOR */}` e substitua o `<aside>` por esta estrutura que roteia para o sub-componente correto conforme o elemento selecionado:

```tsx
{/* ── INSPECTOR ── */}
<aside
  style={{ gridArea: "inspector" }}
  className="bg-bg-surface border-l border-border-subtle flex flex-col overflow-hidden"
>
  <div className="flex-1 overflow-y-auto">
    {!el && !selectedEl ? (
      /* Estado vazio — nenhum elemento selecionado */
      <div className="flex flex-col items-center justify-center h-full gap-3 px-6 py-12 text-center">
        <div className="h-12 w-12 rounded-lg bg-bg-surface-2 border border-border-subtle flex items-center justify-center text-text-tertiary">
          <MousePointer2 size={20} strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-body-strong text-text-primary">Selecione um elemento</p>
          <p className="text-caption text-text-tertiary mt-1">
            Clique em texto, imagem ou forma para editar suas propriedades
          </p>
        </div>
        {/* Atalhos rápidos para adicionar elementos */}
        {/* NOTA: Verifique os nomes exatos das funções de adicionar no Editor.tsx antes de usar.
            O Editor.tsx tem addImage(), addShape(), addProfileEl().
            Para texto, procure por addText() ou a função equivalente que cria um elemento {type:"text"}.
            Se não existir addText(), crie inline aqui seguindo o padrão das outras funções add* */}
        <div className="flex flex-col gap-1.5 w-full mt-4">
          <span className="text-micro text-text-tertiary text-left">ADICIONAR ELEMENTO</span>
          <div className="grid grid-cols-2 gap-1.5">
            <Button variant="secondary" size="sm" onClick={() => {
              // Se addText não existir, implemente inline:
              pushHistory();
              const id = `e${Date.now()}`;
              setDraft((d) => ({
                ...d,
                slides: d.slides.map((s, i) => i === selectedSlide
                  ? { ...s, elements: [...s.elements, { id, type: "text" as const, text: "Texto", x: 80, y: 500, w: CANVAS_W - 160, h: 120, fontSize: 64, weight: 700, color: "#FFFFFF", font: "TheBoldFont", align: "center" as const }] }
                  : s),
              }));
              setSelectedEl(id);
            }} className="gap-1.5">
              <Type size={13} strokeWidth={1.5} /> Texto
            </Button>
            <Button variant="secondary" size="sm" onClick={addImage} className="gap-1.5">
              <ImageIcon size={13} strokeWidth={1.5} /> Imagem
            </Button>
            <Button variant="secondary" size="sm" onClick={addShape} className="gap-1.5">
              <Square size={13} strokeWidth={1.5} /> Forma
            </Button>
            <Button variant="secondary" size="sm" onClick={addProfileEl} className="gap-1.5">
              <span className="text-caption font-mono">@</span> Perfil
            </Button>
          </div>
        </div>
      </div>
    ) : el?.type === "text" ? (
      <InspectorText
        el={el}
        slideIdx={selectedSlide}
        updateEl={updateEl}
        updateElNoHistory={updateElNoHistory}
      />
    ) : el?.type === "image" ? (
      <InspectorImage
        el={el}
        slideIdx={selectedSlide}
        updateEl={updateEl}
        onRegen={() => setRegenTarget({ slideIndex: selectedSlide, elementId: el.id })}
      />
    ) : el?.type === "shape" ? (
      <InspectorShape
        el={el}
        slideIdx={selectedSlide}
        updateEl={updateEl}
      />
    ) : el?.type === "profile" ? (
      <InspectorProfile
        el={el}
        slideIdx={selectedSlide}
        updateEl={updateEl}
      />
    ) : null}
  </div>
</aside>
```

---

- [ ] **Step 4: Verificação visual — Inspector vazio**

Abra um carrossel. Clique no fundo do canvas (fora de qualquer elemento).

Verifique:
- [ ] Inspector mostra ícone de cursor + "Selecione um elemento"
- [ ] Texto secundário "Clique em texto, imagem ou forma para editar suas propriedades"
- [ ] Grid 2×2 de botões: Texto, Imagem, Forma, Perfil
- [ ] Clicar em "Texto" adiciona um elemento de texto no slide ativo

---

- [ ] **Step 5: Commit**

```bash
git add src/components/Editor.tsx
git commit -m "feat(editor): Inspector empty state + routing (DESIGN 2.MD §3.6.1)"
```

---

## Task 8: Inspector — Elemento de Texto

**Contexto:** Quando `el.type === "text"`, o Inspector mostra o componente `InspectorText` com seções: Conteúdo (textarea), Tipografia (tamanho/peso), Alinhamento (chips), Cor, e Transformação (X/Y/W/H/rotação/opacidade). O componente é criado dentro do Editor.tsx como uma função local.

**Files:**
- Modify: `src/components/Editor.tsx` (adicionar função `InspectorText` antes do return principal)

---

- [ ] **Step 1: Invoke `frontend-design` skill**

Use a ferramenta Skill com `skill: "frontend-design"`. Leia o checklist para "inspector panels / property panels". Depois prossiga.

---

- [ ] **Step 2: Criar a função `InspectorText` dentro do Editor.tsx**

Adicione esta função logo ANTES do `return (` principal do componente Editor (mas dentro do componente, pois precisa acessar o tipo IElement):

```tsx
function InspectorText({
  el, slideIdx, updateEl, updateElNoHistory,
}: {
  el: IElement;
  slideIdx: number;
  updateEl: (sIdx: number, elId: string, patch: Partial<IElement>) => void;
  updateElNoHistory: (sIdx: number, elId: string, patch: Partial<IElement>) => void;
}) {
  const upd = (patch: Partial<IElement>) => updateEl(slideIdx, el.id, patch);
  const updLive = (patch: Partial<IElement>) => updateElNoHistory(slideIdx, el.id, patch);

  return (
    <>
      <InspectorHeader icon={<Type size={14} strokeWidth={1.5} />} label="Texto" />

      {/* Conteúdo */}
      <InspectorSection label="Conteúdo">
        <textarea
          className="w-full bg-bg-surface-2 border border-border-default rounded-xs px-3 py-2 text-body text-text-primary resize-y outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors duration-fast min-h-[72px]"
          value={el.text ?? ""}
          rows={3}
          onChange={(e) => updLive({ text: e.target.value })}
          onBlur={(e) => upd({ text: e.target.value })}
          placeholder="Digite o texto…"
        />
      </InspectorSection>

      {/* Tipografia */}
      <InspectorSection label="Tipografia">
        <div className="flex gap-2">
          <NumberInput
            label="Tamanho"
            value={el.fontSize ?? 48}
            min={8}
            max={400}
            onChange={(v) => upd({ fontSize: v })}
          />
          <NumberInput
            label="Altura de linha"
            value={el.lineHeight ?? 1.2}
            min={0.8}
            max={3}
            step={0.05}
            onChange={(v) => upd({ lineHeight: v })}
          />
        </div>
        <ChipRow
          options={[
            { label: "Regular", value: 400 },
            { label: "Medium",  value: 500 },
            { label: "Bold",    value: 700 },
            { label: "Black",   value: 900 },
          ]}
          value={el.weight ?? 400}
          onChange={(v) => upd({ weight: v as number })}
        />
      </InspectorSection>

      {/* Alinhamento */}
      <InspectorSection label="Alinhamento">
        <div className="flex gap-1">
          {(["left", "center", "right"] as const).map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => upd({ align: a })}
              className={cn(
                "flex-1 py-1.5 rounded-xs border text-caption transition-colors duration-fast",
                el.align === a
                  ? "bg-accent-muted border-accent text-accent"
                  : "bg-bg-surface-2 border-border-subtle text-text-secondary hover:border-border-default"
              )}
            >
              {a === "left" ? "⇐" : a === "center" ? "⇔" : "⇒"}
            </button>
          ))}
        </div>
      </InspectorSection>

      {/* Cor */}
      <InspectorSection label="Cor do texto">
        <ColorSwatch
          value={el.color ?? "#F5F5F7"}
          onChange={(v) => upd({ color: v })}
          label="Cor do texto"
        />
      </InspectorSection>

      {/* Transformação */}
      <InspectorSection label="Posição e tamanho">
        <div className="grid grid-cols-2 gap-2">
          <NumberInput label="X" value={el.x ?? 0} onChange={(v) => updLive({ x: v })} />
          <NumberInput label="Y" value={el.y ?? 0} onChange={(v) => updLive({ y: v })} />
          <NumberInput label="Largura" value={el.w ?? 400} min={10} onChange={(v) => updLive({ w: v })} />
          <NumberInput label="Altura" value={el.h ?? 100} min={10} onChange={(v) => updLive({ h: v })} />
          <NumberInput label="Rotação" value={el.rotation ?? 0} min={-180} max={180} onChange={(v) => upd({ rotation: v })} />
          <NumberInput label="Opacidade %" value={Math.round((el.opacity ?? 1) * 100)} min={0} max={100} onChange={(v) => upd({ opacity: v / 100 })} />
        </div>
      </InspectorSection>
    </>
  );
}
```

---

- [ ] **Step 3: Verificação visual — Inspector Texto**

Abra um carrossel e clique em um elemento de texto.

Verifique:
- [ ] Inspector mostra header "Texto" com ícone Type
- [ ] Textarea mostra o texto atual e atualiza ao digitar
- [ ] Chips de peso (Regular/Medium/Bold/Black) — ativo tem fundo accent-muted
- [ ] Alinhamento: 3 botões ⇐ ⇔ ⇒
- [ ] ColorSwatch mostra a cor atual do texto
- [ ] Campos X/Y/W/H/Rotação/Opacidade numericamente corretos
- [ ] Alterar Tamanho e ver o texto mudar de tamanho no canvas

---

- [ ] **Step 4: Commit**

```bash
git add src/components/Editor.tsx
git commit -m "feat(editor): Inspector text element panel (DESIGN 2.MD §3.6.3)"
```

---

## Task 9: Inspector — Elemento de Imagem

**Contexto:** Quando `el.type === "image"`, o Inspector mostra `InspectorImage` com preview da imagem atual, botão "Gerar/Regerar com IA", e controles de Aparência e Transformação.

**Files:**
- Modify: `src/components/Editor.tsx` (adicionar função `InspectorImage` antes do return)

---

- [ ] **Step 1: Invoke `frontend-design` skill**

Use a ferramenta Skill com `skill: "frontend-design"`. Leia o checklist para "inspector panels / property panels". Depois prossiga.

---

- [ ] **Step 2: Criar a função `InspectorImage`**

Adicione logo após a função `InspectorText`:

```tsx
function InspectorImage({
  el, slideIdx, updateEl, onRegen,
}: {
  el: IElement;
  slideIdx: number;
  updateEl: (sIdx: number, elId: string, patch: Partial<IElement>) => void;
  onRegen: () => void;
}) {
  const upd = (patch: Partial<IElement>) => updateEl(slideIdx, el.id, patch);

  return (
    <>
      <InspectorHeader icon={<ImageIcon size={14} strokeWidth={1.5} />} label="Imagem" />

      {/* Preview */}
      <InspectorSection label="Imagem">
        {el.imageUrl || el.photoUrl ? (
          <div className="relative rounded-md overflow-hidden border border-border-subtle h-36 w-full group">
            <img
              src={el.imageUrl ?? el.photoUrl}
              alt=""
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-bg-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-fast">
              <Button variant="secondary" size="sm" onClick={onRegen} className="gap-1.5">
                <Sparkles size={14} strokeWidth={1.5} /> Regerar
              </Button>
            </div>
          </div>
        ) : (
          <div className="h-36 w-full rounded-md border border-dashed border-border-default flex flex-col items-center justify-center gap-2 text-text-tertiary">
            <ImageIcon size={24} strokeWidth={1.5} />
            <span className="text-caption">Nenhuma imagem</span>
          </div>
        )}
        <Button
          variant="secondary"
          size="sm"
          className="w-full gap-1.5"
          onClick={onRegen}
        >
          <Sparkles size={14} strokeWidth={1.5} />
          {el.imageUrl || el.photoUrl ? "Regerar com IA" : "Gerar com IA"}
        </Button>
      </InspectorSection>

      {/* Aparência */}
      <InspectorSection label="Aparência">
        <NumberInput
          label="Opacidade %"
          value={Math.round((el.opacity ?? 1) * 100)}
          min={0}
          max={100}
          onChange={(v) => upd({ opacity: v / 100 })}
        />
        <NumberInput
          label="Borda arredondada"
          value={el.radius ?? 0}
          min={0}
          max={200}
          onChange={(v) => upd({ radius: v })}
        />
      </InspectorSection>

      {/* Transformação */}
      <InspectorSection label="Posição e tamanho">
        <div className="grid grid-cols-2 gap-2">
          <NumberInput label="X" value={el.x ?? 0} onChange={(v) => upd({ x: v })} />
          <NumberInput label="Y" value={el.y ?? 0} onChange={(v) => upd({ y: v })} />
          <NumberInput label="Largura" value={el.w ?? 400} min={10} onChange={(v) => upd({ w: v })} />
          <NumberInput label="Altura" value={el.h ?? 400} min={10} onChange={(v) => upd({ h: v })} />
          <NumberInput label="Rotação" value={el.rotation ?? 0} min={-180} max={180} onChange={(v) => upd({ rotation: v })} />
          <NumberInput label="Opacidade %" value={Math.round((el.opacity ?? 1) * 100)} min={0} max={100} onChange={(v) => upd({ opacity: v / 100 })} />
        </div>
      </InspectorSection>
    </>
  );
}
```

---

- [ ] **Step 3: Verificação visual — Inspector Imagem**

Clique em um elemento de imagem no canvas.

Verifique:
- [ ] Inspector mostra header "Imagem" com ícone
- [ ] Se tem imagem: preview com hover overlay mostrando "Regerar"
- [ ] Se sem imagem: placeholder tracejado com ícone
- [ ] Botão "Gerar com IA" / "Regerar com IA" abre o RegenImageModal
- [ ] Opacidade e borda arredondada com NumberInput

---

- [ ] **Step 4: Commit**

```bash
git add src/components/Editor.tsx
git commit -m "feat(editor): Inspector image element panel (DESIGN 2.MD §3.6.4)"
```

---

## Task 10: Inspector — Elemento de Forma + Perfil

**Contexto:** Quando `el.type === "shape"`, mostra `InspectorShape` com preenchimento (ColorSwatch), opacidade, borda e arredondamento. Quando `el.type === "profile"`, mostra `InspectorProfile` com texto de handle, cor e fonte.

**Files:**
- Modify: `src/components/Editor.tsx` (adicionar funções `InspectorShape` e `InspectorProfile`)

---

- [ ] **Step 1: Invoke `frontend-design` skill**

Use a ferramenta Skill com `skill: "frontend-design"`. Depois prossiga.

---

- [ ] **Step 2: Criar `InspectorShape`**

Adicione após `InspectorImage`:

```tsx
function InspectorShape({
  el, slideIdx, updateEl,
}: {
  el: IElement;
  slideIdx: number;
  updateEl: (sIdx: number, elId: string, patch: Partial<IElement>) => void;
}) {
  const upd = (patch: Partial<IElement>) => updateEl(slideIdx, el.id, patch);

  return (
    <>
      <InspectorHeader icon={<Square size={14} strokeWidth={1.5} />} label="Forma" />

      {/* Preenchimento */}
      <InspectorSection label="Preenchimento">
        <ColorSwatch
          value={el.color ?? "#C6F84E"}
          onChange={(v) => upd({ color: v })}
          label="Cor de preenchimento"
        />
        <NumberInput
          label="Opacidade %"
          value={Math.round((el.opacity ?? 1) * 100)}
          min={0}
          max={100}
          onChange={(v) => upd({ opacity: v / 100 })}
        />
      </InspectorSection>

      {/* Borda */}
      <InspectorSection label="Arredondamento">
        <NumberInput
          label="Raio"
          value={el.radius ?? 0}
          min={0}
          max={500}
          onChange={(v) => upd({ radius: v })}
        />
      </InspectorSection>

      {/* Transformação */}
      <InspectorSection label="Posição e tamanho">
        <div className="grid grid-cols-2 gap-2">
          <NumberInput label="X" value={el.x ?? 0} onChange={(v) => upd({ x: v })} />
          <NumberInput label="Y" value={el.y ?? 0} onChange={(v) => upd({ y: v })} />
          <NumberInput label="Largura" value={el.w ?? 400} min={10} onChange={(v) => upd({ w: v })} />
          <NumberInput label="Altura" value={el.h ?? 200} min={10} onChange={(v) => upd({ h: v })} />
          <NumberInput label="Rotação" value={el.rotation ?? 0} min={-180} max={180} onChange={(v) => upd({ rotation: v })} />
          <NumberInput label="Opacidade %" value={Math.round((el.opacity ?? 1) * 100)} min={0} max={100} onChange={(v) => upd({ opacity: v / 100 })} />
        </div>
      </InspectorSection>
    </>
  );
}
```

---

- [ ] **Step 3: Criar `InspectorProfile`**

Adicione após `InspectorShape`:

```tsx
function InspectorProfile({
  el, slideIdx, updateEl,
}: {
  el: IElement;
  slideIdx: number;
  updateEl: (sIdx: number, elId: string, patch: Partial<IElement>) => void;
}) {
  const upd = (patch: Partial<IElement>) => updateEl(slideIdx, el.id, patch);

  return (
    <>
      <InspectorHeader
        icon={<span className="text-caption font-mono">@</span>}
        label="Perfil"
      />

      {/* Handle */}
      <InspectorSection label="Handle Instagram">
        <input
          type="text"
          className="w-full bg-bg-surface-2 border border-border-default rounded-xs px-3 py-1.5 text-body text-text-primary outline-none focus:border-accent transition-colors duration-fast"
          value={el.text ?? "@seuinstagram"}
          onChange={(e) => upd({ text: e.target.value })}
          placeholder="@seuinstagram"
        />
      </InspectorSection>

      {/* Cor do texto */}
      <InspectorSection label="Cor">
        <ColorSwatch
          value={el.color ?? "#FFFFFF"}
          onChange={(v) => upd({ color: v })}
          label="Cor do handle"
        />
      </InspectorSection>

      {/* Tamanho */}
      <InspectorSection label="Tipografia">
        <NumberInput
          label="Tamanho"
          value={el.fontSize ?? 28}
          min={12}
          max={120}
          onChange={(v) => upd({ fontSize: v })}
        />
        <ChipRow
          options={[
            { label: "Regular", value: 400 },
            { label: "Bold",    value: 700 },
          ]}
          value={el.weight ?? 700}
          onChange={(v) => upd({ weight: v as number })}
        />
      </InspectorSection>

      {/* Transformação */}
      <InspectorSection label="Posição">
        <div className="grid grid-cols-2 gap-2">
          <NumberInput label="X" value={el.x ?? 0} onChange={(v) => upd({ x: v })} />
          <NumberInput label="Y" value={el.y ?? 0} onChange={(v) => upd({ y: v })} />
        </div>
      </InspectorSection>
    </>
  );
}
```

---

- [ ] **Step 4: Verificação visual — Inspector Forma e Perfil**

Adicione uma forma e um perfil ao canvas. Clique em cada um.

Verifique:
- [ ] Forma: ColorSwatch mostra cor atual, muda ao interagir
- [ ] Forma: Arredondamento / Opacidade com NumberInput funcional
- [ ] Perfil: campo de texto com @handle
- [ ] Perfil: ColorSwatch + ChipRow de peso
- [ ] Todos os campos atualizam o canvas em tempo real

---

- [ ] **Step 5: Commit**

```bash
git add src/components/Editor.tsx
git commit -m "feat(editor): Inspector shape + profile panels (DESIGN 2.MD §3.6.5)"
```

---

## Task 11: AI Chat Panel — Slideout

**Contexto:** O painel de chat com o Agente de IA existe no Editor.tsx atual como um popup flutuante com CSS antigo. O redesign o transforma em um slideout de largura fixa (320px) que desliza da direita, com animação framer-motion, bubbles diferenciadas por role, e input com botão de envio.

**Files:**
- Modify: `src/components/Editor.tsx` (adicionar painel de chat como elemento condicional fixed dentro do return)

---

- [ ] **Step 1: Invoke `frontend-design` skill**

Use a ferramenta Skill com `skill: "frontend-design"`. Leia o checklist para "drawers / slideouts / panels". Depois prossiga.

---

- [ ] **Step 2: Verificar que framer-motion está instalado**

```bash
cat package.json | grep "framer-motion"
```

Esperado: deve mostrar `"framer-motion": "..."`. Se não estiver, instale com `npm install framer-motion`.

---

- [ ] **Step 3: Adicionar import de framer-motion no Editor.tsx**

No topo do arquivo, adicione (ou confirme que já existe):

```tsx
import { motion, AnimatePresence } from "framer-motion";
import { Send } from "lucide-react";
```

---

- [ ] **Step 4: Adicionar o painel de chat como fixed layer após o grid**

No return do Editor.tsx, logo após o `</div>` de fechamento do grid shell (o div com `h-screen overflow-hidden bg-bg-base`), adicione:

```tsx
{/* ── AI CHAT SLIDEOUT ── */}
<AnimatePresence>
  {chatOpen && (
    <motion.aside
      key="chat"
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-14 right-0 bottom-0 w-[320px] bg-bg-surface border-l border-border-subtle flex flex-col z-40"
      style={{ boxShadow: "-4px 0 24px rgba(0,0,0,0.4)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles size={16} strokeWidth={1.5} className="text-accent" />
          <span className="text-body-strong text-text-primary">Agente de edição</span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setChatOpen(false)} className="px-2">
          <X size={15} strokeWidth={1.5} />
        </Button>
      </div>

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
        {chatMsgs.map((m, i) => (
          <ChatBubble
            key={i}
            role={m.role}
            content={m.content}
          />
        ))}
        {chatStreaming && (
          <ChatBubble
            role="assistant"
            content={chatStreaming}
            streaming={true}
          />
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border-subtle p-3 shrink-0">
        <div className="flex gap-2">
          <input
            className="flex-1 bg-bg-surface-2 border border-border-default rounded-sm px-3 py-2 text-body text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent transition-colors duration-fast"
            placeholder="Mude o título do slide 2…"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendChat();
              }
            }}
          />
          <Button
            variant="primary"
            size="sm"
            onClick={sendChat}
            loading={chatLoading}
            className="px-2.5"
          >
            <Send size={14} strokeWidth={1.5} />
          </Button>
        </div>
        <p className="text-micro text-text-tertiary mt-1.5">
          Enter para enviar · Shift+Enter para nova linha
        </p>
      </div>
    </motion.aside>
  )}
</AnimatePresence>
```

---

- [ ] **Step 5: Verificação visual — AI Chat**

Abra um carrossel e clique no botão flutuante de Sparkles no bottom-right do canvas.

Verifique:
- [ ] Painel desliza da direita com animação 280ms (ease-out)
- [ ] Botão vira verde (bg-accent) quando chat está aberto
- [ ] Header: ícone Sparkles accent + "Agente de edição" + botão X
- [ ] Mensagens aparecem como bolhas diferenciadas (user: right accent-muted / assistant: left surface-2)
- [ ] Input + botão Send funcionam
- [ ] Fechar (X ou botão flutuante): painel desliza de volta para a direita
- [ ] Painel fica sobre o inspector (z-40, fixed)

---

- [ ] **Step 6: Commit**

```bash
git add src/components/Editor.tsx
git commit -m "feat(editor): AI Chat slideout panel (DESIGN 2.MD §3.7)"
```

---

## Task 12: Atalhos de Teclado do Editor

**Contexto:** O Editor já tem um useEffect para atalhos de teclado (provavelmente para Delete, Escape, undo). Esta task garante que todos os atalhos do DESIGN 2.MD §3.9 estejam implementados e funcionando.

**Files:**
- Modify: `src/components/Editor.tsx` (localizar e expandir o useEffect de keydown)

---

- [ ] **Step 1: Localizar o useEffect de teclado existente**

```bash
grep -n "keydown\|addEventListener" src/components/Editor.tsx | head -10
```

Localize o useEffect que faz `window.addEventListener("keydown", onKey)`. Leia seu conteúdo.

---

- [ ] **Step 2: Substituir o handler de teclado pelo handler completo**

Encontre o useEffect de keydown e substitua o body da função `onKey` por:

```tsx
useEffect(() => {
  function onKey(e: KeyboardEvent) {
    const meta = e.metaKey || e.ctrlKey;
    const tag = (e.target as HTMLElement).tagName;
    const isEditing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT"
      || (e.target as HTMLElement).isContentEditable;

    // ⌘S — Salvar
    if (meta && e.key === "s") {
      e.preventDefault();
      onSave(draft);
      return;
    }

    // ⌘Z — Desfazer
    if (meta && !e.shiftKey && e.key === "z") {
      e.preventDefault();
      undo();
      return;
    }

    // ⌘J — Toggle chat
    if (meta && e.key === "j") {
      e.preventDefault();
      setChatOpen((o) => !o);
      return;
    }

    // ⌘0 — Fit to screen
    if (meta && e.key === "0") {
      e.preventDefault();
      fitZoom();
      return;
    }

    // ← → — Navegar slides (quando não editando texto)
    if (!isEditing && !meta) {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setSelectedSlide((i) => Math.max(0, i - 1));
        setSelectedEl(null);
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setSelectedSlide((i) => Math.min(draft.slides.length - 1, i + 1));
        setSelectedEl(null);
        return;
      }
    }

    // Delete / Backspace — Deletar elemento selecionado
    if (!isEditing && (e.key === "Delete" || e.key === "Backspace") && selectedEl) {
      e.preventDefault();
      deleteEl(selectedSlide, selectedEl);
      return;
    }

    // Escape — Desselecionar elemento
    if (e.key === "Escape") {
      if (chatOpen) { setChatOpen(false); return; }
      setSelectedEl(null);
      return;
    }

    // ⌘D — Duplicar elemento
    if (meta && e.key === "d" && selectedEl && slide) {
      e.preventDefault();
      const elToDup = slide.elements.find((e2) => e2.id === selectedEl);
      if (elToDup) {
        const newEl = { ...elToDup, id: `e${Date.now()}`, x: (elToDup.x ?? 0) + 20, y: (elToDup.y ?? 0) + 20 };
        pushHistory();
        setDraft((d) => ({
          ...d,
          slides: d.slides.map((s, i) =>
            i === selectedSlide ? { ...s, elements: [...s.elements, newEl] } : s
          ),
        }));
        setSelectedEl(newEl.id);
      }
      return;
    }
  }

  window.addEventListener("keydown", onKey);
  return () => window.removeEventListener("keydown", onKey);
}, [draft, selectedSlide, selectedEl, history, chatOpen, slide]);
```

---

- [ ] **Step 3: Verificação dos atalhos**

Abra um carrossel no editor.

Verifique cada atalho:
- [ ] `⌘S` → botão Salvar aciona (badge muda para "Salvando…")
- [ ] `⌘Z` → desfaz última ação
- [ ] `⌘J` → abre/fecha painel AI Chat
- [ ] `← →` → navega entre slides (o slide ativo muda no filmstrip)
- [ ] `Delete` em elemento selecionado → remove o elemento
- [ ] `Escape` → desseleciona elemento ou fecha chat
- [ ] `⌘D` → duplica o elemento selecionado (aparece deslocado 20px)

---

- [ ] **Step 4: Commit**

```bash
git add src/components/Editor.tsx
git commit -m "feat(editor): full keyboard shortcut set (DESIGN 2.MD §3.9)"
```

---

## Task 13: QA Final — 12 Acceptance Criteria

**Contexto:** Verificação final de todos os 12 critérios de aceitação do DESIGN 2.MD §5. Scans automatizados + checklist visual.

**Files:** Nenhum (audit only — pode gerar pequenos commits de fix se necessário).

---

- [ ] **Step 1: Invoke `frontend-design` skill**

Use a ferramenta Skill com `skill: "frontend-design"`. Faça um pass de auto-review. Depois prossiga.

---

- [ ] **Step 2: Scan de hex literals proibidos**

```bash
grep -rnE '#[0-9a-fA-F]{6}' src/app/\(auth\)/register/page.tsx src/components/Editor.tsx src/components/editor/ | grep -vE '(tokens\.css|icon\.svg|Logo\.tsx)'
```

Esperado: sem resultados. Se houver hex, substitua pelo token correspondente da tabela em `DESIGN 2.MD §1`.

---

- [ ] **Step 3: Scan de shadows proibidas**

```bash
grep -rnE 'shadow-(sm|md|lg|xl|2xl)' src/app/\(auth\)/register/page.tsx src/components/Editor.tsx src/components/editor/
```

Esperado: zero resultados.

---

- [ ] **Step 4: Scan de `text-xs` proibido**

```bash
grep -rnE '\btext-xs\b' src/app/\(auth\)/register/page.tsx src/components/Editor.tsx src/components/editor/
```

Esperado: zero resultados.

---

- [ ] **Step 5: Verificação visual — Registro (6 critérios)**

```bash
npm run dev
```

Acesse `http://localhost:3000/register`:

- [ ] **AC1:** Split layout 40/60 visível em ≥ 1024px. Mobile: apenas formulário.
- [ ] **AC2:** Indicador de força aparece e atualiza em tempo real (4 barrinhas).
- [ ] **AC3:** reCAPTCHA renderiza com `theme: "dark"` quando habilitado.
- [ ] **AC4:** Erro da API exibe em bloco `state-danger`, não `alert` nativo.
- [ ] **AC5:** Sucesso redireciona para `/dashboard` imediatamente.
- [ ] **AC6:** Painel direito com frase estática monospace 56px + 3 métricas visível em lg+.

---

- [ ] **Step 6: Verificação visual — Editor (12 critérios)**

Acesse um carrossel no editor:

- [ ] **AC1:** Shell 4 zonas: topbar 56px, filmstrip 180px, inspector 280px, canvas flex-1.
- [ ] **AC2:** Topbar: título editável (cria underline accent ao clicar), badge status, undo/redo.
- [ ] **AC3:** Filmstrip: thumbnails 4:5, ativo com borda accent 2px, scroll vertical funcional.
- [ ] **AC4:** Canvas: fundo `#0A0A0B`, canvas centralizado com sombra, toolbar zoom flutuante.
- [ ] **AC5:** Inspector vazio: ícone cursor + "Selecione um elemento" + grid de botões de adição.
- [ ] **AC6:** Inspector texto: seções Conteúdo/Tipografia/Alinhamento/Cor/Transformação funcionais.
- [ ] **AC7:** Inspector imagem: preview com hover overlay "Regerar", botão Gerar/Regerar.
- [ ] **AC8:** Inspector forma: ColorSwatch de preenchimento, arredondamento, transformação.
- [ ] **AC9:** AI Chat: desliza da direita em 280ms, bolhas diferenciadas user/assistant.
- [ ] **AC10:** Nenhum hex literal nos arquivos novos (Step 2 confirma).
- [ ] **AC11:** `prefers-reduced-motion` no DevTools → todas as animações ficam instantâneas.
- [ ] **AC12:** Atalhos ⌘S, ⌘Z, ⌘J, Delete, Escape, ←/→ funcionam conforme documentado.

---

- [ ] **Step 7: Commit de fixes (se necessário)**

Se qualquer check falhou e foi corrigido:

```bash
git add -p
git commit -m "fix(design): QA fixes — DESIGN 2.MD acceptance criteria"
```

---

- [ ] **Step 8: Tag de baseline**

```bash
git tag design-v2
git log --oneline | head -15
```

Esperado: ver todos os commits deste plano no histórico.

---

## Resumo de Commits Esperados

| Commit | Task |
|---|---|
| `feat(editor): add inspector primitive components (DESIGN 2.MD §3.6)` | Task 1 |
| `feat(design): redesign Register as split layout 40/60 (DESIGN 2.MD §2)` | Task 2 |
| `feat(editor): add 4-zone CSS grid shell (DESIGN 2.MD §3.2)` | Task 3 |
| `feat(editor): redesign Topbar (DESIGN 2.MD §3.3)` | Task 4 |
| `feat(editor): redesign Filmstrip with thumbnails (DESIGN 2.MD §3.4)` | Task 5 |
| `feat(editor): redesign Canvas area + zoom toolbar (DESIGN 2.MD §3.5)` | Task 6 |
| `feat(editor): Inspector empty state + routing (DESIGN 2.MD §3.6.1)` | Task 7 |
| `feat(editor): Inspector text element panel (DESIGN 2.MD §3.6.3)` | Task 8 |
| `feat(editor): Inspector image element panel (DESIGN 2.MD §3.6.4)` | Task 9 |
| `feat(editor): Inspector shape + profile panels (DESIGN 2.MD §3.6.5)` | Task 10 |
| `feat(editor): AI Chat slideout panel (DESIGN 2.MD §3.7)` | Task 11 |
| `feat(editor): full keyboard shortcut set (DESIGN 2.MD §3.9)` | Task 12 |
| `fix(design): QA fixes — DESIGN 2.MD acceptance criteria` | Task 13 (se necessário) |
