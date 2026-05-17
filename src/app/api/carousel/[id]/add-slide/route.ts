import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Carousel, { ISlide, IElement } from "@/models/Carousel";
import { getSessionUser } from "@/lib/auth";
import { decryptApiKey } from "@/lib/encryption";
import { CANVAS_W, CANVAS_H, parseSegments } from "@/lib/canvas";

export const maxDuration = 60;

const DEFAULT_TEXT_MODEL = "gemini-2.0-flash";

interface RouteParams { params: { id: string } }

export async function POST(req: NextRequest, { params }: RouteParams) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = params;
  let hasImage = false;

  try {
    const body = await req.json();
    hasImage = body.hasImage === true;
  } catch { /* ok */ }

  await connectDB();

  const carousel = await Carousel.findOne({ _id: id, userId: session.userId });
  if (!carousel) return NextResponse.json({ error: "Carrossel não encontrado." }, { status: 404 });

  const user = await User.findById(session.userId).select("+encryptedGeminiKey +geminiKeyIv +geminiKeyAuthTag hasGeminiKey textModel");
  if (!user?.hasGeminiKey) {
    return NextResponse.json({ error: "Gemini API Key não configurada." }, { status: 422 });
  }

  let geminiApiKey: string;
  try {
    geminiApiKey = decryptApiKey({ ciphertext: user.encryptedGeminiKey!, iv: user.geminiKeyIv!, authTag: user.geminiKeyAuthTag! });
  } catch {
    return NextResponse.json({ error: "Falha ao descriptografar a API Key." }, { status: 500 });
  }

  // Extract existing slide content for context
  const existingContent = carousel.slides
    .slice(0, -1) // exclude last (CTA) slide
    .map((s, i) => {
      const titleEl = s.elements.find(e => e.type === "text" && e.id.includes("-h"));
      const bodyEl = s.elements.find(e => e.type === "text" && e.id.includes("-p"));
      return `Slide ${i + 1}: "${titleEl?.text?.replace(/\*\*/g, "") || "sem título"}" — ${bodyEl?.text || "sem corpo"}`;
    })
    .join("\n");

  const prompt = `Você está analisando um carrossel do Instagram sobre: "${carousel.title}".

Conteúdo existente:
${existingContent}

Crie UM slide NOVO que:
- Continue a narrativa sem repetir o que já foi dito
- Adicione um ponto específico, valioso e diferente dos slides acima
- Seja impactante e persuasivo
- Use 1 a 2 palavras em **asteriscos duplos** para destaque (obrigatório)

${hasImage ? `Crie também "imagePrompt" em INGLÊS: uma cena visual criativa e específica para este slide.` : `Não inclua "imagePrompt".`}

Responda APENAS com JSON válido:
{
  "title": "TÍTULO COM **PALAVRA** EM DESTAQUE",
  "body": "Copy persuasivo do slide com 3-4 linhas ricas em conteúdo"${hasImage ? `,\n  "imagePrompt": "specific creative scene in English"` : ""}
}`;

  try {
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: user.textModel || DEFAULT_TEXT_MODEL });
    const result = await model.generateContent(prompt);
    const rawText = result.response.text().trim().replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    const parsed = JSON.parse(rawText) as { title: string; body: string; imagePrompt?: string };

    const cid = `c${Date.now()}`;
    const accentColor = carousel.accentColor || "#FFD700";
    const segments = parseSegments(parsed.title, accentColor);
    const titleText = parsed.title.replace(/\*\*/g, "").toUpperCase();
    const W = CANVAS_W;
    const H = CANVAS_H;

    const els: IElement[] = [];

    if (hasImage && parsed.imagePrompt) {
      // Layout: text top + image bottom
      els.push({ id: `${cid}-h`, type: "text", text: titleText, segments, x: 60, y: 200, w: W-120, h: 220, fontSize: 100, weight: 900, color: "#FFFFFF", font: "TheBoldFont", align: "center", lineHeight: 0.95 });
      els.push({ id: `${cid}-p`, type: "text", text: parsed.body, x: 100, y: 400, w: W-200, h: 200, fontSize: 36, weight: 500, color: "#D4D4D4", font: "Space Grotesk", align: "center", lineHeight: 1.5 });
      els.push({ id: `${cid}-img`, type: "image", imagePrompt: parsed.imagePrompt, x: 60, y: 680, w: W-120, h: 580, radius: 24 });
    } else {
      // Centered text layout
      els.push({ id: `${cid}-dot`, type: "shape", shape: "circle", x: W/2-16, y: 90, w: 32, h: 32, color: accentColor, opacity: 1 });
      els.push({ id: `${cid}-h`, type: "text", text: titleText, segments, x: 60, y: 160, w: W-120, h: 440, fontSize: 148, weight: 900, color: "#FFFFFF", font: "TheBoldFont", align: "center", lineHeight: 0.9 });
      els.push({ id: `${cid}-rule`, type: "shape", shape: "rect", x: W/2-60, y: 620, w: 120, h: 6, color: accentColor, radius: 3, opacity: 1 });
      els.push({ id: `${cid}-p`, type: "text", text: parsed.body, x: 80, y: 660, w: W-160, h: 520, fontSize: 40, weight: 500, color: "#D0D0D0", font: "Space Grotesk", align: "center", lineHeight: 1.6 });
    }

    // Page number placeholder
    els.push({ id: `${cid}-page`, type: "text", text: "—", x: W-120, y: H-80, w: 100, h: 40, fontSize: 22, weight: 700, color: "rgba(255,255,255,0.35)", font: "Space Grotesk", align: "right" });

    const newSlide: ISlide = {
      id: `${cid}-slide`,
      bgKey: "noir",
      bgOverride: "#000000",
      bgImageUrl: undefined,
      imagePrompt: undefined,
      elements: els,
    };

    return NextResponse.json({ slide: newSlide });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("[add-slide] ERRO COMPLETO:", err);
    const isQuotaError = msg.includes("RESOURCE_EXHAUSTED") || msg.includes("quota");
    if (isQuotaError) {
      console.error("[add-slide] QUOTA ESGOTADA — resposta Gemini:", JSON.stringify(err, null, 2));
      return NextResponse.json({ error: "Cota da Gemini API esgotada. Aguarde ou verifique seu plano no Google AI Studio." }, { status: 429 });
    }
    return NextResponse.json({ error: `Erro ao gerar slide: ${msg}` }, { status: 502 });
  }
}
