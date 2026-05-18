import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Payment from "@/models/Payment";
import AppConfig from "@/models/AppConfig";

export async function POST(req: NextRequest) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    console.error("[webhook/stripe] STRIPE_SECRET_KEY env var not configured");
    return NextResponse.json(
      { error: "Stripe not configured" },
      { status: 503 }
    );
  }

  const stripe = new Stripe(stripeSecretKey);

  // Connect to DB FIRST
  try {
    await connectDB();
  } catch (dbErr) {
    console.error("[webhook/stripe] Database connection failed");
    return NextResponse.json({ error: "Database error" }, { status: 503 });
  }

  // Load config after DB is connected
  const config = await AppConfig.findOne();
  if (!config?.stripeWebhookSecret) {
    console.error("[webhook/stripe] Webhook secret not configured");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  // Verify signature
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(body, signature, config.stripeWebhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[webhook/stripe] Signature verification failed:", message);
    return NextResponse.json({ error: "Signature verification failed" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      // Extract userId and planType from metadata
      const userId = session.metadata?.userId;
      const planType = session.metadata?.planType as "pro" | "studio" | undefined;

      if (!userId || !planType || !["pro", "studio"].includes(planType)) {
        console.error("[webhook/stripe] Invalid metadata in checkout session:", { userId, planType });
        // Return 200 so Stripe doesn't retry this event
        return NextResponse.json({ received: true }, { status: 200 });
      }

      // Determine plan expiry — current_period_end lives on the Subscription,
      // not on Checkout.Session. Fetch the subscription when available.
      let planExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      if (session.subscription) {
        try {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          // current_period_end may not be typed in all SDK versions; access via index
          const periodEnd = (subscription as unknown as Record<string, unknown>).current_period_end;
          if (typeof periodEnd === "number" && periodEnd > 0) {
            planExpiresAt = new Date(periodEnd * 1000);
          }
        } catch (err) {
          console.warn("[webhook/stripe] Could not fetch subscription period, falling back to +30d", { err });
        }
      }

      // Update user plan — payment_intent is null for subscriptions, use subscription ID as fallback
      const paymentRef = (session.payment_intent as string | null) || (session.subscription as string | null) || session.id;

      await User.findByIdAndUpdate(
        userId,
        {
          plan: planType,
          planExpiresAt,
          stripePaymentId: paymentRef,
        },
        { new: true }
      );

      // Record payment
      await Payment.findOneAndUpdate(
        { stripePaymentId: paymentRef },
        {
          userId,
          stripePaymentId: paymentRef,
          planType,
          amountBRL: session.amount_total ? Math.round(session.amount_total / 100) : 0,
          status: "approved",
        },
        { upsert: true }
      );

      console.log(`[webhook/stripe] Payment approved for user ${userId}, plan ${planType}`);

    } else if (event.type === "customer.subscription.deleted") {
      // Handle subscription cancellation
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;
      if (!userId) {
        console.error("[webhook/stripe] Subscription deletion without userId", {
          subscriptionId: subscription.id,
        });
        // Return 200 so Stripe doesn't retry this invalid event
        return NextResponse.json({ received: true }, { status: 200 });
      }

      try {
        const updated = await User.findByIdAndUpdate(userId, { plan: "free" }, { new: true });
        if (!updated) {
          console.error("[webhook/stripe] User not found for subscription deletion", { userId });
        } else {
          console.log(`[webhook/stripe] User ${userId} downgraded to free plan`);
        }
      } catch (updateErr) {
        console.error("[webhook/stripe] Failed to downgrade user on subscription deletion", {
          userId,
          error: updateErr instanceof Error ? updateErr.message : "Unknown error",
        });
        // Still return 200 to prevent Stripe retry storm, but log the error
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[webhook/stripe] Handler error:", message);
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
