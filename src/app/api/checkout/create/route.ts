import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { connectDB } from "@/lib/mongodb";
import AppConfig from "@/models/AppConfig";
import { getSessionUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { planType } = await req.json();
  if (!planType || !["pro", "studio"].includes(planType)) {
    return NextResponse.json({ error: "planType inválido" }, { status: 400 });
  }

  await connectDB();
  const config = await AppConfig.findOne();
  if (!config?.stripeSecretKey || !config?.stripePublishableKey) {
    return NextResponse.json(
      { error: "Stripe não configurado. Contate o suporte." },
      { status: 503 }
    );
  }

  const stripe = new Stripe(config.stripeSecretKey);

  const priceIdMap: Record<string, string> = {
    pro: config.stripePriceIdPro,
    studio: config.stripePriceIdStudio,
  };

  const priceId = priceIdMap[planType];
  if (!priceId?.trim()) {
    return NextResponse.json(
      { error: `Preço não configurado para plano '${planType}'` },
      { status: 503 }
    );
  }

  const baseUrl = process.env.BASE_URL || process.env.NEXT_PUBLIC_BASE_URL;
  if (!baseUrl) {
    return NextResponse.json(
      { error: "Configuração faltando: NEXT_PUBLIC_BASE_URL" },
      { status: 503 }
    );
  }

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer_email: session.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId: session.userId,
        planType,
      },
      success_url: `${baseUrl}/dashboard/upgrade?status=success`,
      cancel_url: `${baseUrl}/dashboard/upgrade?status=cancelled`,
    });

    return NextResponse.json({ checkoutUrl: checkoutSession.url }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("[checkout/create] Payment error:", {
      userId: session.userId,
      planType,
      error: message,
    });
    return NextResponse.json(
      { error: "Erro ao processar pagamento. Tente novamente." },
      { status: 500 }
    );
  }
}
