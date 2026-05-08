import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Carousel from "@/models/Carousel";
import { requireAdmin } from "@/lib/adminAuth";

function last30Days(): string[] {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d.toISOString().slice(0, 10);
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function dailyCounts(model: any, dateField: string, start: Date): Promise<Record<string, number>> {
  const raw = await model.aggregate([
    { $match: { [dateField]: { $gte: start } } },
    { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: `$${dateField}` } }, count: { $sum: 1 } } },
  ]);
  return Object.fromEntries(raw.map((r: { _id: string; count: number }) => [r._id, r.count]));
}

export async function GET() {
  const deny = await requireAdmin();
  if (deny) return deny;

  try {
    await connectDB();

    const days = last30Days();
    const start = new Date(days[0]);

    const [userMap, carouselMap] = await Promise.all([
      dailyCounts(User, "createdAt", start),
      dailyCounts(Carousel, "createdAt", start),
    ]);

    return NextResponse.json({
      registrations: days.map((d) => ({ date: d, count: userMap[d] || 0 })),
      carousels: days.map((d) => ({ date: d, count: carouselMap[d] || 0 })),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
