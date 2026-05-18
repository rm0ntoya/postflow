import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { getAppConfig } from "@/models/AppConfig";
import { signToken, COOKIE_NAME } from "@/lib/auth";

async function verifyRecaptcha(token: string, secret: string): Promise<boolean> {
  try {
    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(token)}`,
    });
    const data = await res.json() as { success: boolean; score?: number };
    return data.success === true;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, recaptchaToken } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Nome, email e senha são obrigatórios." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Senha deve ter ao menos 8 caracteres." },
        { status: 400 }
      );
    }

    await connectDB();

    const cfg = await getAppConfig();
    if (cfg.recaptchaEnabled && cfg.recaptchaSecretKey) {
      if (!recaptchaToken) {
        return NextResponse.json({ error: "Verificação reCAPTCHA obrigatória." }, { status: 400 });
      }
      const valid = await verifyRecaptcha(recaptchaToken, cfg.recaptchaSecretKey);
      if (!valid) {
        return NextResponse.json({ error: "Falha na verificação reCAPTCHA. Tente novamente." }, { status: 400 });
      }
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json(
        { error: "Email já cadastrado." },
        { status: 409 }
      );
    }

    const hashed = await bcrypt.hash(password, 12);
    const trialDays = cfg.trialDays ?? 7;
    const trialEndsAt = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);
    const user = await User.create({ name, email, password: hashed, trialEndsAt });

    const token = await signToken({
      userId: user._id.toString(),
      email: user.email,
    });

    const res = NextResponse.json(
      { message: "Conta criada com sucesso.", userId: user._id },
      { status: 201 }
    );

    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 dias
    });

    return res;
  } catch (err) {
    console.error("[register]", err);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}
