# MercadoPago → Stripe Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace MercadoPago with Stripe Checkout for Pro (R$49/mês) and Studio (R$149/mês) subscriptions, preserving all existing plan enforcement, Payment history, and admin revenue pages.

**Architecture:** Install `stripe` npm package. Replace MP-specific fields in AppConfig with Stripe keys (`stripeSecretKey`, `stripeWebhookSecret`, `stripeProPriceId`, `stripeStudioPriceId`). Replace `POST /api/checkout/create` to create a Stripe Checkout Session (redirect-based). Replace `POST /api/webhooks/mercadopago` with `POST /api/webhooks/stripe` listening for `checkout.session.completed` and `customer.subscription.deleted`. Delete MP-only files/routes. Update Payment model field name from `mpPaymentId` to `stripePaymentId`. Update admin config page with Stripe fields. Update upgrade page to use new checkout URL response.

**Tech Stack:** Next.js 14 App Router, TypeScript, MongoDB/Mongoose, `stripe` npm package (server-side only), Stripe Checkout (hosted page, no frontend Stripe.js needed), Stripe webhooks with `stripe.webhooks.constructEvent`.

---

## Pre-requisites (manual steps before running tasks)

1. Create a Stripe account at https://stripe.com
2. In Stripe Dashboard → Products, create two recurring products:
   - **NovaCraft Pro** — R$49/month → copy the **Price ID** (starts with `price_`)
   - **NovaCraft Studio** — R$149/month → copy the **Price ID**
3. In Stripe Dashboard → Developers → API Keys, copy the **Secret Key** (`sk_live_...` or `sk_test_...`)
4. Add to `.env` (do NOT commit):
   ```
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_... (fill after Task 6)
   STRIPE_PRO_PRICE_ID=price_...
   STRIPE_STUDIO_PRICE_ID=price_...
   ```

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/models/AppConfig.ts` | Modify | Replace MP fields with Stripe fields |
| `src/models/Payment.ts` | Modify | Rename `mpPaymentId` → `stripePaymentId` |
| `src/models/User.ts` | Modify | Rename `mpPaymentId` → `stripePaymentId` |
| `src/app/api/checkout/create/route.ts` | Rewrite | Create Stripe Checkout Session |
| `src/app/api/checkout/success/route.ts` | Delete | MP-specific redirect handler — Stripe uses webhooks |
| `src/app/api/webhooks/mercadopago/route.ts` | Delete | Replaced by Stripe webhook |
| `src/app/api/webhooks/stripe/route.ts` | Create | Handle `checkout.session.completed`, `customer.subscription.deleted` |
| `src/app/admin/config/page.tsx` | Modify | Replace MP fields with Stripe fields |
| `src/app/dashboard/upgrade/page.tsx` | Modify | Use `checkoutUrl` directly (no sandboxUrl fallback needed) |

---

## Task 1: Install Stripe package

**Files:**
- Modify: `package.json` (via npm install)

- [ ] **Step 1: Install stripe**

```bash
cd "/Users/r.montoya/Downloads/site teste - cópia/novacraft/saas"
npm install stripe
```

Expected output: `added 1 package` (stripe has no sub-dependencies).

- [ ] **Step 2: Verify types are available**

```bash
cd "/Users/r.montoya/Downloads/site teste - cópia/novacraft/saas"
npx tsc --noEmit 2>&1 | grep "stripe" | head -5
```

Expected: no errors (stripe ships its own types).

- [ ] **Step 3: Commit**

```bash
cd "/Users/r.montoya/Downloads/site teste - cópia/novacraft/saas"
git add package.json package-lock.json
git commit -m "chore: install stripe package"
```

---

## Task 2: Update AppConfig model — replace MP fields with Stripe fields

**Files:**
- Modify: `src/models/AppConfig.ts`

> **Context:** Current AppConfig has `mpAccessToken`, `mpPublicKey`, `mpWebhookSecret`, `mpEnabled`, `mpProPriceReais`, `mpStudioPriceReais`. Replace all with Stripe equivalents. Keep `trialDays` and all non-MP fields untouched.

- [ ] **Step 1: Read current file**

```bash
cat "/Users/r.montoya/Downloads/site teste - cópia/novacraft/saas/src/models/AppConfig.ts"
```

- [ ] **Step 2: Replace the IAppConfig interface MP section**

In `src/models/AppConfig.ts`, find the MP block in the interface:

```typescript
  // Mercado Pago
  mpAccessToken: string;
  mpPublicKey: string;
  mpWebhookSecret: string;
  mpEnabled: boolean;
  mpProPriceReais: number;
  mpStudioPriceReais: number;
  trialDays: number;
