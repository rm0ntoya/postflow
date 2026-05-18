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

// Wraps scraper with timeout so one slow portal doesn't block all
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`Timeout ${ms}ms`)), ms)),
  ]);
}

async function runScraper(name: string, fn: () => Promise<RawArticle[]>) {
  let inserted = 0, skipped = 0, errors = 0;
  try {
    // 8s timeout per portal, max 10 articles each
    const all = await withTimeout(fn(), 8000);
    const articles = all.slice(0, 10);
    // Insert in parallel (no sequential await)
    const results = await Promise.allSettled(articles.map(a => insertArticle(a)));
    for (const r of results) {
      if (r.status === 'fulfilled') {
        if (r.value === 'inserted') inserted++;
        else skipped++;
      } else {
        errors++;
      }
    }
  } catch (err) {
    console.error(`[SCRAPER] Falha em ${name}:`, err instanceof Error ? err.message : err);
    errors++;
  }
  console.log(`[${name}] inseridas=${inserted} ignoradas=${skipped} erros=${errors}`);
  return { name, inserted, skipped, errors };
}

export async function runAllScrapers() {
  const start = Date.now();
  console.log('[SCRAPER] Iniciando coleta paralela...');

  // All scrapers run in parallel
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

  await cleanOldArticles(7).catch(() => null);

  const duration_ms = Date.now() - start;
  console.log(`[SCRAPER] Concluído em ${duration_ms}ms — inseridas=${totals.inserted}`);
  return { ...totals, duration_ms };
}

// Scrape single source by name
export async function runSingleScraper(sourceName: string) {
  const source = SOURCES.find(s => s.name.toLowerCase() === sourceName.toLowerCase());
  if (!source) throw new Error(`Source not found: ${sourceName}`);
  return runScraper(source.name, source.fn);
}
