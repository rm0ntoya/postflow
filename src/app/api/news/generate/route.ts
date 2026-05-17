import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Carousel, { IElement, ISlide } from "@/models/Carousel";
import { getSessionUser } from "@/lib/auth";
import { decryptApiKey } from "@/lib/encryption";
import { CANVAS_W, CANVAS_H, parseSegments } from "@/lib/canvas";

export const maxDuration = 60;

const DEFAULT_TEXT_MODEL = "gemini-2.0-flash";

interface GeminiSlide {
  slideNumber: number;
  title: string;
  body: string;
  imagePrompt: string;
  imagePrompt2?: string;
}

type NewsTone = "gossip" | "news" | "viral";

function buildNewsPrompt(title: string, content: string, tone: NewsTone, slideCount: number, customAngle?: string): string {
  const toneInstructions: Record<NewsTone, string> = {
    gossip: `Você é uma página de fofocas do Instagram — animada, dramática, linguagem popular e informal.
Tom: use linguagem informal ("GENTE!", "Você não vai acreditar!"), reações emocionais, drama, emojis no body.
Títulos: impactantes, sensacionalistas mas verdadeiros.`,
    news: `Você é um comunicador de notícias para Instagram — claro, direto, informativo.
Tom: linguagem clara e objetiva, fatos em ordem de importância, sem sensacionalismo.
Títulos: informativos e diretos.`,
    viral: `Você é um criador de conteúdo viral para Instagram — provoca curiosidade, usa ganchos fortes, linguagem jovem.
Tom: títulos que geram clique, body que surpreende, use os fatos para provocar reação emocional forte.`,
  };

  return `${toneInstructions[tone]}

NOTÍCIA ORIGINAL:
Título: ${title}
Conteúdo: ${content.slice(0, 3000)}

${customAngle ? `ÂNGULO PERSONALIZADO: ${customAngle}\nAborde a notícia sob essa perspectiva específica ao longo de todo o carrossel.\n` : ""}Crie um carrossel de ${slideCount} slides baseado SOMENTE nas informações acima. NÃO invente fatos.

ESTRUTURA OBRIGATÓRIA:
- Slide 1: título impactante (máx 8 palavras) + gancho/subtítulo curto (1-2 linhas)
- Slides 2 a ${slideCount - 1}: título do ponto (máx 6 palavras) + texto explicativo (3-4 linhas)
- Slide ${slideCount}: encerramento ou CTA (ex: "Salve para compartilhar", "O que você acha?")

REGRA ABSOLUTA: Envolva 1-2 palavras de cada título com **asteriscos duplos** (ex: O **ESCÂNDALO** revelado).

Para imagePrompt de cada slide: crie em INGLÊS uma cena visual dramática relacionada ao conteúdo. Seja específico.
Para imagePrompt2: cena complementar à imagePrompt — mesma história, ângulo diferente.

Responda APENAS com JSON válido, sem markdown:
{
  "slides": [
    {
      "slideNumber": 1,
      "title": "Título com **PALAVRA** destacada",
      "body": "Texto do slide",
      "imagePrompt": "dramatic scene in English",
      "imagePrompt2": "complementary scene in English"
    }
  ]
}`;
}

