"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Send, Sparkles, MessageCircle, X, ArrowLeft, Undo2, Redo2, MoreHorizontal, Save, ChevronDown } from "lucide-react";
import Icon from "./Icon";
import SlidePreview, { resolveBgStyle, CANVAS_W, CANVAS_H } from "./SlidePreview";
import Toast from "./Toast";
import { ICarousel, ISlide, IElement } from "@/models/Carousel";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";

interface ChatMsg { role: "user" | "assistant"; content: string; actions?: string[]; }
import {
  TextProps, ShapeProps, ImageProps, ProfileProps,
  BackgroundPropsPanel, SlidePropsPanel, LayersList,
  RegenImageModal, RegenOptions, AddSlideModal,
} from "./EditorPanels";

type Draft = Omit<ICarousel, keyof import("mongoose").Document | "userId" | "createdAt">;

interface EditorProps {
  carousel: Draft & { _id?: string };
  generatingSlide?: number | null;
  generatingProgress?: number;
  externallyGeneratedImages?: Record<number, string>;
  onBack: () => void;
  onSave: (updated: Draft & { _id?: string }) => Promise<void>;
}

const THUMB_SCALE = 176 / CANVAS_W;

// Task 5 — Filmstrip thumbnail scaling
const FILMSTRIP_THUMB_W = 156; // 180px - 2*12px padding
const FILMSTRIP_THUMB_H = Math.round(FILMSTRIP_THUMB_W * (CANVAS_H / CANVAS_W));
const FILMSTRIP_SCALE = FILMSTRIP_THUMB_W / CANVAS_W;

