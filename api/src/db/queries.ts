import crypto from 'crypto';
import { Article, connectDB } from './schema';
import { RawArticle } from '../scrapers';

export interface ArticleDoc extends RawArticle {
  id: string;
  scraped_at: string;
  is_active: number;
}

export function generateId(url: string): string {
  return crypto.createHash('md5').update(url).digest('hex');
}

export async function insertArticle(article: RawArticle): Promise<'inserted' | 'skipped'> {
  await connectDB();
  const id = generateId(article.url);
  const scraped_at = new Date().toISOString();

  const existing = await Article.findOne({ url: article.url });
  if (existing) return 'skipped';

  await Article.create({
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
    is_active: 1,
  });

  return 'inserted';
}

export async function getArticles(params: {
  page: number;
  limit: number;
  source?: string;
  category?: string;
  q?: string;
}) {
  await connectDB();
  const { page, limit, source, category, q } = params;
  const offset = (page - 1) * limit;

  const filter: Record<string, unknown> = { is_active: 1 };
  if (source) filter.source = source;
  if (category) filter.category = category;
  if (q) filter.$or = [
    { title: { $regex: q, $options: 'i' } },
    { description: { $regex: q, $options: 'i' } },
  ];

  const total = await Article.countDocuments(filter);
  const articles = await Article.find(filter)
    .sort({ scraped_at: -1 })
    .skip(offset)
    .limit(limit)
    .select('id title description url image_url source source_logo category published_at scraped_at')
    .lean();

  return { articles, total };
}

export async function getArticleById(id: string) {
  await connectDB();
  return Article.findOne({ id, is_active: 1 }).lean();
}

export async function getSources() {
  await connectDB();
  return Article.aggregate([
    { $match: { is_active: 1 } },
    { $group: { _id: '$source', count: { $sum: 1 }, last_scraped: { $max: '$scraped_at' } } },
    { $project: { source: '$_id', count: 1, last_scraped: 1, _id: 0 } },
    { $sort: { count: -1 } },
  ]);
}

export async function getCategories() {
  await connectDB();
  return Article.aggregate([
    { $match: { is_active: 1, category: { $ne: null } } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $project: { category: '$_id', count: 1, _id: 0 } },
    { $sort: { count: -1 } },
  ]);
}

export async function getTotalArticles() {
  await connectDB();
  return Article.countDocuments({ is_active: 1 });
}

export async function getLastScrape() {
  await connectDB();
  const row = await Article.findOne().sort({ scraped_at: -1 }).select('scraped_at').lean();
  return row?.scraped_at ?? null;
}

export async function cleanOldArticles(days: number) {
  await connectDB();
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const result = await Article.updateMany(
    { scraped_at: { $lt: cutoff } },
    { $set: { is_active: 0 } }
  );
  console.log(`[DB] ${result.modifiedCount} artigos marcados como inativos (mais de ${days} dias).`);
}
