# NovaCraft — Monetização, Admin Dashboard e Novas Features

**Data:** 2026-05-17  
**Status:** Aprovado para implementação  
**Sub-projetos:** A (Monetização) → B (Admin Dashboard) → C (Features Roadmap)

---

## Sub-projeto A — Monetização Funcional

### A.1 Planos e Limites

| Plano | Carrosséis/mês | Notícia (URL manual) | Notícia PRO (feed) | Preço |
|-------|---------------|----------------------|--------------------|-------|
| **Trial** | Ilimitado (X dias configurável) | ✅ | ✅ | Grátis |
| **Pro** | 100 | ✅ | ❌ | R$49/mês |
| **Studio** | Ilimitado | ✅ | ✅ | R$149/mês |

- Trial expira → bloqueia acesso, redireciona `/dashboard/upgrade`
- Pro com 100 carrosséis no mês → bloqueia criação com erro `LIMIT_REACHED`
- Studio → sem limite de carrosséis, acesso completo

### A.2 Mudanças no User Model

Adicionar ao schema `src/models/User.ts`:

```typescript
plan: { type: String, enum: ["free", "pro", "studio"], default: "free" }
carouselsThisMonth: { type: Number, default: 0 }
usageResetAt: { type: Date, default: () => new Date() }
```

Remover `"free"` como plano ativo pós-trial — usuário sem plano válido é redirecionado para upgrade. `"free"` só existe internamente como estado antes de comprar.

### A.3 Trial Automático no Registro

- No `POST /api/auth/register`: ao criar conta, setar `trialEndsAt = now + AppConfig.trialDays`
- `AppConfig` ganha campo: `trialDays: { type: Number, default: 7 }`
- Configurável pelo admin no painel (campo numérico em `/admin/config`)

### A.4 Enforcement de Limites

**Onde checar:** `POST /api/carousel/generate` e `POST /api/carousel` (qualquer criação de carrossel).

**Função auxiliar** `src/lib/planLimits.ts`:

```typescript
export async function checkCarouselLimit(userId: string): Promise<{ allowed: boolean; reason?: string }> {
  const user = await User.findById(userId).select("plan planExpiresAt trialEndsAt carouselsThisMonth usageResetAt");
  
  const now = new Date();
  
  // Check trial
  const isInTrial = user.trialEndsAt && new Date(user.trialEndsAt) > now;
  
  // Check active paid plan
  const isPro = user.plan === "pro" && user.planExpiresAt && new Date(user.planExpiresAt) > now;
  const isStudio = user.plan === "studio" && user.planExpiresAt && new Date(user.planExpiresAt) > now;
  
  if (!isInTrial && !isPro && !isStudio) {
    return { allowed: false, reason: "TRIAL_EXPIRED" };
  }
  
  if (isStudio || isInTrial) return { allowed: true }; // unlimited
  
  if (isPro) {
    // Lazy reset: if usageResetAt is in a previous month, reset counter
    const resetAt = new Date(user.usageResetAt);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    if (resetAt < monthStart) {
      await User.findByIdAndUpdate(userId, { carouselsThisMonth: 0, usageResetAt: now });
      return { allowed: true };
    }
    if (user.carouselsThisMonth >= 100) {
      return { allowed: false, reason: "LIMIT_REACHED" };
    }
    return { allowed: true };
  }
  
  return { allowed: false, reason: "NO_PLAN" };
}

export async function incrementCarouselCount(userId: string) {
  await User.findByIdAndUpdate(userId, { $inc: { carouselsThisMonth: 1 } });
}
```

**Em cada endpoint de criação:**
```typescript
const { allowed, reason } = await checkCarouselLimit(session.userId);
if (!allowed) {
  const msg = reason === "LIMIT_REACHED"
    ? "Limite de 100 carrosséis mensais atingido. Faça upgrade para Studio."
    : "Seu período de acesso expirou. Assine um plano para continuar.";
  return NextResponse.json({ error: msg, reason }, { status: 403 });
}
// ... cria carrossel ...
await incrementCarouselCount(session.userId);
```

### A.5 Bloqueio de Notícia PRO para não-Studio

`src/app/dashboard/news-pro/page.tsx` — verificar plano no load:

```typescript
// Server component ou API call no useEffect
// Se user.plan !== "studio" && !isInTrial → redirecionar /dashboard/upgrade com mensagem
```

Alternativa mais limpa: adicionar verificação no `layout.tsx` do dashboard baseado na rota.

### A.6 Página Upgrade Funcional

A página `/dashboard/upgrade` já existe com UI dos 3 planos. Tornar funcional:

