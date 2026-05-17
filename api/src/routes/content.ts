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

async function fetchArticleContent(url: string): Promise<string> {
  const { data } = await axios.get(url, {
    timeout: 10000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; NovaCraftBot/1.0)',
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'pt-BR,pt;q=0.9',
    },
  });

  const $ = cheerio.load(data);

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

  return paragraphs.join('\n\n');
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

  // Try full scrape
  try {
    const content = await fetchArticleContent(article.url);

    if (content.length >= 100) {
      return res.json({
        success: true,
        data: {
          id,
          content,
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
