import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { getSessionUser } from "@/lib/auth";
import { decryptApiKey } from "@/lib/encryption";

export const maxDuration = 120;
const IMAGE_MODEL = "gemini-3-pro-image-preview";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const body = await req.json();
    const promptText = body.prompt || "A futuristic cyberpunk city at night with neon lights, photorealistic 8k";

    await connectDB();

    const user = await User.findById(session.userId).select(
      "+encryptedGeminiKey +geminiKeyIv +geminiKeyAuthTag hasGeminiKey"
    );

    if (!user || !user.hasGeminiKey) {
      return NextResponse.json({ error: "Gemini API Key não configurada na sua conta." }, { status: 422 });
    }

    let geminiApiKey: string;
    try {
      geminiApiKey = decryptApiKey({
        ciphertext: user.encryptedGeminiKey!,
        iv: user.geminiKeyIv!,
        authTag: user.geminiKeyAuthTag!,
      });
    } catch {
      return NextResponse.json({ error: "Falha ao descriptografar a API Key do usuário." }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey: geminiApiKey });

    const response = await ai.models.generateContentStream({
      model: IMAGE_MODEL,
      config: {
        imageConfig: {
          aspectRatio: "4:5",
          imageSize: "1K",
        },
        responseModalities: ["IMAGE", "TEXT"] as string[],
      },
      contents: [{ role: "user", parts: [{ text: promptText }] }],
    });

    for await (const chunk of response) {
      const parts = chunk.candidates?.[0]?.content?.parts;
      if (!parts) continue;
      for (const part of parts) {
        const inlineData = part.inlineData;
        if (inlineData?.data) {
          const mimeType = inlineData.mimeType || "image/png";
          return NextResponse.json({ 
            success: true, 
            url: `data:${mimeType};base64,${inlineData.data}` 
          });
        }
      }
    }

    return NextResponse.json({ error: "Nenhuma imagem retornada pelo modelo." }, { status: 500 });

  } catch (error) {
    console.error("[test-image] Erro:", error);
    return NextResponse.json({ error: "Falha interna na requisição." }, { status: 500 });
  }
}
