import axios from 'axios';
import * as cheerio from 'cheerio';
import { RawArticle } from '../queries';

const SOURCE = 'Metrópoles';
const LOGO = 'https://www.metropoles.com/favicon.ico';

const SECTIONS = [
  { url: 'https://www.metropoles.com', category: 'Geral' },
  { url: 'https://www.metropoles.com/brasil', category: 'Brasil' },
  { url: 'https://www.metropoles.com/colunas-blogs/brasilia', category: 'Política' },
  { url: 'https://www.metropoles.com/tecnologia', category: 'Tecnologia' },
  { url: 'https://www.metropoles.com/entretenimento', category: 'Entretenimento' },
  { url: 'https://www.metropoles.com/esportes', category: 'Esportes' },
];

async function extractMeta(url: string, category?: string): Promise<RawArticle | null> {
  try {
    const { data } = await axios.get(url, { timeout: 8000, headers: { 'User-Agent': 'Mozilla/5.0' } });
    const $ = cheerio.load(data);

    const title = $('meta[property="og:title"]').attr('content') || $('h1.post-title').text() || $('title').text();
    const description = $('meta[property="og:description"]').attr('content');
    const image_url = $('meta[property="og:image"]').attr('content');
    const published_at = $('meta[property="article:published_time"]').attr('content');

    if (!title) return null;
    return { title: title.trim(), description, url, image_url, source: SOURCE, source_logo: LOGO, category, published_at };
  } catch {
    return null;
  }
}

export async function scrapeMetropoles(): Promise<RawArticle[]> {
  const articles: RawArticle[] = [];
  const seen = new Set<string>();

  for (const section of SECTIONS) {
    try {
      const { data } = await axios.get(section.url, { timeout: 10000, headers: { 'User-Agent': 'Mozilla/5.0' } });
      const $ = cheerio.load(data);

      const links: string[] = [];
      $('a[href]').each((_, el) => {
        let href = $(el).attr('href') || '';
        if (!href.startsWith('http')) href = 'https://www.metropoles.com' + href;
        if (href.includes('metropoles.com') && !seen.has(href) && href.length > 35) {
          seen.add(href);
          links.push(href);
        }
      });

      const batch = links.slice(0, 12);
      for (const link of batch) {
        const article = await extractMeta(link, section.category);
        if (article) articles.push(article);
        await new Promise(r => setTimeout(r, 400));
      }
    } catch (err) {
      console.error(`[Metrópoles] Erro na seção ${section.url}:`, err);
    }
  }

  return articles;
}