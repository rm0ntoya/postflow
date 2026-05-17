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
    const raw = await req.json();

    const allowed = ["maintenanceMode", "maintenanceBanner", "announcementBanner", "announcementActive"] as const;
    const body: Partial<Record<typeof allowed[number], unknown>> = {};
    for (const key of allowed) {
      if (key in raw) body[key] = raw[key];
    }

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
