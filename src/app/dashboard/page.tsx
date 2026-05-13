"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { MetricStrip } from "@/components/MetricStrip";
import { FilterToolbar, FilterValue, ViewMode } from "@/components/FilterToolbar";
import { CarouselCard, NewCarouselCard, CarouselCardData } from "@/components/CarouselCard";
import { Badge, BadgeStatus } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { LogoMark } from "@/components/Logo";
import CreateModal, { GenerateSettings } from "@/components/CreateModal";
import GenOverlay from "@/components/GenOverlay";
import Toast from "@/components/Toast";

interface RawCarousel {
  _id: string;
  title: string;
  theme?: string;
  status: string;
  slides?: { id: string; bgKey: string; bgImageUrl?: string; bgThumbUrl?: string }[];
  isNews?: boolean;
  mode?: string;
  updatedAt: string;
  createdAt: string;
}

const GEN_STEPS = [
  "Conectando ao Gemini…",
  "Analisando contexto e tema…",
  "Estruturando narrativa…",
  "Escrevendo copy slide a slide…",
  "Aplicando design e imagens…",
  "Montando carrossel final…",
];

export default function DashboardPage() {
  const router = useRouter();
  const [raw, setRaw] = React.useState<RawCarousel[] | null>(null);
  const [user, setUser] = React.useState<{ name: string; imagesUsed: number; imagesLimit: number; weekCreated: number } | null>(null);
  const [filter, setFilter] = React.useState<FilterValue>("todos");
  const [query, setQuery] = React.useState("");
  const [view, setView] = React.useState<ViewMode>("grid");
  const [sort, setSort] = React.useState("recent");
  const [showCreate, setShowCreate] = React.useState(false);
  const [generating, setGenerating] = React.useState<{ progress: number; text: string } | null>(null);
  const [toast, setToast] = React.useState("");

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(""), 2500); };

  const fetchCarousels = React.useCallback(async () => {
    try {
      const r = await fetch("/api/carousel", { cache: "no-store" });
      const d = await r.json();
      if (d.carousels) {
        setRaw(d.carousels);
      } else if (d.error) {
        showToast(`Erro ao carregar: ${d.error}`);
        setRaw([]);
      } else {
        setRaw([]);
      }
    } catch {
      showToast("Erro de conexão. Tente recarregar a página.");
      setRaw([]);
    }
  }, []);

  React.useEffect(() => {
    fetchCarousels();
    const onVisible = () => { if (document.visibilityState === "visible") fetchCarousels(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [fetchCarousels]);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/user/me", { cache: "no-store" });
        if (!r.ok) return;
        const u = await r.json();
        if (!alive) return;
        setUser({
          name: u.name ?? u.email?.split("@")[0] ?? "—",
          imagesUsed: u.imagesUsed ?? 0,
          imagesLimit: u.imagesLimit ?? 100,
          weekCreated: u.weekCreated ?? 0,
        });
      } catch { /* ignore */ }
    })();
    return () => { alive = false; };
  }, []);

  React.useEffect(() => {
    const onOpen = () => setShowCreate(true);
    window.addEventListener("nc:open-create", onOpen as EventListener);
    return () => window.removeEventListener("nc:open-create", onOpen as EventListener);
  }, []);

  const items: CarouselCardData[] | null = React.useMemo(
    () => raw ? raw.map(mapCarousel) : null,
    [raw]
  );

  const weekCreated = React.useMemo(() => {
    if (!raw) return 0;
    const cutoff = Date.now() - 7 * 24 * 3600 * 1000;
    return raw.filter((c) => new Date(c.createdAt).getTime() >= cutoff).length;
  }, [raw]);

  const filtered = React.useMemo(() => {
    if (!items) return null;
    let out = items;
    if (filter === "rascunhos")  out = out.filter((c) => c.status === "rascunho");
    if (filter === "prontos")    out = out.filter((c) => c.status === "pronto");
    if (filter === "publicados") out = out.filter((c) => c.status === "publicado");
    if (filter === "noticia")    out = out.filter((c) => c.isNews);
    if (query.trim()) {
      const q = query.toLowerCase();
      out = out.filter((c) => c.title.toLowerCase().includes(q));
    }
    if (sort === "title") out = [...out].sort((a, b) => a.title.localeCompare(b.title));
    else if (sort === "oldest") out = [...out].reverse();
    return out;
  }, [items, filter, query, sort]);

  async function handleGenerate(settings: GenerateSettings) {
    setShowCreate(false);
    setGenerating({ progress: 0, text: GEN_STEPS[0] });

    for (let i = 1; i < GEN_STEPS.length - 2; i++) {
      await new Promise((r) => setTimeout(r, 600));
      setGenerating({ progress: i, text: GEN_STEPS[i] });
    }

    const res = await fetch("/api/carousel/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    const data = await res.json();
    setGenerating({ progress: 5, text: GEN_STEPS[5] });
    await new Promise((r) => setTimeout(r, 300));
    setGenerating(null);

    if (!res.ok) {
      showToast(`Erro: ${data.error}`);
      return;
    }

    const newCarousel = data.carousel as RawCarousel;
    setRaw((cs) => cs ? [newCarousel, ...cs] : [newCarousel]);

    if (settings.imageSlides && settings.imageSlides.length > 0) {
      showToast("Texto pronto! Redirecionando para gerar as imagens...");
    } else {
      showToast("Carrossel gerado com sucesso!");
    }

    router.push(`/dashboard/editor/${newCarousel._id}`);
  }

  return (
    <div className="flex flex-col">
      <MetricStrip
        name={user?.name ?? "criador"}
        totalActive={items?.length ?? 0}
        weekCreated={user?.weekCreated ?? weekCreated}
        imagesUsed={user?.imagesUsed ?? 0}
        imagesLimit={user?.imagesLimit ?? 100}
      />
      <FilterToolbar
        filter={filter} onFilter={setFilter}
        query={query} onQuery={setQuery}
        view={view} onView={setView}
        sort={sort} onSort={setSort}
      />
      {filtered === null ? (
        <div className="p-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-[4/5] rounded-lg" />)}
        </div>
      ) : filtered.length === 0 && !query && filter === "todos" ? (
        <EmptyState onCreate={() => setShowCreate(true)} />
      ) : filtered.length === 0 ? (
        <EmptyFilter onClear={() => { setFilter("todos"); setQuery(""); }} />
      ) : view === "list" ? (
        <ListView items={filtered} />
      ) : (
        <div className="p-6 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <NewCarouselCard onClick={() => setShowCreate(true)} />
          {filtered.map((c) => <CarouselCard key={c.id} data={c} />)}
        </div>
      )}

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onGenerate={handleGenerate} />}
      {generating && <GenOverlay progress={generating.progress} statusText={generating.text} />}
      {toast && <Toast msg={toast} />}
    </div>
  );
}

