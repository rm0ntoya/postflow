import { NextRequest, NextResponse } from "next/server";
import { checkCarouselLimit, incrementCarouselCount, limitErrorResponse } from "@/lib/planLimits";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Carousel, { IElement, ISlide } from "@/models/Carousel";
import { getSessionUser } from "@/lib/auth";
import { decryptApiKey } from "@/lib/encryption";
import { CANVAS_W, CANVAS_H, parseSegments } from "@/lib/canvas";
import {
  TemplateParams,
  tpl_centeredPower, tpl_editorialCentered, tpl_impact, tpl_quoteStyle,
  tpl_stackedBold, tpl_minimalCorners, tpl_twoColumnStat, tpl_checklistDecorative,
  tpl_leftAlign, tpl_numberHero, tpl_dramatic,
  tpl_coverCTA, tpl_textTopImageBottom, tpl_twoSquaresTop, tpl_imageTopTextBottom,
  tpl_splitVertical, tpl_smallImgTopRight, tpl_circlePortrait,
  tpl_frostedCard, tpl_mosaicLeft,
} from "@/lib/slideTemplates";

export const maxDuration = 60;

const DEFAULT_TEXT_MODEL = "gemini-2.0-flash";

interface GeminiSlide {
  slideNumber: number;
  title: string;
  body: string;
  imagePrompt: string;
  imagePrompt2?: string;
}

