import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import ScheduledPost from "@/models/ScheduledPost";
import { getSessionUser } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const body = await req.json();
  const { ideaId, carouselId } = body;

  await connectDB();
  const post = await ScheduledPost.findOne({ _id: params.id, userId: session.userId });
  if (!post) return NextResponse.json({ error: "Post não encontrado." }, { status: 404 });

  const idea = post.ideas.find((i) => i.id === ideaId);
  if (!idea) return NextResponse.json({ error: "Ideia não encontrada." }, { status: 404 });

  idea.status = "done";
  if (carouselId) idea.carouselId = carouselId;
  await post.save();

  return NextResponse.json({ message: "Status atualizado." });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  await connectDB();
  await ScheduledPost.deleteOne({ _id: params.id, userId: session.userId });
  return NextResponse.json({ message: "Removido." });
}
