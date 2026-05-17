import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import * as cheerio from "cheerio";

export const maxDuration = 30;

function absoluteUrl(src: string, base: string): string {
  try { return new URL(src, base).href; } catch { return ""; }
}

function cleanText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

// Ordered by specificity — more specific article selectors first
const CONTENT_SELECTORS = [
  "[itemprop='articleBody']",
  ".mc-article-body",          // G1/Globo
  ".article-body",
  ".article__body",
  ".article-content",
  ".article__content",
  ".post-body",
  ".post-content",
  ".entry-content",
  ".materia-conteudo",
  ".noticia-conteudo",
  ".texto-noticia",
  ".texto-materia",
  ".corpo-materia",
  ".content-text",
  ".body-content",
  ".story-body",
  ".story-content",
  ".news-content",
  ".text-content",
  ".article-text",
  "article",
  "main",
  ".content",
  ".materia",
  ".noticia",
];

export async function POST(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  let url: string;
  try {
    const body = await req.json();
    url = (body.url || "").trim();
  } catch {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  if (!url || !/^https?:\/\//i.test(url)) {
    return NextResponse.json({ error: "URL inválida. Use http:// ou https://" }, { status: 400 });
  }

  let html: string;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "no-cache",
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      return NextResponse.json({ error: `Site retornou ${res.status}. Verifique se o link está correto.` }, { status: 422 });
    }
    html = await res.text();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: `Não foi possível acessar o site: ${msg}` }, { status: 422 });
  }

  const $ = cheerio.load(html);
  const source = new URL(url).hostname.replace("www.", "");

  // Remove noise elements
  $("script, style, noscript, nav, header, footer, aside, iframe").remove();
  $(".ad, .ads, .advertisement, .cookie, .popup, .modal, .sidebar").remove();
  $(".menu, .social-share, .share, .related, .recommended, .comments").remove();
  $("[class*='banner'], [class*='widget'], [class*='promo'], [class*='newsletter']").remove();
  $("[id*='banner'], [id*='sidebar'], [id*='ads'], [id*='footer'], [id*='header']").remove();

  // Title
  const title = cleanText(
    $('meta[property="og:title"]').attr("content") ||
    $('meta[name="twitter:title"]').attr("content") ||
    $("h1").first().text() ||
    $("title").text() ||
    "Sem título"
  ).slice(0, 200);

  // Description
  const description = cleanText(
    $('meta[property="og:description"]').attr("content") ||
    $('meta[name="description"]').attr("content") ||
    $('meta[name="twitter:description"]').attr("content") ||
    ""
  ).slice(0, 500);

  // Find best content container
  let contentEl = $("");
  let bestCount = 0;
  for (const sel of CONTENT_SELECTORS) {
    const el = $(sel);
    if (!el.length) continue;
    const pCount = el.find("p").length;
    if (pCount > bestCount) {
      bestCount = pCount;
      contentEl = el;
    }
  }
  if (!contentEl.length || bestCount === 0) contentEl = $("body");

  // Extract paragraphs (also try divs with substantial text if p count is low)
  const paragraphs: string[] = [];
  contentEl.find("p").each((_, el) => {
    const t = cleanText($(el).text());
    if (t.length > 50) paragraphs.push(t);
  });

  // Fallback: if few paragraphs, try div text blocks
  if (paragraphs.length < 3) {
    contentEl.find("div").each((_, el) => {
      const children = $(el).children();
      if (children.length > 3) return; // skip containers
      const t = cleanText($(el).clone().children().remove().end().text());
      if (t.length > 80) paragraphs.push(t);
    });
  }

  const content = paragraphs.length > 0
    ? paragraphs.slice(0, 30).join("\n\n")
    : cleanText(contentEl.text()).slice(0, 4000);

  // Images: og:image first, then article images, then page images
  const images: string[] = [];

  const ogImage = $('meta[property="og:image"]').attr("content");
  if (ogImage) {
    const abs = absoluteUrl(ogImage, url);
    if (abs) images.push(abs);
  }

  // Twitter image
  const twitterImage = $('meta[name="twitter:image"]').attr("content");
  if (twitterImage) {
    const abs = absoluteUrl(twitterImage, url);
    if (abs && !images.includes(abs)) images.push(abs);
  }

  // All img tags (try multiple src attributes for lazy loading)
  const imgSrcAttrs = ["src", "data-src", "data-lazy-src", "data-original", "data-url", "data-image"];
  $("img").each((_, el) => {
    let src = "";
    for (const attr of imgSrcAttrs) {
      src = $(el).attr(attr) || "";
      if (src) break;
    }
    if (!src || src.startsWith("data:")) return;
    const abs = absoluteUrl(src, url);
    if (!abs || images.includes(abs)) return;
    const w = Number($(el).attr("width") || 0);
    const h = Number($(el).attr("height") || 0);
    if ((w > 0 && w < 200) || (h > 0 && h < 150)) return;
    if (/logo|icon|avatar|sprite|pixel|tracking|1x1|placeholder/i.test(abs)) return;
    images.push(abs);
  });

  return NextResponse.json({
    title,
    description,
    content: content.slice(0, 4000),
    images: images.slice(0, 12),
    source,
  });
}
