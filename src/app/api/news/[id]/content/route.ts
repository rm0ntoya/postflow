import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";
import { getArticleById } from "@/lib/news/queries";

const NOISE_SELECTORS = [
  "script", "style", "nav", "header", "footer",
  "[class*='ad']", "[class*='banner']", "[class*='promo']",
  "[class*='related']", "[class*='recommend']", "[class*='sidebar']",
  "[class*='newsletter']", "[class*='social']", "[class*='share']",
  "[id*='ad']", "[id*='banner']", "[id*='sidebar']",
  "noscript", "iframe", "figure > figcaption",
];

async function fetchArticleContent(url: string) {
  const { data } = await axios.get(url, {
    timeout: 10000,
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; NovaCraftBot/1.0)",
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "pt-BR,pt;q=0.9",
    },
  });

  const $ = cheerio.load(data);
  const images: string[] = [];
  const seen = new Set<string>();

  const ogImg = $('meta[property="og:image"]').attr("content");
  if (ogImg && ogImg.startsWith("http")) { seen.add(ogImg); images.push(ogImg); }

  $('article img, [class*="content"] img, [class*="materia"] img, main img').each((_, el) => {
    const src = $(el).attr("src") || $(el).attr("data-src") || "";
    const abs = src.startsWith("http") ? src : src.startsWith("//") ? `https:${src}` : "";
    if (abs && !seen.has(abs) && !abs.includes("logo") && !abs.includes("icon")) {
      const w = parseInt($(el).attr("width") || "0");
      const h = parseInt($(el).attr("height") || "0");
      if ((w === 0 || w >= 300) && (h === 0 || h >= 200)) { seen.add(abs); images.push(abs); }
    }
  });

  NOISE_SELECTORS.forEach(sel => $(sel).remove());

  const paragraphs: string[] = [];
  $("p").each((_, el) => {
    const text = $(el).text().trim();
    if (text.length > 30) paragraphs.push(text);
  });

  return { content: paragraphs.join("\n\n"), images: images.slice(0, 12) };
}

export const maxDuration = 30;

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const article = await getArticleById(params.id) as any;
  if (!article) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "Artigo não encontrado" } },
      { status: 404 }
    );
  }

  const articleImages = article.image_url ? [article.image_url] : [];

  try {
    const { content, images } = await fetchArticleContent(article.url);
    const merged = [...articleImages];
    for (const img of images) { if (!merged.includes(img)) merged.push(img); }

    if (content.length >= 100) {
      return NextResponse.json({ success: true, data: { id: params.id, content, images: merged, partial: false } });
    }

    return NextResponse.json({
      success: true,
      data: { id: params.id, content: article.description ?? "", images: merged, partial: true },
    });
  } catch {
    const fallback = article.description ?? "";
    if (fallback.length > 0) {
      return NextResponse.json({
        success: true,
        data: { id: params.id, content: fallback, images: articleImages, partial: true },
      });
    }
    return NextResponse.json(
      { success: false, error: { code: "SCRAPE_FAILED", message: "Não foi possível obter o conteúdo" } },
      { status: 502 }
    );
  }
}
