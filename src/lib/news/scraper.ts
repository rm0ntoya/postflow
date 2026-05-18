import { insertArticle, cleanOldArticles, RawArticle } from './queries';
import { scrapeG1 } from './scrapers/g1';
import { scrapeCNN } from './scrapers/cnn';
import { scrapeEstadao } from './scrapers/estadao';
import { scrapeFolha } from './scrapers/folha';
import { scrapeUOL } from './scrapers/uol';
import { scrapeR7 } from './scrapers/r7';
import { scrapeMetropoles } from './scrapers/metropoles';

const SOURCES = [
  { name: 'G1', fn: scrapeG1 },
  { name: 'CNN Brasil', fn: scrapeCNN },
  { name: 'Estadão', fn: scrapeEstadao },
  { name: 'Folha', fn: scrapeFolha },
  { name: 'UOL', fn: scrapeUOL },
  { name: 'R7', fn: scrapeR7 },
  { name: 'Metrópoles', fn: scrapeMetropoles },
];

async function runScraper(name: string, fn: () => Promise<RawArticle[]>) {
  let inserted = 0, skipped = 0, errors = 0;
  try {
    const articles = await fn();
    for (const article of articles) {
      try {
        const result = await insertArticle(article);
        if (result === 'inserted') inserted++;
        else skipped++;
      } catch { errors++; }
    }
  } catch (err) {
    console.error(`[SCRAPER] Falha em ${name}:`, err);
    errors++;
  }
  console.log(`[${name}] inseridas=${inserted} ignoradas=${skipped} erros=${errors}`);
  return { name, inserted, skipped, errors };
}

export async function runAllScrapers() {
  const start = Date.now();
  console.log('[SCRAPER] Iniciando coleta...');

  const results = await Promise.allSettled(
    SOURCES.map(({ name, fn }) => runScraper(name, fn))
  );

  const totals = results.reduce((acc, r) => {
    if (r.status === 'fulfilled') {
      acc.inserted += r.value.inserted;
      acc.skipped += r.value.skipped;
      acc.errors += r.value.errors;
    }
    return acc;
  }, { inserted: 0, skipped: 0, errors: 0 });

  await cleanOldArticles(7);

  const duration_ms = Date.now() - start;
  console.log(`[SCRAPER] Concluído em ${duration_ms}ms — inseridas=${totals.inserted}`);
  return { ...totals, duration_ms };
}
