import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Carousel, { IElement } from "@/models/Carousel";
import { getSessionUser } from "@/lib/auth";
import { decryptApiKey } from "@/lib/encryption";
import { uploadToImgbb } from "@/lib/imgbb";

export const maxDuration = 120;

const DEFAULT_IMAGE_MODEL = "gemini-3-pro-image-preview";

async function createThumbnail(base64Url: string): Promise<string | null> {
  try {
    const sepIdx = base64Url.indexOf(",");
    if (sepIdx === -1) return null;
    const base64Data = base64Url.slice(sepIdx + 1);
    const buffer = Buffer.from(base64Data, "base64");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const JimpMod = require("jimp");
    const Jimp = JimpMod.default ?? JimpMod;
    const image = await Jimp.read(buffer);
    image.resize(216, 270).quality(55);
    const thumbBuffer: Buffer = await image.getBufferAsync("image/jpeg");
    return `data:image/jpeg;base64,${thumbBuffer.toString("base64")}`;
  } catch (e) {
    console.error("[thumbnail] Failed to create:", e);
    return null;
  }
}

interface RouteParams { params: { id: string } }

function parseDataUrl(dataUrl: string): { mimeType: string; data: string } {
  const sepIdx = dataUrl.indexOf(",");
  if (sepIdx !== -1 && dataUrl.startsWith("data:")) {
    const header = dataUrl.slice(5, sepIdx);
    const mimeType = header.split(";")[0] || "image/jpeg";
    const data = dataUrl.slice(sepIdx + 1);
    return { mimeType, data };
  }
  return { mimeType: "image/jpeg", data: dataUrl };
}

const VISUAL_STYLES = [
  "ultra-realistic macro photography with cinematic depth of field and dramatic studio lighting",
  "high-contrast editorial fashion photography, deep shadows, architectural minimalism",
  "abstract conceptual digital art — bold geometric forms, neon on black, hard light cuts",
  "cinematic film still, 35mm grain texture, moody color grade, anamorphic lens flare",
  "hyper-stylized graphic novel aesthetic, ink outlines, flat cel shading, vivid accent color",
  "surrealist fine art photography — physically impossible but photorealistic",
  "low-key chiaroscuro portrait lighting, Rembrandt-style dramatic shadow play",
  "futuristic sci-fi product photography, holographic reflections, clean metallic surfaces",
  "gritty documentary street photography, shallow dof, authentic raw moment",
  "luxury brand campaign aesthetic — soft light, minimal props, premium feel",
  "conceptual installation art, large-scale environment, wide angle, overwhelming scale",
  "close-up texture photography — patterns, surfaces, materials, abstract detail",
  "dynamic sports action photography, motion blur, split-second peak moment",
  "dark fantasy illustration, painted-style, dramatic sky, epic atmosphere",
  "psychedelic double-exposure composition, layered imagery, surreal overlap",
  "architectural interior photography, bold geometry, perspective lines, dramatic light shafts",
  "underwater photography, light caustics, bubbles, ethereal blue-green tones",
  "night scene with dramatic neon lighting, rain reflections, urban noir atmosphere",
  "minimalist flat-lay composition, clean white space, graphic design aesthetic",
  "explosive energy shot — particles, sparks, smoke, dynamic motion, cinematic",
];