export default function Editor({ carousel, generatingSlide = null, generatingProgress = 0, externallyGeneratedImages = {}, onBack, onSave }: EditorProps) {
  const [draft, setDraft] = useState<Draft & { _id?: string }>(() => JSON.parse(JSON.stringify(carousel)));
  const [selectedSlide, setSelectedSlide] = useState(0);
  const [selectedEl, setSelectedEl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(0.38);
  const [propsTab, setPropsTab] = useState("design");
  const [history, setHistory] = useState<(Draft & { _id?: string })[]>([]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [titleEditing, setTitleEditing] = useState(false);
  const [regenTarget, setRegenTarget] = useState<{ slideIndex: number; elementId?: string } | null>(null);
  const [regenLoading, setRegenLoading] = useState<string | null>(null);
  const [exportProgress, setExportProgress] = useState<string | null>(null);
  const [showAddSlide, setShowAddSlide] = useState(false);
  const [addingSlide, setAddingSlide] = useState(false);
  const [toast, setToast] = useState("");
  const [viewMode, setViewMode] = useState<"isolated" | "all">("isolated");
  const [chatOpen, setChatOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const router = useRouter();

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(""), 3000); };
  const stageRef = useRef<HTMLDivElement>(null);

  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([
    { role: "assistant", content: "Olá! Sou seu agente de edição. Me diga o que quer mudar no carrossel — posso editar textos, cores, fundos e muito mais." },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatStreaming, setChatStreaming] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  function extractActions(text: string): { actions: any[]; displayText: string } {
    const actions: any[] = [];
    const blockMatch = text.match(/ACTIONS:\n([\s\S]*?)(?:\n\n|$)/);
    let displayText = text;
    if (blockMatch) {
      displayText = text.replace(blockMatch[0], "").trim();
      const lines = blockMatch[1].split("\n").map(l => l.trim()).filter(Boolean);
      for (const line of lines) {
        try { actions.push(JSON.parse(line)); } catch {}
      }
    }
    const legacyRe = /\[\[ACTION:(.*?)\]\]/g;
    let m;
    while ((m = legacyRe.exec(displayText)) !== null) {
      try {
        actions.push(JSON.parse(m[1]));
        displayText = displayText.replace(m[0], "");
      } catch {}
    }
    return { actions, displayText: displayText.trim() };
  }

  function applyAction(action: any) {
    try {
      switch (action.type) {
        case "editText":
          if (action.slideIndex != null && action.text != null) {
            setDraft((d) => {
              const slide = d.slides[action.slideIndex];
              if (!slide) return d;
              const textEls = slide.elements.filter((e: IElement) => e.type === "text");
              const target = action.elementIndex != null
                ? textEls[action.elementIndex]
                : action.elementId
                  ? slide.elements.find((e: IElement) => e.id === action.elementId)
                  : textEls[0];
              if (!target) return d;
              const slides = d.slides.map((s, i) =>
                i !== action.slideIndex ? s : {
                  ...s,
                  elements: s.elements.map((e: IElement) =>
                    e.id !== target.id ? e : { ...e, text: action.text, segments: undefined }
                  ),
                }
              );
              return { ...d, slides };
            });
          }
          break;
        case "editAccentColor":
          if (action.color) setDraft((d) => ({ ...d, accentColor: action.color }));
          break;
        case "editSlideBackground":
          if (action.slideIndex != null && action.bgOverride) {
            setDraft((d) => {
              const slides = d.slides.map((s, i) =>
                i === action.slideIndex ? { ...s, bgOverride: action.bgOverride } : s
              );
              return { ...d, slides };
            });
          }
          break;
        case "selectSlide":
          if (action.slideIndex != null) setSelectedSlide(action.slideIndex);
          break;
      }
    } catch {}
  }

  async function sendChat() {
    const msg = chatInput.trim();
    if (!msg || chatLoading) return;
    setChatInput("");
    setChatMsgs((prev) => [...prev, { role: "user", content: msg }]);
    setChatLoading(true);
    setChatStreaming("");

    const history = chatMsgs.map((m) => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch(`/api/carousel/${draft._id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, history, carousel: draft }),
      });

      if (!res.body) throw new Error("No stream");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const json = JSON.parse(line.slice(6));
            if (json.text) {
              full += json.text;
              setChatStreaming(full);
              chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }
          } catch {}
        }
      }

      const { actions, displayText } = extractActions(full);
      const actionLabels = actions.map(a => { applyAction(a); return a.type as string; });

      setChatMsgs((prev) => [...prev, {
        role: "assistant",
        content: displayText.trim(),
        actions: actionLabels.length ? actionLabels : undefined,
      }]);
    } catch {
      setChatMsgs((prev) => [...prev, { role: "assistant", content: "Erro ao conectar com o agente. Tente novamente." }]);
    } finally {
      setChatLoading(false);
      setChatStreaming("");
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }

  useEffect(() => {
    if (Object.keys(externallyGeneratedImages).length === 0) return;
    setDraft((d) => {
      let changed = false;
      const newSlides = d.slides.map((s, i) => {
        if (externallyGeneratedImages[i] && s.bgImageUrl !== externallyGeneratedImages[i]) {
          changed = true;
          return { ...s, bgImageUrl: externallyGeneratedImages[i] };
        }
        return s;
      });
      return changed ? { ...d, slides: newSlides } : d;
    });
  }, [externallyGeneratedImages]);

  useEffect(() => {
    setDraft((d) => {
      let changed = false;
      const newSlides = d.slides.map((s, idx) => {
        const srcSlide = carousel.slides[idx];
        if (!srcSlide) return s;
        const newElements = s.elements.map((el) => {
          if (el.type !== "image") return el;
          const srcEl = srcSlide.elements.find((e) => e.id === el.id);
          if (srcEl?.imageUrl && el.imageUrl !== srcEl.imageUrl) {
            changed = true;
            return { ...el, imageUrl: srcEl.imageUrl, photoUrl: srcEl.imageUrl };
          }
          return el;
        });
        if (!changed) return s;
        return { ...s, elements: newElements };
      });
      return changed ? { ...d, slides: newSlides } : d;
    });
  }, [carousel]);

  const slide = draft.slides[selectedSlide];
  const el = slide && selectedEl ? slide.elements.find((e) => e.id === selectedEl) || null : null;

  const pendingImages = draft.slides.flatMap((s, sIdx) => {
    const pending: { slideIndex: number; elementId?: string }[] = [];
    if (s.imagePrompt && !s.bgImageUrl) pending.push({ slideIndex: sIdx });
    s.elements.forEach((e) => {
      if (e.type === "image" && e.imagePrompt && !e.imageUrl) {
        pending.push({ slideIndex: sIdx, elementId: e.id });
      }
    });
    return pending;
  });

  const pushHistory = useCallback(() => {
    setHistory((h) => [...h.slice(-19), JSON.parse(JSON.stringify(draft))]);
  }, [draft]);

  const undo = () => {
    if (!history.length) return;
    setDraft(history[history.length - 1]);
    setHistory((h) => h.slice(0, -1));
    setHistoryIndex((idx) => Math.max(0, idx - 1));
  };

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setDraft(history[nextIndex]);
    }
  }, [history, historyIndex]);

  const updateSlide = (idx: number, patch: Partial<ISlide>) => {
    pushHistory();
    setDraft((d) => ({ ...d, slides: d.slides.map((s, i) => i === idx ? { ...s, ...patch } : s) }));
  };

  const updateEl = (slideIdx: number, elId: string, patch: Partial<IElement>) => {
    pushHistory();
    setDraft((d) => ({
      ...d,
      slides: d.slides.map((s, i) =>
        i === slideIdx ? { ...s, elements: s.elements.map((e) => e.id === elId ? { ...e, ...patch } : e) } : s
      ),
    }));
  };

  const updateElNoHistory = (slideIdx: number, elId: string, patch: Partial<IElement>) => {
    setDraft((d) => ({
      ...d,
      slides: d.slides.map((s, i) =>
        i === slideIdx ? { ...s, elements: s.elements.map((e) => e.id === elId ? { ...e, ...patch } : e) } : s
      ),
    }));
  };

  const deleteEl = (slideIdx: number, elId: string) => {
    pushHistory();
    setDraft((d) => ({
      ...d,
      slides: d.slides.map((s, i) =>
        i === slideIdx ? { ...s, elements: s.elements.filter((e) => e.id !== elId) } : s
      ),
    }));
    setSelectedEl(null);
  };

  const addSlide = (newSlide?: ISlide) => {
    pushHistory();
    const s: ISlide = newSlide ?? {
      id: `s${Date.now()}`,
      bgKey: "noir",
      bgOverride: "#000000",
      elements: [{ id: `e${Date.now()}`, type: "text", text: "Novo slide", x: 80, y: 500, w: CANVAS_W - 160, h: 180, fontSize: 80, weight: 700, color: "#fff", font: "TheBoldFont", align: "center" }],
    };
    setDraft((d) => {
      const slides = [...d.slides];
      const insertIdx = slides.length > 1 ? slides.length - 1 : slides.length;
      slides.splice(insertIdx, 0, s);
      return { ...d, slides };
    });
    setDraft((d) => {
      const insertIdx = d.slides.findIndex((sl) => sl.id === s.id);
      setSelectedSlide(insertIdx >= 0 ? insertIdx : d.slides.length - 2);
      return d;
    });
  };

  const handleAddSlideAI = async (hasImage: boolean) => {
    if (!draft._id) return;
    setAddingSlide(true);
    setShowAddSlide(false);
    try {
      const res = await fetch(`/api/carousel/${draft._id}/add-slide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hasImage }),
      });
      let data: { slide?: ISlide; error?: string } = {};
      try { data = await res.json(); } catch {}
      if (res.ok && data.slide) {
        addSlide(data.slide);
        showToast("Slide gerado com IA!");
      } else {
        showToast(`Erro: ${data.error || "Falha ao gerar slide"}`);
      }
    } catch {
      showToast("Erro de conexão ao gerar slide.");
    } finally {
      setAddingSlide(false);
    }
  };

  const duplicateSlide = (idx: number) => {
    pushHistory();
    const copy: ISlide = JSON.parse(JSON.stringify(draft.slides[idx]));
    copy.id = `s${Date.now()}`;
    copy.elements = copy.elements.map((e) => ({ ...e, id: `${e.id}-${Date.now()}` }));
    setDraft((d) => {
      const slides = [...d.slides];
      slides.splice(idx + 1, 0, copy);
      return { ...d, slides };
    });
    setSelectedSlide(idx + 1);
  };

  const deleteSlide = (idx: number) => {
    if (draft.slides.length === 1) return;
    pushHistory();
    setDraft((d) => ({ ...d, slides: d.slides.filter((_, i) => i !== idx) }));
    if (selectedSlide >= idx) setSelectedSlide(Math.max(0, selectedSlide - 1));
  };

  const addText = () => {
    pushHistory();
    const id = `e${Date.now()}`;
    setDraft((d) => ({
      ...d,
      slides: d.slides.map((s, i) => i === selectedSlide
        ? { ...s, elements: [...s.elements, { id, type: "text" as const, text: "Texto novo", x: 80, y: 500, w: CANVAS_W - 160, h: 140, fontSize: 60, weight: 700, color: "#fff", font: "Space Grotesk", align: "left" }] }
        : s),
    }));
    setSelectedEl(id);
  };

  const addImage = () => {
    pushHistory();
    const id = `e${Date.now()}`;
    setDraft((d) => ({
      ...d,
      slides: d.slides.map((s, i) => i === selectedSlide
        ? { ...s, elements: [...s.elements, { id, type: "image" as const, x: 90, y: 200, w: CANVAS_W - 180, h: 520, radius: 18 }] }
        : s),
    }));
    setSelectedEl(id);
    setPropsTab("design");
  };

  const addShape = () => {
    pushHistory();
    const id = `e${Date.now()}`;
    setDraft((d) => ({
      ...d,
      slides: d.slides.map((s, i) => i === selectedSlide
        ? { ...s, elements: [...s.elements, { id, type: "shape" as const, shape: "rect", x: 200, y: 400, w: 680, h: 300, color: "#A855F7", radius: 20, opacity: 1 }] }
        : s),
    }));
    setSelectedEl(id);
  };

  const addProfileEl = () => {
    pushHistory();
    const id = `e${Date.now()}`;
    setDraft((d) => ({
      ...d,
      slides: d.slides.map((s, i) => i === selectedSlide
        ? { ...s, elements: [...s.elements, { id, type: "profile" as const, text: "@seuinstagram", photoUrl: "", x: 60, y: 80, w: 500, h: 56, fontSize: 28, weight: 700, color: "#FFFFFF", font: "Space Grotesk" }] }
        : s),
    }));
    setSelectedEl(id);
    setPropsTab("design");
  };

  const handleRegenImage = async (opts: RegenOptions) => {
    if (!regenTarget || !draft._id) return;
    const { slideIndex, elementId } = regenTarget;
    const key = `${slideIndex}-${elementId || "bg"}`;
    setRegenTarget(null);
    setRegenLoading(key);

    try {
      const body: Record<string, unknown> = { slideIndex, useFace: opts.useFace };
      if (elementId) body.elementId = elementId;
      if (!opts.aiDecide && opts.customPrompt.trim()) body.customPrompt = opts.customPrompt.trim();

      const res = await fetch(`/api/carousel/${draft._id}/generate-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      let data: { url?: string; error?: string } = {};
      try { data = await res.json(); } catch {
        showToast("Erro: resposta inválida da API. Tente novamente.");
        return;
      }

      if (res.ok && data.url) {
        if (elementId) {
          setDraft((d) => ({
            ...d,
            slides: d.slides.map((s, i) =>
              i === slideIndex
                ? { ...s, elements: s.elements.map((e) => e.id === elementId ? { ...e, imageUrl: data.url, photoUrl: data.url } : e) }
                : s
            ),
          }));
        } else {
          setDraft((d) => ({
            ...d,
            slides: d.slides.map((s, i) => i === slideIndex ? { ...s, bgImageUrl: data.url } : s),
          }));
        }
      } else {
        showToast(`Erro ao gerar: ${data.error || "Falha desconhecida"}`);
      }
    } catch (e) {
      showToast("Erro de conexão ao gerar imagem.");
      console.error("[handleRegenImage]", e);
    } finally {
      setRegenLoading(null);
    }
  };

  const handleDownloadZip = async () => {
    setExportProgress("Preparando export...");
    try {
      const [{ default: html2canvas }, { default: JSZip }] = await Promise.all([
        import("html2canvas"),
        import("jszip"),
      ]);

      await document.fonts.ready;

      const zip = new JSZip();
      const frames = document.querySelectorAll<HTMLElement>("[data-slide-frame]");
      const total = frames.length;

      const exportHost = document.createElement("div");
      exportHost.setAttribute("aria-hidden", "true");
      exportHost.style.cssText = [
        "position:fixed",
        "top:-99999px",
        "left:-99999px",
        `width:${CANVAS_W}px`,
        `height:${CANVAS_H}px`,
        "overflow:hidden",
        "pointer-events:none",
      ].join(";");
      document.body.appendChild(exportHost);

      for (let i = 0; i < total; i++) {
        setExportProgress(`Exportando ${i + 1}/${total}…`);
        const frame = frames[i];
        const clone = frame.cloneNode(true) as HTMLElement;
        clone.style.width  = `${CANVAS_W}px`;
        clone.style.height = `${CANVAS_H}px`;
        clone.style.borderRadius = "0";
        clone.style.position = "relative";

        const elContainer = clone.querySelector<HTMLElement>("[data-elements-container]");
        if (elContainer) {
          elContainer.style.transform = "none";
          elContainer.style.width  = `${CANVAS_W}px`;
          elContainer.style.height = `${CANVAS_H}px`;
        }

        clone.querySelectorAll<HTMLElement>(".handle, .selected").forEach((el) => {
          el.style.outline = "none";
          el.style.boxShadow = "none";
          el.classList.remove("selected");
        });

        exportHost.appendChild(clone);

        const canvas = await html2canvas(clone, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#000000",
          logging: false,
          imageTimeout: 30000,
          width: CANVAS_W,
          height: CANVAS_H,
        });

        const blob = await new Promise<Blob>((resolve) =>
          canvas.toBlob((b) => resolve(b!), "image/png", 1.0)
        );

        zip.file(`${draft.title.replace(/[^a-z0-9]/gi, "-")}-slide-${i + 1}.png`, blob);
        clone.remove();
      }

      document.body.removeChild(exportHost);

      setExportProgress("Comprimindo ZIP...");
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${draft.title.replace(/[^a-z0-9]/gi, "-")}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setExportProgress(null);
    }
  };

  const dragRef = useRef<{ slideIdx: number; elId: string; startX: number; startY: number; origX: number; origY: number } | null>(null);

  const onElMouseDown = (ev: React.MouseEvent, slideIdx: number, elId: string) => {
    const target = ev.target as HTMLElement;
    if (target.contentEditable === "true") return;
    ev.stopPropagation();
    setSelectedSlide(slideIdx);
    setSelectedEl(elId);
    const targetEl = draft.slides[slideIdx].elements.find((e) => e.id === elId);
    if (!targetEl) return;
    dragRef.current = { slideIdx, elId, startX: ev.clientX, startY: ev.clientY, origX: targetEl.x, origY: targetEl.y };
    pushHistory();
  };

  useEffect(() => {
    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      const d = dragRef.current;
      const dx = (ev.clientX - d.startX) / zoom;
      const dy = (ev.clientY - d.startY) / zoom;
      const nx = Math.max(-80, Math.min(CANVAS_W, d.origX + dx));
      const ny = Math.max(-80, Math.min(CANVAS_H, d.origY + dy));
      updateElNoHistory(d.slideIdx, d.elId, { x: nx, y: ny });
    };
    const onUp = () => { dragRef.current = null; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [zoom, draft]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const active = document.activeElement as HTMLElement;
      if (e.key === "Escape") { setSelectedEl(null); return; }
      if ((e.metaKey || e.ctrlKey) && e.key === "z") { e.preventDefault(); undo(); return; }
      if ((e.key === "Delete" || e.key === "Backspace") && selectedEl) {
        if (active?.tagName === "INPUT" || active?.tagName === "TEXTAREA" || active?.contentEditable === "true") return;
        deleteEl(selectedSlide, selectedEl);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedEl, selectedSlide, history]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(draft);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCarousel = async () => {
    if (!draft._id) return;
    if (!confirm("Excluir este carrossel? Esta ação não pode ser desfeita.")) return;
    const res = await fetch(`/api/carousel/${draft._id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/dashboard");
    } else {
      showToast("Erro ao excluir. Tente novamente.");
    }
  };

  const accentColor = draft.accentColor || "#FFD700";

  const slideLabel = (idx: number) =>
    idx === 0 ? "Capa" : idx === draft.slides.length - 1 ? "CTA" : "Desenvolvimento";

  return (
    <>
      {/* ── Toast global ── */}
      {toast && <Toast msg={toast} />}

      {/* ── Regen Modal ── */}
      {regenTarget && (
        <RegenImageModal
          onClose={() => setRegenTarget(null)}
          onConfirm={handleRegenImage}
        />
      )}

      {/* ── Add Slide Modal ── */}
      {showAddSlide && (
        <AddSlideModal
          onClose={() => setShowAddSlide(false)}
          onBlank={() => { setShowAddSlide(false); addSlide(); }}
          onAI={(hasImage) => handleAddSlideAI(hasImage)}
        />
      )}

      {/* ── Shell 4 zonas ── */}
      <div
        className="h-screen overflow-hidden bg-bg-base"
        style={{
          display: "grid",
          gridTemplateRows: "56px 1fr",
          gridTemplateColumns: "180px 1fr 280px",
          gridTemplateAreas: `"topbar topbar topbar" "filmstrip canvas inspector"`,
        }}
      >
        {/* ── TOPBAR ── */}
        <header
          style={{ gridArea: "topbar" }}
          className="flex items-center gap-2 px-4 bg-bg-surface border-b border-border-subtle shrink-0 h-14"
        >
          {/* Voltar */}
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 shrink-0">
            <ArrowLeft size={15} strokeWidth={1.5} />
            Voltar
          </Button>

          <div className="h-5 w-px bg-border-subtle mx-1" />

          {/* Título editável */}
          <input
            className="bg-transparent text-body-strong text-text-primary border-b border-transparent focus:border-accent outline-none max-w-[260px] truncate transition-colors duration-200"
            value={draft.title ?? "Sem título"}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            onFocus={() => setTitleEditing(true)}
            onBlur={() => setTitleEditing(false)}
            aria-label="Título do carrossel"
          />

          {/* Badge status */}
          <span className={cn(
            "text-micro px-1.5 py-0.5 rounded-xs whitespace-nowrap",
            saving
              ? "text-accent bg-accent-muted"
              : saved
                ? "text-state-success bg-state-success/10"
                : "text-text-tertiary bg-bg-surface-2"
          )}>
            {saving ? "Salvando…" : saved ? "Salvo" : "Rascunho"}
          </span>

          {/* Espaçador */}
          <div className="flex-1" />

          {/* Contador de slides */}
          <span className="text-caption text-text-tertiary tnum shrink-0">
            Slide {selectedSlide + 1} de {draft.slides.length}
          </span>

          <div className="h-5 w-px bg-border-subtle mx-1" />

          {/* Undo / Redo */}
          <Button
            variant="ghost"
            size="sm"
            disabled={history.length === 0}
            onClick={undo}
            title="Desfazer (⌘Z)"
            className="px-2 shrink-0"
          >
            <Undo2 size={15} strokeWidth={1.5} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={historyIndex >= history.length - 1}
            onClick={redo}
            title="Refazer"
            className="px-2 shrink-0"
          >
            <Redo2 size={15} strokeWidth={1.5} />
          </Button>

          <div className="h-5 w-px bg-border-subtle mx-1" />

          {/* Gerar imagens — só aparece se houver pendentes */}
          {pendingImages.length > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setRegenTarget({ slideIndex: pendingImages[0].slideIndex, elementId: pendingImages[0].elementId })}
              className="gap-1.5 shrink-0"
            >
              <Sparkles size={14} strokeWidth={1.5} />
              Gerar imagens
            </Button>
          )}

          {/* Salvar */}
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="shrink-0"
          >
            Salvar
          </Button>

          {/* Toggle view mode */}
          <Button
            variant="ghost"
            size="sm"
            className="px-2 shrink-0 text-caption"
            title={viewMode === "isolated" ? "Ver todos os slides" : "Ver slide atual"}
            onClick={() => setViewMode(v => v === "isolated" ? "all" : "isolated")}
          >
            {viewMode === "isolated" ? "⊞ Todos" : "⊡ Um"}
          </Button>

          {/* Menu ⋯ */}
          <div className="relative shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="px-2"
              title="Mais opções"
              onClick={() => setMoreMenuOpen(o => !o)}
            >
              <MoreHorizontal size={15} strokeWidth={1.5} />
            </Button>
            {moreMenuOpen && (
              <div
                className="absolute right-0 top-full mt-1 z-50 bg-bg-surface border border-border-subtle rounded-lg shadow-xl min-w-[160px] py-1"
                onMouseLeave={() => setMoreMenuOpen(false)}
              >
                <button
                  onClick={() => { setMoreMenuOpen(false); handleSave(); }}
                  className="w-full text-left px-4 py-2 text-body text-text-primary hover:bg-bg-surface-2 transition-colors"
                >
                  Salvar rascunho
                </button>
                <button
                  onClick={() => { setMoreMenuOpen(false); window.open(`/api/carousel/${draft._id}`, "_blank"); }}
                  className="w-full text-left px-4 py-2 text-body text-text-primary hover:bg-bg-surface-2 transition-colors"
                >
                  Ver dados JSON
                </button>
                <hr className="border-border-subtle my-1" />
                <button
                  onClick={() => { setMoreMenuOpen(false); handleDeleteCarousel(); }}
                  className="w-full text-left px-4 py-2 text-body text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  Excluir carrossel
                </button>
              </div>
            )}
          </div>
        </header>

        {/* ── FILMSTRIP ── */}
        <aside
          style={{ gridArea: "filmstrip" }}
          className="bg-bg-surface border-r border-border-subtle flex flex-col overflow-hidden"
        >
          {/* Header fixo */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-border-subtle shrink-0">
            <span className="text-micro text-text-tertiary">SLIDES</span>
            <span className="text-caption text-text-tertiary tnum">{draft.slides.length}</span>
          </div>

          {/* Lista de thumbnails scrollável */}
          <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
            {draft.slides.map((s, i) => {
              const isActive = selectedSlide === i;
              const isGenerating = generatingSlide === i;

              return (
                <button
                  key={s.id ?? i}
                  type="button"
                  onClick={() => { setSelectedSlide(i); setSelectedEl(null); }}
                  className={cn(
                    "relative w-full rounded-md overflow-hidden border transition-colors duration-fast cursor-pointer group shrink-0",
                    isActive
                      ? "border-2 border-accent"
                      : "border border-border-subtle hover:border-border-default"
                  )}
                  style={{ height: FILMSTRIP_THUMB_H }}
                  aria-label={`Slide ${i + 1}`}
                  aria-pressed={isActive}
                >
                  {/* Thumbnail do slide em escala */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      width: CANVAS_W,
                      height: CANVAS_H,
                      transform: `scale(${FILMSTRIP_SCALE})`,
                      transformOrigin: "top left",
                    }}
                  >
                    <SlidePreview
                      slide={{ ...s, ...(externallyGeneratedImages[i] ? { bgImageUrl: externallyGeneratedImages[i] } : {}) }}
                      
                    />
                  </div>

                  {/* Número do slide */}
                  <div className="absolute bottom-1 right-1 px-1 py-0.5 rounded-xs bg-bg-overlay text-micro text-text-secondary tnum pointer-events-none">
                    {i + 1}
                  </div>

                  {/* Overlay de geração em progresso */}
                  {isGenerating && (
                    <div className="absolute inset-0 bg-bg-overlay flex flex-col items-center justify-center gap-1 pointer-events-none">
                      <Sparkles size={16} className="text-accent animate-pulse" strokeWidth={1.5} />
                      <span className="text-micro text-accent tnum">{generatingProgress}%</span>
                    </div>
                  )}

                  {/* Reloading de imagem individual */}
                  {regenLoading && regenLoading.startsWith(`${i}-`) && !isGenerating && (
                    <div className="absolute inset-0 bg-bg-overlay flex items-center justify-center pointer-events-none">
                      <Sparkles size={14} className="text-accent animate-spin" strokeWidth={1.5} />
                    </div>
                  )}
                </button>
              );
            })}

            {/* Botão adicionar slide */}
            <button
              type="button"
              onClick={() => setShowAddSlide(true)}
              className="w-full flex items-center justify-center gap-2 rounded-md border border-dashed border-border-default text-caption text-text-tertiary hover:border-accent hover:text-accent transition-colors duration-fast shrink-0"
              style={{ height: 44 }}
            >
              <span className="text-base leading-none">+</span>
              Adicionar slide
            </button>
          </div>
        </aside>

        {/* CANVAS */}
        <main
          style={{ gridArea: "canvas" }}
          className={`relative bg-bg-base flex ${viewMode === "all" ? "overflow-auto items-start justify-start" : "overflow-hidden items-center justify-center"}`}
          onClick={() => setSelectedEl(null)}
        >
          {viewMode === "isolated" ? (
            slide && (
              <SlideCanvas
                key={slide.id}
                slide={slide}
                index={selectedSlide}
                selected={true}
                selectedEl={selectedEl}
                zoom={zoom}
                isGenerating={generatingSlide === selectedSlide}
                generatingProgress={generatingProgress}
                regenLoading={regenLoading === `${selectedSlide}-bg`}
                onSlideClick={() => setSelectedEl(null)}
                onElMouseDown={onElMouseDown}
                onElDblClick={(elId) => setSelectedEl(elId)}
                onTextChange={(elId, text) => updateEl(selectedSlide, elId, { text })}
                onRegenBg={() => setRegenTarget({ slideIndex: selectedSlide })}
              />
            )
          ) : (
            <div className="flex flex-wrap gap-4 p-6 items-start justify-start" onClick={e => e.stopPropagation()}>
              {draft.slides.map((s, i) => (
                <div
                  key={s.id}
                  onClick={() => { setSelectedSlide(i); setSelectedEl(null); setViewMode("isolated"); }}
                  className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${selectedSlide === i ? "border-accent" : "border-transparent hover:border-border-strong"}`}
                  title={`Slide ${i + 1}`}
                >
                  <SlidePreview slide={s} scale={0.18} />
                  <div className="text-center text-caption text-text-tertiary mt-1 pb-1">
                    {i + 1}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* INSPECTOR */}
        <aside style={{ gridArea: "inspector" }} className="bg-bg-surface border-l border-border-subtle overflow-y-auto">
          <div className="flex border-b border-border-subtle">
            {["design", "background", "layers"].map((tab) => (
              <button
                key={tab}
                onClick={() => setPropsTab(tab)}
                className={`flex-1 py-2.5 text-caption font-medium transition-colors capitalize ${
                  propsTab === tab
                    ? "text-accent border-b-2 border-accent"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {tab === "design" ? "Design" : tab === "background" ? "Fundo" : "Camadas"}
              </button>
            ))}
          </div>

          <div className="p-4">
            {propsTab === "design" && el?.type === "text" && (
              <TextProps el={el} accentColor={accentColor} update={(p) => updateEl(selectedSlide, el.id, p)} onDelete={() => deleteEl(selectedSlide, el.id)} />
            )}
            {propsTab === "design" && el?.type === "shape" && (
              <ShapeProps el={el} update={(p) => updateEl(selectedSlide, el.id, p)} onDelete={() => deleteEl(selectedSlide, el.id)} />
            )}
            {propsTab === "design" && el?.type === "image" && (
              <ImageProps el={el} update={(p) => updateEl(selectedSlide, el.id, p)} onDelete={() => deleteEl(selectedSlide, el.id)} onRegenerate={() => setRegenTarget({ slideIndex: selectedSlide, elementId: el.id })} />
            )}
            {propsTab === "design" && el?.type === "profile" && (
              <ProfileProps el={el} update={(p) => updateEl(selectedSlide, el.id, p)} onDelete={() => deleteEl(selectedSlide, el.id)} />
            )}
            {propsTab === "design" && !el && slide && (
              <SlidePropsPanel slide={slide} idx={selectedSlide} totalSlides={draft.slides.length} onDuplicate={() => duplicateSlide(selectedSlide)} onDelete={() => deleteSlide(selectedSlide)} />
            )}
            {propsTab === "background" && slide && (
              <BackgroundPropsPanel slide={slide} update={(p) => updateSlide(selectedSlide, p)} onRegenBg={slide.bgImageUrl ? () => setRegenTarget({ slideIndex: selectedSlide }) : undefined} />
            )}
            {propsTab === "layers" && slide && (
              <LayersList slide={slide} selected={selectedEl} onSelect={setSelectedEl} onDelete={(id) => deleteEl(selectedSlide, id)} />
            )}
          </div>
        </aside>
      </div>
    </>
  );
}

// ── SlideCanvas — sem mudança ─────────────────────────────────────────────────

interface SlideCanvasProps {
  slide: ISlide;
  index: number;
  selected: boolean;
  selectedEl: string | null;
  zoom: number;
  isGenerating?: boolean;
  generatingProgress?: number;
  regenLoading?: boolean;
  onSlideClick: () => void;
  onElMouseDown: (ev: React.MouseEvent, slideIdx: number, elId: string) => void;
  onElDblClick: (elId: string) => void;
  onTextChange: (elId: string, text: string) => void;
  onRegenBg: () => void;
}

function SlideCanvas({ slide, index, selected, selectedEl, zoom, isGenerating, generatingProgress, regenLoading, onSlideClick, onElMouseDown, onElDblClick, onTextChange, onRegenBg }: SlideCanvasProps) {
  const bgStyle = resolveBgStyle(slide);
  return (
    <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ position: "relative" }}>
        <div className="slide-frame-num" style={{ top: -28 }}><span className="dot"/> Slide {String(index + 1).padStart(2, "0")}</div>
        <div
          data-slide-frame
          className={`slide-frame ${selected ? "selected" : ""}`}
          style={{ ...bgStyle, width: CANVAS_W * zoom, height: CANVAS_H * zoom, flexShrink: 0, borderRadius: 12 }}
          onClick={(e) => { e.stopPropagation(); onSlideClick(); }}
        >
          {slide.bgImageUrl && (
            <div style={{
              position: "absolute", inset: 0, zIndex: 1,
              background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.35) 40%, rgba(0,0,0,0.08) 70%, transparent 100%)",
              pointerEvents: "none",
            }}/>
          )}
          <div data-elements-container style={{ position: "absolute", top: 0, left: 0, width: CANVAS_W, height: CANVAS_H, transform: `scale(${zoom})`, transformOrigin: "top left", zIndex: 2 }}>
            {(slide.elements || []).map((elItem) => (
              <EditableElement
                key={elItem.id}
                el={elItem}
                selected={selectedEl === elItem.id}
                onMouseDown={(ev) => onElMouseDown(ev, index, elItem.id)}
                onDblClick={() => onElDblClick(elItem.id)}
                onTextChange={(t) => onTextChange(elItem.id, t)}
              />
            ))}
          </div>
        </div>
      </div>

      {isGenerating && (
        <div style={{ padding: "8px 12px", background: "rgba(108,39,190,.1)", borderRadius: 8, border: "1px solid rgba(168,85,247,.3)", display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12, color: "var(--txt)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 12, height: 12, border: "2px solid rgba(255,255,255,.2)", borderTopColor: "#A855F7", borderRadius: "50%", animation: "spin 1s linear infinite", flexShrink: 0 }}/>
              Gerando fundo com IA...
            </div>
            <span>{generatingProgress}%</span>
          </div>
          <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,.1)", overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 2, background: "#A855F7", width: `${generatingProgress}%`, transition: "width 0.3s ease" }}/>
          </div>
        </div>
      )}

      {!isGenerating && (
        <button
          onClick={(e) => { e.stopPropagation(); onRegenBg(); }}
          disabled={!!regenLoading}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            padding: "8px 14px", borderRadius: 8, border: "1px solid var(--b)",
            background: "var(--bg2)", color: "var(--txt)", fontSize: 12, cursor: "pointer",
            opacity: regenLoading ? 0.6 : 1,
          }}
        >
          {regenLoading ? (
            <><div style={{ width: 12, height: 12, border: "2px solid rgba(255,255,255,.2)", borderTopColor: "#A855F7", borderRadius: "50%", animation: "spin 1s linear infinite" }}/> Gerando…</>
          ) : (
            <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            {slide.bgImageUrl ? "Gerar outra imagem" : "Gerar imagem de fundo"}</>
          )}
        </button>
      )}
    </div>
  );
}

