import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { connectDB } from "@/lib/mongodb";
import ScheduledPost from "@/models/ScheduledPost";
import User from "@/models/User";
import { getSessionUser } from "@/lib/auth";
import { decryptApiKey } from "@/lib/encryption";
import { randomUUID } from "crypto";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const body = await req.json();
  const { dates, ideasPerDay, niche, objective, additionalInstructions } = body;

  if (!Array.isArray(dates) || dates.length === 0) {
    return NextResponse.json({ error: "Selecione pelo menos uma data." }, { status: 400 });
  }
  if (!niche?.trim() || !objective?.trim()) {
    return NextResponse.json({ error: "Nicho e objetivo são obrigatórios." }, { status: 400 });
  }

  await connectDB();

  const user = await User.findById(session.userId).select("+encryptedGeminiKey +geminiKeyIv +geminiKeyAuthTag hasGeminiKey textModel");
  if (!user?.hasGeminiKey) {
    return NextResponse.json({ error: "Configure sua Gemini API Key em Configurações primeiro." }, { status: 422 });
  }

  let geminiApiKey: string;
  try {
    geminiApiKey = decryptApiKey({
      ciphertext: user.encryptedGeminiKey!,
      iv: user.geminiKeyIv!,
      authTag: user.geminiKeyAuthTag!,
    });
  } catch {
    return NextResponse.json({ error: "Falha ao descriptografar a API Key." }, { status: 500 });
  }

  const count = Math.min(Math.max(Number(ideasPerDay) || 2, 1), 5);
  const datesFormatted = dates.map((d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
  });

  const prompt = `Você é um estrategista de conteúdo para Instagram especializado em criadores de conteúdo.
Nicho: ${niche}
Objetivo do mês: ${objective}
${additionalInstructions ? `Instruções adicionais: ${additionalInstructions}` : ""}

Gere ${count} ideia(s) de carrossel viral para CADA uma das seguintes datas:
${datesFormatted.map((d: string, i: number) => `- Data ${i + 1}: ${d} (${dates[i]})`).join("\n")}

Cada ideia deve ter:
- Título impactante e específico (máx 10 palavras) — pense viral, contraintuitivo, útil
- Descrição detalhada do conteúdo (2-3 frases explicando o que o carrossel vai cobrir)
- Tom recomendado (um de: direct, editorial, didactic, provocative, casual, authoritive)
- Hook de abertura sugerido (1 frase de gancho para o primeiro slide)

IMPORTANTE: As ideias devem formar uma narrativa coerente — não repita temas entre os dias. Pense como uma linha editorial.

Responda APENAS com JSON válido, sem markdown:
{
  "days": [
    {
      "date": "${dates[0]}",
      "ideas": [
        {
          "id": "unique-id",
          "title": "Título do carrossel",
          "description": "Descrição detalhada do conteúdo",
          "tone": "direct",
          "hook": "Hook de abertura"
        }
      ]
    }
  ]
}`;

  try {
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: user.textModel || "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const rawText = result.response.text().trim();
    const jsonText = rawText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    const parsed = JSON.parse(jsonText) as { days: Array<{ date: string; ideas: Array<{ id: string; title: string; description: string; tone: string; hook?: string }> }> };

    const createdPosts = [];

    for (const dayData of parsed.days) {
      const dateObj = new Date(dayData.date);
      // Normalize to start of day UTC
      dateObj.setUTCHours(0, 0, 0, 0);

      // Delete existing post for this date if any
      await ScheduledPost.deleteOne({ userId: session.userId, date: dateObj });

      const ideas = dayData.ideas.map((idea) => ({
        ...idea,
        id: randomUUID(),
        status: "pending" as const,
      }));

      const post = await ScheduledPost.create({
        userId: session.userId,
        date: dateObj,
        niche,
        objective,
        ideas,
      });

      createdPosts.push(post);
    }

    return NextResponse.json({ posts: createdPosts, message: `Ideias geradas para ${createdPosts.length} dia(s).` });
  } catch (err) {
    console.error("[calendar/generate]", err);
    return NextResponse.json({ error: "Erro ao gerar ideias. Tente novamente." }, { status: 500 });
  }
}
