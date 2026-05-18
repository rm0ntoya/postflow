"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ChevronRight,
  ChevronLeft,
  Filter,
  Newspaper,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Clock,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Toast from "@/components/Toast";
import { useRouter } from "next/navigation";

// ───────────────────────────────────────────────────────────────────────
// TYPES
// ───────────────────────────────────────────────────────────────────────

interface Article {
  id: string;
  title: string;
  description?: string;
  content?: string;
  url: string;
  image_url?: string;
  source: string;
  source_logo?: string;
  category?: string;
  published_at?: string;
  scraped_at: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

interface CarouselConfig {
  pages: number;
  focusPrompt: string;
  imageSlides: number[];
}

// ───────────────────────────────────────────────────────────────────────
// FETCH HELPERS
// ───────────────────────────────────────────────────────────────────────

const NEWS_API_BASE = process.env.NEXT_PUBLIC_NEWS_API_URL || "http://localhost:3001";

async function fetchArticles(
  page: number,
  source: string,
  category: string,
  q: string
): Promise<{ articles: Article[]; pagination: Pagination }> {
  const params = new URLSearchParams({
    page: String(page),
    limit: "12",
    ...(source && { source }),
    ...(category && { category }),
    ...(q && { q }),
  });
  const res = await fetch(`${NEWS_API_BASE}/api/news?${params}`);
  if (!res.ok) throw new Error("Falha ao buscar notícias");
  const data = await res.json();
  return data.data;
}

async function fetchSources(): Promise<{ source: string; count: number }[]> {
  const res = await fetch(`${NEWS_API_BASE}/api/news/sources`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.data || [];
}

async function fetchCategories(): Promise<{ category: string; count: number }[]> {
  const res = await fetch(`${NEWS_API_BASE}/api/news/categories`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.data || [];
}

async function fetchArticleContent(id: string): Promise<{ content: string; images: string[]; partial: boolean }> {
  const res = await fetch(`/api/news-content/${id}`);
  if (!res.ok) throw new Error("Falha ao buscar conteúdo");
  const data = await res.json();
  if (!data.success) throw new Error(data.error?.message || "Erro ao buscar conteúdo");
  return {
    content: data.data.content || "",
    images: Array.isArray(data.data.images) ? data.data.images : [],
    partial: !!data.data.partial,
  };
}

// ───────────────────────────────────────────────────────────────────────
// STEP 1: ARTICLE LIST
// ───────────────────────────────────────────────────────────────────────

function ArticleCard({
  article,
  selected,
  onSelect,
}: {
  article: Article;
  selected: boolean;
  onSelect: () => void;
}) {
  const relativeTime = React.useMemo(() => {
    const date = article.published_at
      ? new Date(article.published_at)
      : new Date(article.scraped_at);
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}min atrás`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h atrás`;
    return `${Math.floor(hrs / 24)}d atrás`;
  }, [article.published_at, article.scraped_at]);

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      onClick={onSelect}
      className={`w-full text-left rounded-xl border overflow-hidden transition-all duration-200 group ${
        selected
          ? "border-accent bg-accent/5 shadow-lg shadow-accent/10"
          : "border-border-subtle bg-bg-surface hover:border-border hover:bg-bg-surface-2"
      }`}
    >
      <div className="flex gap-0">
        {/* Image */}
        <div className="w-28 h-24 flex-shrink-0 bg-bg-surface-2 overflow-hidden">
          {article.image_url ? (
            <img
              src={article.image_url}
              alt=""
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-text-tertiary">
              <Newspaper size={24} />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-4 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-micro text-accent font-medium">{article.source}</span>
            {article.category && (
              <>
                <span className="text-border-subtle">·</span>
                <span className="text-micro text-text-tertiary">{article.category}</span>
              </>
            )}
            <span className="text-border-subtle ml-auto">·</span>
            <span className="text-micro text-text-tertiary flex items-center gap-1">
              <Clock size={10} />
              {relativeTime}
            </span>
          </div>
          <h3 className="text-body-strong text-text-primary leading-snug overflow-hidden"
              style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {article.title}
          </h3>
          {article.description && (
            <p className="text-caption text-text-secondary mt-1 overflow-hidden"
               style={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {article.description}
            </p>
          )}
        </div>

        {/* Selection indicator */}
        <div className="flex items-center px-3">
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
            selected ? "border-accent bg-accent" : "border-border"
          }`}>
            {selected && <CheckCircle2 size={12} className="text-white" />}
          </div>
        </div>
      </div>
    </motion.button>
  );
}

function Step1({
  onArticleSelect,
}: {
  onArticleSelect: (article: Article) => void;
}) {
  const [articles, setArticles] = React.useState<Article[]>([]);
  const [pagination, setPagination] = React.useState<Pagination | null>(null);
  const [sources, setSources] = React.useState<{ source: string; count: number }[]>([]);
  const [categories, setCategories] = React.useState<{ category: string; count: number }[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = React.useState<Article | null>(null);

  // Filters
  const [page, setPage] = React.useState(1);
  const [source, setSource] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [searchInput, setSearchInput] = React.useState("");
  const [q, setQ] = React.useState("");

  // Debounce search
  React.useEffect(() => {
    const t = setTimeout(() => setQ(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Load filters
  React.useEffect(() => {
    fetchSources().then(setSources).catch(() => {});
    fetchCategories().then(setCategories).catch(() => {});
  }, []);

  // Load articles
  React.useEffect(() => {
    setLoading(true);
    setError(null);
    fetchArticles(page, source, category, q)
      .then(({ articles: a, pagination: p }) => {
        setArticles(a);
        setPagination(p);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [page, source, category, q]);

  // Reset page on filter change
  React.useEffect(() => {
    setPage(1);
  }, [source, category, q]);

  const handleSelect = (article: Article) => {
    setSelectedArticle(article);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="text-micro text-text-secondary mb-2">01 · SELECIONE A MATÉRIA</div>
        <h2 className="text-display text-text-primary mb-1">
          Notícias em destaque
        </h2>
        <p className="text-body text-text-secondary">
          Escolha uma matéria para transformar em carrossel.
        </p>
      </div>

      {/* Filters row */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar notícias..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-bg-surface border border-border-subtle rounded-lg text-body text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent transition-colors"
          />
        </div>

        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="px-3 py-2.5 bg-bg-surface border border-border-subtle rounded-lg text-body text-text-primary focus:outline-none focus:border-accent transition-colors"
        >
          <option value="">Todos os portais</option>
          {sources.map((s) => (
            <option key={s.source} value={s.source}>
              {s.source} ({s.count})
            </option>
          ))}
        </select>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2.5 bg-bg-surface border border-border-subtle rounded-lg text-body text-text-primary focus:outline-none focus:border-accent transition-colors"
        >
          <option value="">Todas as categorias</option>
          {categories.map((c) => (
            <option key={c.category} value={c.category}>
              {c.category} ({c.count})
            </option>
          ))}
        </select>
      </div>

      {/* Article list */}
      {error ? (
        <div className="flex gap-3 items-center p-4 bg-state-danger/10 rounded-xl border border-state-danger/20">
          <AlertCircle size={18} className="text-state-danger flex-shrink-0" />
          <div>
            <p className="text-body-strong text-state-danger">API de notícias indisponível</p>
            <p className="text-caption text-text-secondary mt-0.5">{error}</p>
          </div>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-bg-surface border border-border-subtle animate-pulse" />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Newspaper size={40} className="text-text-tertiary mb-3" />
          <p className="text-body-strong text-text-secondary">Nenhuma notícia encontrada</p>
          <p className="text-caption text-text-tertiary mt-1">Tente ajustar os filtros.</p>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="grid grid-cols-1 gap-3">
            {articles.map((a) => (
              <ArticleCard
                key={a.id}
                article={a}
                selected={selectedArticle?.id === a.id}
                onSelect={() => handleSelect(a)}
              />
            ))}
          </div>
        </AnimatePresence>
      )}

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-caption text-text-tertiary">
            {pagination.total} notícias · página {pagination.page} de {pagination.total_pages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-border-subtle bg-bg-surface text-text-secondary hover:text-text-primary hover:border-border disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.total_pages, p + 1))}
              disabled={page === pagination.total_pages}
              className="p-2 rounded-lg border border-border-subtle bg-bg-surface text-text-secondary hover:text-text-primary hover:border-border disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="flex justify-end pt-2">
        <Button
          variant="primary"
          size="lg"
          disabled={!selectedArticle}
          onClick={() => selectedArticle && onArticleSelect(selectedArticle)}
        >
          Continuar com esta matéria
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────
// STEP 2: CAROUSEL CONFIG
// ───────────────────────────────────────────────────────────────────────

const PAGE_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

function Step2({
  article,
  config,
  setConfig,
  onBack,
  onGenerate,
  generating,
  articleImages,
  selectedImages,
  onToggleImage,
  loadingImages,
}: {
  article: Article;
  config: CarouselConfig;
  setConfig: React.Dispatch<React.SetStateAction<CarouselConfig>>;
  onBack: () => void;
  onGenerate: () => void;
  generating: boolean;
  articleImages: string[];
  selectedImages: string[];
  onToggleImage: (url: string) => void;
  loadingImages: boolean;
}) {
  const toggleImageSlide = (n: number) => {
    setConfig((prev) => {
      const set = new Set(prev.imageSlides);
      if (set.has(n)) set.delete(n);
      else set.add(n);
      return { ...prev, imageSlides: Array.from(set) };
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="text-micro text-text-secondary mb-2">02 · CONFIGURE O CARROSSEL</div>
        <h2 className="text-display text-text-primary mb-1">Personalizar</h2>
        <p className="text-body text-text-secondary">
          Ajuste quantos slides, o foco e quais páginas terão imagem.
        </p>
      </div>

      {/* Selected article preview */}
      <div className="flex gap-4 p-4 bg-bg-surface border border-accent/30 rounded-xl">
        {article.image_url && (
          <img
            src={article.image_url}
            alt=""
            className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        )}
        <div className="min-w-0">
          <div className="text-micro text-accent mb-1">{article.source}</div>
          <p className="text-body-strong text-text-primary overflow-hidden"
             style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {article.title}
          </p>
        </div>
      </div>

      {/* Number of pages */}
      <div className="space-y-3">
        <label className="text-body-strong text-text-primary">
          Número de páginas: <span className="text-accent">{config.pages}</span>
        </label>
        <input
          type="range"
          min={3}
          max={12}
          value={config.pages}
          onChange={(e) => setConfig((prev) => ({ ...prev, pages: Number(e.target.value) }))}
          className="w-full accent-accent"
        />
        <div className="flex justify-between text-caption text-text-tertiary">
          <span>3</span>
          <span>12</span>
        </div>
      </div>

      {/* Focus prompt */}
      <div className="space-y-2">
        <label className="text-body-strong text-text-primary">
          Foco da narrativa{" "}
          <span className="text-text-tertiary font-normal">(opcional)</span>
        </label>
        <textarea
          value={config.focusPrompt}
          onChange={(e) => setConfig((prev) => ({ ...prev, focusPrompt: e.target.value }))}
          placeholder="Ex: Destaque o impacto econômico, foque nas reações das pessoas, enfatize o aspecto político…"
          rows={3}
          className="w-full px-4 py-3 bg-bg-surface border border-border-subtle rounded-xl text-body text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent resize-none transition-colors"
        />
        <p className="text-caption text-text-tertiary">
          Direcione a IA para enfatizar um ângulo específico da matéria.
        </p>
      </div>

      {/* Article images picker */}
      <div className="space-y-3">
        <label className="text-body-strong text-text-primary">
          Imagens da matéria{" "}
          <span className="text-text-tertiary font-normal">
            ({selectedImages.length} de {articleImages.length} selecionadas)
          </span>
        </label>
        {loadingImages ? (
          <div className="flex gap-2">
            {[1,2,3].map(i => (
              <div key={i} className="w-24 h-24 rounded-lg bg-bg-surface animate-pulse" />
            ))}
          </div>
        ) : articleImages.length === 0 ? (
          <p className="text-caption text-text-tertiary">Nenhuma imagem encontrada na matéria.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {articleImages.map((url, idx) => {
              const selected = selectedImages.includes(url);
              return (
                <button
                  key={idx}
                  onClick={() => onToggleImage(url)}
                  className={`relative w-24 h-24 rounded-lg overflow-hidden border-2 transition-all ${
                    selected
                      ? "border-accent shadow-md shadow-accent/20"
                      : "border-border-subtle opacity-50 hover:opacity-80"
                  }`}
                  title={selected ? "Desselecionar" : "Selecionar"}
                >
                  <img src={url} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = "none"; }} />
                  {selected && (
                    <div className="absolute inset-0 bg-accent/20 flex items-center justify-center">
                      <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                        <span className="text-[10px] text-white font-bold">✓</span>
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
        <p className="text-caption text-text-tertiary">
          Imagens selecionadas serão usadas nos slides. IA gera imagens apenas para slides sem foto da matéria.
        </p>
      </div>

      {/* Image slides grid */}
      <div className="space-y-3">
        <label className="text-body-strong text-text-primary">
          Páginas com imagem{" "}
          <span className="text-text-tertiary font-normal">
            ({config.imageSlides.length} selecionadas)
          </span>
        </label>
        <div className="grid grid-cols-6 gap-2">
          {PAGE_OPTIONS.slice(0, config.pages).map((n) => (
            <button
              key={n}
              onClick={() => toggleImageSlide(n)}
              className={`py-3 rounded-lg border-2 text-body-strong transition-all ${
                config.imageSlides.includes(n)
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border-subtle bg-bg-surface text-text-secondary hover:border-border hover:text-text-primary"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <p className="text-caption text-text-tertiary">
          Selecione as páginas que deverão ter imagem de fundo.
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button variant="ghost" onClick={onBack}>
          <ChevronLeft size={16} />
          Voltar
        </Button>
        <Button
          variant="primary"
          size="lg"
          onClick={onGenerate}
          disabled={generating}
          loading={generating}
          className="flex-1"
        >
          <Sparkles size={16} />
          Gerar carrossel
        </Button>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────
// STEP 3: LOADING / GENERATION
// ───────────────────────────────────────────────────────────────────────

const PROGRESS_STEPS = [
  { label: "Lendo conteúdo completo" },
  { label: "Estruturando narrativa" },
  { label: "Criando slides" },
  { label: "Finalizando carrossel" },
];

function Step3({ article }: { article: Article }) {
  const [activeStep, setActiveStep] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((s) => Math.min(s + 1, PROGRESS_STEPS.length - 1));
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-10">
      {/* Spinner */}
      <div className="relative">
        <div className="w-20 h-20 rounded-full border-4 border-border-subtle" />
        <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-transparent border-t-accent animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles size={24} className="text-accent" />
        </div>
      </div>

      {/* Article title */}
      <div className="text-center max-w-md">
        <p className="text-micro text-text-tertiary mb-2">Gerando carrossel para</p>
        <p className="text-body-strong text-text-primary overflow-hidden"
           style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {article.title}
        </p>
      </div>

      {/* Progress steps */}
      <div className="space-y-3 w-full max-w-sm">
        {PROGRESS_STEPS.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: i <= activeStep ? 1 : 0.3, x: 0 }}
            transition={{ delay: i * 0.15, duration: 0.3 }}
            className="flex items-center gap-3"
          >
            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500 ${
              i < activeStep
                ? "bg-accent text-white"
                : i === activeStep
                ? "border-2 border-accent bg-accent/10"
                : "border-2 border-border-subtle"
            }`}>
              {i < activeStep && <CheckCircle2 size={12} />}
              {i === activeStep && (
                <Loader2 size={10} className="animate-spin text-accent" />
              )}
            </div>
            <span className={`text-body transition-colors duration-300 ${
              i === activeStep
                ? "text-text-primary"
                : i < activeStep
                ? "text-text-secondary"
                : "text-text-tertiary"
            }`}>
              {step.label}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ───────────────────────────────────────────────────────────────────────

export default function NewsProPage() {
  const router = useRouter();
  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const [selectedArticle, setSelectedArticle] = React.useState<Article | null>(null);
  const [toast, setToast] = React.useState("");
  const [generating, setGenerating] = React.useState(false);

  const [config, setConfig] = React.useState<CarouselConfig>({
    pages: 8,
    focusPrompt: "",
    imageSlides: [1, 2, 4, 6, 8],
  });

  // Article images scraped from the news page
  const [articleImages, setArticleImages] = React.useState<string[]>([]);
  const [selectedImages, setSelectedImages] = React.useState<string[]>([]);
  const [articleContent, setArticleContent] = React.useState("");
  const [loadingImages, setLoadingImages] = React.useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const handleArticleSelect = (article: Article) => {
    setSelectedArticle(article);
    setArticleImages([]);
    setSelectedImages([]);
    setArticleContent("");
    setLoadingImages(true);
    setStep(2);
    // Fetch full content + images in background while user sees Step 2
    fetchArticleContent(article.id)
      .then(({ content, images, partial }) => {
        setArticleContent(content);
        setArticleImages(images);
        setSelectedImages(images); // select all by default
        if (partial) showToast("Conteúdo parcial — matéria pode estar incompleta.");
      })
      .catch(() => {
        // Fallback: use article thumbnail if available
        if (article.image_url) {
          setArticleImages([article.image_url]);
          setSelectedImages([article.image_url]);
        }
      })
      .finally(() => setLoadingImages(false));
  };

  const toggleImage = (url: string) => {
    setSelectedImages(prev =>
      prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url]
    );
  };

  const handleGenerate = React.useCallback(async () => {
    if (!selectedArticle) return;
    setGenerating(true);
    setStep(3);

    try {
      // Use pre-fetched content (already loaded in background at article selection)
      const pasteContent = articleContent || selectedArticle.description || "";

      const themeStr = config.focusPrompt.trim()
        ? `${selectedArticle.title}\n\nFoco adicional: ${config.focusPrompt.trim()}`
        : selectedArticle.title;

      const body = {
        theme: themeStr,
        slideCount: config.pages,
        tone: "direct",
        detail: "medium",
        viral: true,
        imageSlides: config.imageSlides,
        accentColor: "#FFD700",
        pasteContent: pasteContent || undefined,
      };

      const res = await fetch("/api/carousel/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Falha ao gerar carrossel");
      }

      const data = await res.json();
      const carousel = data?.carousel;
      const carouselId = carousel?._id;
      if (!carouselId) throw new Error("ID do carrossel não retornado pela API.");

      // Patch image slides with selected article images (skips AI generation for those)
      if (selectedImages.length > 0 && Array.isArray(carousel.slides)) {
        const imageSlideIndices: number[] = Array.isArray(carousel.imageSlides)
          ? carousel.imageSlides
          : config.imageSlides.map((n: number) => n - 1); // convert 1-based to 0-based

        const updatedSlides = carousel.slides.map((slide: Record<string, unknown>, idx: number) => {
          const imagePos = imageSlideIndices.indexOf(idx);
          if (imagePos !== -1 && imagePos < selectedImages.length) {
            // Assign pre-selected article image — editor won't trigger AI gen for this slide
            return { ...slide, bgImageUrl: selectedImages[imagePos] };
          }
          return slide;
        });

        await fetch(`/api/carousel/${carouselId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slides: updatedSlides }),
        });
      }

      router.push(`/dashboard/editor/${carouselId}`);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Erro ao gerar carrossel.");
      setStep(2);
    } finally {
      setGenerating(false);
    }
  }, [selectedArticle, config, articleContent, selectedImages, router]);

  return (
    <div className="bg-bg-base min-h-screen">
      <div className="max-w-[820px] mx-auto px-8 py-10">
        {/* Page header */}
        <div className="mb-8 pb-8 border-b border-border-subtle">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <Globe size={16} className="text-accent" />
            </div>
            <div className="text-micro text-text-secondary">NOTÍCIA PRO</div>
          </div>
          <h1 className="text-display text-text-primary">
            Notícias em{" "}
            <span className="text-accent border-b-2 border-accent">carrossel</span>
          </h1>
          <p className="text-body text-text-secondary mt-2">
            Escolha qualquer matéria do feed e gere um carrossel em segundos.
          </p>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mt-6">
            {[1, 2, 3].map((s) => (
              <React.Fragment key={s}>
                <div className={`flex items-center gap-2 ${step >= s ? "text-text-primary" : "text-text-tertiary"}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                    step > s
                      ? "bg-accent text-white"
                      : step === s
                      ? "border-2 border-accent text-accent"
                      : "border-2 border-border text-text-tertiary"
                  }`}>
                    {step > s ? <CheckCircle2 size={12} /> : s}
                  </div>
                  <span className="text-caption hidden sm:block">
                    {s === 1 ? "Matéria" : s === 2 ? "Configurar" : "Gerar"}
                  </span>
                </div>
                {s < 3 && (
                  <div className={`flex-1 h-px max-w-[60px] transition-all ${step > s ? "bg-accent" : "bg-border-subtle"}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <Step1 onArticleSelect={handleArticleSelect} />
            </motion.div>
          )}

          {step === 2 && selectedArticle && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <Step2
                article={selectedArticle}
                config={config}
                setConfig={setConfig}
                onBack={() => setStep(1)}
                onGenerate={handleGenerate}
                generating={generating}
                articleImages={articleImages}
                selectedImages={selectedImages}
                onToggleImage={toggleImage}
                loadingImages={loadingImages}
              />
            </motion.div>
          )}

          {step === 3 && selectedArticle && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <Step3 article={selectedArticle} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {toast && <Toast msg={toast} />}
    </div>
  );
}
