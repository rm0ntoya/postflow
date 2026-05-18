import { NextResponse } from "next/server";
import { getSources } from "@/lib/news/queries";

export async function GET() {
  try {
    const data = await getSources();
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("[api/news/sources] error:", err);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Erro interno" } },
      { status: 500 }
    );
  }
}
