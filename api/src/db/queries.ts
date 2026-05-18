import crypto from 'crypto';
import { db } from './schema';
import { RawArticle } from '../scrapers';

export interface Article extends RawArticle {
  id: string;
  scraped_at: string;
  is_active: number;
}

export function generateId(url: string): string {
  return crypto.createHash('md5').update(url).digest('hex');
}

export function insertArticle(article: RawArticle): 'inserted' | 'skipped' {
  const id = generateId(article.url);
  const scraped_at = new Date().toISOString();

  const existing = db.prepare('SELECT id FROM articles WHERE url = ?').get(article.url);
  if (existing) return 'skipped';

  db.prepare(`
    INSERT INTO articles (id, title, description, content, url, image_url, source, source_logo, category, published_at, scraped_at)
    VALUES (@id, @title, @description, @content, @url, @image_url, @source, @source_logo, @category, @published_at, @scraped_at)
  `).run({
    id,
    title: article.title,
    description: article.description ?? null,
    content: article.content ?? null,
    url: article.url,
    image_url: article.image_url ?? null,
    source: article.source,
    source_logo: article.source_logo ?? null,
    category: article.category ?? null,
    published_at: article.published_at ?? null,
    scraped_at,
  });

  return 'inserted';
}

export function getArticles(params: {
  page: number;
  limit: number;
  source?: string;
  category?: string;
  q?: string;
}) {
  const { page, limit, source, category, q } = params;
  const offset = (page - 1) * limit;

  let where = 'WHERE is_active = 1';
  const bindings: Record<string, unknown> = {};

  if (source) { where += ' AND source = @source'; bindings.source = source; }
  if (category) { where += ' AND category = @category'; bindings.category = category; }
  if (q) {
    where += ' AND (title LIKE @q OR description LIKE @q)';
    bindings.q = `%${q}%`;
  }

  const total = (db.prepare(`SELECT COUNT(*) as count FROM articles ${where}`).get(bindings) as { count: number }).count;

  const articles = db.prepare(`
    SELECT id, title, description, url, image_url, source, source_logo, category, published_at, scraped_at
    FROM articles ${where}
    ORDER BY scraped_at DESC
    LIMIT @limit OFFSET @offset
  `).all({ ...bindings, limit, offset });

  return { articles, total };
}

export function getArticleById(id: string) {
  return db.prepare('SELECT * FROM articles WHERE id = ? AND is_active = 1').get(id);
}

export function getSources() {
  return db.prepare(`
    SELECT source, COUNT(*) as count, MAX(scraped_at) as last_scraped
    FROM articles WHERE is_active = 1
    GROUP BY source ORDER BY count DESC
  `).all();
}

export function getCategories() {
  return db.prepare(`
    SELECT category, COUNT(*) as count
    FROM articles WHERE is_active = 1 AND category IS NOT NULL
    GROUP BY category ORDER BY count DESC
  `).all();
}

export function getTotalArticles() {
  return (db.prepare('SELECT COUNT(*) as count FROM articles WHERE is_active = 1').get() as { count: number }).count;
}

export function getLastScrape() {
  const row = db.prepare('SELECT MAX(scraped_at) as last FROM articles').get() as { last: string | null };
  return row?.last ?? null;
}

export function cleanOldArticles(days: number) {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const result = db.prepare('UPDATE articles SET is_active = 0 WHERE scraped_at < ?').run(cutoff);
  console.log(`[DB] ${result.changes} artigos marcados como inativos (mais de ${days} dias).`);
}