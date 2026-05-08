import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { getSessionUser } from "@/lib/auth";

const DEFAULT_CONTEXT = {
  brandName: "",
  brandDescription: "",
  audience: "",
  tone: "",
  structure: "",
  themesYes: [] as string[],
  themesNo: [] as string[],
  rules: "",
  instagramHandle: "",
  instagramBio: "",
};

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    await connectDB();
    const user = await User.findById(session.userId).select("aiContext name").lean() as { aiContext?: typeof DEFAULT_CONTEXT; name?: string } | null;
    if (!user) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });

    return NextResponse.json({ context: user.aiContext || DEFAULT_CONTEXT });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const body = await req.json();
    await connectDB();

    await User.findByIdAndUpdate(session.userId, { $set: { aiContext: body } });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