function buildPromptText(
  slide: any,
  imagePrompt: string,
  accentColor: string,
  viral: boolean,
  carouselTheme: string,
  slideIndex: number,
  totalSlides: number,
  hasFaceRef: boolean,
  cardIndex = -1,
  siblingPrompts: string[] = []
): string {
  const styleIndex = (slideIndex * 3 + carouselTheme.length + Math.max(0, cardIndex)) % VISUAL_STYLES.length;
  const visualStyle = VISUAL_STYLES[styleIndex];

  const slideTextContent = (slide.elements as IElement[])
    .filter((e: IElement) => e.type === "text" && !e.id.includes("-profile") && !e.id.includes("-page"))
    .map((e: IElement) => e.text || "")
    .filter(Boolean)
    .join(" | ");

  const creativeSituations = [
    "erupting from a tear in the fabric of reality, surrounded by cascading light fragments",
    "suspended in zero gravity, floating objects orbiting around them in a dark void",
    "engulfed in a slow-motion explosion of light shards and particles",
    "standing at the edge of an impossible cliff overlooking a neon-lit abyss",
    "being transformed — half person, half something abstract and luminous",
    "conducting an orchestra of floating glowing elements with their hands",
    "stepping through a mirror into an inverted version of themselves",
    "holding the sun, the concept, the idea — as a tangible glowing object in their hands",
    "running in slow motion through a corridor that shatters into light behind them",
    "submerged in crystal-clear glowing liquid, eyes open, completely serene",
    "multiplied into dozens of versions of themselves at different angles",
    "inside a giant transparent sphere, world visible around them distorted",
  ];

  const situation = creativeSituations[slideIndex % creativeSituations.length];

  const faceSection = hasFaceRef
    ? `
SUBJECT: Use the reference face photo provided. The person in the uploaded image is the subject.
- Preserve their facial features, skin tone, and identity with 100% accuracy
- Creative scenario: ${situation}
- Camera angle: vary creatively — don't always use straight-on portraits
- Expression: powerful, authentic emotion appropriate to the visual concept
- IMPORTANT: place this real person in an inventive, dramatic scenario — NOT just a headshot`
    : `
SUBJECT: Create an original, visually compelling subject or scene. No specific person required.
- Invent whatever protagonist, object, or scene best brings the concept to life
- Be completely original — avoid stock photography clichés`;

  const viralSection = viral
    ? `
VIRAL ELEMENT: Include one unexpected, impossible, scroll-stopping visual detail that makes someone stop mid-scroll. Something physically impossible, strangely beautiful, or deeply curious.`
    : "";

  const cardContext = cardIndex >= 0 && siblingPrompts.length > 0
    ? `
CARD CONTEXT: This is image ${cardIndex + 1} of ${siblingPrompts.length + 1} side-by-side cards on this slide.
The companion card(s) will show: ${siblingPrompts.map(p => `"${p}"`).join(", ")}
Your image MUST be visually complementary — same color palette and mood, but a DIFFERENT scene/angle/moment. Together they tell one visual story.`
    : cardIndex >= 0
    ? `\nCARD IMAGE: This is a boxed image card on the slide. Make it visually striking within a contained frame.`
    : "";

  return `Create a stunning, highly original image for an Instagram carousel slide.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRIMARY VISUAL CONCEPT (this is what the image MUST depict):
"${imagePrompt}"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CAROUSEL THEME: "${carouselTheme}"
SLIDE TEXT CONTEXT: "${slideTextContent || 'Not specified'}"
${cardContext}
VISUAL STYLE: ${visualStyle}
ACCENT COLOR for lighting/highlights: ${accentColor}

${faceSection}
${viralSection}

COMPOSITION:
- Aspect ratio: 4:5 vertical (portrait)
- ${cardIndex >= 0 ? "This is a card image — full frame composition, no dark bottom needed" : "The bottom 30% of the image should be darker (reserved for text overlay in the final design)"}
- Create depth and visual interest throughout the frame
- The image should immediately communicate the PRIMARY VISUAL CONCEPT

TECHNICAL QUALITY:
- Photorealistic or high-end digital artwork quality
- Rich detail, professional lighting
- No text, watermarks, logos, or typography anywhere in the image
- No UI elements, social media icons, or interface components

CRITICAL RULES:
1. The image MUST be about: "${imagePrompt}" — interpret this literally and creatively
2. Do NOT generate generic stock imagery (businesspeople shaking hands, etc.)
3. Do NOT generate animals or creatures unless the image prompt explicitly asks for them
4. Every image in this carousel should look completely different from the others
5. Be bold, unexpected, and visually powerful
6. Slide ${slideIndex + 1} of ${totalSlides} — make it unique to this specific slide`;
}

