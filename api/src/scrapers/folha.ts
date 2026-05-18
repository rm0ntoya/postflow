import axios from 'axios';
import xml2js from 'xml2js';
import { RawArticle } from './index';

const SOURCE = 'Folha de S.Paulo';
const LOGO = 'https://www.folha.uol.com.br/favicon.ico';

const RSS_FEEDS = [
  { url: 'https://feeds.folha.uol.com.br/emcimadahora/rss091.xml', category: 'Geral' },
  { url: 'https://feeds.folha.uol.com.br/poder/rss091.xml', category: 'Política' },
  { url: 'https://feeds.folha.uol.com.br/mercado/rss091.xml', category: 'Economia' },
  { url: 'https://feeds.folha.uol.com.br/esporte/rss091.xml', category: 'Esportes' },
  { url: 'https://feeds.folha.uol.com.br/tec/rss091.xml', category: 'Tecnologia' },
  { url: 'https://feeds.folha.uol.com.br/ilustrada/rss091.xml', category: 'Entretenimento' },
];

export async function scrapeFolha(): Promise<RawArticle[]> {
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
          const url = item.link || item.guid?._ || item.guid || '';
          const description = typeof item.description === 'string' ? item.description?.replace(/<[^>]+>/g, '') : '';
          const published_at = item.pubDate ? new Date(item.pubDate).toISOString() : undefined;
          const image_url = item['media:content']?.['$']?.url || item.enclosure?.['$']?.url;

          if (title && url) {
            articles.push({ title: title.trim(), description, url, image_url, source: SOURCE, source_logo: LOGO, category: feed.category, published_at });
          }
        } catch { /* skip item */ }
      }
    } catch (err) {
      console.error(`[Folha] Erro no feed ${feed.url}:`, err);
    }
  }

  return articles;
}