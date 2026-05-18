import axios from 'axios';
import * as cheerio from 'cheerio';
import { RawArticle } from '../queries';

const SOURCE = 'R7';
const LOGO = 'https://noticias.r7.com/favicon.ico';

const SECTIONS = [
  { url: 'https://noticias.r7.com', category: 'Geral' },
  { url: 'https://noticias.r7.com/brasil', category: 'Brasil' },
  { url: 'https://noticias.r7.com/politica', category: 'Política' },
  { url: 'https://noticias.r7.com/tecnologia-e-ciencia', category: 'Tecnologia' },
  { url: 'https://noticias.r7.com/esportes', category: 'Esportes' },
];

async function extractMeta(url: string, category?: string): Promise<RawArticle | null> {
  try {
    const { data } = await axios.get(url, { timeout: 8000, headers: { 'User-Agent': 'Mozilla/5.0' } });
    const $ = cheerio.load(data);

    const title = $('meta[property="og:title"]').attr('content') || $('title').text();
    const description = $('meta[property="og:description"]').attr('content');
    const image_url = $('meta[property="og:image"]').attr('content');
    const published_at = $('meta[property="article:published_time"]').attr('content');

    if (!title) return null;
    return { title: title.trim(), description, url, image_url, source: SOURCE, source_logo: LOGO, category, published_at };
  } catch {
    return null;
  }
}

export async function scrapeR7(): Promise<RawArticle[]> {
  const articles: RawArticle[] = [];
  const seen = new Set<string>();

  for (const section of SECTIONS) {
    try {
      const { data } = await axios.get(section.url, { timeout: 10000, headers: { 'User-Agent': 'Mozilla/5.0' } });
      const $ = cheerio.load(data);

      const links: string[] = [];
      $('a[href]').each((_, el) => {
        let href = $(el).attr('href') || '';
        if (!href.startsWith('http')) href = 'https://noticias.r7.com' + href;
        if (href.includes('r7.com') && !seen.has(href) && href.length > 30) {
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
      console.error(`[R7] Erro na seção ${section.url}:`, err);
    }
  }

  return articles;
}