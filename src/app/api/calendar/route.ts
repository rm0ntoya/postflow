import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import ScheduledPost from "@/models/ScheduledPost";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  await connectDB();
  const posts = await ScheduledPost.find({ userId: session.userId }).sort({ date: 1 }).lean();
  return NextResponse.json({ posts });
}

export async function DELETE(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID obrigatório." }, { status: 400 });

  await connectDB();
  await ScheduledPost.deleteOne({ _id: id, userId: session.userId });
  return NextResponse.json({ message: "Post removido." });
}
