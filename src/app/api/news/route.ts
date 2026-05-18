import { NextRequest, NextResponse } from "next/server";
import { getArticles } from "@/lib/news/queries";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const source = searchParams.get("source") || undefined;
    const category = searchParams.get("category") || undefined;
    const q = searchParams.get("q") || undefined;

    const { articles, total } = await getArticles({ page, limit, source, category, q });
    const total_pages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: { articles, pagination: { page, limit, total, total_pages } },
    });
  } catch (err) {
    console.error("[api/news] error:", err);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Erro interno" } },
      { status: 500 }
    );
  }
}
