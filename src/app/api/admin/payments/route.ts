import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Payment from "@/models/Payment";
import User from "@/models/User";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  const deny = await requireAdmin();
  if (deny) return deny;

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = 25;
    const skip = (page - 1) * limit;
    const statusFilter = searchParams.get("status");

    const filter: Record<string, unknown> = {};
    if (statusFilter && statusFilter !== "all") filter.status = statusFilter;

    const [payments, total] = await Promise.all([
      Payment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Payment.countDocuments(filter),
    ]);

    const userIds = payments.map((p) => String(p.userId));
    const users = await User.find({ _id: { $in: userIds } }).select("name email").lean();
    const userMap = Object.fromEntries(users.map((u) => [String(u._id), u]));

    const enriched = payments.map((p) => ({
      ...p,
      user: userMap[String(p.userId)] || null,
    }));

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const [monthlyRevResult, totalRevResult] = await Promise.all([
      Payment.aggregate([
        { $match: { status: "approved", createdAt: { $gte: monthStart } } },
        { $group: { _id: null, total: { $sum: "$amountBRL" } } },
      ]),
      Payment.aggregate([
        { $match: { status: "approved" } },
        { $group: { _id: null, total: { $sum: "$amountBRL" } } },
      ]),
    ]);

    return NextResponse.json({
      payments: enriched,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      monthlyRevenue: monthlyRevResult[0]?.total ?? 0,
      totalRevenue: totalRevResult[0]?.total ?? 0,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