// Same templates as carousel/generate
function buildCanvasSlides(
  geminiSlides: GeminiSlide[],
  cid: string,
  accentColor: string,
  handle: string,
  imageSlides: number[],
  scrapedImages: string[],
  faceSlides: number[],
  generateAiImages: boolean,
  profilePhotoUrl?: string
): ISlide[] {
  const count = geminiSlides.length;
  const W = CANVAS_W;
  const H = CANVAS_H;
  const TBF = "TheBoldFont";
  const SG = "Space Grotesk";

  let textSlideCount = 0;
  let scrapedIdx = 0;

  return geminiSlides.map((gs, i) => {
    const els: IElement[] = [];
    const segments = parseSegments(gs.title, accentColor);
    const isFirst = i === 0;
    const isLast = i === count - 1;
    const titleText = gs.title.replace(/\*\*/g, "").toUpperCase();
    const hasImage = imageSlides.includes(i) || isFirst || isLast;

    const addProfile = (y: number, x = 60, w = 500) => {
      els.push({ id: `${cid}-s${i}-profile`, type: "profile", text: handle, photoUrl: profilePhotoUrl || "", x, y, w, h: 56, fontSize: 28, weight: 700, color: "#FFFFFF", font: SG });
    };
    const addPageNum = () => {
      els.push({ id: `${cid}-s${i}-page`, type: "text", text: String(i + 1), x: W - 120, y: H - 80, w: 100, h: 40, fontSize: 22, weight: 700, color: "rgba(255,255,255,0.35)", font: SG, align: "right" });
    };

    // Resolve image for this slide
    let bgImageUrl: string | undefined;
    let slideImagePrompt: string | undefined;
    let useFaceForGeneration = false;

    if (hasImage) {
      if (scrapedIdx < scrapedImages.length) {
        bgImageUrl = scrapedImages[scrapedIdx++];
      } else if (generateAiImages) {
        slideImagePrompt = gs.imagePrompt;
        useFaceForGeneration = faceSlides.includes(i);
      }
    }

    // ── TEXT-ONLY SLIDES ──────────────────────────────────────────────────────
    if (!hasImage) {
      const tpl = textSlideCount % 11;
      textSlideCount++;

      if (tpl === 0) {
        els.push({ id: `${cid}-s${i}-c1`, type: "shape", shape: "circle", x: -300, y: -300, w: 900, h: 900, color: accentColor, opacity: 0.06 });
        els.push({ id: `${cid}-s${i}-c2`, type: "shape", shape: "circle", x: W - 200, y: H - 400, w: 700, h: 700, color: accentColor, opacity: 0.05 });
        els.push({ id: `${cid}-s${i}-dot`, type: "shape", shape: "circle", x: W / 2 - 16, y: 90, w: 32, h: 32, color: accentColor, opacity: 1 });
        addProfile(150);
        els.push({ id: `${cid}-s${i}-h`, type: "text", text: titleText, segments, x: 60, y: 260, w: W - 120, h: 440, fontSize: 148, weight: 900, color: "#FFFFFF", font: TBF, align: "center", lineHeight: 0.9 });
        els.push({ id: `${cid}-s${i}-rule`, type: "shape", shape: "rect", x: W / 2 - 60, y: 720, w: 120, h: 6, color: accentColor, radius: 3, opacity: 1 });
        els.push({ id: `${cid}-s${i}-p`, type: "text", text: gs.body, x: 80, y: 760, w: W - 160, h: 420, fontSize: 40, weight: 500, color: "#D0D0D0", font: SG, align: "center", lineHeight: 1.6 });
      } else if (tpl === 1) {
        els.push({ id: `${cid}-s${i}-topbar`, type: "shape", shape: "rect", x: 60, y: 60, w: W - 120, h: 3, color: accentColor, opacity: 0.4, radius: 2 });
        addProfile(90);
        els.push({ id: `${cid}-s${i}-h`, type: "text", text: titleText, segments, x: 60, y: 210, w: W - 120, h: 420, fontSize: 140, weight: 900, color: "#FFFFFF", font: TBF, align: "center", lineHeight: 0.88 });
        els.push({ id: `${cid}-s${i}-rule1`, type: "shape", shape: "rect", x: 60, y: 655, w: W - 120, h: 2, color: "#fff", opacity: 0.08, radius: 1 });
        els.push({ id: `${cid}-s${i}-rule2`, type: "shape", shape: "rect", x: 60, y: 663, w: W - 120, h: 2, color: accentColor, opacity: 0.5, radius: 1 });
        els.push({ id: `${cid}-s${i}-p`, type: "text", text: gs.body, x: 80, y: 700, w: W - 160, h: 520, fontSize: 42, weight: 400, color: "#C8C8C8", font: SG, align: "center", lineHeight: 1.6 });
      } else if (tpl === 2) {
        addProfile(80);
        els.push({ id: `${cid}-s${i}-h`, type: "text", text: titleText, segments, x: 60, y: 190, w: W - 120, h: 500, fontSize: 155, weight: 900, color: "#FFFFFF", font: TBF, align: "center", lineHeight: 0.86 });
        els.push({ id: `${cid}-s${i}-accent`, type: "shape", shape: "rect", x: W / 2 - 80, y: 710, w: 160, h: 7, color: accentColor, radius: 4, opacity: 1 });
        els.push({ id: `${cid}-s${i}-p`, type: "text", text: gs.body, x: 70, y: 760, w: W - 140, h: 460, fontSize: 40, weight: 500, color: "#D4D4D4", font: SG, align: "center", lineHeight: 1.6 });
      } else if (tpl === 3) {
        els.push({ id: `${cid}-s${i}-qmark1`, type: "shape", shape: "rect", x: 60, y: 100, w: 8, h: 240, color: accentColor, opacity: 1, radius: 4 });
        els.push({ id: `${cid}-s${i}-body`, type: "text", text: `"${gs.body}"`, x: 90, y: 100, w: W - 180, h: 520, fontSize: 52, weight: 500, color: "#F0F0F0", font: SG, align: "center", lineHeight: 1.55 });
        els.push({ id: `${cid}-s${i}-rule`, type: "shape", shape: "rect", x: W / 2 - 60, y: H / 2 + 60, w: 120, h: 5, color: accentColor, radius: 3, opacity: 1 });
        addProfile(H / 2 + 110);
        els.push({ id: `${cid}-s${i}-h`, type: "text", text: titleText, segments, x: 60, y: H / 2 + 200, w: W - 120, h: 320, fontSize: 110, weight: 900, color: "#FFFFFF", font: TBF, align: "center", lineHeight: 0.92 });
      } else if (tpl === 4) {
        els.push({ id: `${cid}-s${i}-topline`, type: "shape", shape: "rect", x: 60, y: 60, w: 80, h: 7, color: accentColor, radius: 4, opacity: 1 });
        addProfile(90);
        els.push({ id: `${cid}-s${i}-h`, type: "text", text: titleText, segments, x: 60, y: 210, w: W - 120, h: 500, fontSize: 144, weight: 900, color: "#FFFFFF", font: TBF, align: "center", lineHeight: 0.88 });
        els.push({ id: `${cid}-s${i}-rule`, type: "shape", shape: "rect", x: 60, y: 730, w: W - 120, h: 2, color: "#fff", opacity: 0.1, radius: 1 });
        els.push({ id: `${cid}-s${i}-p`, type: "text", text: gs.body, x: 70, y: 770, w: W - 140, h: 460, fontSize: 42, weight: 400, color: "#C2C2C2", font: SG, align: "center", lineHeight: 1.65 });
      } else if (tpl === 5) {
        els.push({ id: `${cid}-s${i}-tl`, type: "shape", shape: "circle", x: -120, y: -120, w: 340, h: 340, color: accentColor, opacity: 0.08 });
        els.push({ id: `${cid}-s${i}-br`, type: "shape", shape: "circle", x: W - 220, y: H - 220, w: 340, h: 340, color: accentColor, opacity: 0.08 });
        addProfile(H / 2 - 440);
        els.push({ id: `${cid}-s${i}-h`, type: "text", text: titleText, segments, x: 60, y: H / 2 - 360, w: W - 120, h: 480, fontSize: 150, weight: 900, color: "#FFFFFF", font: TBF, align: "center", lineHeight: 0.88 });
        els.push({ id: `${cid}-s${i}-p`, type: "text", text: gs.body, x: 80, y: H / 2 + 170, w: W - 160, h: 480, fontSize: 42, weight: 400, color: "#BEBEBE", font: SG, align: "center", lineHeight: 1.6 });
      } else if (tpl === 6) {
        els.push({ id: `${cid}-s${i}-vdiv`, type: "shape", shape: "rect", x: 520, y: 100, w: 2, h: H - 200, color: "#ffffff", opacity: 0.07, radius: 1 });
        addProfile(80, 60, 420);
        els.push({ id: `${cid}-s${i}-h`, type: "text", text: titleText, segments, x: 50, y: 200, w: 440, h: 620, fontSize: 148, weight: 900, color: "#FFFFFF", font: TBF, align: "center", lineHeight: 0.88 });
        els.push({ id: `${cid}-s${i}-p`, type: "text", text: gs.body, x: 560, y: 160, w: 460, h: 960, fontSize: 40, weight: 400, color: "#CCCCCC", font: SG, align: "left", lineHeight: 1.65 });
      } else if (tpl === 7) {
        addProfile(70);
        els.push({ id: `${cid}-s${i}-h`, type: "text", text: titleText, segments, x: 60, y: 170, w: W - 120, h: 240, fontSize: 92, weight: 900, color: "#FFFFFF", font: TBF, align: "center", lineHeight: 0.9 });
        els.push({ id: `${cid}-s${i}-rule`, type: "shape", shape: "rect", x: W / 2 - 80, y: 420, w: 160, h: 4, color: accentColor, radius: 2, opacity: 1 });
        els.push({ id: `${cid}-s${i}-p`, type: "text", text: gs.body, x: 120, y: 446, w: W - 180, h: 580, fontSize: 36, weight: 500, color: "#D0D0D0", font: SG, align: "left", lineHeight: 1.72 });
      } else if (tpl === 8) {
        addProfile(60);
        els.push({ id: `${cid}-s${i}-h`, type: "text", text: titleText, segments, x: 60, y: 160, w: W - 120, h: 200, fontSize: 88, weight: 900, color: "#FFFFFF", font: TBF, align: "center", lineHeight: 0.9 });
        els.push({ id: `${cid}-s${i}-box-a`, type: "shape", shape: "rect", x: 40, y: 380, w: W - 80, h: 340, color: "#ef4444", opacity: 0.08, radius: 16 });
        els.push({ id: `${cid}-s${i}-lbl-a`, type: "text", text: "❌  ANTES", x: 70, y: 405, w: 300, h: 50, fontSize: 26, weight: 700, color: "#ef4444", font: SG, align: "left" });
        const half = Math.ceil(gs.body.length / 2);
        els.push({ id: `${cid}-s${i}-txt-a`, type: "text", text: gs.body.slice(0, half), x: 70, y: 460, w: W - 150, h: 240, fontSize: 34, weight: 400, color: "#C8C8C8", font: SG, align: "left", lineHeight: 1.5 });
        els.push({ id: `${cid}-s${i}-box-b`, type: "shape", shape: "rect", x: 40, y: 780, w: W - 80, h: 340, color: "#22c55e", opacity: 0.08, radius: 16 });
        els.push({ id: `${cid}-s${i}-lbl-b`, type: "text", text: "✓  DEPOIS", x: 70, y: 805, w: 300, h: 50, fontSize: 26, weight: 700, color: "#22c55e", font: SG, align: "left" });
        els.push({ id: `${cid}-s${i}-txt-b`, type: "text", text: gs.body.slice(half), x: 70, y: 860, w: W - 150, h: 240, fontSize: 34, weight: 400, color: "#C8C8C8", font: SG, align: "left", lineHeight: 1.5 });
      } else if (tpl === 9) {
        els.push({ id: `${cid}-s${i}-h`, type: "text", text: titleText, segments, x: 60, y: 70, w: W - 120, h: 200, fontSize: 88, weight: 900, color: "#FFFFFF", font: TBF, align: "center", lineHeight: 0.9 });
        addProfile(310);
        els.push({ id: `${cid}-s${i}-line`, type: "shape", shape: "rect", x: 96, y: 420, w: 4, h: 680, color: accentColor, opacity: 0.25, radius: 2 });
        const bodyLines = gs.body.split(/\n|[.!?]\s+/).filter(Boolean);
        [420, 650, 880].forEach((y, s) => {
          els.push({ id: `${cid}-s${i}-sc${s}`, type: "shape", shape: "circle", x: 62, y, w: 72, h: 72, color: accentColor, opacity: 1 - s * 0.25 });
          els.push({ id: `${cid}-s${i}-sn${s}`, type: "text", text: String(s + 1), x: 62, y: y + 4, w: 72, h: 64, fontSize: 28, weight: 900, color: "#000000", font: TBF, align: "center" });
          els.push({ id: `${cid}-s${i}-st${s}`, type: "text", text: bodyLines[s] || gs.body.slice(s * 80, (s + 1) * 80) || "—", x: 160, y: y + 4, w: W - 220, h: 60, fontSize: 34, weight: 600, color: "#FFFFFF", font: SG, align: "left" });
        });
      } else {
        // tpl === 10
        els.push({ id: `${cid}-s${i}-topbar`, type: "shape", shape: "rect", x: 60, y: 60, w: W - 120, h: 3, color: accentColor, opacity: 0.5, radius: 2 });
        els.push({ id: `${cid}-s${i}-h`, type: "text", text: titleText, segments, x: 60, y: 110, w: 440, h: 900, fontSize: 138, weight: 900, color: "#FFFFFF", font: TBF, align: "left", lineHeight: 0.87 });
        els.push({ id: `${cid}-s${i}-vdiv`, type: "shape", shape: "rect", x: 540, y: 110, w: 1, h: 960, color: "#ffffff", opacity: 0.07, radius: 1 });
        addProfile(100, 580, 460);
        els.push({ id: `${cid}-s${i}-p`, type: "text", text: gs.body, x: 580, y: 200, w: 440, h: 860, fontSize: 38, weight: 400, color: "#C0C0C0", font: SG, align: "left", lineHeight: 1.68 });
      }

      addPageNum();
      return { id: `${cid}-s${i}`, bgKey: "noir", bgOverride: "#000000", bgImageUrl: undefined, imagePrompt: undefined, useFaceForGeneration: false, elements: els };
    }

    // ── IMAGE SLIDES ───────────────────────────────────────────────────────────
    let imgTpl: number;
    if (isFirst) imgTpl = 0;
    else if (isLast) imgTpl = 1;
    else imgTpl = 2 + (i % 13);

    if (imgTpl === 0 || imgTpl === 1) {
      addProfile(H - 640);
      els.push({ id: `${cid}-s${i}-h`, type: "text", text: titleText, segments, x: 60, y: H - 560, w: W - 120, h: 320, fontSize: 126, weight: 900, color: "#FFFFFF", font: TBF, align: "center", lineHeight: 1.0 });
      els.push({ id: `${cid}-s${i}-p`, type: "text", text: gs.body, x: 100, y: H - 230, w: W - 200, h: 160, fontSize: 34, weight: 500, color: "#EAEAEA", font: SG, align: "center", lineHeight: 1.4 });
    } else if (imgTpl === 2) {
      addProfile(100);
      els.push({ id: `${cid}-s${i}-h`, type: "text", text: titleText, segments, x: 60, y: 200, w: W - 120, h: 220, fontSize: 100, weight: 900, color: "#FFFFFF", font: TBF, align: "center", lineHeight: 0.95 });
      els.push({ id: `${cid}-s${i}-p`, type: "text", text: gs.body, x: 100, y: 400, w: W - 200, h: 180, fontSize: 34, weight: 500, color: "#D4D4D4", font: SG, align: "center", lineHeight: 1.4 });
      els.push({ id: `${cid}-s${i}-img1`, type: "image", imagePrompt: gs.imagePrompt, x: 60, y: 680, w: W - 120, h: 580, radius: 24 });
    } else if (imgTpl === 3) {
      els.push({ id: `${cid}-s${i}-img1`, type: "image", imagePrompt: gs.imagePrompt, x: 60, y: 100, w: 450, h: 450, radius: 40 });
      els.push({ id: `${cid}-s${i}-img2`, type: "image", imagePrompt: gs.imagePrompt2 || gs.imagePrompt, x: 570, y: 100, w: 450, h: 450, radius: 40 });
      addProfile(610);
      els.push({ id: `${cid}-s${i}-h`, type: "text", text: titleText, segments, x: 60, y: 720, w: W - 120, h: 260, fontSize: 96, weight: 900, color: "#FFFFFF", font: TBF, align: "center", lineHeight: 0.95 });
      els.push({ id: `${cid}-s${i}-p`, type: "text", text: gs.body, x: 80, y: 1000, w: W - 160, h: 240, fontSize: 34, weight: 500, color: "#D0D0D0", font: SG, align: "center", lineHeight: 1.45 });
    } else if (imgTpl === 4) {
      addProfile(100);
      els.push({ id: `${cid}-s${i}-h`, type: "text", text: titleText, segments, x: 60, y: 200, w: W - 120, h: 240, fontSize: 100, weight: 900, color: "#FFFFFF", font: TBF, align: "center", lineHeight: 0.95 });
      els.push({ id: `${cid}-s${i}-p`, type: "text", text: gs.body, x: 100, y: 420, w: W - 200, h: 180, fontSize: 34, weight: 500, color: "#D4D4D4", font: SG, align: "center", lineHeight: 1.4 });
      els.push({ id: `${cid}-s${i}-img1`, type: "image", imagePrompt: gs.imagePrompt, x: 60, y: 720, w: 450, h: 450, radius: 40 });
      els.push({ id: `${cid}-s${i}-img2`, type: "image", imagePrompt: gs.imagePrompt2 || gs.imagePrompt, x: 570, y: 720, w: 450, h: 450, radius: 40 });
    } else if (imgTpl === 5) {
      els.push({ id: `${cid}-s${i}-img1`, type: "image", imagePrompt: gs.imagePrompt, x: 60, y: 100, w: W - 120, h: 580, radius: 24 });
      addProfile(740);
      els.push({ id: `${cid}-s${i}-h`, type: "text", text: titleText, segments, x: 60, y: 840, w: W - 120, h: 260, fontSize: 96, weight: 900, color: "#FFFFFF", font: TBF, align: "center", lineHeight: 0.95 });
      els.push({ id: `${cid}-s${i}-p`, type: "text", text: gs.body, x: 100, y: 1110, w: W - 200, h: 180, fontSize: 34, weight: 500, color: "#D4D4D4", font: SG, align: "center", lineHeight: 1.4 });
    } else if (imgTpl === 6) {
      els.push({ id: `${cid}-s${i}-img1`, type: "image", imagePrompt: gs.imagePrompt, x: 0, y: 0, w: 500, h: H, radius: 0 });
      addProfile(100, 548, 480);
      els.push({ id: `${cid}-s${i}-h`, type: "text", text: titleText, segments, x: 548, y: 210, w: 460, h: 340, fontSize: 80, weight: 900, color: "#FFFFFF", font: TBF, align: "left", lineHeight: 0.92 });
      els.push({ id: `${cid}-s${i}-p`, type: "text", text: gs.body, x: 548, y: 600, w: 460, h: 340, fontSize: 30, weight: 500, color: "#C8C8C8", font: SG, align: "left", lineHeight: 1.5 });
    } else if (imgTpl === 7) {
      els.push({ id: `${cid}-s${i}-img1`, type: "image", imagePrompt: gs.imagePrompt, x: W - 340, y: 80, w: 280, h: 280, radius: 28 });
      addProfile(80);
      els.push({ id: `${cid}-s${i}-h`, type: "text", text: titleText, segments, x: 60, y: 200, w: W - 420, h: 340, fontSize: 86, weight: 900, color: "#FFFFFF", font: TBF, align: "left", lineHeight: 0.95 });
      els.push({ id: `${cid}-s${i}-p`, type: "text", text: gs.body, x: 60, y: H / 2, w: W - 120, h: 340, fontSize: 38, weight: 500, color: "#CCCCCC", font: SG, align: "left", lineHeight: 1.5 });
    } else if (imgTpl === 8) {
      els.push({ id: `${cid}-s${i}-img1`, type: "image", imagePrompt: gs.imagePrompt, x: 60, y: 100, w: 448, h: 360, radius: 20 });
      els.push({ id: `${cid}-s${i}-img2`, type: "image", imagePrompt: gs.imagePrompt2 || gs.imagePrompt, x: 572, y: 100, w: 448, h: 360, radius: 20 });
      addProfile(524);
      els.push({ id: `${cid}-s${i}-h`, type: "text", text: titleText, segments, x: 60, y: 620, w: W - 120, h: 220, fontSize: 90, weight: 900, color: "#FFFFFF", font: TBF, align: "center", lineHeight: 0.95 });
      els.push({ id: `${cid}-s${i}-p`, type: "text", text: gs.body, x: 80, y: 860, w: W - 160, h: 160, fontSize: 30, weight: 500, color: "#D0D0D0", font: SG, align: "center", lineHeight: 1.45 });
      els.push({ id: `${cid}-s${i}-img3`, type: "image", imagePrompt: gs.imagePrompt, x: 60, y: 1050, w: W - 120, h: 210, radius: 20 });
    } else if (imgTpl === 9) {
      addProfile(80);
      els.push({ id: `${cid}-s${i}-h`, type: "text", text: titleText, segments, x: 60, y: 190, w: W - 120, h: 280, fontSize: 102, weight: 900, color: "#FFFFFF", font: TBF, align: "left", lineHeight: 0.92 });
      els.push({ id: `${cid}-s${i}-p`, type: "text", text: gs.body, x: 60, y: 520, w: W - 120, h: 200, fontSize: 34, weight: 500, color: "#C8C8C8", font: SG, align: "left", lineHeight: 1.45 });
      els.push({ id: `${cid}-s${i}-img1`, type: "image", imagePrompt: gs.imagePrompt, x: 60, y: 780, w: W - 120, h: 480, radius: 24 });
    } else if (imgTpl === 10) {
      els.push({ id: `${cid}-s${i}-ring`, type: "shape", shape: "circle", x: 160, y: 50, w: 760, h: 760, color: accentColor, opacity: 0.18 });
      els.push({ id: `${cid}-s${i}-img1`, type: "image", imagePrompt: gs.imagePrompt, x: 190, y: 80, w: 700, h: 700, radius: 350 });
      addProfile(848);
      els.push({ id: `${cid}-s${i}-h`, type: "text", text: titleText, segments, x: 60, y: 920, w: W - 120, h: 220, fontSize: 96, weight: 900, color: "#FFFFFF", font: TBF, align: "center", lineHeight: 0.92 });
      els.push({ id: `${cid}-s${i}-p`, type: "text", text: gs.body, x: 100, y: 1178, w: W - 200, h: 130, fontSize: 34, weight: 500, color: "#D0D0D0", font: SG, align: "center", lineHeight: 1.4 });
    } else if (imgTpl === 11) {
      els.push({ id: `${cid}-s${i}-faixa`, type: "shape", shape: "rect", x: 0, y: 576, w: W, h: 10, color: accentColor, opacity: 0.75, radius: 0 });
      els.push({ id: `${cid}-s${i}-overlay`, type: "shape", shape: "rect", x: 0, y: 586, w: W, h: H - 586, color: "rgba(0,0,0,0.72)", opacity: 1, radius: 0 });
      addProfile(640);
      els.push({ id: `${cid}-s${i}-h`, type: "text", text: titleText, segments, x: 60, y: 730, w: W - 120, h: 280, fontSize: 104, weight: 900, color: "#FFFFFF", font: TBF, align: "center", lineHeight: 0.92 });
      els.push({ id: `${cid}-s${i}-p`, type: "text", text: gs.body, x: 100, y: 1024, w: W - 200, h: 220, fontSize: 36, weight: 500, color: "#E0E0E0", font: SG, align: "center", lineHeight: 1.4 });
    } else if (imgTpl === 12) {
      addProfile(44);
      els.push({ id: `${cid}-s${i}-img1`, type: "image", imagePrompt: gs.imagePrompt, x: 40, y: 120, w: 468, h: 1000, radius: 20 });
      els.push({ id: `${cid}-s${i}-img2`, type: "image", imagePrompt: gs.imagePrompt2 || gs.imagePrompt, x: 548, y: 120, w: 492, h: 480, radius: 20 });
      els.push({ id: `${cid}-s${i}-img3`, type: "image", imagePrompt: gs.imagePrompt, x: 548, y: 620, w: 492, h: 500, radius: 20 });
      els.push({ id: `${cid}-s${i}-h`, type: "text", text: titleText, segments, x: 40, y: 1145, w: W - 80, h: 120, fontSize: 76, weight: 900, color: "#FFFFFF", font: TBF, align: "center", lineHeight: 0.92 });
    } else if (imgTpl === 13) {
      els.push({ id: `${cid}-s${i}-card`, type: "shape", shape: "rect", x: 60, y: 270, w: 960, h: 680, color: "rgba(0,0,0,0.65)", opacity: 1, radius: 20 });
      els.push({ id: `${cid}-s${i}-cardtop`, type: "shape", shape: "rect", x: 60, y: 270, w: 220, h: 5, color: accentColor, opacity: 1, radius: 3 });
      addProfile(320, 100, 500);
      els.push({ id: `${cid}-s${i}-h`, type: "text", text: titleText, segments, x: 100, y: 420, w: 880, h: 300, fontSize: 106, weight: 900, color: "#FFFFFF", font: TBF, align: "center", lineHeight: 0.9 });
      els.push({ id: `${cid}-s${i}-p`, type: "text", text: gs.body, x: 120, y: 760, w: 840, h: 160, fontSize: 34, weight: 500, color: "#EAEAEA", font: SG, align: "center", lineHeight: 1.4 });
    } else {
      // imgTpl === 14
      addProfile(60);
      els.push({ id: `${cid}-s${i}-h`, type: "text", text: titleText, segments, x: 60, y: 160, w: W - 120, h: 260, fontSize: 100, weight: 900, color: "#FFFFFF", font: TBF, align: "center", lineHeight: 0.92 });
      els.push({ id: `${cid}-s${i}-p`, type: "text", text: gs.body, x: 100, y: 450, w: W - 200, h: 140, fontSize: 34, weight: 500, color: "#D0D0D0", font: SG, align: "center", lineHeight: 1.4 });
      els.push({ id: `${cid}-s${i}-img1`, type: "image", imagePrompt: gs.imagePrompt, x: 40, y: 610, w: 316, h: 400, radius: 16 });
      els.push({ id: `${cid}-s${i}-img2`, type: "image", imagePrompt: gs.imagePrompt2 || gs.imagePrompt, x: 382, y: 610, w: 316, h: 400, radius: 16 });
      els.push({ id: `${cid}-s${i}-img3`, type: "image", imagePrompt: gs.imagePrompt, x: 724, y: 610, w: 316, h: 400, radius: 16 });
    }

    addPageNum();

    // Templates 0,1,11,13 use bgImageUrl (full-bleed) — others use element images
    const usesBgImage = imgTpl === 0 || imgTpl === 1 || imgTpl === 11 || imgTpl === 13;

    return {
      id: `${cid}-s${i}`,
      bgKey: bgImageUrl ? "image" : "noir",
      bgOverride: bgImageUrl ? undefined : (usesBgImage ? undefined : "#000000"),
      bgImageUrl: bgImageUrl || undefined,
      imagePrompt: bgImageUrl ? undefined : (usesBgImage ? slideImagePrompt : undefined),
      useFaceForGeneration,
      elements: els,
    };
  });
}

