# Modo Notícia PRO — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `/dashboard/news-pro` — a 3-step wizard that lists news from the local Express API, lets the user configure a carousel (pages, focus prompt, per-page toggles), fetches the full article content at generation time, calls Gemini, and opens the result in the existing editor.

**Architecture:** New Next.js page (`/dashboard/news-pro`) acts as the UI wizard. A new Next.js route handler (`/api/news-content/[id]`) proxies to the Express API's new `GET /api/news/:id/content` endpoint, which performs generic Cheerio scraping of the article URL. Generation reuses the existing `POST /api/carousel/generate` route by passing `pasteContent` (the scraped full text) alongside a `theme` built from the article title + focus prompt. The `concurrently` + `tsx` setup makes `npm run dev` start both processes.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, Framer Motion, Lucide React, Cheerio (already in `/api`), `concurrently`, `tsx`, Express (existing API), Gemini via existing `/api/carousel/generate`

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `package.json` | Modify | Add `concurrently`, `tsx` devDeps; update `dev` script |
| `api/src/routes/content.ts` | **Create** | `GET /api/news/:id/content` — Cheerio scraper for full article body |
| `api/src/server.ts` | Modify | Register the new content route |
| `src/app/api/news-content/[id]/route.ts` | **Create** | Next.js proxy to Express content endpoint |
| `src/app/dashboard/news-pro/page.tsx` | **Create** | Full 3-step wizard UI |
| `src/components/Sidebar.tsx` | Modify | Add "Notícia PRO" nav item |

---

## Task 1: Add `concurrently` + `tsx`, update `dev` script

**Files:**
- Modify: `package.json`

> **Context:** Currently `npm run dev` only starts Next.js. The Express API on port 3001 must also start. `tsx` is a zero-config TypeScript runner (faster than `ts-node-esm`). `concurrently` runs both processes with color-coded output.

- [ ] **Step 1: Install packages**

```bash
cd "/Users/r.montoya/Downloads/site teste - cópia/novacraft/saas"
npm install --save-dev concurrently tsx
```

Expected output: packages added to `devDependencies` in `package.json`.

- [ ] **Step 2: Update `package.json` scripts**

Open `package.json`. Replace the `"scripts"` block with:

```json
"scripts": {
  "dev": "concurrently --names \"next,api\" --prefix-colors \"cyan,yellow\" \"next dev\" \"npm run dev:api\"",
  "dev:api": "cd api && npx tsx watch src/server.ts",
  "build": "next build",
  "start": "node server.js"
},
```

- [ ] **Step 3: Verify both processes start**

```bash
npm run dev
```

Expected: two streams of logs — `[next]` in cyan on port 3000, `[api]` in yellow on port 3001 showing `[SERVER] API rodando em http://localhost:3001`. Wait ~10 seconds. Hit `Ctrl+C` to stop.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: run Next.js and Express API together with npm run dev"
```

---

## Task 2: Create Express content scraping route

**Files:**
- Create: `api/src/routes/content.ts`
- Modify: `api/src/server.ts`

> **Context:** The existing scrapers only save `og:meta` to the DB — the `content` field is `null`. When the user clicks "Generate", we need the full article body. This route fetches the article URL and extracts all `<p>` tags with generic Cheerio selectors, removing noise (ads, navs, scripts).

- [ ] **Step 1: Create `api/src/routes/content.ts`**

```typescript
import { Router, Request, Response } from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { getArticleById } from '../db/queries';

const router = Router();

const BROWSER_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

async function scrapeFullContent(url: string): Promise<string> {
  const { data } = await axios.get(url, {
    timeout: 12000,
    headers: { 'User-Agent': BROWSER_UA },
  });

  const $ = cheerio.load(data);

  // Remove noise elements
  $('script, style, nav, header, footer, aside, iframe, noscript').remove();
  $('[class*="ad"], [class*="banner"], [class*="cookie"], [class*="popup"], [id*="ad"], [id*="banner"]').remove();
  $('[class*="related"], [class*="newsletter"], [class*="share"], [class*="social"]').remove();

  // Try specific article containers in order
  const containers = [
    'article',
    '[class*="article-body"]',
    '[class*="article-content"]',
    '[class*="materia-corpo"]',
    '[class*="content-text"]',
    '[class*="post-content"]',
    '[class*="entry-content"]',
    'main',
  ];

  let $container = $('body');
  for (const selector of containers) {
    if ($(selector).length > 0) {
      $container = $(selector).first();
      break;
    }
  }

  const paragraphs: string[] = [];
  $container.find('p').each((_, el) => {
    const text = $(el).text().trim();
    if (text.length > 40) paragraphs.push(text);
  });

  return paragraphs.join('\n\n');
}

