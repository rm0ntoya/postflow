import axios from 'axios';
import * as cheerio from 'cheerio';
import { RawArticle } from './index';

const SOURCE = 'Estadão';
const LOGO = 'https://www.estadao.com.br/favicon.ico';

const SECTIONS = [
  { url: 'https://www.estadao.com.br', category: 'Geral' },
  { url: 'https://www.estadao.com.br/politica/', category: 'Política' },
  { url: 'https://www.estadao.com.br/economia/', category: 'Economia' },
  { url: 'https://www.estadao.com.br/esportes/', category: 'Esportes' },
  { url: 'https://www.estadao.com.br/tecnologia/', category: 'Tecnologia' },
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

export async function scrapeEstadao(): Promise<RawArticle[]> {
  const articles: RawArticle[] = [];
  const seen = new Set<string>();

  for (const section of SECTIONS) {
    try {
      const { data } = await axios.get(section.url, { timeout: 10000, headers: { 'User-Agent': 'Mozilla/5.0' } });
      const $ = cheerio.load(data);

      const links: string[] = [];
      $('a[href]').each((_, el) => {
        let href = $(el).attr('href') || '';
        if (!href.startsWith('http')) href = 'https://www.estadao.com.br' + href;
        if (href.includes('estadao.com.br') && !seen.has(href) && href.length > 35) {
          seen.add(href);
          links.push(href);
        }
      });

      const batch = links.slice(0, 10);
      for (const link of batch) {
        const article = await extractMeta(link, section.category);
        if (article) articles.push(article);
        // Respeitar rate limit do Estadão
        await new Promise(r => setTimeout(r, 1000));
      }
    } catch (err) {
      console.error(`[Estadão] Erro na seção ${section.url}:`, err);
    }
  }

  return articles;
}