async function generateImage(
  promptText: string,
  apiKey: string,
  faceImages: string[],
  hasFaceRef: boolean,
  imageModel: string
): Promise<string | null> {
  try {
    const ai = new GoogleGenAI({ apiKey });

    const parts: object[] = [];

    if (hasFaceRef && faceImages.length > 0) {
      const { mimeType, data } = parseDataUrl(faceImages[0]);
      parts.push({ inlineData: { mimeType, data } });
    }

    parts.push({ text: promptText });

    const contents = [{ role: "user", parts }];

    const config = {
      imageConfig: {
        aspectRatio: "4:5",
        imageSize: "1K",
      },
      responseModalities: ["IMAGE", "TEXT"] as string[],
    };

    const response = await ai.models.generateContentStream({
      model: imageModel,
      config,
      contents,
    });

    for await (const chunk of response) {
      const chunkParts = chunk.candidates?.[0]?.content?.parts;
      if (!chunkParts) continue;
      for (const part of chunkParts) {
        const inlineData = (part as { inlineData?: { mimeType?: string; data?: string } }).inlineData;
        if (inlineData?.data) {
          const mimeType = inlineData.mimeType || "image/png";
          return `data:${mimeType};base64,${inlineData.data}`;
        }
      }
    }

    console.error("[generate-image] Stream finalizado sem retornar imagem.");
    return null;
  } catch (e) {
    console.error("[generate-image]", e instanceof Error ? e.message : String(e));
    return null;
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = params;

  let slideIndex: number, useFace: boolean, elementId: string | undefined, customPrompt: string | undefined;

  try {
    const body = await req.json();
    slideIndex = Number(body.slideIndex);
    useFace = body.useFace !== false;
    elementId = body.elementId;
    customPrompt = typeof body.customPrompt === "string" && body.customPrompt.trim() ? body.customPrompt.trim() : undefined;
  } catch {
    return NextResponse.json({ error: "Body JSON inválido." }, { status: 400 });
  }

  await connectDB();

  const carousel = await Carousel.findOne({ _id: id, userId: session.userId });
  if (!carousel) return NextResponse.json({ error: "Carrossel não encontrado." }, { status: 404 });

  const user = await User.findById(session.userId).select(
    "+encryptedGeminiKey +geminiKeyIv +geminiKeyAuthTag +faceReferenceImages hasGeminiKey imageModel"
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

  // Image box elements (elementId) never use face reference — contextual scenes only
  const effectiveUseFace = useFace && !elementId;
  const faceImages = effectiveUseFace ? (user.faceReferenceImages || []) : [];
  const hasFaceRef = effectiveUseFace && faceImages.length > 0;
  const resolvedAccent = carousel.accentColor || "#FFD700";
  const isViral = carousel.viral ?? true;
  const carouselTheme = carousel.title || "";
  const totalSlides = carousel.slides.length;

  if (slideIndex < 0 || slideIndex >= totalSlides) {
    return NextResponse.json({ error: "Índice de slide inválido." }, { status: 400 });
  }

  const slide = carousel.slides[slideIndex];
  let imgPrompt = slide.imagePrompt;

  if (elementId) {
    const el = slide.elements.find(e => e.id === elementId);
    if (el && el.imagePrompt) imgPrompt = el.imagePrompt;
  }

  if (customPrompt) imgPrompt = customPrompt;

  if (!imgPrompt) {
    imgPrompt = `cinematic dark dramatic scene related to: ${carouselTheme}`;
  }

  // For card elements, find sibling image prompts to ensure complementary scenes
  const imageElements = slide.elements.filter(e => e.type === "image");
  const cardIndex = elementId ? imageElements.findIndex(e => e.id === elementId) : -1;
  const siblingPrompts = elementId
    ? imageElements.filter(e => e.id !== elementId).map(e => e.imagePrompt).filter(Boolean)
    : [];

  const promptText = buildPromptText(
    slide,
    imgPrompt,
    resolvedAccent,
    isViral,
    carouselTheme,
    slideIndex,
    totalSlides,
    hasFaceRef,
    cardIndex,
    siblingPrompts as string[]
  );

  const url = await generateImage(promptText, geminiApiKey, faceImages, hasFaceRef, user.imageModel || DEFAULT_IMAGE_MODEL);

  if (url) {
    let finalUrl = url;
    let thumbUrl: string | undefined;

    try {
      finalUrl = await uploadToImgbb(url);
      thumbUrl = finalUrl.replace(/(\.\w+)$/, 'm$1');
    } catch (e) {
      console.error("[generate-image] ImgBB upload falhou, usando base64:", e instanceof Error ? e.message : String(e));
      thumbUrl = (await createThumbnail(url)) || undefined;
      finalUrl = url;
    }

    if (elementId) {
      const elIdx = slide.elements.findIndex(e => e.id === elementId);
      if (elIdx !== -1) {
        slide.elements[elIdx].imageUrl = finalUrl;
        slide.elements[elIdx].photoUrl = finalUrl;
      }
    } else {
      carousel.slides[slideIndex].bgImageUrl = finalUrl;
      if (thumbUrl) carousel.slides[slideIndex].bgThumbUrl = thumbUrl;
    }

    carousel.markModified("slides");

    const pendingImages = carousel.imageSlides?.filter((idx) => !carousel.slides[idx]?.bgImageUrl && idx !== slideIndex);
    if (!pendingImages || pendingImages.length === 0) {
      carousel.status = "ready";
    }

    await carousel.save();
    return NextResponse.json({ url: finalUrl, thumb: thumbUrl });
  }

  return NextResponse.json({ error: "Falha na geração de imagem" }, { status: 500 });
}
