import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { getAppConfig } from "@/models/AppConfig";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const paymentId = searchParams.get("payment_id");
  const status = searchParams.get("status");
  const externalRef = searchParams.get("external_reference");

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  if (status !== "approved" || !paymentId || !externalRef) {
    return NextResponse.redirect(`${baseUrl}/dashboard?plan=failed`);
  }

  try {
    await connectDB();
    const cfg = await getAppConfig();

    if (!cfg.mpAccessToken) {
      return NextResponse.redirect(`${baseUrl}/dashboard?plan=failed`);
    }

    // Verify payment status with MP API
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${cfg.mpAccessToken}` },
    });

    if (!mpRes.ok) {
      return NextResponse.redirect(`${baseUrl}/dashboard?plan=failed`);
    }

    const payment = await mpRes.json();

    if (payment.status !== "approved") {
      return NextResponse.redirect(`${baseUrl}/dashboard?plan=failed`);
    }

    // Activate pro plan — expires in 31 days from now
    const planExpiresAt = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000);

    await User.findByIdAndUpdate(externalRef, {
      plan: "pro",
      mpPaymentId: paymentId,
      planExpiresAt,
    });

    return NextResponse.redirect(`${baseUrl}/dashboard?plan=activated`);
  } catch (err) {
    console.error("[checkout/success]", err);
    return NextResponse.redirect(`${baseUrl}/dashboard?plan=failed`);
  }
}
