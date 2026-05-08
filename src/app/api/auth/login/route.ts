import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { signToken, COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email e senha são obrigatórios." },
        { status: 400 }
      );
    }

    await connectDB();

    // +password: select it explicitly since schema hides it by default
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 });
    }

    const token = await signToken({
      userId: user._id.toString(),
      email: user.email,
    });

    const res = NextResponse.json({
      message: "Login realizado.",
      user: { id: user._id, name: user.name, email: user.email, hasGeminiKey: user.hasGeminiKey },
    });

    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (err) {
    console.error("[login]", err);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ message: "Logout realizado." });
  res.cookies.delete(COOKIE_NAME);
  return res;
}