```

Replace with:

```typescript
  // Stripe
  stripeSecretKey: string;
  stripeWebhookSecret: string;
  stripeProPriceId: string;
  stripeStudioPriceId: string;
  stripeEnabled: boolean;
  trialDays: number;
```

- [ ] **Step 3: Replace the AppConfigSchema MP fields**

Find:

```typescript
  mpAccessToken: { type: String, default: "" },
  mpPublicKey: { type: String, default: "" },
  mpWebhookSecret: { type: String, default: "" },
  mpEnabled: { type: Boolean, default: false },
  mpProPriceReais: { type: Number, default: 97 },
  mpStudioPriceReais: { type: Number, default: 149 },
  trialDays: { type: Number, default: 7 },
```

Replace with:

```typescript
  stripeSecretKey: { type: String, default: "" },
  stripeWebhookSecret: { type: String, default: "" },
  stripeProPriceId: { type: String, default: "" },
  stripeStudioPriceId: { type: String, default: "" },
  stripeEnabled: { type: Boolean, default: false },
  trialDays: { type: Number, default: 7 },
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd "/Users/r.montoya/Downloads/site teste - cópia/novacraft/saas"
npx tsc --noEmit 2>&1 | grep "AppConfig\|error TS" | grep -v "api/src" | head -20
```

Expected: errors referencing MP fields in OTHER files (checkout/create, webhooks, admin config) — that's expected, we fix those in later tasks. Zero errors about AppConfig.ts itself.

- [ ] **Step 5: Commit**

```bash
cd "/Users/r.montoya/Downloads/site teste - cópia/novacraft/saas"
git add src/models/AppConfig.ts
git commit -m "feat(config): replace MercadoPago fields with Stripe fields in AppConfig"
```

---

## Task 3: Update Payment model — rename mpPaymentId → stripePaymentId

**Files:**
- Modify: `src/models/Payment.ts`
- Modify: `src/models/User.ts`

> **Context:** `Payment.mpPaymentId` is the unique MP payment ID used for upsert deduplication. Rename to `stripePaymentId` (will hold Stripe session or payment intent ID). `User.mpPaymentId` tracks the user's last payment ID — same rename.

- [ ] **Step 1: Update Payment model**

Open `src/models/Payment.ts`. Replace the entire file with:

```typescript
import mongoose, { Document, Model, Schema } from "mongoose";