- Botão "Assinar Pro" → `POST /api/checkout/create` (já implementado) → redireciona MercadoPago
- Botão "Assinar Studio" → `POST /api/checkout/create` com `planType: "studio"` → item diferente no MP
- Botão "Ver meu plano" para usuários já pagantes → mostra data de expiração e uso do mês
- Toast de erro quando `reason === "LIMIT_REACHED"` no dashboard

Modificação no `POST /api/checkout/create`: aceitar `planType: "pro" | "studio"` no body para criar preferência com preço correto.

### A.7 Webhook MercadoPago

Já existe em `src/app/api/webhooks/mercadopago/route.ts`. Verificar/adicionar:

- Ao receber pagamento aprovado: setar `plan`, `planExpiresAt = now + 30 dias`
- Ao receber `planType: "studio"`: setar `plan: "studio"`
- Persistir payment no DB (novo model `Payment`)

### A.8 Model Payment (novo)

```typescript
// src/models/Payment.ts
{
  userId: ObjectId,
  mpPaymentId: string,
  planType: "pro" | "studio",
  amountBRL: number,
  status: "approved" | "pending" | "rejected",
  createdAt: Date,
}
```

---

## Sub-projeto B — Admin Dashboard Completo

### B.1 Estrutura de Rotas

```
/admin                    → Dashboard principal (métricas)
/admin/users              → Gestão de usuários
/admin/carousels          → Gestão de carrosséis
/admin/revenue            → Receita e pagamentos
/admin/config             → Configurações (já existe — mantém + adiciona trialDays)
```

Layout compartilhado `/admin/layout.tsx` com sidebar de navegação e verificação `requireAdmin()`.

### B.2 Dashboard Principal `/admin`

**Métricas em tempo real** (API `GET /api/admin/stats` — já existe, expandir):

Cards de stat:
- Total usuários / Novos hoje / Novos esta semana
- Em trial / Pro / Studio / Banidos
- Total carrosséis / Criados hoje
- MRR estimado: `(proCount × 49) + (studioCount × 149)` em R$
- Taxa de conversão: `(pro + studio) / total × 100`%

Gráfico de crescimento de usuários (últimos 30 dias) — dados via `GET /api/admin/stats/growth`.

Ações rápidas:
- Toggle manutenção (já existe no config, expor aqui também)
- Campo de anúncio rápido com botão publicar

### B.3 Gestão de Usuários `/admin/users`

**Tabela paginada** (25/página) com colunas:
- Nome, Email, Plano (badge colorido), Trial restante (dias), Carrosséis (total), Registro, Status

**Filtros:**
- Plano: Todos / Trial / Pro / Studio / Expirado
- Status: Ativos / Banidos
- Busca: nome ou email (debounced 400ms)

**Ações por usuário** (menu ⋯ na linha):
- Banir / Desbanir
- Promover pra admin / Remover admin
- Alterar plano manualmente (Pro / Studio / sem plano)
- Estender trial: input de dias → `trialEndsAt += X dias`
- Ver carrosséis do usuário → link `/admin/carousels?userId=X`

**API necessária:** `GET /api/admin/users?page&limit&plan&q` — já existe parcialmente, expandir com filtros.

### B.4 Gestão de Carrosséis `/admin/carousels`

**Tabela paginada** com colunas:
- Título, Usuário (nome + email), Slides, Status, Data criação

**Filtros:** Status, Data (últimos 7d / 30d / tudo), busca por título/usuário

**Ações:**
- Ver no editor (link)
- Deletar (com confirm)

**API:** `GET /api/admin/carousels?page&limit&userId&q` — nova rota (já existe estrutura).

### B.5 Revenue `/admin/revenue`

**Requer:** model `Payment` persistido via webhook (Sub-projeto A).

**Métricas:**
- MRR atual (usuários pagantes ativos)
- Receita do mês corrente
- Receita total histórica
- Pagamentos com falha no mês

**Tabela de pagamentos:**
- Usuário, Plano, Valor (R$), Data, Status (badge: Aprovado / Pendente / Falhou)
- Paginada, filtro por status e data

**API:** `GET /api/admin/payments?page&limit&status` — nova rota.

### B.6 Adição ao `/admin/config`

Adicionar campo:
- **Dias de trial gratuito:** input numérico, default 7, salvo em `AppConfig.trialDays`
- **Preço Pro (R$):** já existe `mpProPriceReais`, expor aqui
- **Preço Studio (R$):** novo campo `mpStudioPriceReais`

### B.7 Design do Admin

- Layout sidebar escuro com itens: Dashboard, Usuários, Carrosséis, Receita, Configurações
- Badges de plano: Trial = amarelo, Pro = roxo, Studio = dourado, Expirado = vermelho
- Tabelas com hover state e ações rápidas acessíveis
- Usar design system existente (`bg-bg-surface`, `border-border-subtle`, `text-accent`)
- Responsivo mas prioridade desktop