function buildCanvasSlides(
  geminiSlides: GeminiSlide[],
  cid: string,
  viral: boolean,
  accentColor: string,
  handle: string,
  imageSlides: number[],
  profilePhotoUrl?: string
): ISlide[] {
  const count = geminiSlides.length;
  const W = CANVAS_W;
  const H = CANVAS_H;

  // Count text-only slides to rotate their template independently
  let textSlideCount = 0;

  return geminiSlides.map((gs, i) => {
    const els: IElement[] = [];
    const segments = parseSegments(gs.title, accentColor);
    const isFirst = i === 0;
    const isLast = i === count - 1;

    const addProfile = (y: number, x = 60, w = 500) => {
      els.push({
        id: `${cid}-s${i}-profile`, type: "profile", text: handle, photoUrl: profilePhotoUrl || "",
        x, y, w, h: 56, fontSize: 28, weight: 700, color: "#FFFFFF", font: "Space Grotesk",
      });
    };

    const addPageNum = () => {
      els.push({
        id: `${cid}-s${i}-page`, type: "text", text: String(i + 1),
        x: W - 120, y: H - 80, w: 100, h: 40, fontSize: 22, weight: 700,
        color: "rgba(255,255,255,0.35)", font: "Space Grotesk", align: "right",
      });
    };

    const hasImage = imageSlides.includes(i) || isFirst || isLast;

    const TBF = "TheBoldFont";
    const SG  = "Space Grotesk";
    const titleText = gs.title.replace(/\*\*/g, "").toUpperCase();

    // Randomize middle templates
    const randomTpl = Math.floor(Math.random() * 1000);

    // ─── TEXT-ONLY SLIDES ──────────────────────────────────────────────────────
    // All centered, big TheBoldFont titles, more body content
    if (!hasImage && !isFirst && !isLast) {
      const tplFns = [
        tpl_centeredPower, tpl_editorialCentered, tpl_impact, tpl_quoteStyle,
        tpl_stackedBold, tpl_minimalCorners, tpl_twoColumnStat, tpl_checklistDecorative,
        tpl_leftAlign, tpl_numberHero, tpl_dramatic,
      ];
      const tplFn = tplFns[randomTpl % tplFns.length];
      const params: TemplateParams = {
        cid, i, title: titleText, body: gs.body,
        accentColor, handle, imagePrompt: gs.imagePrompt,
      };
      els.push(...tplFn.build(params));

      addPageNum();
      return {
        id: `${cid}-s${i}`,
        bgKey: "noir",
        bgOverride: "#000000",
        bgImageUrl: undefined,
        imagePrompt: undefined,
        elements: els,
      };
    }

    // ─── IMAGE SLIDES ──────────────────────────────────────────────────────────
    const imgTplFns = [
      tpl_coverCTA,           // 0 = cover
      tpl_coverCTA,           // 1 = cta (same layout)
      tpl_textTopImageBottom, // 2
      tpl_twoSquaresTop,      // 3
      tpl_imageTopTextBottom, // 4
      tpl_imageTopTextBottom, // 5
      tpl_splitVertical,      // 6
      tpl_smallImgTopRight,   // 7
      tpl_twoSquaresTop,      // 8
      tpl_textTopImageBottom, // 9
      tpl_circlePortrait,     // 10
      tpl_frostedCard,        // 11
      tpl_mosaicLeft,         // 12
      tpl_frostedCard,        // 13
      tpl_textTopImageBottom, // 14
    ];
    let imgTplIdx: number;
    if (isFirst) imgTplIdx = 0;
    else if (isLast) imgTplIdx = 1;
    else imgTplIdx = 2 + (randomTpl % 13);

    const imgParams: TemplateParams = {
      cid, i, title: titleText, body: gs.body,
      accentColor, handle, imagePrompt: gs.imagePrompt,
    };
    els.push(...imgTplFns[imgTplIdx].build(imgParams));

    addPageNum();

    return {
      id: `${cid}-s${i}`,
      bgKey: "noir",
      bgOverride: (imgTplIdx === 0 || imgTplIdx === 1 || imgTplIdx === 11 || imgTplIdx === 13) ? undefined : "#000000",
      bgImageUrl: undefined,
      imagePrompt: (imgTplIdx === 0 || imgTplIdx === 1 || imgTplIdx === 11 || imgTplIdx === 13) ? gs.imagePrompt : undefined,
      elements: els,
    };
  });
}
function buildPrompt(
  theme: string,
  slideCount: number,
  tone: string,
  detail: string,
  viral: boolean,
  context?: Record<string, string>,
  pasteContent?: string,
  modeDebate?: boolean,
  paletteColors?: string[]
): string {
  const ctxBlock = context?.brandName
    ? `\nCONTEXTO DA MARCA:\n- Nome: ${context.brandName}\n- Tom: ${context.tone || ""}\n- Handle: ${context.instagramHandle || ""}`
    : "";

  const toneMap: Record<string, string> = {
    direct: "direto e sem rodeios",
    editorial: "editorial e autoral",
    didactic: "didático passo a passo",
    provocative: "provocativo e contraintuitivo",
    casual: "casual e conversacional",
    authoritive: "autoritativo de especialista",
  };

  const detailMap: Record<string, string> = {
    high: "argumentos completos com dados e exemplos",
    medium: "pontos-chave com profundidade equilibrada",
    short: "frases curtas e diretas ao ponto",
  };

  const pasteBlock = pasteContent
    ? `\nCONTEÚDO DE REFERÊNCIA (extraia os pontos principais deste conteúdo para montar o carrossel):\n---\n${pasteContent.slice(0, 3000)}\n---`
    : "";

  const debateBlock = modeDebate
    ? `\nMODO DEBATE ATIVO: Use estrutura provocativa. Slide 1 deve desafiar uma crença comum com gancho forte tipo "Todo mundo diz X. Mas a realidade é Y." Os slides intermediários devem apresentar argumentos sólidos que contradizem a crença popular com dados e exemplos reais. Use tom desafiador e contraintuitivo ao longo de todo o carrossel.`
    : "";

  const colorHint = paletteColors && paletteColors.length > 0
    ? `\nESQUEMA DE CORES DA PALETA: ${paletteColors.join(", ")} — mencione estas cores sutilmente nos prompts de imagem para garantir coerência visual.`
    : "";

  return `Você é especialista em marketing digital para Instagram.
Crie um carrossel viral com ${slideCount} slides sobre: "${theme}".

TOM: ${toneMap[tone] || "direto"}
NÍVEL DE DETALHE: ${detailMap[detail] || "equilibrado"}
${viral ? "MODO VIRAL: Ative ganchos fortes. REGRA ABSOLUTA: Você DEVE envolver 1 a 2 palavras de cada título com **asteriscos duplos** (ex: O SEGREDO DO **SUCESSO**). ISSO É OBRIGATÓRIO PARA APLICAR A COR NEON!" : "REGRA ABSOLUTA: Você DEVE envolver 1 a 2 palavras de cada título com **asteriscos duplos** (ex: **PALAVRA**) para aplicar a cor de destaque. ISSO É OBRIGATÓRIO."}${debateBlock}${pasteBlock}${colorHint}${ctxBlock}

ESTRUTURA OBRIGATÓRIA:
- Slide 1: título impactante (máx 8 palavras) + gancho/subtítulo curto (1-2 linhas)
- Slides 2 a ${slideCount - 1}: título do ponto (máx 6 palavras) + copy persuasivo DETALHADO (3-5 linhas com dados, exemplos concretos ou argumentos sólidos — slides sem imagem precisam de texto rico)
- Slide ${slideCount}: CTA clara e direta

Para imagePrompt de cada slide: crie em INGLÊS uma cena EXCLUSIVA e altamente criativa que represente exatamente o conteúdo do slide. Seja específico e surpreendente. A cena deve estar DIRETAMENTE ligada ao texto do slide — não use metáforas genéricas.

REGRA OBRIGATÓRIA PARA imagePrompt2: você SEMPRE deve fornecer "imagePrompt2" para TODOS os slides de conteúdo (slides 2 até ${slideCount - 1}). imagePrompt2 DEVE ser uma cena DIFERENTE mas COMPLEMENTAR ao imagePrompt — os dois juntos devem contar a mesma história pelo slide. Exemplo: se imagePrompt mostra "the problem", imagePrompt2 mostra "the solution". Se imagePrompt mostra "before", imagePrompt2 mostra "after". Eles precisam fazer sentido juntos visualmente.

Responda APENAS com JSON válido, sem markdown:
{
  "slides": [
    {
      "slideNumber": 1,
      "title": "Título com **palavras** de destaque",
      "body": "Copy persuasivo do slide",
      "imagePrompt": "cinematic scene description in English",
      "imagePrompt2": "optional second scene description in English"
    }
  ]
}`;
}

