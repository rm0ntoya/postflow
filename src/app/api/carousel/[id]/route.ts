import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Carousel from "@/models/Carousel";
import { getSessionUser } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  await connectDB();
  const carousel = await Carousel.findOne({ _id: id, userId: session.userId }).lean();
  if (!carousel) return NextResponse.json({ error: "Não encontrado." }, { status: 404 });

  return NextResponse.json({ carousel });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  await connectDB();

  const allowed = ["title", "theme", "slides", "status", "accent", "fontPair"];
  const update: Record<string, unknown> = {};
  for (const k of allowed) {
    if (k in body) update[k] = body[k];
  }

  const carousel = await Carousel.findOneAndUpdate(
    { _id: id, userId: session.userId },
    { $set: update },
    { new: true }
  ).lean();

  if (!carousel) return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
  return NextResponse.json({ carousel });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  await connectDB();
  await Carousel.deleteOne({ _id: id, userId: session.userId });
  return NextResponse.json({ ok: true });
}