export interface IPayment extends Document {
  userId: mongoose.Types.ObjectId;
  stripePaymentId: string;
  planType: "pro" | "studio";
  amountBRL: number;
  status: "approved" | "pending" | "rejected" | "cancelled";
  createdAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    stripePaymentId: { type: String, required: true, unique: true },
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

- [ ] **Step 2: Update User model**

Open `src/models/User.ts`. Find:

```typescript
  mpPaymentId?: string;
```

Replace with:

```typescript
  stripePaymentId?: string;
```

In `UserSchema`, find:

```typescript
  mpPaymentId: { type: String },
```

Replace with:

```typescript
  stripePaymentId: { type: String },
```

(If that exact schema field doesn't exist as a separate line, search for `mpPaymentId` anywhere in the schema and rename it.)

- [ ] **Step 3: Verify compiles**

```bash
cd "/Users/r.montoya/Downloads/site teste - cópia/novacraft/saas"
npx tsc --noEmit 2>&1 | grep "Payment.ts\|User.ts\|mpPaymentId" | grep -v "api/src" | head -10
```

Expected: errors about `mpPaymentId` in the webhook and checkout/success routes — fix in later tasks. No errors inside Payment.ts or User.ts themselves.

- [ ] **Step 4: Commit**

```bash
cd "/Users/r.montoya/Downloads/site teste - cópia/novacraft/saas"
git add src/models/Payment.ts src/models/User.ts
git commit -m "feat: rename mpPaymentId → stripePaymentId in Payment and User models"
```

---

## Task 4: Rewrite checkout/create route — Stripe Checkout Session

**Files:**
- Rewrite: `src/app/api/checkout/create/route.ts`

> **Context:** Stripe Checkout works by creating a Session server-side, then redirecting the user to `session.url`. The session carries `metadata: { userId, planType }` so the webhook can identify the user. The existing route returns `{ checkoutUrl, sandboxUrl }` — keep `checkoutUrl` in the response (upgrade page uses it). `stripeSecretKey` comes from `cfg.stripeSecretKey` (AppConfig) or fallback to env var `STRIPE_SECRET_KEY`. Price IDs come from `cfg.stripeProPriceId` / `cfg.stripeStudioPriceId` or env vars `STRIPE_PRO_PRICE_ID` / `STRIPE_STUDIO_PRICE_ID`.

- [ ] **Step 1: Rewrite the file**

Replace the entire content of `src/app/api/checkout/create/route.ts` with:

```typescript
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { connectDB } from "@/lib/mongodb";
import { getSessionUser } from "@/lib/auth";
import User from "@/models/User";
import { getAppConfig } from "@/models/AppConfig";

export async function POST(req: NextRequest) {
  try {
    let planType: "pro" | "studio" = "pro";
    try {
      const body = await req.json();
      if (body.planType === "studio") planType = "studio";
    } catch { /* no body = default pro */ }

    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    await connectDB();

    const [user, cfg] = await Promise.all([
      User.findById(session.userId).select("email plan name"),
      getAppConfig(),
    ]);

    if (!user) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });

    if (user.plan === planType) {
      return NextResponse.json({
        error: `Você já tem o plano ${planType === "studio" ? "Studio" : "Pro"}.`,
      }, { status: 400 });
    }

    const secretKey = cfg.stripeSecretKey || process.env.STRIPE_SECRET_KEY;
    if (!secretKey || !cfg.stripeEnabled) {
      return NextResponse.json({ error: "Pagamentos não configurados ainda." }, { status: 503 });
    }

    const priceId = planType === "studio"
      ? (cfg.stripeStudioPriceId || process.env.STRIPE_STUDIO_PRICE_ID)
      : (cfg.stripeProPriceId || process.env.STRIPE_PRO_PRICE_ID);

    if (!priceId) {
      return NextResponse.json({ error: "Price ID do plano não configurado." }, { status: 503 });
    }

    const stripe = new Stripe(secretKey, { apiVersion: "2025-04-30.basil" });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: user.email,
      success_url: `${baseUrl}/dashboard?plan=activated`,
      cancel_url: `${baseUrl}/dashboard/upgrade?plan=cancelled`,
      metadata: {
        userId: session.userId,
        planType,
      },
      subscription_data: {
        metadata: {
          userId: session.userId,
          planType,
        },
      },
    });

    return NextResponse.json({ checkoutUrl: checkoutSession.url });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro interno";
    console.error("[checkout/create]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verify compiles**

```bash
cd "/Users/r.montoya/Downloads/site teste - cópia/novacraft/saas"
npx tsc --noEmit 2>&1 | grep "checkout/create\|error TS" | grep -v "api/src" | head -10
```

Expected: zero errors on this file.

- [ ] **Step 3: Commit**

```bash
cd "/Users/r.montoya/Downloads/site teste - cópia/novacraft/saas"
git add src/app/api/checkout/create/route.ts
git commit -m "feat(checkout): rewrite to use Stripe Checkout Session"
```

---

## Task 5: Create Stripe webhook handler

**Files:**
- Create: `src/app/api/webhooks/stripe/route.ts`

> **Context:** Stripe sends `checkout.session.completed` when a subscription payment succeeds. The session has `metadata.userId` and `metadata.planType`. We also handle `customer.subscription.deleted` to reset user to free plan. Signature verification uses `stripe.webhooks.constructEvent` with the raw request body — **must** use `req.text()` not `req.json()` for this. The webhook secret comes from `cfg.stripeWebhookSecret` or env var `STRIPE_WEBHOOK_SECRET`.

- [ ] **Step 1: Create the directory and file**

```bash
mkdir -p "/Users/r.montoya/Downloads/site teste - cópia/novacraft/saas/src/app/api/webhooks/stripe"
```

- [ ] **Step 2: Write the webhook handler**

Create `src/app/api/webhooks/stripe/route.ts` with:

```typescript
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Payment from "@/models/Payment";
import { getAppConfig } from "@/models/AppConfig";

export const maxDuration = 30;

// Stripe requires the raw body for signature verification
export const config = { api: { bodyParser: false } };

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const cfg = await getAppConfig();

    const webhookSecret = cfg.stripeWebhookSecret || process.env.STRIPE_WEBHOOK_SECRET;
    const secretKey = cfg.stripeSecretKey || process.env.STRIPE_SECRET_KEY;

    if (!secretKey) {
      console.error("[webhook/stripe] Stripe secret key not configured");
      return NextResponse.json({ ok: false }, { status: 500 });
    }

    const stripe = new Stripe(secretKey, { apiVersion: "2025-04-30.basil" });

    const body = await req.text();
    const sig = req.headers.get("stripe-signature") ?? "";

    let event: Stripe.Event;
    try {
      if (webhookSecret) {
        event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
      } else {
        // No webhook secret configured — parse without verification (dev only)
        event = JSON.parse(body) as Stripe.Event;
        console.warn("[webhook/stripe] No webhook secret — skipping signature verification");
      }
    } catch (err) {
      console.error("[webhook/stripe] Signature verification failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const userId = session.metadata?.userId;
      const planType = (session.metadata?.planType === "studio" ? "studio" : "pro") as "pro" | "studio";

      if (!userId) {
        console.warn("[webhook/stripe] checkout.session.completed missing userId in metadata");
        return NextResponse.json({ ok: true });
      }

      const planExpiresAt = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000);

      await User.findByIdAndUpdate(userId, {
        plan: planType,
        stripePaymentId: session.id,
        planExpiresAt,
      });

      const amountBRL = session.amount_total ? session.amount_total / 100 : (planType === "studio" ? 149 : 49);

      try {
        await Payment.findOneAndUpdate(
          { stripePaymentId: session.id },
          {
            userId,
            stripePaymentId: session.id,
            planType,
            amountBRL,
            status: "approved",
          },
          { upsert: true, new: true }
        );
      } catch (e) {
        console.error("[webhook/stripe] Failed to persist Payment:", e);
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;

      if (userId) {
        await User.findByIdAndUpdate(userId, { plan: "free" });
        console.log(`[webhook/stripe] Subscription cancelled for user ${userId}`);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[webhook/stripe]", err);
    return NextResponse.json({ ok: true }); // always 200 so Stripe doesn't retry indefinitely
  }
}
```

- [ ] **Step 3: Verify compiles**

```bash
cd "/Users/r.montoya/Downloads/site teste - cópia/novacraft/saas"
npx tsc --noEmit 2>&1 | grep "webhook/stripe\|error TS" | grep -v "api/src" | head -10
```

Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
cd "/Users/r.montoya/Downloads/site teste - cópia/novacraft/saas"
git add src/app/api/webhooks/stripe/route.ts
git commit -m "feat(webhook): add Stripe webhook handler for subscription events"
```

---

## Task 6: Delete MP-specific routes

**Files:**
- Delete: `src/app/api/webhooks/mercadopago/route.ts`
- Delete: `src/app/api/checkout/success/route.ts` (MP-specific redirect handler)

> **Context:** The MP webhook is replaced by the Stripe webhook. The MP success redirect (`/api/checkout/success`) handled the MP `back_urls.success` redirect — Stripe uses `success_url` directly to the dashboard, so this route is no longer needed.

- [ ] **Step 1: Delete MP webhook**

```bash
rm "/Users/r.montoya/Downloads/site teste - cópia/novacraft/saas/src/app/api/webhooks/mercadopago/route.ts"
rmdir "/Users/r.montoya/Downloads/site teste - cópia/novacraft/saas/src/app/api/webhooks/mercadopago" 2>/dev/null || true
```

- [ ] **Step 2: Delete MP success redirect**

```bash
rm "/Users/r.montoya/Downloads/site teste - cópia/novacraft/saas/src/app/api/checkout/success/route.ts"
rmdir "/Users/r.montoya/Downloads/site teste - cópia/novacraft/saas/src/app/api/checkout/success" 2>/dev/null || true
```

- [ ] **Step 3: Verify no references remain to deleted routes**

```bash
grep -rn "mercadopago\|checkout/success\|mpAccessToken\|mpEnabled\|mpWebhookSecret\|mpPublicKey\|mpProPriceReais\|mpStudioPriceReais" \
  "/Users/r.montoya/Downloads/site teste - cópia/novacraft/saas/src/" \
  --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "node_modules"
```

Expected: only `src/app/admin/config/page.tsx` references (fixed in Task 7). If anything else shows up, fix it before continuing.

- [ ] **Step 4: Verify compiles**

```bash
cd "/Users/r.montoya/Downloads/site teste - cópia/novacraft/saas"
npx tsc --noEmit 2>&1 | grep "error TS" | grep -v "api/src" | head -10
```

Expected: zero errors (admin/config still has MP field references but they are `string` types that TypeScript won't error on until we remove them from the interface — which we already did in Task 2, so you may see errors here about `mpAccessToken` etc. being unknown properties. If so, they are in admin/config/page.tsx only — acceptable, fixed in Task 7).

- [ ] **Step 5: Commit**

```bash
cd "/Users/r.montoya/Downloads/site teste - cópia/novacraft/saas"
git add -A
git commit -m "chore: delete MercadoPago webhook and checkout/success routes"
```

---

## Task 7: Update admin config page — replace MP fields with Stripe fields

**Files:**
- Modify: `src/app/admin/config/page.tsx`

> **Context:** The config page has a "MercadoPago" section with fields: Access Token, Public Key, Webhook Secret, mpEnabled toggle, Preço Pro, Preço Studio. Replace with a "Stripe" section containing: Secret Key (password input), Webhook Secret (password input), Pro Price ID (text), Studio Price ID (text), stripeEnabled toggle. The save button already calls `/api/admin/config` PUT — keep that, just change which fields are sent.

- [ ] **Step 1: Read the current file**

```bash
cat "/Users/r.montoya/Downloads/site teste - cópia/novacraft/saas/src/app/admin/config/page.tsx"
```

- [ ] **Step 2: Update the AppConfig interface in the page**

Find the interface at the top of the file:

```typescript
interface AppConfig {
  ...
  mpAccessToken: string;
  mpPublicKey: string;
  mpWebhookSecret: string;
  mpEnabled: boolean;
  mpProPriceReais: number;
  mpStudioPriceReais: number;
  ...
}
```

Replace those fields with:

```typescript
  stripeSecretKey: string;
  stripeWebhookSecret: string;
  stripeProPriceId: string;
  stripeStudioPriceId: string;
  stripeEnabled: boolean;
```

- [ ] **Step 3: Update the state initializer**

Find the block that initializes cfg from fetched data (inside the `useEffect`/`fetch` callback). Replace MP field initializations:

```typescript
          mpAccessToken: d.mpAccessToken ?? "",
          mpPublicKey: d.mpPublicKey ?? "",
          mpWebhookSecret: d.mpWebhookSecret ?? "",
          mpEnabled: d.mpEnabled ?? false,
          mpProPriceReais: d.mpProPriceReais ?? 97,
          mpStudioPriceReais: d.mpStudioPriceReais ?? 149,
```

With:

```typescript
          stripeSecretKey: d.stripeSecretKey ?? "",
          stripeWebhookSecret: d.stripeWebhookSecret ?? "",
          stripeProPriceId: d.stripeProPriceId ?? "",
          stripeStudioPriceId: d.stripeStudioPriceId ?? "",
          stripeEnabled: d.stripeEnabled ?? false,
```

- [ ] **Step 4: Replace the MercadoPago UI section**

Find the entire MercadoPago card section (starts with something like `{/* ── MercadoPago */}` or the card containing the MP toggle). Replace the entire MP card JSX with:

```tsx
      {/* ── Stripe ── */}
      <div style={cardS}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={sectionTitleS}>Stripe</h2>
          <Toggle
            label={cfg.stripeEnabled ? "Pagamentos ativos" : "Pagamentos desativados"}
            on={cfg.stripeEnabled}
            onChange={() => set("stripeEnabled", !cfg.stripeEnabled)}
          />
        </div>

        <div style={fieldS}>
          <label style={labelS}>Secret Key (sk_live_... ou sk_test_...)</label>
          <input
            value={cfg.stripeSecretKey}
            onChange={(e) => set("stripeSecretKey", e.target.value)}
            style={{ ...inputS, fontFamily: "monospace", fontSize: 13 }}
            type="password"
            placeholder="sk_live_..."
          />
        </div>
        <div style={fieldS}>
          <label style={labelS}>Webhook Secret (whsec_...)</label>
          <input
            value={cfg.stripeWebhookSecret}
            onChange={(e) => set("stripeWebhookSecret", e.target.value)}
            style={{ ...inputS, fontFamily: "monospace", fontSize: 13 }}
            type="password"
            placeholder="whsec_..."
          />
        </div>
        <div style={fieldS}>
          <label style={labelS}>Pro Price ID (price_...)</label>
          <input
            value={cfg.stripeProPriceId}
            onChange={(e) => set("stripeProPriceId", e.target.value)}
            style={{ ...inputS, fontFamily: "monospace", fontSize: 13 }}
            placeholder="price_..."
          />
        </div>
        <div style={fieldS}>
          <label style={labelS}>Studio Price ID (price_...)</label>
          <input
            value={cfg.stripeStudioPriceId}
            onChange={(e) => set("stripeStudioPriceId", e.target.value)}
            style={{ ...inputS, fontFamily: "monospace", fontSize: 13 }}
            placeholder="price_..."
          />
        </div>

        <div style={{ background: "#0d1a12", border: "1px solid #1a3020", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#4ade80" }}>
          <b>Webhook URL</b> para configurar no painel Stripe (Developers → Webhooks):<br />
          <code style={{ color: "#86efac" }}>{typeof window !== "undefined" ? window.location.origin : ""}/api/webhooks/stripe</code>
          <br /><br />
          <b>Eventos a habilitar:</b> <code style={{ color: "#86efac" }}>checkout.session.completed</code>, <code style={{ color: "#86efac" }}>customer.subscription.deleted</code>
        </div>
      </div>
```

- [ ] **Step 5: Verify compiles**

```bash
cd "/Users/r.montoya/Downloads/site teste - cópia/novacraft/saas"
npx tsc --noEmit 2>&1 | grep "error TS\|config/page" | grep -v "api/src" | head -10
```

Expected: zero errors.

- [ ] **Step 6: Commit**

```bash
cd "/Users/r.montoya/Downloads/site teste - cópia/novacraft/saas"
git add src/app/admin/config/page.tsx
git commit -m "feat(admin/config): replace MercadoPago section with Stripe configuration"
```

---

## Task 8: Update admin stats API — remove MP MRR references

**Files:**
- Modify: `src/app/api/admin/stats/route.ts`
- Modify: `src/app/admin/page.tsx`

> **Context:** The stats API calculates `mrrEstimated` using `config.mpProPriceReais` and `config.mpStudioPriceReais`. These fields no longer exist. Stripe Price IDs don't contain price amounts, so we hardcode the BRL amounts or read them from env. Use a simple fallback: Pro = 49, Studio = 149 (same values as before but no longer from AppConfig).

- [ ] **Step 1: Update stats API**

Open `src/app/api/admin/stats/route.ts`. Find:

```typescript
    const mrrEstimated = (proUsers * (config.mpProPriceReais ?? 49)) + (studioUsers * (config.mpStudioPriceReais ?? 149));
```

Replace with:

```typescript
    const PRO_PRICE_BRL = Number(process.env.PRO_PRICE_BRL) || 49;
    const STUDIO_PRICE_BRL = Number(process.env.STUDIO_PRICE_BRL) || 149;
    const mrrEstimated = (proUsers * PRO_PRICE_BRL) + (studioUsers * STUDIO_PRICE_BRL);
```

- [ ] **Step 2: Update admin dashboard page**

Open `src/app/admin/page.tsx`. Find the same pattern in `getStats()`:

```typescript
  const mrrEstimated = (proUsers * (config.mpProPriceReais ?? 49)) + (studioUsers * (config.mpStudioPriceReais ?? 149));
```

Replace with:

```typescript
  const PRO_PRICE_BRL = 49;
  const STUDIO_PRICE_BRL = 149;
  const mrrEstimated = (proUsers * PRO_PRICE_BRL) + (studioUsers * STUDIO_PRICE_BRL);
```

- [ ] **Step 3: Verify compiles**

```bash
cd "/Users/r.montoya/Downloads/site teste - cópia/novacraft/saas"
npx tsc --noEmit 2>&1 | grep "error TS" | grep -v "api/src" | head -10
```

Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
cd "/Users/r.montoya/Downloads/site teste - cópia/novacraft/saas"
git add src/app/api/admin/stats/route.ts src/app/admin/page.tsx
git commit -m "fix(admin): remove mpProPriceReais/mpStudioPriceReais from MRR calculation"
```

---

## Task 9: Update upgrade page — clean up sandboxUrl fallback

**Files:**
- Modify: `src/app/dashboard/upgrade/page.tsx`

> **Context:** The upgrade page's `handleCheckout` function uses `data.checkoutUrl || data.sandboxUrl`. Stripe only returns `checkoutUrl`. Remove the sandboxUrl fallback and improve error handling for cleaner UX.

- [ ] **Step 1: Read current handleCheckout function**

```bash
grep -n "handleCheckout\|checkoutUrl\|sandboxUrl\|setCheckingOut" "/Users/r.montoya/Downloads/site teste - cópia/novacraft/saas/src/app/dashboard/upgrade/page.tsx"
```

- [ ] **Step 2: Update handleCheckout**

Find the current function (around line 99–117):

```typescript
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
        alert(data.error || "Erro ao criar checkout.");
        return;
      }
      const url = data.checkoutUrl || data.sandboxUrl;
      if (url) window.location.href = url;
    } catch {
      alert("Erro de conexão. Tente novamente.");
    } finally {
      setCheckingOut(null);
    }
  }
```

Replace with:

```typescript
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
        alert(data.error || "Erro ao criar checkout. Tente novamente.");
        return;
      }
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        alert("Erro ao obter URL de pagamento. Tente novamente.");
      }
    } catch {
      alert("Erro de conexão. Tente novamente.");
    } finally {
      setCheckingOut(null);
    }
  }
