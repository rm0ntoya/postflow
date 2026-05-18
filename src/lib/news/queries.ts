import crypto from 'crypto';
import { Article, connectNewsDB } from './schema';

export interface RawArticle {
  title: string;
  description?: string;
  content?: string;
  url: string;
  image_url?: string;
  source: string;
  source_logo?: string;
  category?: string;
  published_at?: string;
}

export function generateId(url: string): string {
  return crypto.createHash('md5').update(url).digest('hex');
}

export async function insertArticle(article: RawArticle): Promise<'inserted' | 'skipped'> {
  await connectNewsDB();
  const id = generateId(article.url);
  const scraped_at = new Date().toISOString();
  const existing = await Article.findOne({ url: article.url });
  if (existing) return 'skipped';
  await Article.create({ id, ...article, scraped_at, is_active: 1 });
  return 'inserted';
}

export async function getArticles(params: {
  page: number;
  limit: number;
  source?: string;
  category?: string;
  q?: string;
}) {
  await connectNewsDB();
  const { page, limit, source, category, q } = params;
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
    .skip((page - 1) * limit)
    .limit(limit)
    .select('id title description url image_url source source_logo category published_at scraped_at')
    .lean();
  return { articles, total };
}

export async function getArticleById(id: string) {
  await connectNewsDB();
  return Article.findOne({ id, is_active: 1 }).lean();
}

export async function getSources() {
  await connectNewsDB();
  return Article.aggregate([
    { $match: { is_active: 1 } },
    { $group: { _id: '$source', count: { $sum: 1 }, last_scraped: { $max: '$scraped_at' } } },
    { $project: { source: '$_id', count: 1, last_scraped: 1, _id: 0 } },
    { $sort: { count: -1 } },
  ]);
}

export async function getCategories() {
  await connectNewsDB();
  return Article.aggregate([
    { $match: { is_active: 1, category: { $ne: null } } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $project: { category: '$_id', count: 1, _id: 0 } },
    { $sort: { count: -1 } },
  ]);
}

export async function getTotalArticles() {
  await connectNewsDB();
  return Article.countDocuments({ is_active: 1 });
}

export async function getLastScrape() {
  await connectNewsDB();
  const row = await Article.findOne().sort({ scraped_at: -1 }).select('scraped_at').lean();
  return (row as any)?.scraped_at ?? null;
}

export async function cleanOldArticles(days: number) {
  await connectNewsDB();
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const result = await Article.updateMany({ scraped_at: { $lt: cutoff } }, { $set: { is_active: 0 } });
  console.log(`[DB] ${result.modifiedCount} artigos marcados como inativos.`);
}
