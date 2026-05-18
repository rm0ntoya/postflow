import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ hasNewsPro: false }, { status: 401 });

  await connectDB();
  const user = await User.findById(session.userId).select("plan planExpiresAt trialEndsAt");
  if (!user) return NextResponse.json({ hasNewsPro: false });

  const now = new Date();
  const isInTrial = !!(user.trialEndsAt && new Date(user.trialEndsAt) > now);
  const isStudio = user.plan === "studio" && !!(user.planExpiresAt && new Date(user.planExpiresAt) > now);

  return NextResponse.json({ hasNewsPro: isInTrial || isStudio });
}