```

- [ ] **Step 3: Verify compiles**

```bash
cd "/Users/r.montoya/Downloads/site teste - cópia/novacraft/saas"
npx tsc --noEmit 2>&1 | grep "error TS\|upgrade" | grep -v "api/src" | head -5
```

- [ ] **Step 4: Commit**

```bash
cd "/Users/r.montoya/Downloads/site teste - cópia/novacraft/saas"
git add src/app/dashboard/upgrade/page.tsx
git commit -m "chore(upgrade): remove sandboxUrl fallback — Stripe only returns checkoutUrl"
```

---

## Task 10: Configure Stripe webhook in dashboard + add env vars

**Files:**
- No code changes — manual steps + `.env` update

> **Context:** Stripe needs a webhook endpoint configured in their dashboard pointing to `/api/webhooks/stripe`. In local dev, use Stripe CLI to forward webhooks. In production, configure in the Stripe Dashboard.

- [ ] **Step 1: Add env vars to .env (if not already done from pre-requisites)**

Open `.env` and ensure these exist:

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_STUDIO_PRICE_ID=price_...
PRO_PRICE_BRL=49
STUDIO_PRICE_BRL=149
```

- [ ] **Step 2: Enable Stripe in admin config**

Start the dev server:

```bash
cd "/Users/r.montoya/Downloads/site teste - cópia/novacraft/saas"
npm run dev
```

