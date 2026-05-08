import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    await connectDB();
    const user = await User.findById(session.userId).select("+faceReferenceImages brandAccentColor profileAvatarUrl colorPalettes");
    if (!user) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });

    return NextResponse.json({
      brandAccentColor: user.brandAccentColor || "#FFD700",
      colorPalettes: user.colorPalettes || [],
      faceReferenceImages: user.faceReferenceImages || [],
      hasFaceImages: (user.faceReferenceImages?.length || 0) > 0,
      profileAvatarUrl: user.profileAvatarUrl || "",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  let brandAccentColor: string | undefined;
  let faceReferenceImages: string[] | undefined;
  let profileAvatarUrl: string | undefined;

  try {
    const body = await req.json();
    brandAccentColor = body.brandAccentColor;
    faceReferenceImages = body.faceReferenceImages;
    profileAvatarUrl = body.profileAvatarUrl;
  } catch {
    return NextResponse.json({ error: "Body JSON inválido." }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  if (brandAccentColor && /^#[0-9A-Fa-f]{6}$/.test(brandAccentColor)) {
    update.brandAccentColor = brandAccentColor;
  }
  if (Array.isArray(faceReferenceImages)) {
    update.faceReferenceImages = faceReferenceImages.slice(0, 3);
  }
  if (typeof profileAvatarUrl === "string") {
    update.profileAvatarUrl = profileAvatarUrl;
  }

  await connectDB();
  await User.findByIdAndUpdate(session.userId, update);

  return NextResponse.json({ message: "Perfil atualizado com sucesso." });
}
