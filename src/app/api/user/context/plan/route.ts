export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { getSessionUser } from "@/lib/auth";
import { decryptApiKey } from "@/lib/encryption";

export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  await connectDB();

  const user = await User.findById(session.userId).select(
    "+encryptedGeminiKey +geminiKeyIv +geminiKeyAuthTag hasGeminiKey aiContext"
  );

  if (!user || !user.hasGeminiKey) {
    return NextResponse.json({ error: "Gemini API Key não configurada." }, { status: 422 });
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

  interface AiCtx { brandName?: string; brandDescription?: string; audience?: string; tone?: string; structure?: string; themesYes?: string[]; themesNo?: string[]; rules?: string; instagramHandle?: string; }
  const ctx: AiCtx = user.aiContext || {};

  const prompt = `Você é um estrategista de conteúdo para Instagram especializado em carrosséis virais.

Com base no contexto de marca abaixo, gere um PLANEJAMENTO DETALHADO em português para o próximo carrossel ideal para essa marca. Escreva de forma fluida e estratégica, como se estivesse pensando em voz alta.

CONTEXTO DA MARCA:
- Nome: ${ctx.brandName || 'Não informado'}
- Descrição: ${ctx.brandDescription || 'Não informada'}
- Público-alvo: ${ctx.audience || 'Não informado'}
- Tom de voz: ${ctx.tone || 'Não informado'}
- Estrutura padrão: ${ctx.structure || 'Não informada'}
- Temas permitidos: ${ctx.themesYes?.join(', ') || 'Não informados'}
- Temas proibidos: ${ctx.themesNo?.join(', ') || 'Nenhum'}
- Regras personalizadas: ${ctx.rules || 'Nenhuma'}
- Instagram: ${ctx.instagramHandle || 'Não informado'}

Estruture o planejamento assim:
1. **Análise do contexto** — o que eu entendi sobre essa marca
2. **Tema do carrossel** — qual tema vai bombar agora com esse público
3. **Estrutura dos slides** — quantos slides, o que vai em cada um
4. **Tom e linguagem** — como vou escrever cada slide
5. **Elemento viral** — o que vai fazer as pessoas salvar ou compartilhar
6. **Call to action** — como vou fechar o carrossel

Seja específico, criativo e estratégico. Use exemplos concretos.`;

  const ai = new GoogleGenAI({ apiKey: geminiApiKey });

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await ai.models.generateContentStream({
          model: "gemini-2.0-flash",
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        });

        for await (const chunk of response) {
          const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
          }
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
