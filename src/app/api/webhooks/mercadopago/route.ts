import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Payment from "@/models/Payment";
import { getAppConfig } from "@/models/AppConfig";
import crypto from "crypto";

export const maxDuration = 30;

// Verify MP HMAC-SHA256 signature
function verifySignature(secret: string, xSignature: string, xRequestId: string, dataId: string): boolean {
  try {
    const ts = xSignature.split(";").find(p => p.startsWith("ts="))?.split("=")[1];
    const v1 = xSignature.split(";").find(p => p.startsWith("v1="))?.split("=")[1];
    if (!ts || !v1) return false;
    const signedManifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
    const hmac = crypto.createHmac("sha256", secret).update(signedManifest).digest("hex");
    return hmac === v1;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const cfg = await getAppConfig();

    const xSignature = req.headers.get("x-signature") ?? "";
    const xRequestId = req.headers.get("x-request-id") ?? "";

    const body = await req.json() as { type: string; data?: { id?: string }; action?: string };

    // Verify signature only if secret is configured
    if (cfg.mpWebhookSecret && body.data?.id) {
      const valid = verifySignature(cfg.mpWebhookSecret, xSignature, xRequestId, String(body.data.id));
      if (!valid) {
        console.warn("[webhook/mp] Invalid signature");
        return NextResponse.json({ ok: false }, { status: 401 });
      }
    }

    // Only process payment events
    if (body.type !== "payment" || !body.data?.id) {
      return NextResponse.json({ ok: true });
    }

    const paymentId = String(body.data.id);

    // Fetch payment details from MP
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${cfg.mpAccessToken}` },
    });

    if (!mpRes.ok) return NextResponse.json({ ok: false }, { status: 502 });

    const payment = await mpRes.json() as {
      status: string;
      external_reference: string;
      id: number;
      transaction_amount: number;
      metadata?: { planType?: string };
    };

    const userId = payment.external_reference;
    if (!userId) return NextResponse.json({ ok: true });

    if (payment.status === "approved") {
      const planType = payment.metadata?.planType === "studio" ? "studio" : "pro";
      const planExpiresAt = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000);
      await User.findByIdAndUpdate(userId, {
        plan: planType,
        mpPaymentId: String(payment.id),
        planExpiresAt,
      });
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
      try {
        await Payment.findOneAndUpdate(
          { mpPaymentId: String(payment.id) },
          { status: "cancelled" }
        );
      } catch {}
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[webhook/mercadopago]", err);
    return NextResponse.json({ ok: true }); // always 200 so MP doesn't retry
  }
}
