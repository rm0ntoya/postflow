import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Payment from "@/models/Payment";
import AppConfig from "@/models/AppConfig";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const body = await req.text();
    const config = await AppConfig.findOne();
    if (!config?.stripeWebhookSecret) {
      console.error("[webhook/stripe] Webhook secret not configured");
      return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
    }
    event = stripe.webhooks.constructEvent(body, signature, config.stripeWebhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[webhook/stripe] Signature verification failed:", message);
    return NextResponse.json({ error: "Signature verification failed" }, { status: 400 });
  }

  await connectDB();

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      // Extract userId and planType from metadata
      const userId = session.metadata?.userId;
      const planType = session.metadata?.planType as "pro" | "studio" | undefined;

      if (!userId || !planType || !["pro", "studio"].includes(planType)) {
        console.error("[webhook/stripe] Invalid metadata:", { userId, planType });
        return NextResponse.json({ error: "Invalid metadata" }, { status: 400 });
      }

      // Update user plan
      const planExpiresAt = new Date();
      planExpiresAt.setMonth(planExpiresAt.getMonth() + 1);

      if (session.payment_intent) {
        await User.findByIdAndUpdate(
          userId,
          {
            plan: planType,
            planExpiresAt,
            stripePaymentId: session.payment_intent,
          },
          { new: true }
        );
      } else {
        // No payment intent - don't save incomplete payment
        console.warn("[webhook/stripe] No payment_intent in session", { userId, planType });
      }

      // Record payment
      await Payment.findOneAndUpdate(
        { stripePaymentId: session.payment_intent },
        {
          userId,
          stripePaymentId: session.payment_intent,
          planType,
          amountBRL: (session.amount_total && session.payment_intent)
            ? Math.round(session.amount_total / 100)
            : 0,
          status: "approved",
          createdAt: new Date(session.created * 1000),
        },
        { upsert: true }
      );

      console.log(`[webhook/stripe] Payment approved for user ${userId}, plan ${planType}`);
    } else if (event.type === "customer.subscription.deleted") {
      // Handle subscription cancellation
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;
      if (!userId) {
        console.error("[webhook/stripe] Subscription deletion without userId in metadata", {
          subscriptionId: subscription.id,
        });
        return NextResponse.json(
          { error: "Cannot process subscription deletion without userId" },
          { status: 400 }
        );
      }

      await User.findByIdAndUpdate(userId, { plan: "free" }, { new: true });
      console.log(`[webhook/stripe] User ${userId} downgraded to free plan`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[webhook/stripe] Handler error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
