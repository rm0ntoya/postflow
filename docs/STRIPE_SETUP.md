# Stripe Integration Setup

## Requirements

- Stripe account with live/test API keys
- Two products created: Pro (R$ 49/month) and Studio (R$ 149/month)
- Webhook endpoint configured in Stripe Dashboard

## Configuration Steps

### 1. Create Products in Stripe Dashboard

1. Log into https://dashboard.stripe.com
2. Go to **Products** → **Add product**
3. Create **Pro Plan**:
   - Name: `Pro`
   - Price: R$ 49.00 / month (recurring) or one-time depending on your mode
   - Copy the Price ID: `price_...`
4. Create **Studio Plan**:
   - Name: `Studio`
   - Price: R$ 149.00 / month (recurring) or one-time
   - Copy the Price ID: `price_...`

> Note: The checkout route uses `mode: "payment"` (one-time). If you want
> subscriptions, change `mode` to `"subscription"` in
> `src/app/api/checkout/create/route.ts` and use recurring prices in Stripe.

### 2. Configure Webhook Endpoint

1. Go to **Developers** → **Webhooks** → **Add endpoint**
2. Endpoint URL: `https://yourdomain.com/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
4. Click **Add endpoint**
5. Copy the **Signing secret** (`whsec_...`)

### 3. Enter Keys in Admin Panel

1. Go to your app at `/admin/settings` (or the Stripe Configuration section)
2. Fill in:
   - **Stripe Secret Key**: `sk_live_...` (or `sk_test_...` for testing)
   - **Stripe Publishable Key**: `pk_live_...` (or `pk_test_...`)
   - **Pro Price ID**: `price_...` (from step 1)
   - **Studio Price ID**: `price_...` (from step 1)
   - **Webhook Secret**: `whsec_...` (from step 2)
3. Save

## Test Cards (Stripe Test Mode)

| Scenario | Card Number | Exp | CVC |
|---|---|---|---|
| Payment succeeds | 4242 4242 4242 4242 | Any future date | Any 3 digits |
| Payment declined | 4000 0000 0000 0002 | Any future date | Any 3 digits |
| Requires authentication | 4000 0025 0000 3155 | Any future date | Any 3 digits |

## E2E Payment Flow Test

1. Create a test user account in your app
2. Go to **Dashboard** → **Upgrade**
3. Select **Pro** plan → Click **Subscribe**
4. You are redirected to Stripe Checkout
5. Enter test card `4242 4242 4242 4242`, any future exp, any CVC
6. Complete payment
7. You are redirected to `/dashboard/upgrade?status=success`
8. Verify in Stripe Dashboard: payment shows as completed
9. Verify in admin panel: user is now on Pro plan

Repeat for **Studio** plan with a second test account.

## Webhook Events

Handler: `src/app/api/webhooks/stripe/route.ts`
Endpoint: `POST /api/webhooks/stripe`

| Event | Action |
|---|---|
| `checkout.session.completed` | Approve payment, set user plan + expiry, record in Payment collection |
| `customer.subscription.deleted` | Downgrade user to free plan |

The webhook reads `stripeWebhookSecret` from the database (`AppConfig` collection),
so the signing secret must be saved via the admin panel — not as an env var.

## Environment Variables Required

```env
STRIPE_SECRET_KEY=sk_test_...   # fallback only; admin panel key takes precedence
NEXT_PUBLIC_URL=https://yourdomain.com
```

## Testing Webhook Delivery Locally

Use the Stripe CLI to forward events to your local server:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

This prints a temporary `whsec_...` to use as the webhook secret during local dev.

## Troubleshooting

- **"Webhook not configured"** (503): Webhook secret not saved in admin panel
- **"Signature verification failed"** (400): Wrong webhook secret in admin panel
- **"Preço não configurado"** (503): Price ID not saved in admin panel for that plan
- **"Stripe não configurado"** (503): Secret/publishable keys not saved in admin panel
