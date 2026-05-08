import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Carousel from "@/models/Carousel";
import { requireAdmin } from "@/lib/adminAuth";
import { getAppConfig } from "@/models/AppConfig";

export async function GET() {
  const deny = await requireAdmin();
  if (deny) return deny;

  try {
    await connectDB();

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers, totalCarousels, newUsersToday, newUsersWeek,
      usersWithKey, bannedUsers, adminCount, carouselsToday, config,
    ] = await Promise.all([
      User.countDocuments(),
      Carousel.countDocuments(),
      User.countDocuments({ createdAt: { $gte: todayStart } }),
      User.countDocuments({ createdAt: { $gte: weekAgo } }),
      User.countDocuments({ hasGeminiKey: true }),
      User.countDocuments({ isBanned: true }),
      User.countDocuments({ isAdmin: true }),
      Carousel.countDocuments({ createdAt: { $gte: todayStart } }),
      getAppConfig(),
    ]);

    return NextResponse.json({
      totalUsers, totalCarousels, newUsersToday, newUsersWeek,
      usersWithKey, bannedUsers, adminCount, carouselsToday,
      maintenanceMode: config.maintenanceMode,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