---

## Sub-projeto C — Features Roadmap

### C.1 Alta prioridade (implementar em seguida)

| Feature | Descrição | Complexidade |
|---------|-----------|--------------|
| **Pastas / Coleções** | Organizar carrosséis por tema/campanha. Filtro no dashboard. | Baixa |
| **Duplicar carrossel** | Clone como base pra novo. Menu ⋯ no card da dashboard. | Baixa |
| **Export PDF** | Todos os slides como PDF. `html2canvas` + jsPDF (já tem html2canvas). | Média |
| **Reescritor de Tom** | Botão no editor: regera carrossel com tom diferente (viral / técnico / formal). | Baixa |
| **Título Viral Generator** | Botão no editor: IA sugere 10 títulos alternativos pra capa. Clique pra aplicar. | Baixa |

### C.2 Média prioridade

| Feature | Descrição | Complexidade |
|---------|-----------|--------------|
| **Modo Série** | Criar 3–5 carrosséis de uma vez com identidade visual consistente sobre um tema. | Média |
| **Trends Feed** | Aba mostrando trending topics (Google Trends API). Clique → cria carrossel. | Média |
| **Auto-contexto** | IA analisa últimos 10 carrosséis e atualiza contexto de marca automaticamente. | Média |
| **Galeria Pública** | Carrosséis marcados como públicos aparecem em feed descoberta. | Alta |
| **Agendamento** | Fila de publicação com data/hora. Integração Instagram Graph API. | Alta |

### C.3 Roadmap futuro

| Feature | Descrição |
|---------|-----------|
| **Performance Tracking** | Conectar Instagram Insights, ver alcance/saves por carrossel. |
| **Templates de Comunidade** | Usuários publicam templates, outros podem usar. |
| **Histórico de Versões** | Snapshots automáticos ao salvar. Restaurar versão anterior. |
| **Modo Agência** | Um usuário gerencia sub-contas de clientes. |
| **A/B Testing de Capa** | Gerar 2 variações de capa, comparar performance. |

---

## Ordem de Implementação Recomendada

```
Sprint 1 (Sub-projeto A):
  1. Payment model
  2. planLimits.ts (checkCarouselLimit + increment)
  3. User model update (carouselsThisMonth, usageResetAt, studio plan)
  4. AppConfig update (trialDays, mpStudioPriceReais)
  5. Registro: auto-setar trialEndsAt
  6. Enforcement nos endpoints de criação
  7. Bloqueio Notícia PRO para não-Studio
  8. Checkout/webhook update para Studio
  9. Upgrade page funcional

Sprint 2 (Sub-projeto B):
  10. Admin layout + sidebar
  11. Dashboard /admin (stats expandidos)
  12. /admin/users (tabela + filtros + ações)
  13. /admin/carousels (tabela + filtros)
  14. /admin/revenue (tabela de payments)
  15. /admin/config update (trialDays, preços)

Sprint 3 (Sub-projeto C — alta prioridade):
  16. Duplicar carrossel
  17. Pastas/Coleções
  18. Reescritor de Tom
  19. Título Viral Generator
  20. Export PDF
```

---

## Arquivos a Criar / Modificar

| Arquivo | Ação |
|---------|------|
| `src/models/Payment.ts` | Criar |
| `src/models/User.ts` | Modificar — adicionar campos |
| `src/models/AppConfig.ts` | Modificar — trialDays, mpStudioPriceReais |
| `src/lib/planLimits.ts` | Criar |
| `src/app/api/auth/register/route.ts` | Modificar — setar trialEndsAt |
| `src/app/api/carousel/generate/route.ts` | Modificar — checkCarouselLimit |
| `src/app/api/carousel/route.ts` | Modificar — checkCarouselLimit |
| `src/app/api/checkout/create/route.ts` | Modificar — planType Studio |
| `src/app/api/webhooks/mercadopago/route.ts` | Modificar — persistir Payment, Studio |
| `src/app/api/admin/stats/route.ts` | Modificar — expandir métricas |
| `src/app/api/admin/users/route.ts` | Modificar — filtros, paginação |
| `src/app/api/admin/carousels/route.ts` | Criar |
| `src/app/api/admin/payments/route.ts` | Criar |
| `src/app/admin/layout.tsx` | Criar |
| `src/app/admin/page.tsx` | Criar — dashboard principal |
| `src/app/admin/users/page.tsx` | Criar |
| `src/app/admin/carousels/page.tsx` | Criar |
| `src/app/admin/revenue/page.tsx` | Criar |
| `src/app/dashboard/upgrade/page.tsx` | Modificar — tornar funcional |
| `src/app/dashboard/news-pro/page.tsx` | Modificar — bloquear para não-Studio |
