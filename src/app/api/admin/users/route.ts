import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
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
    const filter = q
      ? { $or: [{ name: { $regex: safe, $options: "i" } }, { email: { $regex: safe, $options: "i" } }] }
      : {};

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("name email hasGeminiKey isAdmin isBanned bannedReason createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    const ids = users.map((u) => new Types.ObjectId(String(u._id)));
    const counts = await Carousel.aggregate([
      { $match: { userId: { $in: ids } } },
      { $group: { _id: "$userId", count: { $sum: 1 } } },
    ]);
    const countMap = Object.fromEntries(counts.map((c: { _id: Types.ObjectId; count: number }) => [c._id.toString(), c.count]));

    const enriched = users.map((u) => ({ ...u, carouselCount: countMap[String(u._id)] || 0 }));
    return NextResponse.json({ users: enriched, total, page, pages: Math.ceil(total / limit) });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
