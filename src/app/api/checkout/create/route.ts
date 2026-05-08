import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getSessionUser } from "@/lib/auth";
import User from "@/models/User";
import { getAppConfig } from "@/models/AppConfig";

export async function POST() {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    await connectDB();

    const [user, cfg] = await Promise.all([
      User.findById(session.userId).select("email plan name"),
      getAppConfig(),
    ]);

    if (!user) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });

    if (user.plan === "pro") {
      return NextResponse.json({ error: "Você já tem o plano Pro." }, { status: 400 });
    }

    if (!cfg.mpEnabled || !cfg.mpAccessToken) {
      return NextResponse.json({ error: "Pagamentos não configurados ainda." }, { status: 503 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    const preference = {
      items: [
        {
          id: "novacraft-pro",
          title: "NovaCraft Pro — Plano Mensal",
          description: "Carrosséis ilimitados, imagens com IA, suporte prioritário",
          quantity: 1,
          unit_price: cfg.mpProPriceReais,
          currency_id: "BRL",
        },
      ],
      payer: {
        name: user.name,
        email: user.email,
      },
      back_urls: {
        success: `${baseUrl}/api/checkout/success`,
        failure: `${baseUrl}/dashboard?plan=failed`,
        pending: `${baseUrl}/dashboard?plan=pending`,
      },
      auto_return: "approved",
      notification_url: `${baseUrl}/api/webhooks/mercadopago`,
      external_reference: session.userId,
      statement_descriptor: "NOVACRAFT",
    };

    const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.mpAccessToken}`,
      },
      body: JSON.stringify(preference),
    });

    if (!mpRes.ok) {
      const err = await mpRes.json();
      console.error("[checkout/create] MP error:", err);
      return NextResponse.json({ error: "Erro ao criar preferência de pagamento." }, { status: 502 });
    }

    const data = await mpRes.json();

    return NextResponse.json({
      checkoutUrl: data.init_point,
      sandboxUrl: data.sandbox_init_point,
      preferenceId: data.id,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
