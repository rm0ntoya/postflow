import axios from 'axios';
import * as cheerio from 'cheerio';
import { RawArticle } from '../queries';

const SOURCE = 'G1';
const LOGO = 'https://s.glbimg.com/en/ho/f/dynamic/bjWL_y2-fGHTrRJOhx4R-w==/200x60/i.s3.glbimg.com/v1/AUTH_63b422c2af0745d39e15228a7702027c/internal_photos/bs/2021/Q/Y/w5VXlBTaqzF3m8iJ3gKQ/g1logo-branco.png';

const SECTIONS = [
  { url: 'https://g1.globo.com', category: 'Geral' },
  { url: 'https://g1.globo.com/politica/', category: 'Política' },
  { url: 'https://g1.globo.com/tecnologia/', category: 'Tecnologia' },
  { url: 'https://g1.globo.com/economia/', category: 'Economia' },
  { url: 'https://g1.globo.com/esportes/', category: 'Esportes' },
  { url: 'https://g1.globo.com/pop-arte/', category: 'Entretenimento' },
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

export async function scrapeG1(): Promise<RawArticle[]> {
  const articles: RawArticle[] = [];
  const seen = new Set<string>();

  for (const section of SECTIONS) {
    try {
      const { data } = await axios.get(section.url, { timeout: 10000, headers: { 'User-Agent': 'Mozilla/5.0' } });
      const $ = cheerio.load(data);

      const links: string[] = [];
      $('a[href]').each((_, el) => {
        const href = $(el).attr('href') || '';
        if (href.includes('g1.globo.com') && href.includes('.html') && !seen.has(href)) {
          seen.add(href);
          links.push(href);
        }
      });

      const batch = links.slice(0, 15);
      for (const link of batch) {
        const article = await extractMeta(link, section.category);
        if (article) articles.push(article);
        await new Promise(r => setTimeout(r, 300));
      }
    } catch (err) {
      console.error(`[G1] Erro na seção ${section.url}:`, err);
    }
  }

  return articles;
}