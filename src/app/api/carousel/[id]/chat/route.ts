export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { getSessionUser } from "@/lib/auth";
import { decryptApiKey } from "@/lib/encryption";

interface ChatMessage { role: "user" | "assistant"; content: string; }

function buildCarouselSummary(carousel: any): string {
  if (!carousel) return "Carrossel sem dados.";
  const slides = (carousel.slides || []).map((s: any, i: number) => {
    const texts = (s.elements || [])
      .filter((e: any) => e.type === "text")
      .map((e: any, ti: number) => `      [elementIndex:${ti}] "${e.text || ""}"`)
      .join("\n");
    return `  Slide ${i} (slideIndex:${i}):${texts ? "\n" + texts : " (sem texto)"}`;
  }).join("\n");

  return `Título: ${carousel.title || "Sem título"}
Tema: ${carousel.theme || "N/A"}
Cor de destaque: ${carousel.accentColor || "#FFD700"}
Total de slides: ${(carousel.slides || []).length}

Slides e elementos de texto:
${slides}`;
}

export async function POST(req: NextRequest, _ctx: { params: { id: string } }) {
  const session = await getSessionUser();
  if (!session) return new Response(JSON.stringify({ error: "Não autenticado." }), { status: 401 });

  await connectDB();

  const user = await User.findById(session.userId).select(
    "+encryptedGeminiKey +geminiKeyIv +geminiKeyAuthTag hasGeminiKey textModel aiContext"
  );
  if (!user?.hasGeminiKey) {
    return new Response(JSON.stringify({ error: "Gemini API Key não configurada." }), { status: 422 });
  }

  let geminiApiKey: string;
  try {
    geminiApiKey = decryptApiKey({
      ciphertext: user.encryptedGeminiKey!,
      iv: user.geminiKeyIv!,
      authTag: user.geminiKeyAuthTag!,
    });
  } catch {
    return new Response(JSON.stringify({ error: "Falha ao descriptografar API Key." }), { status: 500 });
  }

  let body: { message: string; history: ChatMessage[]; carousel: any };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Body inválido." }), { status: 400 });
  }

  const { message, history = [], carousel } = body;
  const ctx = user.aiContext || {} as any;

  const systemPrompt = `Você é um agente de edição de carrosséis para Instagram. Você pode editar o carrossel diretamente respondendo com comandos de ação.

CONTEXTO DA MARCA:
- Nome: ${ctx.brandName || "Não informado"}
- Tom de voz: ${ctx.tone || "Não informado"}
- Público-alvo: ${ctx.audience || "Não informado"}

ESTADO ATUAL DO CARROSSEL:
${buildCarouselSummary(carousel)}

INSTRUÇÕES:
1. Responda SEMPRE em português brasileiro
2. Seja conciso — uma frase explicando o que vai fazer, depois os comandos
3. SEMPRE inclua um bloco ACTIONS no final quando for editar algo — mesmo que o usuário peça algo simples
4. O bloco ACTIONS deve estar no formato EXATO abaixo, sem markdown, sem explicação dentro do bloco

FORMATO OBRIGATÓRIO para ações (copie exatamente):
ACTIONS:
{"type":"editText","slideIndex":0,"elementId":"ID_AQUI","text":"texto novo"}

Para múltiplas ações, uma por linha depois de ACTIONS:
ACTIONS:
{"type":"editText","slideIndex":0,"elementId":"ID1","text":"texto 1"}
{"type":"editAccentColor","color":"#FF6B6B"}

AÇÕES DISPONÍVEIS:
- editText → muda texto: {"type":"editText","slideIndex":N,"elementIndex":N,"text":"novo texto"}
  (slideIndex e elementIndex são os números mostrados no estado do carrossel, começando em 0)
- editAccentColor → muda cor: {"type":"editAccentColor","color":"#RRGGBB"}
- editSlideBackground → muda fundo: {"type":"editSlideBackground","slideIndex":N,"bgOverride":"linear-gradient(135deg, #cor1, #cor2)"}
- selectSlide → navega para slide: {"type":"selectSlide","slideIndex":N}

CRÍTICO: Use EXATAMENTE os índices listados. slideIndex:0 = primeiro slide. elementIndex:0 = primeiro texto do slide.
NAO use markdown, NAO use blocos de codigo, NAO use colchetes duplos. Apenas ACTIONS: seguido de JSON puro.`;

  const contents = [
    ...history.map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    })),
    { role: "user" as const, parts: [{ text: message }] },
  ];

  const ai = new GoogleGenAI({ apiKey: geminiApiKey });
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await ai.models.generateContentStream({
          model: user.textModel || "gemini-2.0-flash",
          contents,
          config: { systemInstruction: systemPrompt },
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
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
