import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    const { email, secret } = await req.json() as { email: string; secret: string };

    if (!secret || secret !== process.env.ADMIN_SEED_SECRET) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    await connectDB();
    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { isAdmin: true },
      { new: true }
    );

    if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });
    return NextResponse.json({ ok: true, email: user.email, isAdmin: user.isAdmin });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
