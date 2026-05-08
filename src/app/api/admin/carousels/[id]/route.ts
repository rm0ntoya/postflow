import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Carousel from "@/models/Carousel";
import { requireAdmin } from "@/lib/adminAuth";

interface RouteParams { params: { id: string } }

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const deny = await requireAdmin();
  if (deny) return deny;

  try {
    await connectDB();
    const c = await Carousel.findByIdAndDelete(params.id);
    if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
