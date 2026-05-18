import { Router, Request, Response } from 'express';
import { getArticles, getArticleById, getSources, getCategories, getTotalArticles, getLastScrape } from '../db/queries';
import { runAllScrapers } from '../scheduler';

const router = Router();

// GET /api/news
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const source = req.query.source as string | undefined;
    const category = req.query.category as string | undefined;
    const q = req.query.q as string | undefined;

    const { articles, total } = getArticles({ page, limit, source, category, q });
    const total_pages = Math.ceil(total / limit);

    res.json({ success: true, data: { articles, pagination: { page, limit, total, total_pages } } });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Erro interno do servidor' } });
  }
});

// GET /api/news/sources
router.get('/sources', (_req: Request, res: Response) => {
  try {
    const data = getSources();
    res.json({ success: true, data });
  } catch {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Erro interno' } });
  }
});

// GET /api/news/categories
router.get('/categories', (_req: Request, res: Response) => {
  try {
    const data = getCategories();
    res.json({ success: true, data });
  } catch {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Erro interno' } });
  }
});

// GET /api/news/:id
router.get('/:id', (req: Request, res: Response) => {
  try {
    const article = getArticleById(req.params.id);
    if (!article) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Artigo não encontrado' } });
    }
    res.json({ success: true, data: article });
  } catch {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Erro interno' } });
  }
});

// POST /api/scrape
router.post('/scrape', async (_req: Request, res: Response) => {
  try {
    const result = await runAllScrapers();
    res.json({ success: true, data: result });
  } catch {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Erro ao executar scraping' } });
  }
});

export default router;