import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { initDb } from './db/schema';
import { getTotalArticles, getLastScrape } from './db/queries';
import { runAllScrapers, startScheduler } from './scheduler';
import newsRouter from './routes/news';
import contentRouter from './routes/content';

const app = express();
const PORT = process.env.PORT || 3001;
const startTime = Date.now();

app.use(express.json());
app.use(cors({
  origin: ['http://localhost:3000', 'https://novacraft.app'],
  methods: ['GET', 'POST'],
}));
app.use(rateLimit({ windowMs: 60_000, max: 100 }));

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      articles_total: getTotalArticles(),
      last_scrape: getLastScrape(),
      uptime_seconds: Math.floor((Date.now() - startTime) / 1000),
    },
  });
});

app.use('/api/news', newsRouter);
app.use('/api/news', contentRouter);

app.use((_req, res) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Rota não encontrada' } });
});

(async () => {
  initDb();
  startScheduler();
  app.listen(PORT, () => {
    console.log('[SERVER] API rodando em http://localhost:' + PORT);
  });
  await runAllScrapers();
})();