// GET /api/news/:id/content
router.get('/:id/content', async (req: Request, res: Response) => {
  const article = getArticleById(req.params.id);

  if (!article) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Artigo não encontrado.' },
    });
  }

  try {
    const content = await scrapeFullContent(article.url);

    if (!content || content.length < 100) {
      // Fallback to description if scraping yields too little
      const fallback = article.description || '';
      return res.json({
        success: true,
        data: {
          id: article.id,
          title: article.title,
          url: article.url,
          content: fallback,
          partial: true,
        },
      });
    }

    return res.json({
      success: true,
      data: {
        id: article.id,
        title: article.title,
        url: article.url,
        content,
        partial: false,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido';
    console.error(`[content] Erro ao scraping ${article.url}:`, msg);

    // Fallback to description
    const fallback = article.description || '';
    if (fallback) {
      return res.json({
        success: true,
        data: {
          id: article.id,
          title: article.title,
          url: article.url,
          content: fallback,
          partial: true,
        },
      });
    }

    return res.status(502).json({
      success: false,
      error: { code: 'SCRAPE_FAILED', message: `Não foi possível extrair conteúdo: ${msg}` },
    });
  }
});

export default router;
```

- [ ] **Step 2: Register the new route in `api/src/server.ts`**

Open `api/src/server.ts`. After the existing `import newsRouter from './routes/news';` line, add:

```typescript
import contentRouter from './routes/content';
```

Then after `app.use('/api/news', newsRouter);`, add:

```typescript
app.use('/api/news', contentRouter);
```

The final order in `server.ts` should be:
```typescript
app.use('/api/news', newsRouter);
app.use('/api/news', contentRouter);
```

- [ ] **Step 3: Test the endpoint manually**

Start the API alone:
```bash
cd api && npx tsx src/server.ts
```

In another terminal, fetch any article ID from the DB:
```bash
curl "http://localhost:3001/api/news?limit=1" | jq '.data.articles[0].id'
```

Then test content scraping (replace `ARTICLE_ID` with the ID from above):
```bash
curl "http://localhost:3001/api/news/ARTICLE_ID/content" | jq '{partial: .data.partial, len: (.data.content | length)}'
```

Expected: `{ "partial": false, "len": <number > 200> }` for most articles. `partial: true` is acceptable for paywalled sites.

- [ ] **Step 4: Commit**

```bash
cd ..
git add api/src/routes/content.ts api/src/server.ts
git commit -m "feat(api): add GET /api/news/:id/content with generic Cheerio scraper"
```

---

## Task 3: Create Next.js proxy route handler

**Files:**
- Create: `src/app/api/news-content/[id]/route.ts`

> **Context:** The browser can't call `localhost:3001` directly from the wizard (CORS would need to be wide open). Instead, a Next.js route handler proxies the request server-side. This also future-proofs the URL if the API moves.

- [ ] **Step 1: Create `src/app/api/news-content/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEWS_API_URL ?? 'http://localhost:3001';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const res = await fetch(`${API_BASE}/api/news/${id}/content`, {
      headers: { 'Content-Type': 'application/json' },
      // No cache — always fresh scrape
      cache: 'no-store',
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido';
    return NextResponse.json(
      { success: false, error: { code: 'PROXY_ERROR', message: msg } },
      { status: 502 }
    );
  }
}
```

- [ ] **Step 2: Test the proxy**

With both `next dev` and the Express API running (`npm run dev`):

```bash
# Get any article ID first
curl "http://localhost:3001/api/news?limit=1" | jq '.data.articles[0].id'

# Then call through Next.js proxy (replace ARTICLE_ID)
curl "http://localhost:3000/api/news-content/ARTICLE_ID" | jq '{ok: .success, len: (.data.content | length)}'
```

Expected: `{ "ok": true, "len": <number> }`.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/news-content/
git commit -m "feat: add Next.js proxy route for article content scraping"
```

---

## Task 4: Add "Notícia PRO" to sidebar

**Files:**
- Modify: `src/components/Sidebar.tsx`

> **Context:** The sidebar uses `<SidebarItem>` components. "Notícia PRO" goes after the existing "Modo Notícia" item. We use the `Rss` icon from `lucide-react` to differentiate from the existing `Newspaper` icon.

- [ ] **Step 1: Add import for `Rss` icon**

Open `src/components/Sidebar.tsx`. Find this line:
```typescript
import { LayoutDashboard, Newspaper, Calendar, BookOpen, Settings, Plus, PanelLeft, LogOut } from "lucide-react";
```

Replace with:
```typescript
import { LayoutDashboard, Newspaper, Rss, Calendar, BookOpen, Settings, Plus, PanelLeft, LogOut } from "lucide-react";
```

- [ ] **Step 2: Add sidebar nav item**

Find the existing Notícia item:
```tsx
<SidebarItem href="/dashboard/news" icon={ICON(Newspaper)} label="Modo Notícia" shortcut="g n" active={!!isActive("/dashboard/news")} expanded={expanded} />
```

After that line, add:
```tsx
<SidebarItem href="/dashboard/news-pro" icon={ICON(Rss)} label="Notícia PRO" shortcut="g p" active={!!isActive("/dashboard/news-pro")} expanded={expanded} />
```

- [ ] **Step 3: Verify sidebar renders**

Start `npm run dev`. Go to `http://localhost:3000/dashboard`. Confirm "Notícia PRO" appears below "Modo Notícia" in the sidebar. Hover over the sidebar to expand — both label and icon should appear.

- [ ] **Step 4: Commit**

```bash
git add src/components/Sidebar.tsx
git commit -m "feat(sidebar): add Notícia PRO nav item"
```

---

## Task 5: Build the Notícia PRO wizard page

**Files:**
- Create: `src/app/dashboard/news-pro/page.tsx`

> **Context:** This is the main feature. It's a client component with 3 steps managed by a `step` state variable (1 | 2 | 3). Step 1 = news list. Step 2 = carousel config. Step 3 = loading/generating screen. After generation, it redirects to `/dashboard/editor/[carouselId]`. Follow existing design patterns: `Stage`/`motion.div` with `bg-bg-surface border border-border-subtle rounded-xl p-8`, `text-micro text-text-secondary` for eyebrows, `text-display text-text-primary` for headings, `text-body text-text-secondary` for descriptions. Use `frontend-design` skill principles — premium, editorial, high visual quality, no generic AI aesthetics.

**⚠️ IMPORTANT — Use the `frontend-design` skill before writing any UI code in this task.** This page is the most visually complex piece of the feature. Invoke the skill to get design guidelines before implementing.

- [ ] **Step 1: Invoke `frontend-design` skill**

Before writing any code: invoke the `frontend-design` skill to get premium UI guidelines. Follow its principles throughout this task — especially: editorial typography hierarchy, editorial card design for news items, non-generic toggle designs, smooth step transitions with Framer Motion.

- [ ] **Step 2: Define types at the top of the file**

Create `src/app/dashboard/news-pro/page.tsx` with this type block first:

```typescript
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Rss, Search, Filter,
  CheckCircle2, Circle, Loader2, AlertTriangle,
  RotateCcw, ChevronDown,
} from "lucide-react";
import Toast from "@/components/Toast";

// ── Types ─────────────────────────────────────────────────────────────────
interface Article {
  id: string;
  title: string;
  description: string | null;
  url: string;
  image_url: string | null;
  source: string;
  source_logo: string | null;
  category: string | null;
  published_at: string | null;
  scraped_at: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

interface CarouselConfig {
  totalPages: number;           // 3–12
  focusPrompt: string;          // may be empty
  pageToggles: boolean[];       // true = carousel layout, false = text-only slide
}
```

- [ ] **Step 3: Write the `API_BASE` constant and fetch helpers**

After the type block:

```typescript
const EXPRESS_API = '/api/news-content'; // Next.js proxy base

async function fetchArticles(params: {
  page: number;
  limit: number;
  source?: string;
  category?: string;
  q?: string;
}): Promise<{ articles: Article[]; pagination: Pagination }> {
  const qs = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
    ...(params.source ? { source: params.source } : {}),
    ...(params.category ? { category: params.category } : {}),
    ...(params.q ? { q: params.q } : {}),
  });
  const res = await fetch(`http://localhost:3001/api/news?${qs}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`API retornou ${res.status}`);
  const data = await res.json();
  return data.data;
}