Navigate to `http://localhost:3000/admin/config`. Fill in:
- Secret Key: your `sk_test_...` key
- Webhook Secret: your `whsec_...` (from Stripe CLI or dashboard)
- Pro Price ID: `price_...` for the Pro product
- Studio Price ID: `price_...` for the Studio product
- Toggle **Stripe** to enabled
- Click **Salvar**

- [ ] **Step 3: Set up local webhook forwarding with Stripe CLI**

```bash
# Install Stripe CLI if not already installed
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the webhook signing secret printed by the CLI (`whsec_...`) and update both:
- `.env` → `STRIPE_WEBHOOK_SECRET`
- Admin config page → Webhook Secret field

- [ ] **Step 4: Test checkout flow end-to-end**

With dev server and stripe CLI running:

1. Navigate to `http://localhost:3000/dashboard/upgrade`
2. Click "Assinar Pro"
3. Should redirect to Stripe hosted checkout
4. Use test card `4242 4242 4242 4242`, any future expiry, any CVC
5. After payment, should redirect to `/dashboard?plan=activated`
6. Check MongoDB: `db.users.findOne({email: "your@email.com"}, {plan:1, planExpiresAt:1})`
   Expected: `plan: "pro"`, `planExpiresAt` set 31 days in future
7. Check `db.payments.find()` — should have one document with `stripePaymentId`, `status: "approved"`

