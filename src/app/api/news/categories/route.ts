import { NextResponse } from "next/server";
import { getCategories } from "../../../../../lib/news/queries";

export async function GET() {
  try {
    const data = await getCategories();
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("[api/news/categories] error:", err);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Erro interno" } },
      { status: 500 }
    );
  }
}