async function fetchSources(): Promise<string[]> {
  const res = await fetch('http://localhost:3001/api/news/sources', { cache: 'no-store' });
  if (!res.ok) return [];
  const data = await res.json();
  return data.data ?? [];
}

async function fetchCategories(): Promise<string[]> {
  const res = await fetch('http://localhost:3001/api/news/categories', { cache: 'no-store' });
  if (!res.ok) return [];
  const data = await res.json();
  return data.data ?? [];
}

async function fetchArticleContent(id: string): Promise<{ content: string; partial: boolean }> {
  const res = await fetch(`${EXPRESS_API}/${id}`, { cache: 'no-store' });
  const data = await res.json();
  if (!data.success) throw new Error(data.error?.message ?? 'Erro ao buscar conteúdo');
  return { content: data.data.content, partial: data.data.partial };
}
```

- [ ] **Step 4: Write the Step 1 component — news list**

```typescript
// ── Step 1: News List ──────────────────────────────────────────────────────
function Step1({
  onSelect,
}: {
  onSelect: (article: Article) => void;
}) {
  const [articles, setArticles] = React.useState<Article[]>([]);
  const [pagination, setPagination] = React.useState<Pagination | null>(null);
  const [page, setPage] = React.useState(1);
  const [sources, setSources] = React.useState<string[]>([]);
  const [categories, setCategories] = React.useState<string[]>([]);
  const [filterSource, setFilterSource] = React.useState('');
  const [filterCategory, setFilterCategory] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Debounce search input 400ms
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  // Reset to page 1 when filters change
  React.useEffect(() => { setPage(1); }, [filterSource, filterCategory, debouncedSearch]);

  // Load sources + categories once
  React.useEffect(() => {
    fetchSources().then(setSources);
    fetchCategories().then(setCategories);
  }, []);

  // Load articles
  React.useEffect(() => {
    setLoading(true);
    setError(null);
    fetchArticles({
      page,
      limit: 12,
      source: filterSource || undefined,
      category: filterCategory || undefined,
      q: debouncedSearch || undefined,
    })
      .then(({ articles, pagination }) => {
        setArticles(articles);
        setPagination(pagination);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [page, filterSource, filterCategory, debouncedSearch]);

  function formatDate(iso: string | null) {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    } catch { return ''; }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <div className="text-micro text-text-secondary mb-2">01 · SELECIONAR NOTÍCIA</div>
        <h1 className="text-display text-text-primary">
          Escolha uma matéria para transformar em carrossel.
        </h1>
        <p className="text-body text-text-secondary mt-2">
          Notícias coletadas automaticamente das principais fontes brasileiras.
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <input
            type="text"
            placeholder="Buscar por título…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-bg-surface border border-border-subtle rounded-lg text-body text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent transition-colors"
          />
        </div>

        <div className="relative">
          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 bg-bg-surface border border-border-subtle rounded-lg text-body text-text-primary focus:outline-none focus:border-accent transition-colors"
          >
            <option value="">Todas as fontes</option>
            {sources.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 bg-bg-surface border border-border-subtle rounded-lg text-body text-text-primary focus:outline-none focus:border-accent transition-colors"
          >
            <option value="">Todas as categorias</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <AlertTriangle size={16} className="text-red-400 shrink-0" />
          <div>
            <p className="text-body-strong text-red-400">API de notícias offline</p>
            <p className="text-body text-text-secondary">Certifique-se de que a API está rodando. Rode <code className="font-mono text-accent">npm run dev</code> — ela sobe automaticamente.</p>
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="bg-bg-surface border border-border-subtle rounded-xl overflow-hidden animate-pulse">
              <div className="h-36 bg-bg-surface-2" />
              <div className="p-4 space-y-2">
                <div className="h-3 bg-bg-surface-2 rounded w-16" />
                <div className="h-4 bg-bg-surface-2 rounded w-full" />
                <div className="h-4 bg-bg-surface-2 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && articles.length === 0 && (
        <div className="text-center py-16">
          <Rss size={32} className="text-text-tertiary mx-auto mb-4" />
          <p className="text-body-strong text-text-secondary">Nenhuma notícia encontrada.</p>
          <p className="text-body text-text-tertiary mt-1">Tente outro filtro ou aguarde o próximo scraping automático.</p>
        </div>
      )}

      {/* Article grid */}
      {!loading && articles.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {articles.map((article) => (
            <motion.button
              key={article.id}
              onClick={() => onSelect(article)}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.15 }}
              className="group text-left bg-bg-surface border border-border-subtle rounded-xl overflow-hidden hover:border-accent/40 hover:shadow-lg hover:shadow-accent/5 transition-all duration-200"
            >
              {/* Thumbnail */}
              <div className="relative h-36 bg-bg-surface-2 overflow-hidden">
                {article.image_url ? (
                  <img
                    src={article.image_url}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Rss size={24} className="text-text-tertiary" />
                  </div>
                )}
                {/* Source badge */}
                <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-bg-base/80 backdrop-blur-sm px-2 py-1 rounded-md">
                  {article.source_logo && (
                    <img src={article.source_logo} alt={article.source} className="h-3 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  )}
                  <span className="text-micro text-text-secondary">{article.source}</span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  {article.category && (
                    <span className="text-micro text-accent bg-accent/10 px-2 py-0.5 rounded-full">{article.category}</span>
                  )}
                  <span className="text-micro text-text-tertiary ml-auto">{formatDate(article.published_at)}</span>
                </div>
                <h3 className="text-body-strong text-text-primary line-clamp-3 group-hover:text-accent transition-colors">
                  {article.title}
                </h3>
                {article.description && (
                  <p className="text-caption text-text-tertiary mt-2 line-clamp-2">{article.description}</p>
                )}
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-2 px-4 py-2 text-body text-text-secondary border border-border-subtle rounded-lg hover:border-border-strong disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft size={14} /> Anterior
          </button>
          <span className="text-body text-text-secondary">
            Página <strong className="text-text-primary">{page}</strong> de <strong className="text-text-primary">{pagination.total_pages}</strong>
            <span className="text-text-tertiary ml-2">({pagination.total} matérias)</span>
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.total_pages, p + 1))}
            disabled={page === pagination.total_pages}
            className="flex items-center gap-2 px-4 py-2 text-body text-text-secondary border border-border-subtle rounded-lg hover:border-border-strong disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Próxima <ArrowRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Write the Step 2 component — carousel configuration**

```typescript
// ── Step 2: Config ─────────────────────────────────────────────────────────
function Step2({
  article,
  config,
  setConfig,
  onBack,
  onGenerate,
}: {
  article: Article;
  config: CarouselConfig;
  setConfig: React.Dispatch<React.SetStateAction<CarouselConfig>>;
  onBack: () => void;
  onGenerate: () => void;
}) {
  // Sync pageToggles length when totalPages changes
  React.useEffect(() => {
    setConfig((prev) => {
      const current = prev.pageToggles;
      if (current.length === prev.totalPages) return prev;
      const next = Array.from({ length: prev.totalPages }, (_, i) => current[i] ?? true);
      return { ...prev, pageToggles: next };
    });
  }, [config.totalPages, setConfig]);

  function togglePage(index: number) {
    setConfig((prev) => {
      const next = [...prev.pageToggles];
      next[index] = !next[index];
      return { ...prev, pageToggles: next };
    });
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button
          onClick={onBack}
          className="mt-1 p-2 rounded-lg border border-border-subtle hover:border-border-strong text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <div className="text-micro text-text-secondary mb-2">02 · CONFIGURAR CARROSSEL</div>
          <h1 className="text-display text-text-primary">Configure como o carrossel vai ser gerado.</h1>
        </div>
      </div>

      {/* Selected article summary */}
      <div className="flex items-center gap-4 p-4 bg-bg-surface border border-accent/20 rounded-xl">
        {article.image_url && (
          <img src={article.image_url} alt={article.title} className="w-16 h-16 rounded-lg object-cover shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        )}
        <div className="min-w-0">
          <div className="text-micro text-accent mb-1">{article.source} · {article.category}</div>
          <p className="text-body-strong text-text-primary line-clamp-2">{article.title}</p>
        </div>
      </div>

      {/* Number of pages */}
      <div className="bg-bg-surface border border-border-subtle rounded-xl p-6">
        <label className="text-body-strong text-text-primary block mb-1">
          Número de páginas
        </label>
        <p className="text-body text-text-secondary mb-4">
          Quantos slides o carrossel vai ter? Mínimo 3, máximo 12.
        </p>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={3}
            max={12}
            value={config.totalPages}
            onChange={(e) => setConfig((prev) => ({ ...prev, totalPages: Number(e.target.value) }))}
            className="flex-1 accent-accent"
          />
          <span className="text-display text-accent w-8 text-center">{config.totalPages}</span>
        </div>
      </div>

      {/* Focus prompt */}
      <div className="bg-bg-surface border border-border-subtle rounded-xl p-6">
        <label className="text-body-strong text-text-primary block mb-1">
          Instrução de foco <span className="text-text-tertiary font-normal">(opcional)</span>
        </label>
        <p className="text-body text-text-secondary mb-4">
          Diga à IA qual ângulo ou público abordar. Deixe vazio para um carrossel genérico da matéria.
        </p>
        <textarea
          value={config.focusPrompt}
          onChange={(e) => setConfig((prev) => ({ ...prev, focusPrompt: e.target.value }))}
          placeholder="Ex: foque nos impactos econômicos para o brasileiro comum…"
          rows={3}
          className="w-full px-4 py-3 bg-bg-base border border-border-subtle rounded-lg text-body text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent transition-colors resize-none"
        />
      </div>

      {/* Per-page toggles */}
      <div className="bg-bg-surface border border-border-subtle rounded-xl p-6">
        <div className="text-body-strong text-text-primary mb-1">Configurar páginas individualmente</div>
        <p className="text-body text-text-secondary mb-5">
          Cada página pode ser um <strong>slide de carrossel</strong> (layout visual com título e bullets) ou um <strong>slide de texto</strong> (corrido, simples — ideal para capa ou encerramento).
        </p>

        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: config.totalPages }).map((_, i) => {
            const isCarousel = config.pageToggles[i] ?? true;
            return (
              <button
                key={i}
                onClick={() => togglePage(i)}
                className={`flex items-center justify-between px-4 py-3 rounded-lg border-2 transition-all text-left ${
                  isCarousel
                    ? 'border-accent bg-accent/5 text-accent'
                    : 'border-border-subtle bg-bg-base text-text-secondary hover:border-border-strong'
                }`}
              >
                <div>
                  <div className="text-body-strong">Página {i + 1}</div>
                  <div className={`text-caption ${isCarousel ? 'text-accent/70' : 'text-text-tertiary'}`}>
                    {isCarousel ? 'Carrossel (visual)' : 'Texto simples'}
                  </div>
                </div>
                {isCarousel
                  ? <CheckCircle2 size={18} className="shrink-0" />
                  : <Circle size={18} className="shrink-0" />
                }
              </button>
            );
          })}
        </div>
      </div>

      {/* Generate button */}
      <button
        onClick={onGenerate}
        className="w-full h-14 bg-accent hover:bg-accent-hover text-text-inverse font-medium rounded-xl flex items-center justify-center gap-2 text-body-strong transition-colors"
      >
        Gerar Carrossel <ArrowRight size={18} />
      </button>
    </div>
  );
}
```

- [ ] **Step 6: Write the Step 3 component — generating screen**

```typescript
// ── Step 3: Generating ─────────────────────────────────────────────────────
const GEN_STEPS = [
  'Buscando conteúdo completo da matéria…',
  'Analisando com IA…',
  'Montando slides…',
  'Finalizando carrossel…',
];

function Step3({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-8">
      <div className="relative">
        <div className="w-20 h-20 rounded-full border-4 border-accent/20 border-t-accent animate-spin" />
        <Rss size={24} className="absolute inset-0 m-auto text-accent" />
      </div>
      <div className="text-center space-y-2">
        <div className="text-micro text-text-secondary">03 · GERANDO</div>
        <AnimatePresence mode="wait">
          <motion.p
            key={currentStep}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="text-body-strong text-text-primary"
          >
            {GEN_STEPS[Math.min(currentStep, GEN_STEPS.length - 1)]}
          </motion.p>
        </AnimatePresence>
      </div>
      <div className="flex gap-2">
        {GEN_STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i <= currentStep ? 'bg-accent w-6' : 'bg-border-subtle w-3'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Write the main page component and generation logic**

```typescript
// ── Main Page ──────────────────────────────────────────────────────────────
export default function NewsProPage() {
  const router = useRouter();
  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const [selectedArticle, setSelectedArticle] = React.useState<Article | null>(null);
  const [config, setConfig] = React.useState<CarouselConfig>({
    totalPages: 8,
    focusPrompt: '',
    pageToggles: Array(8).fill(true),
  });
  const [genStep, setGenStep] = React.useState(0);
  const [toast, setToast] = React.useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  async function handleGenerate() {
    if (!selectedArticle) return;
    setStep(3);
    setGenStep(0);

    try {
      // Step 0: fetch full article content
      const { content, partial } = await fetchArticleContent(selectedArticle.id);
      if (partial) showToast('Conteúdo parcial — matéria pode estar incompleta.');
      setGenStep(1);

      // Build imageSlides array: indices where pageToggles[i] === true
      const imageSlides = config.pageToggles
        .map((isCarousel, i) => (isCarousel ? i : -1))
        .filter((i) => i !== -1);

      // Build theme: article title + optional focus prompt
      const theme = config.focusPrompt.trim()
        ? `${selectedArticle.title}\n\nFoco adicional: ${config.focusPrompt.trim()}`
        : selectedArticle.title;

      setGenStep(2);

      // Call existing carousel generate endpoint
      const res = await fetch('/api/carousel/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme,
          slideCount: config.totalPages,
          tone: 'direct',
          detail: 'medium',
          viral: true,
          imageSlides,
          accentColor: '#FFD700',
          pasteContent: content,
        }),
      });

      setGenStep(3);

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao gerar carrossel.');
      }

      const data = await res.json();
      const carouselId = data.carousel._id;

      // Redirect to editor
      router.push(`/dashboard/editor/${carouselId}`);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Erro ao gerar carrossel. Tente novamente.');
      setStep(2);
    }
  }

  function handleSelectArticle(article: Article) {
    setSelectedArticle(article);
    setStep(2);
  }

  return (
    <div className="bg-bg-base min-h-screen">
      <div className="max-w-[1040px] mx-auto px-8 py-10">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <Step1 onSelect={handleSelectArticle} />
            </motion.div>
          )}

          {step === 2 && selectedArticle && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
            >
              <Step2
                article={selectedArticle}
                config={config}
                setConfig={setConfig}
                onBack={() => setStep(1)}
                onGenerate={handleGenerate}
              />
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
            >
              <Step3 currentStep={genStep} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {toast && <Toast msg={toast} />}
    </div>
  );
}
```

- [ ] **Step 8: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: zero errors. If there are errors about `line-clamp-*`, add `@tailwindcss/line-clamp` plugin or use `overflow-hidden` with fixed height as fallback.

- [ ] **Step 9: Commit**

```bash
git add src/app/dashboard/news-pro/
git commit -m "feat(news-pro): add 3-step wizard page with article list, config, and generation"
```

---

## Task 6: Manual end-to-end test

**Files:** No code changes — testing only.

> **Context:** No automated tests exist in this project. This task is a structured manual walkthrough to catch integration issues before shipping.

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

Confirm both `[next]` and `[api]` logs appear. Confirm `http://localhost:3001/api/health` returns `{ success: true }`.