export async function POST(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const limitCheck = await checkCarouselLimit(session.userId);
  if (!limitCheck.allowed) {
    const { error, reason } = limitErrorResponse(limitCheck.reason);
    return NextResponse.json({ error, reason }, { status: 403 });
  }

  let theme: string, slideCount: number, tone: string, detail: string;
  let viral: boolean, imageSlides: number[], faceSlides: number[], accentColor: string;
  let pasteContent: string | undefined, modeDebate: boolean, paletteColors: string[] | undefined;

  try {
    const body = await req.json();
    theme = (body.theme ?? "").trim();
    slideCount = Math.min(Math.max(Number(body.slideCount) || 7, 3), 15);
    tone = body.tone || "direct";
    detail = body.detail || "medium";
    viral = body.viral !== false;
    modeDebate = body.modeDebate === true;
    imageSlides = Array.isArray(body.imageSlides) ? body.imageSlides : [];
    faceSlides = Array.isArray(body.faceSlides) ? body.faceSlides : [];
    accentColor = /^#[0-9A-Fa-f]{6}$/.test(body.accentColor || "") ? body.accentColor : "#FFD700";
    pasteContent = typeof body.pasteContent === "string" && body.pasteContent.trim() ? body.pasteContent.trim() : undefined;
    paletteColors = Array.isArray(body.paletteColors) ? body.paletteColors.filter((c: unknown) => typeof c === "string" && /^#[0-9A-Fa-f]{6}$/.test(c as string)) : undefined;
  } catch {
    return NextResponse.json({ error: "Body JSON inválido." }, { status: 400 });
  }

  if (!theme) return NextResponse.json({ error: "Campo 'theme' é obrigatório." }, { status: 400 });

  await connectDB();

  const user = await User.findById(session.userId).select(
    "+encryptedGeminiKey +geminiKeyIv +geminiKeyAuthTag hasGeminiKey textModel aiContext brandAccentColor profileAvatarUrl"
  );
  if (!user) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
  if (!user.hasGeminiKey) {
    return NextResponse.json({ error: "Nenhuma Gemini API Key configurada. Acesse Configurações para adicionar." }, { status: 422 });
  }

  let geminiApiKey: string;
  try {
    geminiApiKey = decryptApiKey({
      ciphertext: user.encryptedGeminiKey!,
      iv: user.geminiKeyIv!,
      authTag: user.geminiKeyAuthTag!,
    });
  } catch {
    return NextResponse.json({ error: "Falha ao descriptografar a API Key. Re-salve sua chave em Configurações." }, { status: 500 });
  }

  console.log(`[carousel/generate] usando key: ${geminiApiKey.slice(0, 8)}...${geminiApiKey.slice(-4)} | modelo: ${user.textModel || DEFAULT_TEXT_MODEL}`);

  const cid = `c${Date.now()}`;
  const title = theme.length > 60 ? theme.slice(0, 60) + "…" : theme;
  const aiContext = user.aiContext as Record<string, string> | undefined;
  const handle = aiContext?.instagramHandle || "@seuhandle";
  const resolvedAccent = accentColor !== "#FFD700" ? accentColor : (user.brandAccentColor || "#FFD700");

  const carousel = await Carousel.create({
    userId: session.userId,
    title,
    theme: "Recém gerado",
    slides: [],
    status: "generating",
    accentColor: resolvedAccent,
    viral,
    imageSlides,
    faceSlides,
  });

  try {
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: user.textModel || DEFAULT_TEXT_MODEL });
    const prompt = buildPrompt(theme, slideCount, tone, detail, viral, aiContext, pasteContent, modeDebate, paletteColors);

    console.log(`[carousel/generate] prompt chars: ${prompt.length} | tokens estimados: ~${Math.round(prompt.length / 4)}`);
    console.log(`[carousel/generate] prompt completo:\n${prompt}`);

    const result = await model.generateContent(prompt);
    const rawText = result.response.text().trim();
    const jsonText = rawText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    const parsed = JSON.parse(jsonText) as { slides: GeminiSlide[] };

    if (!Array.isArray(parsed.slides) || parsed.slides.length === 0) {
      throw new Error("Gemini retornou estrutura de slides inválida.");
    }

    const canvasSlides = buildCanvasSlides(
      parsed.slides,
      cid,
      viral,
      resolvedAccent,
      handle,
      imageSlides,
      user.profileAvatarUrl || undefined
    );

    carousel.slides = canvasSlides;
    carousel.status = "draft";
    await carousel.save();
    await incrementCarouselCount(session.userId);

    return NextResponse.json({
      message: "Carrossel gerado com sucesso! Inicie a geração de imagens para completar.",
      carousel: {
        _id: carousel._id,
        title: carousel.title,
        theme: carousel.theme,
        status: carousel.status,
        accent: carousel.accent,
        accentColor: carousel.accentColor,
        viral: carousel.viral,
        imageSlides: carousel.imageSlides,
        faceSlides: carousel.faceSlides,
        fontPair: carousel.fontPair,
        slides: carousel.slides,
        createdAt: carousel.createdAt,
        updatedAt: carousel.updatedAt,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("[carousel/generate] ERRO COMPLETO:", err);

    const isApiKeyError =
      message.includes("API_KEY_INVALID") ||
      message.includes("API key not valid") ||
      message.includes("PERMISSION_DENIED");
    const isQuotaError = message.includes("RESOURCE_EXHAUSTED") || message.includes("quota");

    carousel.status = "error";
    carousel.errorMessage = message;
    await carousel.save();

    if (isApiKeyError) {
      console.error("[carousel/generate] API KEY INVÁLIDA — resposta Gemini:", JSON.stringify(err, null, 2));
      return NextResponse.json({ error: "Gemini API Key inválida. Verifique sua chave em Configurações." }, { status: 401 });
    }
    if (isQuotaError) {
      console.error("[carousel/generate] QUOTA ESGOTADA — resposta Gemini:", JSON.stringify(err, null, 2));
      return NextResponse.json({ error: "Cota da Gemini API esgotada. Aguarde ou verifique seu plano no Google AI Studio." }, { status: 429 });
    }

    return NextResponse.json({ error: `Erro ao gerar carrossel: ${message}` }, { status: 502 });
  }
}
