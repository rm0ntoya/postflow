import { NextResponse } from "next/server";
import Stripe from "stripe";
import { connectDB } from "@/lib/mongodb";
import AppConfig from "@/models/AppConfig";
import User from "@/models/User";
import { getSessionUser } from "@/lib/auth";

export async function POST() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  await connectDB();

  const config = await AppConfig.findOne();
  if (!config?.stripeSecretKey) {
    return NextResponse.json({ error: "Stripe não configurado" }, { status: 503 });
  }

  const user = await User.findById(session.userId).select("email stripeCustomerId");
  if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

  const stripe = new Stripe(config.stripeSecretKey);

  // Find or create Stripe customer
  let customerId = user.stripeCustomerId as string | undefined;
  if (!customerId) {
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({ email: user.email });
      customerId = customer.id;
    }
    await User.findByIdAndUpdate(session.userId, { stripeCustomerId: customerId });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (!baseUrl) return NextResponse.json({ error: "Missing NEXT_PUBLIC_BASE_URL" }, { status: 503 });

  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${baseUrl}/dashboard/upgrade`,
    });
    return NextResponse.json({ portalUrl: portalSession.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("[checkout/portal] error:", message);
    return NextResponse.json({ error: "Erro ao abrir portal de assinatura" }, { status: 500 });
  }
}