- [ ] **Step 2: Test the news list (Step 1)**

Navigate to `http://localhost:3000/dashboard/news-pro`.

Checklist:
- [ ] Article grid renders (≥1 card visible)
- [ ] Each card shows thumbnail, source badge, category chip, date, title
- [ ] Search input debounces — type a word, wait 400ms, grid updates
- [ ] Source dropdown filters articles to that source only
- [ ] Category dropdown filters articles to that category only
- [ ] Pagination shows "Página X de Y" and buttons work
- [ ] Prev button disabled on page 1, Next button disabled on last page
- [ ] Clicking a card advances to Step 2 with that article pre-filled

- [ ] **Step 3: Test the configuration form (Step 2)**

Checklist:
- [ ] Selected article title/thumbnail shown in summary card at top
- [ ] Back arrow returns to Step 1 (article list preserved)
- [ ] Page slider moves from 3 to 12, number updates in real time
- [ ] When slider changes, the page toggles grid below updates (adds or removes rows)
- [ ] Each page toggle button switches between "Carrossel (visual)" and "Texto simples"
- [ ] Focus prompt textarea accepts text, no crashes
- [ ] "Gerar Carrossel" button is visible and clickable

- [ ] **Step 4: Test the generation flow (Step 3)**

With a valid Gemini API key configured in Settings:

