import { getSessionUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { NextResponse } from "next/server";

export interface AdminUser {
  userId: string;
  email: string;
  isAdmin: true;
}

export async function getAdminUser(): Promise<AdminUser | null> {
  const session = await getSessionUser();
  if (!session) return null;
  await connectDB();
  const user = await User.findById(session.userId).select("isAdmin isBanned");
  if (!user || !user.isAdmin || user.isBanned) return null;
  return { userId: session.userId, email: session.email, isAdmin: true };
}

export async function requireAdmin(): Promise<NextResponse | null> {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  return null;
}
