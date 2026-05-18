# Monetização Funcional — Sprint A Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the SaaS monetization fully functional — Trial auto-setup on register, plan enforcement (Pro = 100 carousels/month, Studio = unlimited + Notícia PRO), Studio plan in checkout, Payment history, and upgrade page wired to real checkout.

**Architecture:** Add `studio` to User plan enum + monthly usage counter. Create `src/lib/planLimits.ts` as the single enforcement function called by all carousel creation endpoints. Add `Payment` model for history. Update AppConfig with `trialDays` and `mpStudioPriceReais`. Update webhook to handle Studio. Wire upgrade page buttons to real checkout. Block `/dashboard/news-pro` for non-Studio users.

**Tech Stack:** Next.js 14 App Router, TypeScript, MongoDB (Mongoose), MercadoPago API (existing integration), existing `getAppConfig()` pattern.

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/models/User.ts` | Modify | Add `studio` plan, `carouselsThisMonth`, `usageResetAt` |
| `src/models/AppConfig.ts` | Modify | Add `trialDays`, `mpStudioPriceReais` |
| `src/models/Payment.ts` | **Create** | Persist payment history from webhook |
| `src/lib/planLimits.ts` | **Create** | `checkCarouselLimit()` + `incrementCarouselCount()` |
| `src/app/api/auth/register/route.ts` | Modify | Use `cfg.trialDays` instead of hardcoded 7 |
| `src/app/api/carousel/generate/route.ts` | Modify | Call `checkCarouselLimit` before generating |
| `src/app/api/carousel/route.ts` | Modify | Call `checkCarouselLimit` before creating |
| `src/app/api/checkout/create/route.ts` | Modify | Accept `planType: "pro" \| "studio"`, use correct price |
| `src/app/api/webhooks/mercadopago/route.ts` | Modify | Handle Studio plan, persist Payment |
| `src/app/dashboard/upgrade/page.tsx` | Modify | Wire buttons to real checkout API |
| `src/app/dashboard/news-pro/page.tsx` | Modify | Block access for non-Studio users |
| `src/app/dashboard/layout.tsx` | Modify | Check Studio plan for news-pro route |

---

## Task 1: Update AppConfig model — add trialDays and mpStudioPriceReais

**Files:**
- Modify: `src/models/AppConfig.ts`

> **Context:** `AppConfig` is a singleton MongoDB document (key: "singleton"). Currently has `mpProPriceReais`. We need `trialDays` (default 7) and `mpStudioPriceReais` (default 149). The `getAppConfig()` upsert ensures new fields are available immediately.

- [ ] **Step 1: Add fields to the interface `IAppConfig`**

Open `src/models/AppConfig.ts`. Find the `IAppConfig` interface. After `mpProPriceReais: number;` add:

```typescript
mpStudioPriceReais: number;
trialDays: number;
```

- [ ] **Step 2: Add fields to the schema**

In `AppConfigSchema`, after `mpProPriceReais: { type: Number, default: 97 },` add:

```typescript
mpStudioPriceReais: { type: Number, default: 149 },
trialDays: { type: Number, default: 7 },
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd "/Users/r.montoya/Downloads/site teste - cópia/novacraft/saas"
npx tsc --noEmit 2>&1 | grep "AppConfig" | head -5
```
Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
git add src/models/AppConfig.ts
git commit -m "feat(config): add trialDays and mpStudioPriceReais to AppConfig"
```

---

## Task 2: Update User model — add studio plan and usage tracking

**Files:**
- Modify: `src/models/User.ts`

> **Context:** Currently `plan` enum is `["free", "pro"]`. Need to add `"studio"`. Also add `carouselsThisMonth` (reset monthly via lazy check) and `usageResetAt` (tracks when the month started). These fields default to 0/now for existing users.

- [ ] **Step 1: Update the IUser interface**

Open `src/models/User.ts`. Find `plan: "free" | "pro";`. Replace with:

```typescript
plan: "free" | "pro" | "studio";
carouselsThisMonth: number;
usageResetAt: Date;
```

- [ ] **Step 2: Update the schema**

Find `plan: { type: String, enum: ["free", "pro"], default: "free" },`. Replace with:

```typescript
plan: { type: String, enum: ["free", "pro", "studio"], default: "free" },
carouselsThisMonth: { type: Number, default: 0 },
usageResetAt: { type: Date, default: () => new Date() },
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep "User.ts\|error TS" | grep -v "api/src" | head -10
```
Expected: zero errors (some files that use `plan === "pro"` may need updating — fix them in later tasks).

- [ ] **Step 4: Commit**

```bash
git add src/models/User.ts
git commit -m "feat(user): add studio plan + carouselsThisMonth + usageResetAt fields"
```

---

## Task 3: Create Payment model

**Files:**
- Create: `src/models/Payment.ts`

> **Context:** MercadoPago webhook currently updates User but doesn't store payment history. The `/admin/revenue` page (Sprint B) needs this. Create a simple model now so the webhook can persist payments.

- [ ] **Step 1: Create `src/models/Payment.ts`**

```typescript
import mongoose, { Document, Model, Schema } from "mongoose";

export interface IPayment extends Document {
  userId: mongoose.Types.ObjectId;
  mpPaymentId: string;
  planType: "pro" | "studio";
  amountBRL: number;
  status: "approved" | "pending" | "rejected" | "cancelled";
  createdAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    mpPaymentId: { type: String, required: true, unique: true },
    planType: { type: String, enum: ["pro", "studio"], required: true },
    amountBRL: { type: Number, required: true },
    status: { type: String, enum: ["approved", "pending", "rejected", "cancelled"], required: true },
  },
  { timestamps: true }
);

const Payment: Model<IPayment> =
  mongoose.models.Payment ?? mongoose.model<IPayment>("Payment", PaymentSchema);

export default Payment;
```

- [ ] **Step 2: Verify compiles**

```bash
npx tsc --noEmit 2>&1 | grep "Payment" | head -5
```

- [ ] **Step 3: Commit**

```bash
git add src/models/Payment.ts
git commit -m "feat: add Payment model for MercadoPago history"
```

---

## Task 4: Create planLimits utility

**Files:**
- Create: `src/lib/planLimits.ts`

> **Context:** This is the single source of truth for plan enforcement. Called by any endpoint that creates a carousel. Uses lazy monthly reset — checks if `usageResetAt` is before the current month start; if so, resets counter. Returns `{ allowed: boolean; reason?: string }`.

- [ ] **Step 1: Create `src/lib/planLimits.ts`**

```typescript
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export type LimitResult =
  | { allowed: true }
  | { allowed: false; reason: "TRIAL_EXPIRED" | "LIMIT_REACHED" | "NO_PLAN" | "NO_STUDIO" };

export async function checkCarouselLimit(userId: string): Promise<LimitResult> {
  await connectDB();
  const user = await User.findById(userId).select(
    "plan planExpiresAt trialEndsAt carouselsThisMonth usageResetAt"
  );
  if (!user) return { allowed: false, reason: "NO_PLAN" };

  const now = new Date();
  const isInTrial = !!(user.trialEndsAt && new Date(user.trialEndsAt) > now);
  const isPro = user.plan === "pro" && !!(user.planExpiresAt && new Date(user.planExpiresAt) > now);
  const isStudio = user.plan === "studio" && !!(user.planExpiresAt && new Date(user.planExpiresAt) > now);

  // No valid access
  if (!isInTrial && !isPro && !isStudio) {
    return { allowed: false, reason: "TRIAL_EXPIRED" };
  }

  // Studio and trial: unlimited
  if (isStudio || isInTrial) return { allowed: true };

  // Pro: check monthly limit (100)
  if (isPro) {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const resetAt = user.usageResetAt ? new Date(user.usageResetAt) : new Date(0);

    // Lazy reset if usageResetAt is in a previous month
    if (resetAt < monthStart) {
      await User.findByIdAndUpdate(userId, {
        carouselsThisMonth: 0,
        usageResetAt: now,
      });
      return { allowed: true };
    }

    if ((user.carouselsThisMonth ?? 0) >= 100) {
      return { allowed: false, reason: "LIMIT_REACHED" };
    }
    return { allowed: true };
  }

  return { allowed: false, reason: "NO_PLAN" };
}

export async function incrementCarouselCount(userId: string): Promise<void> {
  await connectDB();
  await User.findByIdAndUpdate(userId, { $inc: { carouselsThisMonth: 1 } });
}

export function limitErrorResponse(reason: string): { error: string; reason: string } {
  if (reason === "LIMIT_REACHED") {
    return {
      error: "Limite de 100 carrosséis mensais atingido. Faça upgrade para o plano Studio.",
      reason,
    };
  }
  return {
    error: "Seu período de acesso expirou. Assine um plano para continuar.",
    reason,
  };
}
```