Checklist:
- [ ] Clicking "Gerar Carrossel" transitions to loading screen (animated spinner + progress steps)
- [ ] Steps cycle through 4 messages: "Buscando conteúdo…" → "Analisando com IA…" → "Montando slides…" → "Finalizando…"
- [ ] After generation, browser redirects to `/dashboard/editor/[id]`
- [ ] Editor loads the carousel with correct slide count matching config

- [ ] **Step 5: Test error states**

Stop the Express API (`Ctrl+C` on the API process, leave Next.js running):
- [ ] Step 1 shows the offline error banner with instructions to run `npm run dev`
- [ ] No white screen / uncaught errors in browser console

For a paywalled article (e.g. Folha):
- [ ] Generation completes (uses `description` as fallback)
- [ ] Toast warning "Conteúdo parcial — matéria pode estar incompleta" appears briefly

- [ ] **Step 6: Test sidebar**

Checklist:
- [ ] "Notícia PRO" appears below "Modo Notícia" in the collapsed sidebar
- [ ] Hovering expands — both icon and label visible
- [ ] Active state highlights when on `/dashboard/news-pro`
- [ ] Keyboard shortcut `g p` navigates to the page

---

## Task 7: Final visual QA with `frontend-design` skill

**Files:** Minor CSS/Tailwind tweaks only.

