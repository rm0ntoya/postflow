"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import SlidePreview, { resolveBgStyle } from "@/components/SlidePreview";
import CreateModal, { GenerateSettings } from "@/components/CreateModal";
import GenOverlay from "@/components/GenOverlay";
import Toast from "@/components/Toast";

interface Carousel {
  _id: string;
  title: string;
  theme: string;
  status: string;
  accent: string;
  accentColor?: string;
  viral?: boolean;
  imageSlides?: number[];
  slides: { id: string; bgKey: string; bgOverride?: string; bgImageUrl?: string; imagePrompt?: string; elements: unknown[] }[];
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

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  const hr = Math.floor(diff / 3600000);
  const day = Math.floor(diff / 86400000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  if (hr < 24) return `há ${hr}h`;
  if (day === 1) return "há 1 dia";
  return `há ${day} dias`;
}

function statusLabel(s: string) {
  if (s === "draft") return "Rascunho";
  if (s === "ready") return "Pronto";
  if (s === "published") return "Publicado";
  if (s === "generating") return "Gerando…";
  return s;
}

export default function DashboardPage() {
  const router = useRouter();
  const [carousels, setCarousels] = useState<Carousel[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [generating, setGenerating] = useState<{ progress: number; text: string } | null>(null);
  const [generatingImages, setGeneratingImages] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState("");

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(""), 2500); };