- [ ] **Step 2: Verify compiles**

```bash
npx tsc --noEmit 2>&1 | grep "planLimits" | head -5
```
Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/planLimits.ts
git commit -m "feat: add planLimits utility — checkCarouselLimit + incrementCarouselCount"
```

---

## Task 5: Update register route — use cfg.trialDays

**Files:**
- Modify: `src/app/api/auth/register/route.ts`

> **Context:** Register currently hardcodes 7 days trial: `new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)`. It already calls `getAppConfig()` to check reCAPTCHA. Reuse that `cfg` to read `trialDays`.

- [ ] **Step 1: Update trialEndsAt calculation**

Open `src/app/api/auth/register/route.ts`. Find:
```typescript
const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
```

Replace with:
```typescript
const trialDays = cfg.trialDays ?? 7;
const trialEndsAt = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);
```

- [ ] **Step 2: Verify `cfg` is in scope**

The `cfg` variable is already assigned earlier in the function via `const cfg = await getAppConfig();`. Confirm it exists before the `const existing = ...` line.

- [ ] **Step 3: Verify compiles**

```bash
npx tsc --noEmit 2>&1 | grep "register" | head -5
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/auth/register/route.ts
git commit -m "feat(register): use AppConfig.trialDays instead of hardcoded 7 days"
```

---

## Task 6: Enforce limits in carousel generate endpoint

**Files:**
- Modify: `src/app/api/carousel/generate/route.ts`

> **Context:** This is the main creation endpoint. Add `checkCarouselLimit` call right after auth check (before any DB work). On success, call `incrementCarouselCount` after carousel is saved. The `session.userId` is already available.

- [ ] **Step 1: Add import**

Open `src/app/api/carousel/generate/route.ts`. After existing imports add:

```typescript
import { checkCarouselLimit, incrementCarouselCount, limitErrorResponse } from "@/lib/planLimits";
```

- [ ] **Step 2: Add limit check after auth check**

Find the section right after:
```typescript
if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
```

Add immediately after it:
```typescript
const limitCheck = await checkCarouselLimit(session.userId);
if (!limitCheck.allowed) {
  const { error, reason } = limitErrorResponse(limitCheck.reason);
  return NextResponse.json({ error, reason }, { status: 403 });
}
```

- [ ] **Step 3: Add increment after carousel is saved**

Find where `carousel.status = "draft"` and `await carousel.save()` are called. After `await carousel.save();` add:

```typescript
await incrementCarouselCount(session.userId);
```

- [ ] **Step 4: Verify compiles**

```bash
npx tsc --noEmit 2>&1 | grep "generate/route" | head -5
```

- [ ] **Step 5: Commit**

```bash
git add src/app/api/carousel/generate/route.ts
git commit -m "feat(generate): enforce carousel plan limits before generation"
```

---

## Task 7: Enforce limits in carousel POST endpoint

**Files:**
- Modify: `src/app/api/carousel/route.ts`

> **Context:** The `POST /api/carousel` route creates carousels directly (not via AI). Same enforcement pattern as Task 6.

- [ ] **Step 1: Read the file to find the POST handler**

```bash
grep -n "POST\|session\|userId" "/Users/r.montoya/Downloads/site teste - cópia/novacraft/saas/src/app/api/carousel/route.ts" | head -15
```

- [ ] **Step 2: Add import**

```typescript
import { checkCarouselLimit, incrementCarouselCount, limitErrorResponse } from "@/lib/planLimits";
```

- [ ] **Step 3: Add limit check after auth in POST handler**

After `if (!session) return NextResponse.json(...)` in the POST handler:

```typescript
const limitCheck = await checkCarouselLimit(session.userId);
if (!limitCheck.allowed) {
  const { error, reason } = limitErrorResponse(limitCheck.reason);
  return NextResponse.json({ error, reason }, { status: 403 });
}
```

- [ ] **Step 4: Add increment after carousel creation**

After the carousel is created/saved, add:
```typescript
await incrementCarouselCount(session.userId);
```

- [ ] **Step 5: Verify compiles and commit**

```bash
npx tsc --noEmit 2>&1 | grep "carousel/route" | head -5
git add src/app/api/carousel/route.ts
git commit -m "feat(carousel): enforce plan limits on direct carousel creation"
```

---

## Task 8: Update checkout — support Studio plan

**Files:**
- Modify: `src/app/api/checkout/create/route.ts`

> **Context:** Currently only creates Pro checkout. Need to accept `planType: "pro" | "studio"` in the body and use the correct price from AppConfig. The `external_reference` (userId) is used by the webhook to identify the user; add `planType` to `metadata` so the webhook knows which plan to set.

- [ ] **Step 1: Update POST handler body parsing**

Open `src/app/api/checkout/create/route.ts`. Find:
```typescript
export async function POST() {
```

Change to accept body:
```typescript
export async function POST(req: NextRequest) {
  try {
    let planType: "pro" | "studio" = "pro";
    try {
      const body = await req.json();
      if (body.planType === "studio") planType = "studio";
    } catch { /* no body = default pro */ }
```

Add `req: NextRequest` to the import if not already present:
```typescript
import { NextRequest, NextResponse } from "next/server";
```

- [ ] **Step 2: Use correct price based on planType**

Find:
```typescript
unit_price: cfg.mpProPriceReais,
```

Replace with:
```typescript
unit_price: planType === "studio" ? cfg.mpStudioPriceReais : cfg.mpProPriceReais,
```

Find `title: "NovaCraft Pro — Plano Mensal"`. Replace with:
```typescript
title: planType === "studio"
  ? "NovaCraft Studio — Plano Mensal"
  : "NovaCraft Pro — Plano Mensal",
```

- [ ] **Step 3: Add planType to metadata for webhook**

Find `external_reference: session.userId,`. After it add:
```typescript
metadata: { planType },
```

- [ ] **Step 4: Verify compiles**

```bash
npx tsc --noEmit 2>&1 | grep "checkout/create" | head -5
```

- [ ] **Step 5: Commit**

```bash
git add src/app/api/checkout/create/route.ts
git commit -m "feat(checkout): support Studio plan type with correct pricing"
```

---

## Task 9: Update MercadoPago webhook — handle Studio + persist Payment

**Files:**
- Modify: `src/app/api/webhooks/mercadopago/route.ts`

> **Context:** Currently webhook sets `plan: "pro"` for all approved payments. Need to: (1) read `planType` from MP payment metadata to know if it's pro or studio, (2) persist to Payment model, (3) set correct plan.

- [ ] **Step 1: Add Payment import**

Add at the top:
```typescript
import Payment from "@/models/Payment";
```

- [ ] **Step 2: Update the payment type to include metadata and amount**

Find:
```typescript
const payment = await mpRes.json() as {
  status: string;
  external_reference: string;
  id: number;
};
```

Replace with:
```typescript
const payment = await mpRes.json() as {
  status: string;
  external_reference: string;
  id: number;
  transaction_amount: number;
  metadata?: { planType?: string };
};
```

- [ ] **Step 3: Update the approval handler**

Find:
```typescript
if (payment.status === "approved") {
  const planExpiresAt = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000);
  await User.findByIdAndUpdate(userId, {
    plan: "pro",
    mpPaymentId: String(payment.id),
    planExpiresAt,
  });
}
```

Replace with:
```typescript
if (payment.status === "approved") {
  const planType = payment.metadata?.planType === "studio" ? "studio" : "pro";
  const planExpiresAt = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000);
  await User.findByIdAndUpdate(userId, {
    plan: planType,
    mpPaymentId: String(payment.id),
    planExpiresAt,
  });
  // Persist payment history
  try {
    await Payment.findOneAndUpdate(
      { mpPaymentId: String(payment.id) },
      {
        userId,
        mpPaymentId: String(payment.id),
        planType,
        amountBRL: payment.transaction_amount ?? (planType === "studio" ? 149 : 49),
        status: "approved",
      },
      { upsert: true, new: true }
    );
  } catch (e) {
    console.error("[webhook/mp] Failed to persist payment:", e);
  }
} else if (["cancelled", "refunded", "charged_back"].includes(payment.status)) {
  await User.findByIdAndUpdate(userId, { plan: "free" });
  // Update payment status
  try {
    await Payment.findOneAndUpdate(
      { mpPaymentId: String(payment.id) },
      { status: "cancelled" }
    );
  } catch {}
}
```

- [ ] **Step 4: Verify compiles**

```bash
npx tsc --noEmit 2>&1 | grep "mercadopago\|Payment" | head -10
```

- [ ] **Step 5: Commit**

```bash
git add src/app/api/webhooks/mercadopago/route.ts
git commit -m "feat(webhook): handle Studio plan + persist Payment history"
```

---

## Task 10: Block Notícia PRO for non-Studio users

**Files:**
- Modify: `src/app/dashboard/news-pro/page.tsx`

> **Context:** `/dashboard/news-pro` should only be accessible to Studio plan users (and trial users). Pro users trying to access should see an upgrade prompt instead of the wizard.

- [ ] **Step 1: Add plan check API call**

In `src/app/dashboard/news-pro/page.tsx`, at the top of the `NewsProPage` component (inside the function body), add:

```typescript
const [planAllowed, setPlanAllowed] = React.useState<boolean | null>(null);

React.useEffect(() => {
  fetch("/api/user/plan-check")
    .then(r => r.json())
    .then(d => setPlanAllowed(d.hasNewsPro))
    .catch(() => setPlanAllowed(false));
}, []);
```

- [ ] **Step 2: Create the plan-check API route**

Create `src/app/api/user/plan-check/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ hasNewsPro: false }, { status: 401 });

  await connectDB();
  const user = await User.findById(session.userId).select("plan planExpiresAt trialEndsAt");
  if (!user) return NextResponse.json({ hasNewsPro: false });

  const now = new Date();
  const isInTrial = !!(user.trialEndsAt && new Date(user.trialEndsAt) > now);
  const isStudio = user.plan === "studio" && !!(user.planExpiresAt && new Date(user.planExpiresAt) > now);

  return NextResponse.json({ hasNewsPro: isInTrial || isStudio });
}
```

- [ ] **Step 3: Add gating UI in NewsProPage**

In the `return` statement of `NewsProPage`, wrap the existing content:

```tsx
// Add before the main return:
if (planAllowed === null) {
  return (
    <div className="bg-bg-base min-h-screen flex items-center justify-center">
      <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
    </div>
  );
}

