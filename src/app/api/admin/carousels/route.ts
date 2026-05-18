export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Carousel from "@/models/Carousel";
import User from "@/models/User";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  const deny = await requireAdmin();
  if (deny) return deny;

  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = 20;
    const skip = (page - 1) * limit;

    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const matchStage = q ? { $match: { title: { $regex: safe, $options: "i" } } } : { $match: {} };

    const [carousels, countResult] = await Promise.all([
      Carousel.aggregate([
        matchStage,
        { $project: { title: 1, userId: 1, accentColor: 1, createdAt: 1, slideCount: { $size: "$slides" } } },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
      ]),
      Carousel.aggregate([matchStage, { $count: "total" }]),
    ]);

    const total = countResult[0]?.total || 0;

    // Enrich with user info
    const userIds = Array.from(new Set(carousels.map((c: { userId: unknown }) => String(c.userId))));
    const users = await User.find({ _id: { $in: userIds } }).select("name email").lean();
    const userMap = Object.fromEntries(users.map((u: { _id: unknown; name: string; email: string }) => [String(u._id), u]));
    const enriched = carousels.map((c: { userId: unknown }) => ({ ...c, user: userMap[String(c.userId)] || null }));

    return NextResponse.json({ carousels: enriched, total, page, pages: Math.ceil(total / limit) });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
