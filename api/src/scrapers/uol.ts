import axios from 'axios';
import xml2js from 'xml2js';
import { RawArticle } from './index';

const SOURCE = 'UOL';
const LOGO = 'https://conteudo.imguol.com.br/c/portal/o5/2022/10/18/uol-logo.svg';

const RSS_FEEDS = [
  { url: 'https://rss.uol.com.br/feed/noticias.xml', category: 'Geral' },
  { url: 'https://rss.uol.com.br/feed/tecnologia.xml', category: 'Tecnologia' },
  { url: 'https://rss.uol.com.br/feed/economia.xml', category: 'Economia' },
  { url: 'https://rss.uol.com.br/feed/esportes.xml', category: 'Esportes' },
];

export async function scrapeUOL(): Promise<RawArticle[]> {
  const articles: RawArticle[] = [];
  const parser = new xml2js.Parser({ explicitArray: false });

  for (const feed of RSS_FEEDS) {
    try {
      const { data } = await axios.get(feed.url, { timeout: 10000, headers: { 'User-Agent': 'Mozilla/5.0' } });
      const result = await parser.parseStringPromise(data);

      const items = result?.rss?.channel?.item;
      if (!items) continue;

      const list = Array.isArray(items) ? items : [items];

      for (const item of list.slice(0, 20)) {
        try {
          const title = typeof item.title === 'string' ? item.title : item.title?._ || '';
          const url = item.link || '';
          const description = typeof item.description === 'string' ? item.description?.replace(/<[^>]+>/g, '') : '';
          const published_at = item.pubDate ? new Date(item.pubDate).toISOString() : undefined;
          const image_url = item['media:content']?.['$']?.url;

          if (title && url) {
            articles.push({ title: title.trim(), description, url, image_url, source: SOURCE, source_logo: LOGO, category: feed.category, published_at });
          }
        } catch { /* skip */ }
      }
    } catch (err) {
      console.error(`[UOL] Erro no feed ${feed.url}:`, err);
    }
  }

  return articles;
}