// ── EditableElement — sem mudança ─────────────────────────────────────────────

interface EditableElementProps {
  el: IElement;
  selected: boolean;
  onMouseDown: (ev: React.MouseEvent) => void;
  onDblClick: () => void;
  onTextChange: (text: string) => void;
}

function EditableElement({ el, selected, onMouseDown, onDblClick, onTextChange }: EditableElementProps) {
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const baseStyle: React.CSSProperties = { left: el.x, top: el.y, width: el.w, minHeight: el.h };

  if (el.type === "text") {
    const hasSegments = Array.isArray(el.segments) && el.segments.length > 0;
    return (
      <div
        ref={ref}
        className={`el el-text ${selected ? "selected" : ""}`}
        contentEditable={editing}
        suppressContentEditableWarning
        style={{
          ...baseStyle,
          fontSize: el.fontSize, fontWeight: el.weight,
          color: hasSegments ? undefined : el.color,
          fontFamily: `'${el.font}', sans-serif`,
          textAlign: (el.align as "left" | "center" | "right") || "left",
          lineHeight: el.lineHeight || 1.15,
          letterSpacing: el.letterSpacing !== undefined ? `${el.letterSpacing}em` : ((el.fontSize || 16) > 50 ? "-0.03em" : "-0.01em"),
          cursor: editing ? "text" : "grab",
        }}
        onMouseDown={(e) => { if (!editing) onMouseDown(e); }}
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => { e.stopPropagation(); setEditing(true); onDblClick(); setTimeout(() => ref.current?.focus(), 0); }}
        onBlur={(e) => { setEditing(false); onTextChange(e.currentTarget.innerText); }}
        onKeyDown={(e) => { if (e.key === "Escape") e.currentTarget.blur(); }}
      >
        {hasSegments
          ? el.segments!.map((seg, i) => <span key={i} style={{ color: seg.color }}>{seg.text}</span>)
          : el.text}
        {selected && !editing && <ResizeHandles/>}
      </div>
    );
  }

  if (el.type === "shape") {
    return (
      <div
        className={`el ${selected ? "selected" : ""}`}
        style={{ ...baseStyle, height: el.h, background: el.color, opacity: el.opacity, borderRadius: el.shape === "circle" ? "50%" : (el.radius || 8) }}
        onMouseDown={onMouseDown}
        onClick={(e) => e.stopPropagation()}
      >
        {selected && <ResizeHandles/>}
      </div>
    );
  }

  if (el.type === "image") {
    const finalUrl = el.imageUrl || el.photoUrl;
    return (
      <div
        className={`el ${selected ? "selected" : ""}`}
        style={{ ...baseStyle, height: el.h, borderRadius: el.radius || 18, overflow: "hidden", background: "#111" }}
        onMouseDown={onMouseDown}
        onClick={(e) => e.stopPropagation()}
      >
        {finalUrl ? (
          <img src={finalUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}/>
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,.2)", fontSize: 14, gap: 6 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
            Sem imagem
          </div>
        )}
        {selected && <ResizeHandles/>}
      </div>
    );
  }

  if (el.type === "profile") {
    return (
      <div
        className={`el ${selected ? "selected" : ""}`}
        style={{ ...baseStyle, height: el.h, display: "flex", alignItems: "center", gap: 14 }}
        onMouseDown={onMouseDown}
        onClick={(e) => e.stopPropagation()}
      >
        {el.photoUrl ? (
          <div style={{ width: el.h, height: el.h, borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: "2px solid rgba(255,255,255,.3)" }}>
            <img src={el.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}/>
          </div>
        ) : (
          <div style={{ width: el.h, height: el.h, borderRadius: "50%", background: "rgba(255,255,255,.12)", flexShrink: 0, border: "2px solid rgba(255,255,255,.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width={el.h * 0.5} height={el.h * 0.5} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.5)" strokeWidth="2" strokeLinecap="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
        )}
        <span style={{ fontSize: el.fontSize || 26, fontWeight: el.weight || 600, color: el.color || "rgba(255,255,255,.75)", fontFamily: `'${el.font || "Space Grotesk"}', sans-serif`, letterSpacing: "-0.01em" }}>
          {el.text}
        </span>
        {selected && <ResizeHandles/>}
      </div>
    );
  }

  return null;
}

function ResizeHandles() {
  return <>
    <div className="handle tl"/><div className="handle tr"/>
    <div className="handle bl"/><div className="handle br"/>
  </>;
}
