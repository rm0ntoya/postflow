"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "./Icon";
import SlidePreview, { resolveBgStyle, CANVAS_W, CANVAS_H } from "./SlidePreview";
import Toast from "./Toast";
import { ICarousel, ISlide, IElement } from "@/models/Carousel";
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

export default function Editor({ carousel, generatingSlide = null, generatingProgress = 0, externallyGeneratedImages = {}, onBack, onSave }: EditorProps) {
  const [draft, setDraft] = useState<Draft & { _id?: string }>(() => JSON.parse(JSON.stringify(carousel)));
  const [selectedSlide, setSelectedSlide] = useState(0);
  const [selectedEl, setSelectedEl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(0.38);
  const [propsTab, setPropsTab] = useState("design");
  const [history, setHistory] = useState<(Draft & { _id?: string })[]>([]);
  const [saving, setSaving] = useState(false);
  const [regenTarget, setRegenTarget] = useState<{ slideIndex: number; elementId?: string } | null>(null);
  const [regenLoading, setRegenLoading] = useState<string | null>(null);
  const [exportProgress, setExportProgress] = useState<string | null>(null);
  const [showAddSlide, setShowAddSlide] = useState(false);
  const [addingSlide, setAddingSlide] = useState(false);
  const [toast, setToast] = useState("");
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(""), 3000); };
  const stageRef = useRef<HTMLDivElement>(null);

  // Sync bg images from parent
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

  // Sync element imageUrls from parent carousel prop into draft (auto-generation updates)
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

  const pushHistory = useCallback(() => {
    setHistory((h) => [...h.slice(-19), JSON.parse(JSON.stringify(draft))]);
  }, [draft]);

  const undo = () => {
    if (!history.length) return;
    setDraft(history[history.length - 1]);
    setHistory((h) => h.slice(0, -1));
  };

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
    const slide: ISlide = newSlide ?? {
      id: `s${Date.now()}`,
      bgKey: "noir",
      bgOverride: "#000000",
      elements: [{ id: `e${Date.now()}`, type: "text", text: "Novo slide", x: 80, y: 500, w: CANVAS_W - 160, h: 180, fontSize: 80, weight: 700, color: "#fff", font: "TheBoldFont", align: "center" }],
    };
    setDraft((d) => {
      const slides = [...d.slides];
      // Insert before last slide (CTA) if more than 1 slide exists
      const insertIdx = slides.length > 1 ? slides.length - 1 : slides.length;
      slides.splice(insertIdx, 0, slide);
      return { ...d, slides };
    });
    setDraft((d) => {
      const insertIdx = d.slides.findIndex((s) => s.id === slide.id);
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
      try { data = await res.json(); } catch { /* empty */ }
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

      // Safe JSON parse — API may return empty body on timeout or server crash
      let data: { url?: string; error?: string } = {};
      try {
        data = await res.json();
      } catch {
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

      // Ensure all fonts (TheBoldFont, Space Grotesk, etc.) are fully loaded
      await document.fonts.ready;

      const zip = new JSZip();
      const frames = document.querySelectorAll<HTMLElement>("[data-slide-frame]");
      const total = frames.length;

      // Off-screen container for full-size renders — avoids zoom transform quality loss
      const exportHost = document.createElement("div");
      exportHost.setAttribute("aria-hidden", "true");
      // visibility:hidden and z-index negativo fazem html2canvas pular o render
      // Usar só posição off-screen — elemento precisa ser visível para captura funcionar
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

        // Clone the entire slide frame (copies inline styles including bgImage, bgColor)
        const clone = frame.cloneNode(true) as HTMLElement;

        // Expand clone to full canvas size
        clone.style.width  = `${CANVAS_W}px`;
        clone.style.height = `${CANVAS_H}px`;
        clone.style.borderRadius = "0";
        clone.style.position = "relative";

        // Remove zoom transform from the elements container so text/shapes render at native size
        const elContainer = clone.querySelector<HTMLElement>("[data-elements-container]");
        if (elContainer) {
          elContainer.style.transform = "none";
          elContainer.style.width  = `${CANVAS_W}px`;
          elContainer.style.height = `${CANVAS_H}px`;
        }

        // Remove selection handles and editing UI artifacts from clone
        clone.querySelectorAll<HTMLElement>(".handle, .selected").forEach((el) => {
          el.style.outline = "none";
          el.style.boxShadow = "none";
          el.classList.remove("selected");
        });

        exportHost.appendChild(clone);

        // Capture at 2x (2160×2700) — text now renders at full native size → sharp
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
    await onSave(draft);
    setSaving(false);
  };

  const accentColor = draft.accentColor || "#FFD700";

  return (
    <div className="editor">
      <div className="editor-tools">
        <button className="tool-btn active" title="Selecionar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 2l8 20 2-8 8-2L2 2z"/></svg>
        </button>
        <div className="tool-divider"/>
        <button className="tool-btn" onClick={addText} title="Adicionar texto"><Icon name="type" size={18}/></button>
        <button className="tool-btn" onClick={addImage} title="Adicionar imagem box"><Icon name="image" size={18}/></button>
        <button className="tool-btn" onClick={addShape} title="Adicionar forma"><Icon name="shapes" size={18}/></button>
        <button className="tool-btn" onClick={addProfileEl} title="Adicionar perfil">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </button>
        <div className="tool-divider"/>
        <button className="tool-btn" onClick={() => setPropsTab("background")} title="Fundo"><Icon name="palette" size={18}/></button>
        <button className="tool-btn" onClick={() => setPropsTab("layers")} title="Camadas"><Icon name="layers" size={18}/></button>
        <div className="tool-divider"/>
        <button className="tool-btn" onClick={undo} disabled={!history.length} style={{ opacity: history.length ? 1 : .3 }} title="Desfazer (⌘Z)"><Icon name="undo" size={18}/></button>
      </div>

      <div className="editor-canvas" ref={stageRef} onClick={() => setSelectedEl(null)}>
        <div className="editor-canvas-bar">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button className="btn-icon" onClick={onBack} title="Voltar"><Icon name="arrowLeft"/></button>
            <input
              className="editor-title-input"
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            />
            <span className="editor-bar-meta">1080 × 1350 · {saving ? "salvando…" : "salvo"}</span>
          </div>
          <div className="editor-bar-actions">
            <div className="editor-zoom">
              <button onClick={() => setZoom((z) => Math.max(0.2, z - 0.05))}>−</button>
              <span>{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom((z) => Math.min(0.8, z + 0.05))}>+</button>
            </div>
            <button className="btn btn-ghost" onClick={handleDownloadZip} disabled={!!exportProgress} title="Baixar todos os slides como ZIP">
              <Icon name="download"/> {exportProgress || "Baixar fotos (ZIP)"}
            </button>
            <button className="btn btn-ghost" onClick={handleSave} disabled={saving}><Icon name="check"/> Salvar</button>
          </div>
        </div>

        <div className="slide-list-bar">
          {draft.slides.map((s, i) => (
            <div key={s.id} className={`slide-thumb-mini ${selectedSlide === i ? "selected" : ""}`} onClick={() => setSelectedSlide(i)}>
              <div className="slide-thumb-mini-num">{i + 1}</div>
              <SlidePreview slide={s} scale={72 / CANVAS_W} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", borderRadius: 6 }}/>
            </div>
          ))}
          <button className="slide-thumb-mini add-slide-btn" onClick={() => setShowAddSlide(true)} style={{ display: "flex", alignItems: "center", justifyContent: "center", borderStyle: "dashed", color: "var(--muted)" }}>
            <Icon name="plus" size={18}/>
          </button>
        </div>

        <div className="editor-stage-wrap" onClick={() => setSelectedEl(null)}>
          <div className="editor-stage">
            {draft.slides.map((s, i) => (
              <SlideCanvas
                key={s.id}
                slide={s}
                index={i}
                selected={selectedSlide === i}
                selectedEl={selectedSlide === i ? selectedEl : null}
                zoom={zoom}
                isGenerating={generatingSlide === i}
                generatingProgress={generatingProgress}
                regenLoading={regenLoading === `${i}-bg`}
                onSlideClick={() => { setSelectedSlide(i); setSelectedEl(null); }}
                onElMouseDown={onElMouseDown}
                onElDblClick={(elId) => { setSelectedSlide(i); setSelectedEl(elId); }}
                onTextChange={(elId, text) => updateEl(i, elId, { text })}
                onRegenBg={() => setRegenTarget({ slideIndex: i })}
              />
            ))}
            <button className="slide-frame-add" onClick={(e) => { e.stopPropagation(); setShowAddSlide(true); }} title="Adicionar slide"><Icon name="plus" size={18}/></button>
          </div>
        </div>
      </div>

      <div className="props">
        <div className="props-tabs">
          <button className={`props-tab ${propsTab === "design" ? "active" : ""}`} onClick={() => setPropsTab("design")}>Design</button>
          <button className={`props-tab ${propsTab === "background" ? "active" : ""}`} onClick={() => setPropsTab("background")}>Fundo</button>
          <button className={`props-tab ${propsTab === "layers" ? "active" : ""}`} onClick={() => setPropsTab("layers")}>Camadas</button>
        </div>

        {propsTab === "design" && el?.type === "text" && (
          <TextProps el={el} accentColor={accentColor} update={(p) => updateEl(selectedSlide, el.id, p)} onDelete={() => deleteEl(selectedSlide, el.id)}/>
        )}
        {propsTab === "design" && el?.type === "shape" && (
          <ShapeProps el={el} update={(p) => updateEl(selectedSlide, el.id, p)} onDelete={() => deleteEl(selectedSlide, el.id)}/>
        )}
        {propsTab === "design" && el?.type === "image" && (
          <ImageProps
            el={el}
            update={(p) => updateEl(selectedSlide, el.id, p)}
            onDelete={() => deleteEl(selectedSlide, el.id)}
            onRegenerate={() => setRegenTarget({ slideIndex: selectedSlide, elementId: el.id })}
          />
        )}
        {propsTab === "design" && el?.type === "profile" && (
          <ProfileProps el={el} update={(p) => updateEl(selectedSlide, el.id, p)} onDelete={() => deleteEl(selectedSlide, el.id)}/>
        )}
        {propsTab === "design" && !el && slide && (
          <SlidePropsPanel slide={slide} idx={selectedSlide} totalSlides={draft.slides.length}
            onDuplicate={() => duplicateSlide(selectedSlide)}
            onDelete={() => deleteSlide(selectedSlide)}/>
        )}
        {propsTab === "background" && slide && (
          <BackgroundPropsPanel
            slide={slide}
            update={(p) => updateSlide(selectedSlide, p)}
            onRegenBg={slide.bgImageUrl ? () => setRegenTarget({ slideIndex: selectedSlide }) : undefined}
          />
        )}
        {propsTab === "layers" && slide && (
          <LayersList slide={slide} selected={selectedEl} onSelect={setSelectedEl} onDelete={(id) => deleteEl(selectedSlide, id)}/>
        )}
      </div>

      {regenTarget && (
        <RegenImageModal
          onClose={() => setRegenTarget(null)}
          onConfirm={handleRegenImage}
        />
      )}

      {showAddSlide && (
        <AddSlideModal
          onClose={() => setShowAddSlide(false)}
          onBlank={() => { setShowAddSlide(false); addSlide(); }}
          onAI={(hasImage) => handleAddSlideAI(hasImage)}
        />
      )}

      {addingSlide && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
          <div style={{ width: 36, height: 36, border: "3px solid rgba(255,255,255,0.15)", borderTopColor: "#A855F7", borderRadius: "50%", animation: "spin 1s linear infinite" }}/>
          <span style={{ color: "#fff", fontSize: 14 }}>Gerando slide com IA…</span>
        </div>
      )}

      {toast && <Toast msg={toast}/>}
    </div>
  );
}

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
        <div style={{ padding: "8px 12px", background: "rgba(108,39,190,0.1)", borderRadius: 8, border: "1px solid rgba(168,85,247,0.3)", display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12, color: "var(--txt)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 12, height: 12, border: "2px solid rgba(255,255,255,0.2)", borderTopColor: "#A855F7", borderRadius: "50%", animation: "spin 1s linear infinite", flexShrink: 0 }}/>
              Gerando fundo com IA...
            </div>
            <span>{generatingProgress}%</span>
          </div>
          <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
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
            <><div style={{ width: 12, height: 12, border: "2px solid rgba(255,255,255,0.2)", borderTopColor: "#A855F7", borderRadius: "50%", animation: "spin 1s linear infinite" }}/> Gerando…</>
          ) : (
            <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            {slide.bgImageUrl ? "Gerar outra imagem" : "Gerar imagem de fundo"}</>
          )}
        </button>
      )}
    </div>
  );
}

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
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.2)", fontSize: 14, gap: 6 }}>
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
          <div style={{ width: el.h, height: el.h, borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: "2px solid rgba(255,255,255,0.3)" }}>
            <img src={el.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}/>
          </div>
        ) : (
          <div style={{ width: el.h, height: el.h, borderRadius: "50%", background: "rgba(255,255,255,0.12)", flexShrink: 0, border: "2px solid rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width={el.h * 0.5} height={el.h * 0.5} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
        )}
        <span style={{ fontSize: el.fontSize || 26, fontWeight: el.weight || 600, color: el.color || "rgba(255,255,255,0.75)", fontFamily: `'${el.font || "Space Grotesk"}', sans-serif`, letterSpacing: "-0.01em" }}>
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
