import { NextRequest, NextResponse } from "next/server";
import { getArticleById } from "@/lib/news/queries";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const article = await getArticleById(params.id);
    if (!article) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Artigo não encontrado" } },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: article });
  } catch (err) {
    console.error("[api/news/[id]] error:", err);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Erro interno" } },
      { status: 500 }
    );
  }
}
