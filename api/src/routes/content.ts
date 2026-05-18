import { Router, Request, Response } from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { getArticleById, Article } from '../db/queries';

const router = Router();

const NOISE_SELECTORS = [
  'script', 'style', 'nav', 'header', 'footer',
  '[class*="ad"]', '[class*="banner"]', '[class*="promo"]',
  '[class*="related"]', '[class*="recommend"]', '[class*="sidebar"]',
  '[class*="newsletter"]', '[class*="social"]', '[class*="share"]',
  '[id*="ad"]', '[id*="banner"]', '[id*="sidebar"]',
  'noscript', 'iframe', 'figure > figcaption',
];

interface ScrapeResult {
  content: string;
  images: string[];
}

async function fetchArticleContent(url: string): Promise<ScrapeResult> {
  const { data } = await axios.get(url, {
    timeout: 10000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; NovaCraftBot/1.0)',
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'pt-BR,pt;q=0.9',
    },
  });

  const $ = cheerio.load(data);

  // Extract images BEFORE removing noise (og:image, article body imgs)
  const images: string[] = [];
  const seen = new Set<string>();

  // og:image first (highest quality)
  const ogImg = $('meta[property="og:image"]').attr('content');
  if (ogImg && ogImg.startsWith('http')) { seen.add(ogImg); images.push(ogImg); }

  // Article body images
  $('article img, [class*="content"] img, [class*="materia"] img, [class*="corpo"] img, main img').each((_, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-lazy-src') || '';
    const absUrl = src.startsWith('http') ? src : src.startsWith('//') ? `https:${src}` : '';
    if (absUrl && !seen.has(absUrl) && !absUrl.includes('logo') && !absUrl.includes('icon') && !absUrl.includes('avatar')) {
      // Filter out tiny images (likely icons) — only accept if no dimension hints suggest tiny
      const w = parseInt($(el).attr('width') || '0');
      const h = parseInt($(el).attr('height') || '0');
      if ((w === 0 || w >= 300) && (h === 0 || h >= 200)) {
        seen.add(absUrl);
        images.push(absUrl);
      }
    }
  });

  // Remove noise elements
  NOISE_SELECTORS.forEach(sel => $(sel).remove());

  // Collect paragraph text
  const paragraphs: string[] = [];
  $('p').each((_, el) => {
    const text = $(el).text().trim();
    if (text.length > 30) {
      paragraphs.push(text);
    }
  });

  return { content: paragraphs.join('\n\n'), images: images.slice(0, 12) };
}

// GET /api/news/:id/content
router.get('/:id/content', async (req: Request, res: Response) => {
  const { id } = req.params;

  let article: Article | undefined;
  try {
    article = getArticleById(id) as Article | undefined;
  } catch {
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Erro ao buscar artigo no banco de dados' },
    });
  }

  if (!article) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Artigo não encontrado' },
    });
  }

  // Always include article's own image as first candidate
  const articleImages: string[] = [];
  if (article.image_url) articleImages.push(article.image_url);

  // Try full scrape
  try {
    const { content, images } = await fetchArticleContent(article.url);

    // Merge: article thumbnail first, then scraped images (deduped)
    const merged = [...articleImages];
    for (const img of images) {
      if (!merged.includes(img)) merged.push(img);
    }

    if (content.length >= 100) {
      return res.json({
        success: true,
        data: {
          id,
          content,
          images: merged,
          partial: false,
        },
      });
    }

    // Content too short — fall back to description
    const fallback = article.description ?? '';
    return res.json({
      success: true,
      data: {
        id,
        content: fallback,
        images: merged,
        partial: true,
      },
    });
  } catch {
    // Scrape failed — try description fallback
    const fallback = article.description ?? '';
    if (fallback.length > 0) {
      return res.json({
        success: true,
        data: {
          id,
          content: fallback,
          images: articleImages,
          partial: true,
        },
      });
    }

    return res.status(502).json({
      success: false,
      error: {
        code: 'SCRAPE_FAILED',
        message: 'Não foi possível obter o conteúdo do artigo',
      },
    });
  }
});

export default router;
