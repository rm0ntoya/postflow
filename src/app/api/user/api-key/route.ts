import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { getSessionUser } from "@/lib/auth";
import { encryptApiKey, decryptApiKey } from "@/lib/encryption";

export const TEXT_MODELS = [
  { id: "gemini-2.5-flash",          label: "Gemini 2.5 Flash",          tier: "free" },
  { id: "gemini-2.5-flash-lite",     label: "Gemini 2.5 Flash-Lite",     tier: "free" },
  { id: "gemini-2.5-pro",            label: "Gemini 2.5 Pro",            tier: "paid" },
  { id: "gemini-3-flash-preview",    label: "Gemini 3 Flash (Preview)",  tier: "paid" },
  { id: "gemini-3.1-flash-lite",     label: "Gemini 3.1 Flash-Lite",     tier: "paid" },
  { id: "gemini-3.1-pro-preview",    label: "Gemini 3.1 Pro (Preview)",  tier: "paid" },
] as const;

export const IMAGE_MODELS = [
  { id: "gemini-2.5-flash-image",         label: "Nano Banana (Gemini 2.5 Flash Image)",        tier: "free" },
  { id: "gemini-3.1-flash-image-preview", label: "Nano Banana 2 (Gemini 3.1 Flash Image)",      tier: "paid" },
  { id: "gemini-3-pro-image-preview",     label: "Nano Banana Pro (Gemini 3 Pro Image)",        tier: "paid" },
  { id: "imagen-4.0-fast-generate-001",   label: "Imagen 4 Fast",                               tier: "paid" },
  { id: "imagen-4.0-generate-001",        label: "Imagen 4",                                    tier: "paid" },
  { id: "imagen-4.0-ultra-generate-001",  label: "Imagen 4 Ultra",                              tier: "paid" },
] as const;

/** GET /api/user/api-key — returns masked status of stored key */
export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(session.userId).select(
      "+encryptedGeminiKey +geminiKeyIv +geminiKeyAuthTag hasGeminiKey textModel imageModel"
    );

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    const modelInfo = {
      textModel: user.textModel || "gemini-2.5-flash",
      imageModel: user.imageModel || "gemini-2.5-flash-image",
    };

    if (!user.hasGeminiKey) {
      return NextResponse.json({ hasKey: false, maskedKey: null, ...modelInfo });
    }

    // Decrypt to show last 4 chars only — never expose full key
    const plain = decryptApiKey({
      ciphertext: user.encryptedGeminiKey!,
      iv: user.geminiKeyIv!,
      authTag: user.geminiKeyAuthTag!,
    });

    const maskedKey = `AIza${"*".repeat(plain.length - 8)}${plain.slice(-4)}`;

    return NextResponse.json({ hasKey: true, maskedKey, ...modelInfo });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** PUT /api/user/api-key — encrypts and saves the key */
export async function PUT(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { apiKey } = await req.json();
  if (!apiKey || typeof apiKey !== "string" || apiKey.trim().length < 10) {
    return NextResponse.json(
      { error: "API Key inválida ou muito curta." },
      { status: 400 }
    );
  }

  const { ciphertext, iv, authTag } = encryptApiKey(apiKey.trim());

  await connectDB();
  await User.findByIdAndUpdate(session.userId, {
    encryptedGeminiKey: ciphertext,
    geminiKeyIv: iv,
    geminiKeyAuthTag: authTag,
    hasGeminiKey: true,
  });

  return NextResponse.json({ message: "API Key salva com sucesso." });
}

/** DELETE /api/user/api-key — removes the key */
export async function DELETE() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  await connectDB();
  await User.findByIdAndUpdate(session.userId, {
    $unset: { encryptedGeminiKey: 1, geminiKeyIv: 1, geminiKeyAuthTag: 1 },
    hasGeminiKey: false,
  });

  return NextResponse.json({ message: "API Key removida." });
}

/** PATCH /api/user/api-key — saves model preferences */
export async function PATCH(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const body = await req.json();
  const validTextIds = TEXT_MODELS.map((m) => m.id);
  const validImageIds = IMAGE_MODELS.map((m) => m.id);

  const update: Record<string, string> = {};
  if (body.textModel && validTextIds.includes(body.textModel)) update.textModel = body.textModel;
  if (body.imageModel && validImageIds.includes(body.imageModel)) update.imageModel = body.imageModel;

  if (!Object.keys(update).length) {
    return NextResponse.json({ error: "Nenhum modelo válido informado." }, { status: 400 });
  }

  await connectDB();
  await User.findByIdAndUpdate(session.userId, update);
  return NextResponse.json({ message: "Modelos salvos." });
}
