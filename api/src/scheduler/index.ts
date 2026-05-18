import cron from 'node-cron';
import { scrapeG1, scrapeCNN, scrapeEstadao, scrapeFolha, scrapeUOL, scrapeR7, scrapeMetropoles } from '../scrapers';
import { insertArticle, cleanOldArticles } from '../db/queries';
import { RawArticle } from '../scrapers';

interface ScraperResult {
  name: string;
  inserted: number;
  skipped: number;
  errors: number;
}

async function runScraper(name: string, fn: () => Promise<RawArticle[]>): Promise<ScraperResult> {
  let inserted = 0, skipped = 0, errors = 0;
  try {
    const articles = await fn();
    for (const article of articles) {
      try {
        const result = insertArticle(article);
        if (result === 'inserted') inserted++;
        else skipped++;
      } catch {
        errors++;
      }
    }
  } catch (err) {
    console.error(`[SCRAPER] Falha total em ${name}:`, err);
    errors++;
  }
  console.log(`[${name}] inseridas=${inserted} ignoradas=${skipped} erros=${errors}`);
  return { name, inserted, skipped, errors };
}

export async function runAllScrapers() {
  const start = Date.now();
  console.log('[CRON] Iniciando coleta de notícias...');

  const results = await Promise.allSettled([
    runScraper('G1', scrapeG1),
    runScraper('CNN Brasil', scrapeCNN),
    runScraper('Estadão', scrapeEstadao),
    runScraper('Folha', scrapeFolha),
    runScraper('UOL', scrapeUOL),
    runScraper('R7', scrapeR7),
    runScraper('Metrópoles', scrapeMetropoles),
  ]);

  const totals = results.reduce((acc, r) => {
    if (r.status === 'fulfilled') {
      acc.inserted += r.value.inserted;
      acc.skipped += r.value.skipped;
      acc.errors += r.value.errors;
    }
    return acc;
  }, { inserted: 0, skipped: 0, errors: 0 });

  const duration_ms = Date.now() - start;
  console.log(`[CRON] Concluído em ${duration_ms}ms — inseridas=${totals.inserted} ignoradas=${totals.skipped} erros=${totals.errors}`);

  return { ...totals, duration_ms };
}

export function startScheduler() {
  // A cada 15 minutos
  cron.schedule('*/15 * * * *', async () => {
    await runAllScrapers();
  });

  // Às 03:00 — limpar notícias com mais de 7 dias
  cron.schedule('0 3 * * *', async () => {
    console.log('[CRON] Limpando notícias antigas...');
    cleanOldArticles(7);
  });

  console.log('[CRON] Agendador iniciado.');
}