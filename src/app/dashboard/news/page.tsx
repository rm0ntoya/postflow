"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, ChevronRight, Globe, Newspaper, MessageCircle, Zap } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Chip } from "@/components/ui/Chip";
import { Card } from "@/components/ui/Card";
import Toast from "@/components/Toast";

// ───────────────────────────────────────────────────────────────────────
// TYPES
// ───────────────────────────────────────────────────────────────────────

interface ScrapedArticle {
  title: string;
  description: string;
  content: string;
  images: string[];
  source: string;
}

type Tone = "notícia" | "fofoca" | "viral";

// ───────────────────────────────────────────────────────────────────────
// UTILS
// ───────────────────────────────────────────────────────────────────────

function humanizeError(error: string): string {
  if (error.includes("URL inválida")) return "URL inválida — confirme o link.";
  if (error.includes("Site retornou")) return "Não conseguimos ler essa matéria. Tente outro link.";
  if (error.includes("bloqueia")) return "Esse site bloqueia leitura automática.";
  return error || "Erro desconhecido.";
}

// ───────────────────────────────────────────────────────────────────────
// HERO EDITORIAL
// ───────────────────────────────────────────────────────────────────────

function HeroEditorial() {
  return (
    <div className="px-8 py-10 grid grid-cols-[1fr_1fr] gap-12">
      {/* Left column: title + tagline */}
      <div className="flex flex-col gap-4">
        <div className="text-micro text-text-secondary">MODO NOTÍCIA</div>
        <h1 className="text-display text-text-primary">
          Transforme <span className="text-accent border-b-2 border-accent">qualquer matéria</span> em carrossel viral.
        </h1>
        <p className="text-body text-text-secondary">
          Cole o link, escolha o tom. Em 30 segundos você tem 8 slides prontos pra postar.
        </p>
      </div>

      {/* Right column: illustrative block */}
      <div className="flex items-center justify-center">
        <div className="text-[12px] text-text-tertiary font-mono space-y-2 text-center">
          <div>[ ARTIGO ORIGINAL ]</div>
          <div className="text-text-secondary">Lula sanciona lei que…</div>
          <div className="my-2 flex justify-center gap-2 text-accent">
            <span>↓</span>
            <span>↓</span>
            <span>↓</span>
          </div>
          <div>[ CARROSSEL NOVACRAFT ]</div>
          <div className="text-text-primary font-semibold">GENTE!! Saiu agora a</div>
          <div className="text-text-primary font-semibold">nova lei que muda TUDO</div>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────
// STAGE CONTAINER
// ───────────────────────────────────────────────────────────────────────

function Stage({
  number,
  eyebrow,
  borderAccent = false,
  children,
}: {
  number: number;
  eyebrow: string;
  borderAccent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className={`bg-bg-surface border rounded-xl p-8 ${
        borderAccent ? "border-t-2 border-accent" : "border-border-subtle"
      }`}
    >
      <div className="text-micro text-text-secondary mb-6">
        {`0${number}`} · {eyebrow}
      </div>
      {children}
    </motion.div>
  );
}

// ───────────────────────────────────────────────────────────────────────
// STAGE 1: URL INPUT
// ───────────────────────────────────────────────────────────────────────

function Stage1({
  url,
  setUrl,
  loading,
  error,
  onAnalyze,
}: {
  url: string;
  setUrl: (url: string) => void;
  loading: boolean;
  error: string | null;
  onAnalyze: () => void;
}) {
  return (
    <Stage number={1} eyebrow="LINK DA MATÉRIA">
      <div className="space-y-6">
        {error && (
          <div className="flex gap-3 items-start p-3 bg-state-danger/10 rounded-md border border-state-danger/20">
            <AlertCircle size={16} className="text-state-danger mt-0.5 flex-shrink-0" />
            <p className="text-body text-state-danger">{humanizeError(error)}</p>
          </div>
        )}

        <div className="space-y-3">
          <Input
            label="URL da matéria"
            placeholder="https://g1.globo.com/…"
            inputSize="lg"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={loading}
          />
          <p className="text-caption text-text-tertiary">
            Funciona em sites de notícia como G1, UOL, Folha, BBC, CNN.
          </p>
        </div>

        <div className="flex justify-end">
          <Button
            variant="primary"
            size="lg"
            onClick={onAnalyze}
            disabled={!url || loading}
            loading={loading}
          >
            Analisar matéria
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    </Stage>
  );
}

// ───────────────────────────────────────────────────────────────────────
// STAGE 2: PREVIEW
// ───────────────────────────────────────────────────────────────────────

function Stage2({
  article,
  selectedImages,
  onToggleImage,
  onReanalyze,
  onContinue,
}: {
  article: ScrapedArticle;
  selectedImages: Set<string>;
  onToggleImage: (img: string) => void;
  onReanalyze: () => void;
  onContinue: () => void;
}) {
  const [useAll, setUseAll] = React.useState(true);

  return (
    <Stage number={2} eyebrow="MATÉRIA ENCONTRADA" borderAccent>
      <div className="space-y-6">
        {/* Source chip */}
        <div className="flex items-center gap-2">
          <Chip>
            <Globe size={14} />
            {article.source}
          </Chip>
          <span className="text-caption text-text-tertiary">publicado há pouco</span>
        </div>

        {/* Title */}
        <h2 className="text-h1 text-text-primary line-clamp-3">{article.title}</h2>

        {/* Description / Lead */}
        <p className="text-body text-text-secondary line-clamp-2">{article.description}</p>

        {/* Divider */}
        <div className="h-px bg-border-subtle" />

        {/* Image gallery */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-body-strong text-text-primary">Imagens encontradas</h3>
            <div className="flex gap-2">
              <button
                className={`px-3 py-1 text-caption rounded-pill border transition-colors ${
                  useAll
                    ? "bg-accent-muted border-accent text-accent"
                    : "bg-bg-surface-2 border-border text-text-secondary hover:text-text-primary"
                }`}
                onClick={() => {
                  setUseAll(true);
                  article.images.forEach((img) => {
                    const set = new Set(selectedImages);
                    set.add(img);
                    onToggleImage(img);
                  });
                }}
              >
                usar todas
              </button>
              <button
                className={`px-3 py-1 text-caption rounded-pill border transition-colors ${
                  !useAll
                    ? "bg-accent-muted border-accent text-accent"
                    : "bg-bg-surface-2 border-border text-text-secondary hover:text-text-primary"
                }`}
                onClick={() => setUseAll(false)}
              >
                escolher
              </button>
            </div>
          </div>

          {/* Images grid */}
          <div className="grid grid-cols-6 gap-3">
            {article.images.map((img, i) => (
              <button
                key={i}
                onClick={() => !useAll && onToggleImage(img)}
                className={`relative h-24 rounded-md overflow-hidden border-2 transition-all ${
                  selectedImages.has(img) || useAll
                    ? "border-accent"
                    : "border-border-subtle hover:border-border"
                }`}
              >
                <img
                  src={img}
                  alt={`slide-${i}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'%3E%3Crect fill='%23222' width='96' height='96'/%3E%3C/svg%3E";
                  }}
                />
              </button>
            ))}
          </div>
          <p className="text-caption text-text-tertiary">
            {useAll ? article.images.length : selectedImages.size} de {article.images.length} selecionadas
          </p>
        </div>

        {/* Footer buttons */}
        <div className="flex justify-between gap-3 pt-4">
          <Button variant="ghost" onClick={onReanalyze}>
            Re-analisar
          </Button>
          <Button variant="primary" size="lg" onClick={onContinue}>
            Continuar
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    </Stage>
  );
}

// ───────────────────────────────────────────────────────────────────────
// STAGE 3: CONFIGURE GENERATION
// ───────────────────────────────────────────────────────────────────────

function Stage3({
  tone,
  setTone,
  slides,
  setSlides,
  aiFill,
  setAiFill,
  includeSource,
  setIncludeSource,
  onGenerate,
  generating,
}: {
  tone: Tone;
  setTone: (tone: Tone) => void;
  slides: number;
  setSlides: (slides: number) => void;
  aiFill: boolean;
  setAiFill: (val: boolean) => void;
  includeSource: boolean;
  setIncludeSource: (val: boolean) => void;
  onGenerate: () => void;
  generating: boolean;
}) {
  const TONE_OPTIONS: { id: Tone; label: string; icon: React.ReactNode; description: string; example: string }[] = [
    {
      id: "notícia",
      label: "Notícia",
      icon: <Newspaper size={24} />,
      description: "Direto, factual, sem floreio. Como CNN ou G1.",
      example: "STF decide hoje a constitucionalidade da lei X.",
    },
    {
      id: "fofoca",
      label: "Fofoca",
      icon: <MessageCircle size={24} />,
      description: "Drama, reações, linguagem popular tipo @choquei.",
      example: "GENTE não acredito no que o STF acabou de fazer!",
    },
    {
      id: "viral",
      label: "Viral",
      icon: <Zap size={24} />,
      description: "Ganchos fortes, curiosidade, prova social explícita.",
      example: "O que ninguém te contou sobre essa decisão do STF.",
    },
  ];

  return (
    <Stage number={3} eyebrow="COMO QUER QUE FIQUE?">
      <div className="grid grid-cols-2 gap-8">
        {/* Left: Tone cards */}
        <div className="space-y-3">
          {TONE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setTone(opt.id)}
              className={`w-full p-5 rounded-lg border-2 transition-all text-left ${
                tone === opt.id
                  ? "bg-accent-muted border-accent"
                  : "bg-bg-surface border-border hover:border-border-strong"
              }`}
            >
              <div
                className={`text-xl mb-2 ${tone === opt.id ? "text-accent" : "text-text-primary"}`}
              >
                {opt.icon}
              </div>
              <h4 className={`text-body-strong mb-2 ${tone === opt.id ? "text-accent" : "text-text-primary"}`}>
                {opt.label}
              </h4>
              <p className="text-body text-text-secondary mb-3">{opt.description}</p>
              <p className="text-caption text-text-tertiary font-mono bg-bg-surface-2 p-2 rounded-sm">
                {opt.example}
              </p>
            </button>
          ))}
        </div>

        {/* Right: Parameters */}
        <div className="space-y-6">
          {/* Slides slider */}
          <div className="space-y-2">
            <label className="text-body-strong text-text-primary">{slides} slides</label>
            <input
              type="range"
              min="4"
              max="10"
              value={slides}
              onChange={(e) => setSlides(Number(e.target.value))}
              className="w-full"
            />
            <p className="text-caption text-text-tertiary">Quantidade de slides (4-10)</p>
          </div>

          {/* AI fill toggle */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={aiFill}
              onChange={(e) => setAiFill(e.target.checked)}
              className="mt-1"
            />
            <div>
              <div className="text-body-strong text-text-primary">Gerar imagens faltantes com IA</div>
              <p className="text-caption text-text-tertiary">
                Se necessário, cria imagens para completar os slides com créditos.
              </p>
            </div>
          </label>

          {/* Include source toggle */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={includeSource}
              onChange={(e) => setIncludeSource(e.target.checked)}
              className="mt-1"
            />
            <div>
              <div className="text-body-strong text-text-primary">Adicionar fonte no último slide</div>
              <p className="text-caption text-text-tertiary">
                Aparece como crédito discreto.
              </p>
            </div>
          </label>

          {/* Generate button */}
          <div className="pt-4">
            <Button
              variant="primary"
              size="lg"
              onClick={onGenerate}
              disabled={generating}
              loading={generating}
              className="w-full"
            >
              Gerar carrossel
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </div>
    </Stage>
  );
}

// ───────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ───────────────────────────────────────────────────────────────────────

export default function NewsPage() {
  const [url, setUrl] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [scraped, setScraped] = React.useState<ScrapedArticle | null>(null);
  const [selectedImages, setSelectedImages] = React.useState<Set<string>>(new Set());
  const [tone, setTone] = React.useState<Tone>("notícia");
  const [slides, setSlides] = React.useState(7);
  const [aiFill, setAiFill] = React.useState(true);
  const [includeSource, setIncludeSource] = React.useState(true);
  const [generating, setGenerating] = React.useState(false);
  const [toast, setToast] = React.useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const analyze = React.useCallback(async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/news/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao analisar matéria.");
        return;
      }
      setScraped(data);
      setSelectedImages(new Set(data.images)); // Select all images by default
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro de conexão.");
    } finally {
      setLoading(false);
    }
  }, [url]);

  const toggleImage = (img: string) => {
    const next = new Set(selectedImages);
    if (next.has(img)) next.delete(img);
    else next.add(img);
    setSelectedImages(next);
  };

  const generate = React.useCallback(async () => {
    if (!scraped) return;
    setGenerating(true);
    try {
      // Placeholder: just log for now
      console.log("Generating with:", {
        article: scraped,
        selectedImages: Array.from(selectedImages),
        tone,
        slides,
        aiFill,
        includeSource,
      });
      showToast("Geração iniciada! (Modo notícia — em desenvolvimento)");
      // Future: POST to /api/news/generate
    } finally {
      setGenerating(false);
    }
  }, [scraped, selectedImages, tone, slides, aiFill, includeSource]);

  return (
    <div className="bg-bg-base min-h-screen">
      <div className="max-w-[1040px] mx-auto px-8 py-10 flex flex-col gap-8">
        <HeroEditorial />

        <AnimatePresence mode="wait">
          {/* Stage 1: URL Input (always visible) */}
          <Stage1
            key="stage-1"
            url={url}
            setUrl={setUrl}
            loading={loading}
            error={error}
            onAnalyze={analyze}
          />

          {/* Stage 2: Preview (appears after scrape) */}
          {scraped && (
            <Stage2
              key="stage-2"
              article={scraped}
              selectedImages={selectedImages}
              onToggleImage={toggleImage}
              onReanalyze={() => {
                setScraped(null);
                setSelectedImages(new Set());
                setError(null);
              }}
              onContinue={() => {
                // Transition to Stage 3 is automatic via scraped state
              }}
            />
          )}

          {/* Stage 3: Configure (appears after Stage 2 confirmed) */}
          {scraped && (
            <Stage3
              key="stage-3"
              tone={tone}
              setTone={setTone}
              slides={slides}
              setSlides={setSlides}
              aiFill={aiFill}
              setAiFill={setAiFill}
              includeSource={includeSource}
              setIncludeSource={setIncludeSource}
              onGenerate={generate}
              generating={generating}
            />
          )}
        </AnimatePresence>
      </div>

      {toast && <Toast msg={toast} />}
    </div>
  );
}

