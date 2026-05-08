import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/adminAuth";
import AppConfig, { getAppConfig } from "@/models/AppConfig";

export async function GET() {
  const deny = await requireAdmin();
  if (deny) return deny;

  try {
    await connectDB();
    const cfg = await getAppConfig();
    return NextResponse.json(cfg);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const deny = await requireAdmin();
  if (deny) return deny;

  try {
    await connectDB();
    const body = await req.json() as Partial<{
      maintenanceMode: boolean;
      maintenanceBanner: string;
      announcementBanner: string;
      announcementActive: boolean;
    }>;

    const cfg = await AppConfig.findOneAndUpdate(
      { key: "singleton" },
      { $set: body },
      { upsert: true, new: true }
    );

    return NextResponse.json(cfg);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
