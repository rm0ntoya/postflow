import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User, { IColorPalette } from "@/models/User";
import { getSessionUser } from "@/lib/auth";
import { randomUUID } from "crypto";

export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  await connectDB();
  const user = await User.findById(session.userId).select("colorPalettes");
  if (!user) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });

  return NextResponse.json({ palettes: user.colorPalettes || [] });
}

export async function POST(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const body = await req.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const colors = Array.isArray(body.colors) ? body.colors.filter((c: unknown) => typeof c === "string" && /^#[0-9A-Fa-f]{6}$/.test(c as string)) : [];

  if (!name) return NextResponse.json({ error: "Nome da paleta é obrigatório." }, { status: 400 });

  const newPalette: IColorPalette = { id: randomUUID(), name, colors };

  await connectDB();
  await User.findByIdAndUpdate(session.userId, { $push: { colorPalettes: newPalette } });

  return NextResponse.json({ palette: newPalette });
}

export async function PUT(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const body = await req.json();
  const { id, name, colors } = body;

  if (!id) return NextResponse.json({ error: "ID da paleta é obrigatório." }, { status: 400 });

  await connectDB();
  const user = await User.findById(session.userId).select("colorPalettes");
  if (!user) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });

  const palettes: IColorPalette[] = (user.colorPalettes || []) as IColorPalette[];
  const idx = palettes.findIndex((p) => p.id === id);
  if (idx === -1) return NextResponse.json({ error: "Paleta não encontrada." }, { status: 404 });

  if (typeof name === "string" && name.trim()) palettes[idx].name = name.trim();
  if (Array.isArray(colors)) {
    palettes[idx].colors = colors.filter((c: unknown) => typeof c === "string" && /^#[0-9A-Fa-f]{6}$/.test(c as string));
  }

  await User.findByIdAndUpdate(session.userId, { colorPalettes: palettes });

  return NextResponse.json({ palette: palettes[idx] });
}

export async function DELETE(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID é obrigatório." }, { status: 400 });

  await connectDB();
  await User.findByIdAndUpdate(session.userId, { $pull: { colorPalettes: { id } } });

  return NextResponse.json({ message: "Paleta removida." });
}
