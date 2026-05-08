import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Carousel from "@/models/Carousel";
import { requireAdmin } from "@/lib/adminAuth";

interface RouteParams { params: { id: string } }

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const deny = await requireAdmin();
  if (deny) return deny;

  try {
    await connectDB();
    const user = await User.findById(params.id)
      .select("name email hasGeminiKey isAdmin isBanned bannedReason bannedAt aiContext brandAccentColor createdAt")
      .lean();
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const carousels = await Carousel.find({ userId: params.id })
      .select("title createdAt slides")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      user,
      carouselCount: carousels.length,
      carousels: carousels.map((c) => ({
        _id: c._id,
        title: c.title,
        slideCount: (c.slides as unknown[])?.length || 0,
        createdAt: c.createdAt,
      })),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const deny = await requireAdmin();
  if (deny) return deny;

  try {
    await connectDB();
    const body = await req.json() as { action: "ban" | "unban" | "promote" | "demote"; reason?: string };

    const user = await User.findById(params.id);
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

    switch (body.action) {
      case "ban":
        user.isBanned = true;
        user.bannedReason = body.reason || "Violação dos termos de uso";
        user.bannedAt = new Date();
        break;
      case "unban":
        user.isBanned = false;
        user.bannedReason = undefined;
        user.bannedAt = undefined;
        break;
      case "promote":
        user.isAdmin = true;
        break;
      case "demote":
        user.isAdmin = false;
        break;
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    await user.save();
    return NextResponse.json({ ok: true, action: body.action });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const deny = await requireAdmin();
  if (deny) return deny;

  try {
    await connectDB();
    const user = await User.findByIdAndDelete(params.id);
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await Carousel.deleteMany({ userId: params.id });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