- [ ] **Step 5: Final compile check**

```bash
cd "/Users/r.montoya/Downloads/site teste - cópia/novacraft/saas"
npx tsc --noEmit 2>&1 | grep "error TS" | grep -v "api/src" | head -10
```

Expected: zero errors.

- [ ] **Step 6: Final commit**

```bash
cd "/Users/r.montoya/Downloads/site teste - cópia/novacraft/saas"
git add .env.example 2>/dev/null || true
git commit -m "feat: complete MercadoPago → Stripe migration" --allow-empty
```

---

## Self-Review

**Spec coverage:**
- ✅ Remove MP: checkout/create rewritten, webhook deleted, success route deleted, MP fields removed from AppConfig + admin config
- ✅ Add Stripe: checkout creates Stripe Session, webhook handles `checkout.session.completed` and `customer.subscription.deleted`
- ✅ Payment model: `mpPaymentId` → `stripePaymentId`
- ✅ User model: `mpPaymentId` → `stripePaymentId`
- ✅ Admin config: MP section replaced with Stripe section
- ✅ MRR calculation: no longer depends on removed AppConfig price fields
- ✅ Upgrade page: sandboxUrl fallback removed
- ✅ Plan enforcement (planLimits.ts): unchanged — works off `user.plan` and `user.planExpiresAt`, not payment provider

**Placeholder scan:** No TBDs, no "implement later", all code blocks complete.

**Type consistency:**
- `stripePaymentId` used consistently in Payment model, User model, webhook handler
- `stripeEnabled` / `stripeSecretKey` / `stripeWebhookSecret` / `stripeProPriceId` / `stripeStudioPriceId` consistent across AppConfig interface, schema, admin config page, checkout route, and webhook route
- Stripe API version `"2025-04-30.basil"` used consistently in both checkout and webhook