if (planAllowed === false) {
  return (
    <div className="bg-bg-base min-h-screen flex items-center justify-center px-8">
      <div className="text-center max-w-md">
        <div className="text-5xl mb-6">🔒</div>
        <h2 className="text-display text-text-primary mb-3">Notícia PRO</h2>
        <p className="text-body text-text-secondary mb-6">
          Acesso ao feed de notícias com seleção de imagens é exclusivo do plano Studio.
        </p>
        <a
          href="/dashboard/upgrade"
          className="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-hover text-text-inverse font-medium rounded-xl transition-colors"
        >
          Ver planos → Studio
        </a>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify compiles**

```bash
npx tsc --noEmit 2>&1 | grep "news-pro\|plan-check" | head -10
```

- [ ] **Step 5: Commit**

```bash
git add src/app/dashboard/news-pro/page.tsx src/app/api/user/plan-check/route.ts
git commit -m "feat(news-pro): block access for non-Studio users with upgrade prompt"
```

---

## Task 11: Wire upgrade page to real checkout

**Files:**
- Modify: `src/app/dashboard/upgrade/page.tsx`

> **Context:** The upgrade page has buttons for Pro and Studio but they don't call the checkout API. The checkout API returns `{ checkoutUrl, sandboxUrl }`. We navigate to `checkoutUrl` (production) or `sandboxUrl` (sandbox mode). Add loading state per button.

- [ ] **Step 1: Read current button structure**

```bash
grep -n "Assinar\|button\|onClick\|href\|PLANS\|id.*pro\|id.*studio" "/Users/r.montoya/Downloads/site teste - cópia/novacraft/saas/src/app/dashboard/upgrade/page.tsx" | head -20
```

- [ ] **Step 2: Add checkout handler function**

In the component body, add:

```typescript
const [checkingOut, setCheckingOut] = React.useState<string | null>(null);

async function handleCheckout(planType: "pro" | "studio") {
  setCheckingOut(planType);
  try {
    const res = await fetch("/api/checkout/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planType }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Erro ao iniciar pagamento.");
      return;
    }
    const url = process.env.NODE_ENV === "production" ? data.checkoutUrl : data.sandboxUrl;
    window.location.href = url;
  } catch {
    alert("Erro de conexão. Tente novamente.");
  } finally {
    setCheckingOut(null);
  }
}
```

- [ ] **Step 3: Wire buttons**

Find the button for the Pro plan. It should call `handleCheckout("pro")`. Find the Studio button and wire `handleCheckout("studio")`. Add disabled and loading states:

```tsx
// Pro button:
<button
  onClick={() => handleCheckout("pro")}
  disabled={!!checkingOut}
  className="w-full py-3 bg-accent text-text-inverse rounded-xl font-medium hover:bg-accent-hover transition-colors disabled:opacity-50"
>
  {checkingOut === "pro" ? "Redirecionando…" : "Assinar Pro — R$49/mês"}
</button>

// Studio button:
<button
  onClick={() => handleCheckout("studio")}
  disabled={!!checkingOut}
  className="w-full py-3 bg-accent text-text-inverse rounded-xl font-medium hover:bg-accent-hover transition-colors disabled:opacity-50"
>
  {checkingOut === "studio" ? "Redirecionando…" : "Assinar Studio — R$149/mês"}
</button>
```

- [ ] **Step 4: Show usage info for active Pro users**

Add a fetch for current usage on mount. Show "X/100 carrosséis usados este mês" for Pro users:

```typescript
const [usage, setUsage] = React.useState<{ carouselsThisMonth: number; plan: string } | null>(null);

React.useEffect(() => {
  fetch("/api/user/profile")
    .then(r => r.json())
    .then(d => setUsage({ carouselsThisMonth: d.user?.carouselsThisMonth ?? 0, plan: d.user?.plan ?? "free" }))
    .catch(() => {});
}, []);
```

If `usage?.plan === "pro"`, show a small bar: `{usage.carouselsThisMonth}/100 carrosséis este mês`.

- [ ] **Step 5: Verify compiles and commit**

```bash
npx tsc --noEmit 2>&1 | grep "upgrade" | head -5
git add src/app/dashboard/upgrade/page.tsx
git commit -m "feat(upgrade): wire Pro and Studio checkout buttons to real MercadoPago API"
```

---

## Task 12: Add carouselsThisMonth to user profile API

**Files:**
- Modify: `src/app/api/user/profile/route.ts`

> **Context:** The upgrade page and dashboard need to show usage. The profile route should return `carouselsThisMonth` and `plan` fields.

- [ ] **Step 1: Read current profile route**

```bash
cat "/Users/r.montoya/Downloads/site teste - cópia/novacraft/saas/src/app/api/user/profile/route.ts" | head -40
```

- [ ] **Step 2: Add fields to the select**

Find the `.select(...)` call in the GET handler. Add `carouselsThisMonth plan planExpiresAt trialEndsAt` if not already present.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/user/profile/route.ts
git commit -m "feat(profile): include carouselsThisMonth and plan in profile response"
```

---

## Task 13: Handle 403 LIMIT_REACHED in dashboard

**Files:**
- Modify: `src/app/dashboard/page.tsx`

> **Context:** When `POST /api/carousel/generate` returns `{ reason: "LIMIT_REACHED" }`, the dashboard should show a toast with an upgrade prompt instead of a generic error.

- [ ] **Step 1: Find the generate call in dashboard**

```bash
grep -n "generate\|error\|reason\|showToast\|toast" "/Users/r.montoya/Downloads/site teste - cópia/novacraft/saas/src/app/dashboard/page.tsx" | head -20
```

- [ ] **Step 2: Update error handler**

Find where the generate API response is handled. After checking `!res.ok`, add:

```typescript
if (!res.ok) {
  const err = await res.json().catch(() => ({}));
  if (err.reason === "LIMIT_REACHED") {
    showToast("Limite de 100 carrosséis atingido. Faça upgrade para Studio.");
    // Optionally redirect:
    // router.push("/dashboard/upgrade");
  } else if (err.reason === "TRIAL_EXPIRED") {
    router.push("/dashboard/upgrade");
  } else {
    showToast(err.error || "Erro ao gerar carrossel.");
  }
  return;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat(dashboard): handle LIMIT_REACHED and TRIAL_EXPIRED errors with upgrade prompt"
```

---

## Task 14: Manual E2E test

**Files:** No code changes — testing only.

> **Context:** Verify the full monetization flow works end-to-end.

- [ ] **Step 1: Test new user trial setup**

Register a new account. Check in MongoDB:
```bash
# In mongosh or MongoDB Compass:
db.users.findOne({ email: "test@example.com" }, { trialEndsAt: 1, plan: 1, carouselsThisMonth: 1 })
```
Expected: `trialEndsAt` = ~7 days from now, `plan: "free"`, `carouselsThisMonth: 0`.

- [ ] **Step 2: Test carousel limit enforcement**

Use MongoDB Compass to manually set `plan: "pro"` and `planExpiresAt: <future date>` and `carouselsThisMonth: 100` on a test user.

Try to generate a carousel. Expected: error toast "Limite de 100 carrosséis mensais atingido."

- [ ] **Step 3: Test lazy reset**

Set `carouselsThisMonth: 100` and `usageResetAt: <last month>` on the Pro test user.

Try to generate a carousel. Expected: success (counter was reset).

- [ ] **Step 4: Test Notícia PRO gating**

With a Pro user (not Studio, not trial), navigate to `http://localhost:3000/dashboard/news-pro`.
Expected: upgrade prompt screen with "🔒 Notícia PRO" message.

With a Studio user or trial user: full wizard appears.

- [ ] **Step 5: Test upgrade page**

With `mpEnabled: true` in AppConfig and valid MP sandbox credentials, click "Assinar Pro".
Expected: redirect to MercadoPago checkout sandbox URL.

- [ ] **Step 6: Verify upgrade page shows usage**

As a Pro user with 45 carousels this month, open `/dashboard/upgrade`.
Expected: "45/100 carrosséis este mês" visible.