function ListView({ items }: { items: CarouselCardData[] }) {
  return (
    <div className="p-6">
      <div className="rounded-lg border border-border-subtle overflow-hidden">
        {items.map((c, i) => (
          <a
            key={c.id}
            href={`/dashboard/editor/${c.id}`}
            className={`flex items-center gap-4 px-4 py-3 hover:bg-bg-surface-2 transition-colors duration-fast ${i > 0 ? "border-t border-border-subtle" : ""}`}
          >
            <div className="h-12 w-10 rounded-sm overflow-hidden bg-bg-surface-2 shrink-0">
              {c.thumbnail && <img src={c.thumbnail} alt="" className="w-full h-full object-cover" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-body-strong text-text-primary truncate">{c.title}</div>
              <div className="text-caption text-text-tertiary tnum">{c.updatedRelative} · {c.slideCount} slides</div>
            </div>
            <Badge status={c.status} />
          </a>
        ))}
      </div>
    </div>
  );
}

function mapCarousel(c: RawCarousel): CarouselCardData {
  const slides = Array.isArray(c.slides) ? c.slides : [];
  const cover = slides[0];
  const thumbnail = cover?.bgThumbUrl || (cover?.bgImageUrl && cover.bgImageUrl !== "__has_image__" ? cover.bgImageUrl : undefined);
  return {
    id: c._id,
    title: c.title || c.theme || "Sem título",
    thumbnail,
    slideCount: slides.length,
    status: mapStatus(c.status),
    isNews: !!(c.isNews || c.mode === "news"),
    updatedRelative: relativeTime(c.updatedAt ?? c.createdAt),
  };
}

function mapStatus(s: string): BadgeStatus {
  if (s === "ready" || s === "pronto") return "pronto";
  if (s === "generating" || s === "gerando") return "gerando";
  if (s === "published" || s === "publicado") return "publicado";
  if (s === "error" || s === "erro") return "erro";
  return "rascunho";
}

function relativeTime(t: string | undefined): string {
  if (!t) return "—";
  const d = new Date(t).getTime();
  const diff = Date.now() - d;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `há ${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h}h`;
  const days = Math.floor(h / 24);
  if (days < 7) return `há ${days}d`;
  return new Date(d).toLocaleDateString("pt-BR");
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
      <LogoMark size={48} className="text-text-tertiary" />
      <h2 className="text-h2 text-text-primary">Nenhum carrossel ainda</h2>
      <p className="text-body text-text-secondary max-w-md">Crie seu primeiro carrossel — leva 30 segundos.</p>
      <Button variant="primary" size="lg" onClick={onCreate}>
        Criar primeiro carrossel
      </Button>
    </div>
  );
}

function EmptyFilter({ onClear }: { onClear: () => void }) {
  return (
    <div className="p-12 text-center text-body text-text-secondary">
      Nenhum carrossel com este filtro.{" "}
      <button className="text-accent hover:underline" onClick={onClear}>limpar filtros</button>.
    </div>
  );
}
