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
      usersWithKey, bannedUsers, adminCount, carouselsToday,
      proUsers, studioUsers, trialUsers, config,
    ] = await Promise.all([
      User.countDocuments(),
      Carousel.countDocuments(),
      User.countDocuments({ createdAt: { $gte: todayStart } }),
      User.countDocuments({ createdAt: { $gte: weekAgo } }),
      User.countDocuments({ hasGeminiKey: true }),
      User.countDocuments({ isBanned: true }),
      User.countDocuments({ isAdmin: true }),
      Carousel.countDocuments({ createdAt: { $gte: todayStart } }),
      User.countDocuments({ plan: "pro", planExpiresAt: { $gt: now } }),
      User.countDocuments({ plan: "studio", planExpiresAt: { $gt: now } }),
      User.countDocuments({ trialEndsAt: { $gt: now }, plan: "free" }),
      getAppConfig(),
    ]);

    // Hardcoded prices (BRL). Update these when Stripe pricing changes.
    const proPriceReais = 49;      // Pro plan: R$ 49/month
    const studioPriceReais = 149;  // Studio plan: R$ 149/month
    const mrrEstimated = (proUsers * proPriceReais) + (studioUsers * studioPriceReais);
    const conversionRate = totalUsers > 0 ? Math.round(((proUsers + studioUsers) / totalUsers) * 100) : 0;

    return NextResponse.json({
      totalUsers, totalCarousels, newUsersToday, newUsersWeek,
      usersWithKey, bannedUsers, adminCount, carouselsToday,
      proUsers, studioUsers, trialUsers,
      mrrEstimated, conversionRate,
      maintenanceMode: config.maintenanceMode,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