> **Context:** After the functional tests pass, do a visual pass. The page should feel premium and editorial — not generic.

- [ ] **Step 1: Invoke `frontend-design` skill for QA checklist**

Invoke the `frontend-design` skill and use its visual quality checklist to review the rendered page.

- [ ] **Step 2: Apply visual fixes**

Common issues to look for and fix:
- Card hover states should feel smooth (check `transition-all duration-200`)
- Typography hierarchy: eyebrow (`text-micro`) → heading (`text-display`) → body (`text-body`) must be clearly distinct
- Active toggle buttons must have visible accent color (`border-accent bg-accent/5`)
- Loading skeleton cards must match the real card proportions exactly
- Step transitions must be directional (Step 1→2: slide right; Step 2→1: slide left)
- Pagination controls should be right-aligned or space-between, not centered

- [ ] **Step 3: Final commit**

```bash
git add -p  # stage only visual fix hunks
git commit -m "fix(news-pro): visual QA — spacing, transitions, typography hierarchy"
```

---

## Summary of All New Files

| Path | Purpose |
|------|---------|
| `api/src/routes/content.ts` | Express route — Cheerio scraper for full article body |
| `src/app/api/news-content/[id]/route.ts` | Next.js proxy to Express content endpoint |
| `src/app/dashboard/news-pro/page.tsx` | Full 3-step wizard (list → config → generate) |

## Summary of Modified Files

| Path | Change |
|------|--------|
| `package.json` | `dev` script uses `concurrently`; add `tsx`, `concurrently` devDeps |
| `api/src/server.ts` | Register `contentRouter` |
| `src/components/Sidebar.tsx` | Add "Notícia PRO" nav item with `Rss` icon |