  const fetchCarousels = useCallback(async () => {
    try {
      const r = await fetch("/api/carousel", { cache: "no-store" });
      const d = await r.json();
      if (d.carousels) {
        setCarousels(d.carousels);
      } else if (d.error) {
        showToast(`Erro ao carregar: ${d.error}`);
      }
    } catch (e) {
      showToast("Erro de conexão. Tente recarregar a página.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCarousels();
    const onVisible = () => { if (document.visibilityState === "visible") fetchCarousels(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [fetchCarousels]);

  const filtered = useMemo(() => {
    let list = carousels;
    if (filter !== "all") list = list.filter((c) => c.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) => c.title.toLowerCase().includes(q) || c.theme.toLowerCase().includes(q));
    }
    return list;
  }, [carousels, filter, search]);

  const counts = useMemo(() => ({
    all: carousels.length,
    draft: carousels.filter((c) => c.status === "draft").length,
    ready: carousels.filter((c) => c.status === "ready").length,
    published: carousels.filter((c) => c.status === "published").length,
  }), [carousels]);

  const totalSlides = carousels.reduce((s, c) => s + (c.slides?.length || 0), 0);

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

    const newCarousel = data.carousel as Carousel;
    setCarousels((cs) => [newCarousel, ...cs]);

    if (settings.imageSlides.length > 0) {
      showToast("Texto pronto! Redirecionando para gerar as imagens...");
    } else {
      showToast("Carrossel gerado com sucesso!");
    }

    router.push(`/dashboard/editor/${newCarousel._id}`);
  }

  async function handleDuplicate(id: string) {
    const src = carousels.find((c) => c._id === id);
    if (!src) return;
    const res = await fetch("/api/carousel/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme: src.title + " (cópia)", slideCount: src.slides?.length || 5 }),
    });
    if (res.ok) {
      const data = await res.json();
      setCarousels((cs) => [data.carousel, ...cs]);
      showToast("Carrossel duplicado");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este carrossel?")) return;
    await fetch(`/api/carousel/${id}`, { method: "DELETE" });
    setCarousels((cs) => cs.filter((c) => c._id !== id));
    showToast("Carrossel excluído");
  }

  return (
    <div className="main">
      {/* TOPBAR */}
      <div className="topbar">
        <div className="tb-left">
          <h1>Meus carrosséis</h1>
          <p>Crie, edite e exporte conteúdos para Instagram em minutos</p>
        </div>
        <div className="tb-right">
          <div className="search">
            <Icon name="search"/>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar carrosséis…"/>
          </div>
          <button className="btn-icon" title="Notificações"><Icon name="bell"/></button>
          <button className="btn btn-pri" onClick={() => setShowCreate(true)}>
            <Icon name="sparkle"/> Criar carrossel
          </button>
        </div>
      </div>

      <div className="content">
        {/* STATS */}
        <div className="stat-row">
          <div className="stat-card"><div className="stat-card-ico"><Icon name="layers"/></div><div className="stat-card-lbl">Carrosséis</div><div className="stat-card-val">{carousels.length}</div><div className="stat-card-delta">total criados</div></div>
          <div className="stat-card"><div className="stat-card-ico"><Icon name="layout"/></div><div className="stat-card-lbl">Slides totais</div><div className="stat-card-val">{totalSlides}</div><div className="stat-card-delta">em todos os carrosséis</div></div>
          <div className="stat-card"><div className="stat-card-ico"><Icon name="instagram"/></div><div className="stat-card-lbl">Publicados</div><div className="stat-card-val">{counts.published}</div><div className="stat-card-delta">{counts.all > 0 ? Math.round((counts.published / counts.all) * 100) : 0}% do total</div></div>
          <div className="stat-card"><div className="stat-card-ico"><Icon name="flame"/></div><div className="stat-card-lbl">Rascunhos</div><div className="stat-card-val">{counts.draft}</div><div className="stat-card-delta">prontos para editar</div></div>
        </div>

        {/* FILTER BAR */}
        <div className="filter-bar">
          <div className="filter-pills">
            {(["all", "draft", "ready", "published"] as const).map((f) => (
              <button key={f} className={`pill ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
                {f === "all" ? "Tudo" : f === "draft" ? "Rascunhos" : f === "ready" ? "Prontos" : "Publicados"}
                <span className="pill-count">{counts[f]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* GRID */}
        {loading ? (
          <div className="empty-state">
            <div style={{ width: 24, height: 24, border: "2px solid rgba(255,255,255,.2)", borderTopColor: "#A855F7", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto" }}/>
          </div>
        ) : (
          <div className="cg">
            <div className="cg-new" onClick={() => setShowCreate(true)}>
              <div className="cg-new-icon"><Icon name="sparkle" size={24}/></div>
              <div className="cg-new-title">Criar novo carrossel</div>
              <div className="cg-new-sub">Gere um carrossel completo a partir de um tema com IA</div>
            </div>

            {filtered.map((c) => (
              <CarouselCard
                key={c._id}
                carousel={c}
                isGeneratingImages={generatingImages.has(c._id)}
                onOpen={() => router.push(`/dashboard/editor/${c._id}`)}
                onDuplicate={() => handleDuplicate(c._id)}
                onDelete={() => handleDelete(c._id)}
              />
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && search && (
          <div className="empty-state">
            <Icon name="search" size={32}/>
            <p style={{ marginTop: 14 }}>Nenhum carrossel encontrado para &ldquo;{search}&rdquo;</p>
          </div>
        )}

        {!loading && carousels.length === 0 && (
          <div className="empty-state" style={{ marginTop: 32 }}>
            <Icon name="sparkle" size={32}/>
            <p style={{ marginTop: 14, color: "var(--txt)" }}>Nenhum carrossel ainda</p>
            <p style={{ fontSize: 13, marginTop: 6 }}>Clique em &ldquo;Criar carrossel&rdquo; para começar</p>
          </div>
        )}
      </div>

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onGenerate={handleGenerate}/>}
      {generating && <GenOverlay progress={generating.progress} statusText={generating.text}/>}
      {toast && <Toast msg={toast}/>}
    </div>
  );
}

function CarouselCard({ carousel, isGeneratingImages, onOpen, onDuplicate, onDelete }: { carousel: Carousel; isGeneratingImages?: boolean; onOpen: () => void; onDuplicate: () => void; onDelete: () => void }) {
  const slides = carousel.slides || [];
  const cover = slides[0];
  const second = slides[1] || cover;
  const third = slides[2] || cover;
  const stackOrder = second && cover && third ? [second, cover, third] : [cover].filter(Boolean);

  return (
    <div className="cg-card">
      <div className="cg-thumb">
        <div className={`cg-status ${carousel.status}`}>
          <span className="dot"/>
          {statusLabel(carousel.status)}
        </div>
        <div className="cg-thumb-stack">
          {stackOrder.map((slide, i) => (
            <div key={i} className="cg-thumb-slide" style={resolveBgStyle(slide)}>
              {slide && <SlidePreview slide={slide as Parameters<typeof SlidePreview>[0]["slide"]} scale={0.36} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}/>}
              {slide?.bgImageUrl === "__has_image__" && (
                <div style={{ position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,0.5)", borderRadius: 4, padding: "2px 4px", fontSize: 9, color: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", gap: 3 }}>
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                  IA
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="cg-thumb-count">
          <Icon name="layers" size={10}/>
          {slides.length} slides
        </div>
      </div>
      {isGeneratingImages && (
        <div style={{ padding: "8px 12px 0", display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--muted)" }}>
            <div style={{ width: 10, height: 10, border: "1.5px solid rgba(255,255,255,0.2)", borderTopColor: carousel.accentColor || "#FFD700", borderRadius: "50%", animation: "spin 1s linear infinite", flexShrink: 0 }}/>
            Gerando imagens com IA…
          </div>
          <div style={{ height: 3, borderRadius: 2, background: "var(--b)", overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 2, background: carousel.accentColor || "#FFD700", animation: "imgLoadBar 2.5s ease-in-out infinite" }}/>
          </div>
        </div>
      )}
      <div className="cg-body">
        <div className="cg-title">{carousel.title}</div>
        <div className="cg-meta">
          <span>{carousel.theme}</span>
          <span className="cg-meta-dot"/>
          <span>{timeAgo(carousel.updatedAt)}</span>
        </div>
      </div>
      <div className="cg-actions">
        <button className="cg-act primary" onClick={onOpen}><Icon name="edit"/> Editar</button>
        <button className="cg-act" onClick={onDuplicate} title="Duplicar"><Icon name="copy"/></button>
        <button className="cg-act" onClick={onDelete} title="Excluir"><Icon name="trash"/></button>
      </div>
    </div>
  );
}
