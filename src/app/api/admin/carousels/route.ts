export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Carousel from "@/models/Carousel";
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
    return NextResponse.json({ carousels, total, page, pages: Math.ceil(total / limit) });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
