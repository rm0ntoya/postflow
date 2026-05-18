import { NextRequest, NextResponse } from "next/server";
import { runAllScrapers } from "@/lib/news/scraper";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  // Vercel cron sends this header — reject other callers
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runAllScrapers();
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error("[cron/scrape-news] error:", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
