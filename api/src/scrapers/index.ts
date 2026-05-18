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

export { scrapeG1 } from './g1';
export { scrapeCNN } from './cnn';
export { scrapeEstadao } from './estadao';
export { scrapeFolha } from './folha';
export { scrapeUOL } from './uol';
export { scrapeR7 } from './r7';
export { scrapeMetropoles } from './metropoles';