export async function POST(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  let title: string, content: string, images: string[], tone: NewsTone,
    slideCount: number, accentColor: string, newsUrl: string, newsSource: string,
    imageSlides: number[], faceSlides: number[], generateAiImages: boolean, customAngle: string | undefined;

  try {
    const body = await req.json();
    title = (body.title || "").trim();
    content = (body.content || "").trim();
    images = Array.isArray(body.images) ? body.images : [];
    tone = ["gossip", "news", "viral"].includes(body.tone) ? body.tone : "gossip";
    slideCount = Math.min(Math.max(Number(body.slideCount) || 7, 3), 12);
    accentColor = /^#[0-9A-Fa-f]{6}$/.test(body.accentColor || "") ? body.accentColor : "#FFD700";
    newsUrl = (body.newsUrl || "").trim();
    newsSource = (body.newsSource || "").trim();
    imageSlides = Array.isArray(body.imageSlides) ? body.imageSlides.map(Number) : [0, slideCount - 1];
    faceSlides = Array.isArray(body.faceSlides) ? body.faceSlides.map(Number) : [];
    generateAiImages = body.generateAiImages !== false;
    customAngle = typeof body.customAngle === "string" && body.customAngle.trim() ? body.customAngle.trim() : undefined;
  } catch {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  if (!title || !content) {
    return NextResponse.json({ error: "Título e conteúdo são obrigatórios." }, { status: 400 });
  }

  await connectDB();

  const user = await User.findById(session.userId).select(
    "+encryptedGeminiKey +geminiKeyIv +geminiKeyAuthTag hasGeminiKey textModel aiContext brandAccentColor profileAvatarUrl"
  );
  if (!user) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
  if (!user.hasGeminiKey) return NextResponse.json({ error: "Nenhuma Gemini API Key configurada." }, { status: 422 });

  let geminiApiKey: string;
  try {
    geminiApiKey = decryptApiKey({ ciphertext: user.encryptedGeminiKey!, iv: user.geminiKeyIv!, authTag: user.geminiKeyAuthTag! });
  } catch {
    return NextResponse.json({ error: "Falha ao descriptografar a API Key." }, { status: 500 });
  }

  const aiContext = user.aiContext as Record<string, string> | undefined;
  const handle = aiContext?.instagramHandle || "@seuhandle";
  const resolvedAccent = accentColor !== "#FFD700" ? accentColor : (user.brandAccentColor || "#FFD700");
  const cid = `n${Date.now()}`;

  const carousel = await Carousel.create({
    userId: session.userId,
    title: title.slice(0, 60),
    theme: "Notícia",
    slides: [],
    status: "generating",
    accentColor: resolvedAccent,
    viral: false,
    mode: "news",
    newsUrl,
    newsSource,
  });

  try {
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: user.textModel || DEFAULT_TEXT_MODEL });
    const prompt = buildNewsPrompt(title, content, tone, slideCount, customAngle);

    const result = await model.generateContent(prompt);
    const rawText = result.response.text().trim();
    const jsonText = rawText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    const parsed = JSON.parse(jsonText) as { slides: GeminiSlide[] };

    if (!Array.isArray(parsed.slides) || parsed.slides.length === 0) {
      throw new Error("Gemini retornou estrutura de slides inválida.");
    }

    const slides = buildCanvasSlides(
      parsed.slides, cid, resolvedAccent, handle,
      imageSlides, images, faceSlides, generateAiImages, user.profileAvatarUrl
    );

    carousel.slides = slides;
    carousel.status = "ready";
    await carousel.save();

    return NextResponse.json({ carouselId: carousel._id.toString() });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("[news/generate]", err);
    const isQuota = message.includes("RESOURCE_EXHAUSTED") || message.includes("quota") || message.includes("429");
    const isKey = message.includes("API_KEY_INVALID") || message.includes("PERMISSION_DENIED");

    carousel.status = "error";
    carousel.errorMessage = message;
    await carousel.save();

    if (isKey) return NextResponse.json({ error: "Gemini API Key inválida." }, { status: 401 });
    if (isQuota) return NextResponse.json({ error: "Cota da Gemini API esgotada." }, { status: 429 });
    return NextResponse.json({ error: `Erro ao gerar: ${message}` }, { status: 502 });
  }
}
