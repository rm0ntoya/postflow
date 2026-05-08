import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { getSessionUser } from "@/lib/auth";
import { encryptApiKey, decryptApiKey } from "@/lib/encryption";

/** GET /api/user/api-key — returns masked status of stored key */
export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(session.userId).select(
      "+encryptedGeminiKey +geminiKeyIv +geminiKeyAuthTag hasGeminiKey"
    );

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    if (!user.hasGeminiKey) {
      return NextResponse.json({ hasKey: false, maskedKey: null });
    }

    // Decrypt to show last 4 chars only — never expose full key
    const plain = decryptApiKey({
      ciphertext: user.encryptedGeminiKey!,
      iv: user.geminiKeyIv!,
      authTag: user.geminiKeyAuthTag!,
    });

    const maskedKey = `AIza${"*".repeat(plain.length - 8)}${plain.slice(-4)}`;

    return NextResponse.json({ hasKey: true, maskedKey });
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
