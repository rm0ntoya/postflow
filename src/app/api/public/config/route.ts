import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAppConfig } from "@/models/AppConfig";

// Public endpoint — returns only non-sensitive config the frontend needs
export async function GET() {
  try {
    await connectDB();
    const cfg = await getAppConfig();
    return NextResponse.json({
      recaptchaEnabled: cfg.recaptchaEnabled,
      recaptchaSiteKey: cfg.recaptchaEnabled ? cfg.recaptchaSiteKey : "",
      mpEnabled: cfg.mpEnabled,
      mpPublicKey: cfg.mpEnabled ? cfg.mpPublicKey : "",
    });
  } catch {
    return NextResponse.json({ recaptchaEnabled: false, mpEnabled: false });
  }
}
