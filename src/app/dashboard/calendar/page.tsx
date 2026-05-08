"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import CreateModal, { GenerateSettings } from "@/components/CreateModal";
import GenOverlay from "@/components/GenOverlay";
import Toast from "@/components/Toast";

interface Idea {
  id: string;
  title: string;
  description: string;
  tone: string;
  hook?: string;
  status: "pending" | "done";
  carouselId?: string;
}

interface ScheduledPost {
  _id: string;
  date: string;
  niche: string;
  objective: string;
  ideas: Idea[];
}

const OBJECTIVES = ["Autoridade", "Venda", "Viralização", "Engajamento", "Educação"];
const MONTHS_PT = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const DAYS_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const GEN_STEPS = [
  "Conectando ao Gemini…",
  "Analisando contexto e tema…",
  "Estruturando narrativa…",
  "Escrevendo copy slide a slide…",
  "Aplicando design e imagens…",
  "Montando carrossel final…",
];

function toLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function CalendarPage() {
  const router = useRouter();
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  // Calendar state
  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set());
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // Selected day panel
  const [panelDay, setPanelDay] = useState<string | null>(null);

  // Briefing form
  const [niche, setNiche] = useState("");
  const [objective, setObjective] = useState("Autoridade");
  const [ideasPerDay, setIdeasPerDay] = useState(2);
  const [additionalInstructions, setAdditionalInstructions] = useState("");
  const [generating, setGenerating] = useState(false);

  // Carousel modal
  const [carouselModal, setCarouselModal] = useState<{ idea: Idea; postId: string } | null>(null);
  const [carouselGenerating, setCarouselGenerating] = useState<{ progress: number; text: string } | null>(null);

  const [toast, setToast] = useState("");
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(""), 3000); };

  const fetchPosts = useCallback(async () => {
    try {
      const r = await fetch("/api/calendar");
      const d = await r.json();
      if (d.posts) setPosts(d.posts);
    } catch {
      showToast("Erro ao carregar calendário.");
    } finally {
      setLoadingPosts(false);
    }
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  // Build calendar grid for current month
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  // Map of date string -> post
  const postsByDate = new Map<string, ScheduledPost>();
  posts.forEach((p) => {
    const d = new Date(p.date);
    postsByDate.set(toLocalDateStr(new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())), p);
  });

  function getDayStr(day: number): string {
    return `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function toggleDay(day: number) {
    const str = getDayStr(day);
    if (postsByDate.has(str)) {
      // Click on planned day: show panel
      setPanelDay(str === panelDay ? null : str);
      return;
    }
    const isPast = new Date(viewYear, viewMonth, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (isPast) return;
    setSelectedDays((prev) => {
      const next = new Set(prev);
      if (next.has(str)) next.delete(str); else next.add(str);
      return next;
    });
    setPanelDay(null);
  }

  async function handleGenerate() {
    if (selectedDays.size === 0) { showToast("Selecione pelo menos um dia."); return; }
    if (!niche.trim()) { showToast("Informe o nicho."); return; }
    setGenerating(true);
    try {
      const res = await fetch("/api/calendar/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dates: Array.from(selectedDays).sort(),
          ideasPerDay,
          niche,
          objective,
          additionalInstructions,
        }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || "Erro ao gerar."); return; }
      setPosts((prev) => {
        const updated = [...prev];
        for (const newPost of data.posts) {
          const d = new Date(newPost.date);
          const dateStr = toLocalDateStr(new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
          const idx = updated.findIndex((p) => {
            const pd = new Date(p.date);
            return toLocalDateStr(new Date(pd.getUTCFullYear(), pd.getUTCMonth(), pd.getUTCDate())) === dateStr;
          });
          if (idx >= 0) updated[idx] = newPost;
          else updated.push(newPost);
        }
        return updated;
      });
      setSelectedDays(new Set());
      showToast(`Ideias geradas para ${data.posts.length} dia(s)!`);
    } catch {
      showToast("Erro ao gerar ideias.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleDeleteDay(postId: string) {
    if (!confirm("Remover todas as ideias deste dia?")) return;
    await fetch(`/api/calendar?id=${postId}`, { method: "DELETE" });
    setPosts((prev) => prev.filter((p) => p._id !== postId));
    setPanelDay(null);
    showToast("Dia removido do calendário.");
  }

  async function handleCarouselGenerate(settings: GenerateSettings) {
    if (!carouselModal) return;
    const modalRef = carouselModal;
    setCarouselModal(null);
    setCarouselGenerating({ progress: 0, text: GEN_STEPS[0] });

    for (let i = 1; i < GEN_STEPS.length - 2; i++) {
      await new Promise((r) => setTimeout(r, 600));
      setCarouselGenerating({ progress: i, text: GEN_STEPS[i] });
    }

    const res = await fetch("/api/carousel/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    const data = await res.json();
    setCarouselGenerating({ progress: 5, text: GEN_STEPS[5] });
    await new Promise((r) => setTimeout(r, 300));
    setCarouselGenerating(null);

    if (!res.ok) { showToast(`Erro: ${data.error}`); return; }

    // Mark idea as done
    await fetch(`/api/calendar/${modalRef.postId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ideaId: modalRef.idea.id, carouselId: data.carousel._id }),
    });

    // Update local state
    setPosts((prev) => prev.map((p) => {
      if (p._id !== modalRef.postId) return p;
      return { ...p, ideas: p.ideas.map((idea) => idea.id === modalRef.idea.id ? { ...idea, status: "done" as const, carouselId: data.carousel._id } : idea) };
    }));

    showToast("Carrossel gerado! Redirecionando...");
    router.push(`/dashboard/editor/${data.carousel._id}`);
  }

  const panelPost = panelDay ? postsByDate.get(panelDay) : null;

  // suppress unused warning
  void loadingPosts;

  return (
    <div className="main">
      <div className="topbar">
        <div className="tb-left">
          <h1>Planejador de Conteúdo</h1>
          <p>Planeje sua linha editorial e gere carrosséis com 1 clique</p>
        </div>
        <div className="tb-right">
          {selectedDays.size > 0 && (
            <span style={{ fontSize: 13, color: "var(--muted)" }}>
              {selectedDays.size} dia{selectedDays.size > 1 ? "s" : ""} selecionado{selectedDays.size > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      <div className="content" style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24, alignItems: "start" }}>
        {/* ── CALENDAR ── */}
        <div>
          {/* Month nav */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <button
              className="btn btn-ghost"
              style={{ padding: "8px 14px" }}
              onClick={() => {
                if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
                else setViewMonth(m => m - 1);
              }}
            >←</button>
            <h2 style={{ fontSize: 20, fontWeight: 500, color: "#fff", letterSpacing: "-0.02em" }}>
              {MONTHS_PT[viewMonth]} {viewYear}
            </h2>
            <button
              className="btn btn-ghost"
              style={{ padding: "8px 14px" }}
              onClick={() => {
                if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
                else setViewMonth(m => m + 1);
              }}
            >→</button>
          </div>

          {/* Day headers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
            {DAYS_PT.map((d) => (
              <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: "var(--dim)", letterSpacing: ".08em", textTransform: "uppercase", padding: "6px 0" }}>{d}</div>
            ))}
          </div>

          {/* Calendar cells */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
            {cells.map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} />;
              const dateStr = getDayStr(day);
              const isToday = dateStr === toLocalDateStr(today);
              const isPast = new Date(viewYear, viewMonth, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
              const hasPost = postsByDate.has(dateStr);
              const post = postsByDate.get(dateStr);
              const isSelected = selectedDays.has(dateStr);
              const isPanelOpen = panelDay === dateStr;
              const doneCount = post?.ideas.filter(i => i.status === "done").length || 0;
              const totalCount = post?.ideas.length || 0;

              return (
                <button
                  key={dateStr}
                  onClick={() => toggleDay(day)}
                  style={{
                    aspectRatio: "1",
                    borderRadius: 12,
                    border: isPanelOpen
                      ? "1px solid rgba(168,85,247,.6)"
                      : isSelected
                      ? "1px solid rgba(34,211,238,.5)"
                      : isToday
                      ? "1px solid rgba(168,85,247,.4)"
                      : "1px solid var(--b)",
                    background: isPanelOpen
                      ? "rgba(168,85,247,.15)"
                      : isSelected
                      ? "rgba(34,211,238,.08)"
                      : hasPost
                      ? "rgba(168,85,247,.06)"
                      : "var(--bg2)",
                    cursor: isPast && !hasPost ? "default" : "pointer",
                    opacity: isPast && !hasPost ? 0.35 : 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                    padding: 4,
                    transition: "all .15s",
                    position: "relative",
                  }}
                >
                  <span style={{
                    fontSize: 15, fontWeight: isToday ? 600 : 400,
                    color: isSelected ? "#22D3EE" : isPanelOpen ? "#C4B5FD" : isToday ? "#A855F7" : hasPost ? "#fff" : "var(--muted)",
                  }}>
                    {day}
                  </span>
                  {hasPost && (
                    <div style={{ display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "center" }}>
                      {Array.from({ length: Math.min(totalCount, 3) }).map((_, i) => (
                        <div key={i} style={{
                          width: 5, height: 5, borderRadius: "50%",
                          background: i < doneCount ? "#4ADE80" : "#A855F7",
                        }} />
                      ))}
                      {totalCount > 3 && <span style={{ fontSize: 8, color: "var(--dim)" }}>+{totalCount - 3}</span>}
                    </div>
                  )}
                  {isSelected && (
                    <div style={{ position: "absolute", top: 4, right: 4, width: 6, height: 6, borderRadius: "50%", background: "#22D3EE" }} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ display: "flex", gap: 20, marginTop: 16, flexWrap: "wrap" }}>
            {[
              { color: "rgba(34,211,238,.5)", label: "Dia selecionado" },
              { color: "#A855F7", label: "Com ideias" },
              { color: "#4ADE80", label: "Carrossel gerado" },
            ].map((l) => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--muted)" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: l.color }} />
                {l.label}
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div style={{ position: "sticky", top: 88, display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Panel: planned day ideas */}
          {panelPost && panelDay && (
            <div className="card" style={{ padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 500, color: "#fff" }}>
                    {new Date(panelPost.date + "T00:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "long" })}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                    {panelPost.niche} · {panelPost.objective}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteDay(panelPost._id)}
                  style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid rgba(239,68,68,.2)", background: "rgba(239,68,68,.06)", color: "#f87171", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}
                >×</button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {panelPost.ideas.map((idea, idx) => (
                  <div
                    key={idea.id}
                    style={{
                      background: "var(--bg3)", border: "1px solid var(--b)", borderRadius: 12, padding: "14px 16px",
                      borderLeftColor: idea.status === "done" ? "#4ADE80" : "rgba(168,85,247,.4)",
                      borderLeftWidth: 3,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "#fff", lineHeight: 1.4 }}>
                        <span style={{ fontSize: 10, color: "var(--dim)", fontWeight: 400, marginRight: 6 }}>#{idx + 1}</span>
                        {idea.title}
                      </div>
                      {idea.status === "done" && <span style={{ fontSize: 10, fontWeight: 600, color: "#4ADE80", background: "rgba(74,222,128,.1)", border: "1px solid rgba(74,222,128,.2)", borderRadius: 999, padding: "2px 8px", flexShrink: 0 }}>Criado ✓</span>}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.55, marginBottom: 10 }}>{idea.description}</div>
                    {idea.hook && (
                      <div style={{ fontSize: 11, color: "rgba(168,85,247,.8)", fontStyle: "italic", marginBottom: 10 }}>
                        &ldquo;{idea.hook}&rdquo;
                      </div>
                    )}
                    {idea.status === "pending" ? (
                      <button
                        className="btn btn-pri"
                        style={{ width: "100%", justifyContent: "center", fontSize: 12, padding: "8px 14px" }}
                        onClick={() => setCarouselModal({ idea, postId: panelPost._id })}
                      >
                        ✦ Gerar Carrossel
                      </button>
                    ) : (
                      <button
                        className="btn btn-ghost"
                        style={{ width: "100%", justifyContent: "center", fontSize: 12, padding: "8px 14px" }}
                        onClick={() => idea.carouselId && router.push(`/dashboard/editor/${idea.carouselId}`)}
                      >
                        Ver carrossel →
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Briefing form */}
          {!panelPost && (
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 500, color: "#fff", marginBottom: 4 }}>Briefing de Conteúdo</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 16, lineHeight: 1.5 }}>
                Selecione os dias no calendário e preencha o briefing para gerar ideias de carrosséis virais.
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,.5)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6 }}>Nicho *</div>
                  <input
                    className="input"
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    placeholder="ex: Marketing Digital, Fitness, Finanças..."
                    style={{ width: "100%" }}
                  />
                </div>

                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,.5)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6 }}>Objetivo</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {OBJECTIVES.map((obj) => (
                      <button
                        key={obj}
                        onClick={() => setObjective(obj)}
                        style={{
                          padding: "6px 12px", borderRadius: 999, fontSize: 12, fontWeight: 400,
                          background: objective === obj ? "rgba(108,39,190,.2)" : "rgba(255,255,255,.04)",
                          border: objective === obj ? "1px solid rgba(168,85,247,.4)" : "1px solid var(--b)",
                          color: objective === obj ? "#C4B5FD" : "var(--muted)",
                          cursor: "pointer",
                        }}
                      >
                        {obj}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,.5)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6 }}>
                    Ideias por dia: <span style={{ color: "#A855F7" }}>{ideasPerDay}</span>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        onClick={() => setIdeasPerDay(n)}
                        style={{
                          width: 36, height: 36, borderRadius: 8, fontSize: 14, fontWeight: 500,
                          background: ideasPerDay === n ? "rgba(108,39,190,.2)" : "rgba(255,255,255,.04)",
                          border: ideasPerDay === n ? "1px solid rgba(168,85,247,.4)" : "1px solid var(--b)",
                          color: ideasPerDay === n ? "#C4B5FD" : "var(--muted)",
                          cursor: "pointer",
                        }}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,.5)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6 }}>Instruções adicionais</div>
                  <textarea
                    className="textarea"
                    value={additionalInstructions}
                    onChange={(e) => setAdditionalInstructions(e.target.value)}
                    placeholder="ex: Foco em resultados rápidos, use linguagem jovem..."
                    style={{ width: "100%", minHeight: 72, fontSize: 13 }}
                  />
                </div>

                <button
                  className="btn btn-pri"
                  style={{
                    width: "100%", justifyContent: "center", padding: "12px 20px",
                    fontSize: 14, opacity: selectedDays.size === 0 || generating ? 0.6 : 1,
                  }}
                  onClick={handleGenerate}
                  disabled={selectedDays.size === 0 || generating || !niche.trim()}
                >
                  {generating ? (
                    "Gerando ideias..."
                  ) : selectedDays.size === 0 ? (
                    "Selecione dias no calendário"
                  ) : (
                    `✦ Gerar ideias para ${selectedDays.size} dia${selectedDays.size > 1 ? "s" : ""}`
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CreateModal for carousel generation */}
      {carouselModal && (
        <CreateModal
          onClose={() => setCarouselModal(null)}
          onGenerate={handleCarouselGenerate}
          prefill={{
            theme: carouselModal.idea.title + (carouselModal.idea.hook ? "\n\nHook: " + carouselModal.idea.hook : ""),
            tone: carouselModal.idea.tone as "direct" | "editorial" | "didactic" | "provocative" | "casual" | "authoritive",
          }}
        />
      )}

      {carouselGenerating && <GenOverlay progress={carouselGenerating.progress} statusText={carouselGenerating.text} />}
      {toast && <Toast msg={toast} />}
    </div>
  );
}
