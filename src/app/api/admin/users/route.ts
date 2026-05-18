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
    const planFilter = searchParams.get("plan") || "all";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = 20;
    const skip = (page - 1) * limit;
    const now = new Date();

    const filter: Record<string, unknown> = {};
    if (q) {
      const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { name: { $regex: safe, $options: "i" } },
        { email: { $regex: safe, $options: "i" } },
      ];
    }
    if (planFilter === "trial") {
      filter.trialEndsAt = { $gt: now };
      filter.plan = "free";
    } else if (planFilter === "pro") {
      filter.plan = "pro";
      filter.planExpiresAt = { $gt: now };
    } else if (planFilter === "studio") {
      filter.plan = "studio";
      filter.planExpiresAt = { $gt: now };
    } else if (planFilter === "expired") {
      filter.$and = [
        { $or: [{ planExpiresAt: { $lt: now } }, { planExpiresAt: { $exists: false } }] },
        { $or: [{ trialEndsAt: { $lt: now } }, { trialEndsAt: { $exists: false } }] },
      ];
    } else if (planFilter === "banned") {
      filter.isBanned = true;
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("name email hasGeminiKey isAdmin isBanned bannedReason plan planExpiresAt trialEndsAt carouselsThisMonth createdAt")
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

export async function PATCH(req: NextRequest) {
  const deny = await requireAdmin();
  if (deny) return deny;

  try {
    await connectDB();
    const { userId, action, value } = await req.json();
    if (!userId || !action) return NextResponse.json({ error: "userId e action obrigatórios." }, { status: 400 });

    const update: Record<string, unknown> = {};

    switch (action) {
      case "ban":
        update.isBanned = true;
        update.bannedAt = new Date();
        break;
      case "unban":
        update.isBanned = false;
        break;
      case "makeAdmin":
        update.isAdmin = true;
        break;
      case "removeAdmin":
        update.isAdmin = false;
        break;
      case "setPlan":
        if (!["free", "pro", "studio"].includes(value)) return NextResponse.json({ error: "Plano inválido." }, { status: 400 });
        update.plan = value;
        if (value !== "free") {
          update.planExpiresAt = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000);
        }
        break;
      case "extendTrial": {
        const days = parseInt(value) || 7;
        const user = await User.findById(userId).select("trialEndsAt");
        const base = user?.trialEndsAt && new Date(user.trialEndsAt) > new Date()
          ? new Date(user.trialEndsAt)
          : new Date();
        update.trialEndsAt = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
        break;
      }
      default:
        return NextResponse.json({ error: "Action inválida." }, { status: 400 });
    }

    await User.findByIdAndUpdate(userId, { $set: update });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
