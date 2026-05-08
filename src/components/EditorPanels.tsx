"use client";

import { useState } from "react";
import Icon from "./Icon";
import { BG_PRESETS } from "./SlidePreview";
import { ISlide, IElement, ISegment } from "@/models/Carousel";

export const FONT_FAMILIES = ["TheBoldFont", "Space Grotesk", "Inter", "Fraunces", "Playfair Display", "JetBrains Mono", "Bebas Neue", "DM Serif Display"];
export const FONT_WEIGHTS = [{ v: 300, l: "Light" }, { v: 400, l: "Regular" }, { v: 500, l: "Medium" }, { v: 600, l: "Semibold" }, { v: 700, l: "Bold" }];
export const COLOR_SWATCHES = ["#ffffff","#000000","#A855F7","#6C27BE","#F97316","#4ADE80","#FBBF24","#3B82F6","#EC4899","#06B6D4","#1a1530","#f4eee0","#fca5a5","#C4B5FD","#fed7aa","transparent"];

export interface RegenOptions {
  customPrompt: string;
  aiDecide: boolean;
  useFace: boolean;
}

export function RegenImageModal({
  onClose,
  onConfirm,
}: {
  onClose: () => void;
  onConfirm: (opts: RegenOptions) => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [aiDecide, setAiDecide] = useState(false);
  const [useFace, setUseFace] = useState(true);

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--bg2)", border: "1px solid var(--b)",
          borderRadius: 16, padding: 28, width: 420, maxWidth: "90vw",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Gerar nova imagem</h3>
          <button className="btn-icon" onClick={onClose}><Icon name="x" size={16}/></button>
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, cursor: "pointer", fontSize: 14 }}>
          <input
            type="checkbox"
            checked={aiDecide}
            onChange={(e) => setAiDecide(e.target.checked)}
            style={{ width: 16, height: 16 }}
          />
          Deixar a IA usar a imaginação
        </label>

        {!aiDecide && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>Descreva o que quer na imagem (opcional)</div>
            <textarea
              className="textarea"
              placeholder="Ex: pessoa no escritório olhando para o horizonte com expressão de determinação..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              style={{ minHeight: 90, width: "100%", boxSizing: "border-box" }}
            />
          </div>
        )}

        <label style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, cursor: "pointer", fontSize: 14 }}>
          <input
            type="checkbox"
            checked={useFace}
            onChange={(e) => setUseFace(e.target.checked)}
            style={{ width: 16, height: 16 }}
          />
          Usar foto do rosto cadastrada
        </label>

        <button
          className="btn btn-pri"
          style={{ width: "100%", justifyContent: "center" }}
          onClick={() => onConfirm({ customPrompt: prompt, aiDecide, useFace })}
        >
          <Icon name="sparkle"/> Gerar imagem
        </button>
      </div>
    </div>
  );
}

export function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <>
      <div className="color-grid" style={{ marginBottom: 10 }}>
        {COLOR_SWATCHES.map((c) => (
          <button key={c} className={`color-sw ${value === c ? "active" : ""} ${c === "transparent" ? "transparent" : ""}`}
            style={c === "transparent" ? {} : { background: c }}
            onClick={() => onChange(c)}/>
        ))}
      </div>
      <input className="input" value={value} onChange={(e) => onChange(e.target.value)} style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12 }}/>
    </>
  );
}

export function PositionSection({ el, update }: { el: IElement; update: (p: Partial<IElement>) => void }) {
  return (
    <div className="props-section">
      <div className="props-section-title">Posição & tamanho</div>
      <div className="props-row">
        <span className="props-row-lbl">X</span>
        <input className="input" type="number" value={Math.round(el.x)} onChange={(e) => update({ x: parseInt(e.target.value || "0") })}/>
        <span className="props-row-lbl" style={{ width: "auto" }}>Y</span>
        <input className="input" type="number" value={Math.round(el.y)} onChange={(e) => update({ y: parseInt(e.target.value || "0") })}/>
      </div>
      <div className="props-row">
        <span className="props-row-lbl">L</span>
        <input className="input" type="number" value={Math.round(el.w)} onChange={(e) => update({ w: parseInt(e.target.value || "0") })}/>
        <span className="props-row-lbl" style={{ width: "auto" }}>A</span>
        <input className="input" type="number" value={Math.round(el.h)} onChange={(e) => update({ h: parseInt(e.target.value || "0") })}/>
      </div>
    </div>
  );
}

export function TextProps({
  el,
  accentColor,
  update,
  onDelete,
}: {
  el: IElement;
  accentColor: string;
  update: (p: Partial<IElement>) => void;
  onDelete: () => void;
}) {
  const highlightWords = (el.segments || [])
    .filter((s) => s.color !== "#FFFFFF" && s.color !== "#fff" && s.color !== (el.color || "#fff"))
    .map((s) => s.text.trim())
    .join(", ");

  const handleHighlightChange = (raw: string) => {
    if (!raw.trim()) {
      update({ segments: undefined });
      return;
    }
    const words = raw.split(",").map((w) => w.trim().toUpperCase()).filter(Boolean);
    const text = (el.text || "").toUpperCase();
    const segments: ISegment[] = [];
    let marked = text;
    words.forEach((w) => {
      marked = marked.split(w).join(` ${w} `);
    });
    const parts = marked.split(" ").filter(Boolean);
    parts.forEach((part) => {
      segments.push({ text: part, color: words.includes(part) ? accentColor : (el.color || "#FFFFFF") });
    });
    update({ segments: segments.length > 0 ? segments : undefined });
  };

  return (
    <>
      <div className="props-section">
        <div className="props-section-title">Texto</div>
        <textarea className="textarea" value={el.text || ""} onChange={(e) => update({ text: e.target.value })} style={{ minHeight: 80 }}/>
      </div>
      <div className="props-section">
        <div className="props-section-title">Palavras em destaque</div>
        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>Separadas por vírgula. Ficam na cor de destaque do carrossel.</div>
        <input
          className="input"
          placeholder="Ex: SUCESSO, RESULTADO"
          defaultValue={highlightWords}
          onBlur={(e) => handleHighlightChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleHighlightChange((e.target as HTMLInputElement).value); }}
        />
      </div>
      <div className="props-section">
        <div className="props-section-title">Tipografia</div>
        <div className="font-grid" style={{ marginBottom: 10 }}>
          {[{ id: "bold", display: "TheBoldFont", label: "Bold" }, { id: "modern", display: "Space Grotesk", label: "Modern" }, { id: "editorial", display: "Fraunces", label: "Editorial" }, { id: "mono", display: "JetBrains Mono", label: "Mono" }].map((fp) => (
            <button key={fp.id} className={`font-tile ${el.font === fp.display ? "active" : ""}`} style={{ fontFamily: `'${fp.display}', sans-serif` }} onClick={() => update({ font: fp.display })}>
              Aa<span className="font-tile-name">{fp.label}</span>
            </button>
          ))}
        </div>
        <div className="props-row">
          <span className="props-row-lbl">Família</span>
          <select className="select" value={el.font} onChange={(e) => update({ font: e.target.value })}>
            {FONT_FAMILIES.map((f) => <option key={f}>{f}</option>)}
          </select>
        </div>
        <div className="props-row">
          <span className="props-row-lbl">Peso</span>
          <select className="select" value={el.weight} onChange={(e) => update({ weight: parseInt(e.target.value) })}>
            {FONT_WEIGHTS.map((w) => <option key={w.v} value={w.v}>{w.l}</option>)}
          </select>
        </div>
        <div className="props-row">
          <span className="props-row-lbl">Tamanho</span>
          <div className="slider-row" style={{ flex: 1 }}>
            <input type="range" min="12" max="260" step="2" value={el.fontSize} onChange={(e) => update({ fontSize: parseInt(e.target.value) })}/>
            <span className="slider-val">{el.fontSize}</span>
          </div>
        </div>
        <div className="props-row">
          <span className="props-row-lbl">Alinhar</span>
          <div className="align-row" style={{ flex: 1 }}>
            {(["left", "center", "right"] as const).map((a) => (
              <button key={a} className={`align-btn ${el.align === a ? "active" : ""}`} onClick={() => update({ align: a })}>
                <Icon name={`align${a.charAt(0).toUpperCase() + a.slice(1)}`}/>
              </button>
            ))}
          </div>
        </div>
        <div className="props-row">
          <span className="props-row-lbl">Entre Linhas</span>
          <div className="slider-row" style={{ flex: 1 }}>
            <input type="range" min="0.5" max="2.5" step="0.05" value={el.lineHeight || 1.12} onChange={(e) => update({ lineHeight: parseFloat(e.target.value) })}/>
            <span className="slider-val">{el.lineHeight || 1.12}</span>
          </div>
        </div>
        <div className="props-row">
          <span className="props-row-lbl">Entre Letras</span>
          <div className="slider-row" style={{ flex: 1 }}>
            <input type="range" min="-0.2" max="0.5" step="0.01" value={el.letterSpacing || 0} onChange={(e) => update({ letterSpacing: parseFloat(e.target.value) })}/>
            <span className="slider-val">{el.letterSpacing || 0}</span>
          </div>
        </div>
      </div>
      <div className="props-section">
        <div className="props-section-title">Cor</div>
        <ColorPicker value={el.color || "#fff"} onChange={(c) => update({ color: c })}/>
      </div>
      <PositionSection el={el} update={update}/>
      <div className="props-section">
        <button className="btn btn-ghost" style={{ width: "100%", justifyContent: "center", color: "#fca5a5", borderColor: "rgba(239,68,68,.2)" }} onClick={onDelete}>
          <Icon name="trash"/> Excluir elemento
        </button>
      </div>
    </>
  );
}

export function ShapeProps({ el, update, onDelete }: { el: IElement; update: (p: Partial<IElement>) => void; onDelete: () => void }) {
  return (
    <>
      <div className="props-section">
        <div className="props-section-title">Forma</div>
        <div className="props-row">
          <span className="props-row-lbl">Tipo</span>
          <select className="select" value={el.shape} onChange={(e) => update({ shape: e.target.value })}>
            <option value="rect">Retângulo</option>
            <option value="circle">Círculo</option>
          </select>
        </div>
        {el.shape !== "circle" && (
          <div className="props-row">
            <span className="props-row-lbl">Raio</span>
            <div className="slider-row" style={{ flex: 1 }}>
              <input type="range" min="0" max="200" value={el.radius || 0} onChange={(e) => update({ radius: parseInt(e.target.value) })}/>
              <span className="slider-val">{el.radius || 0}</span>
            </div>
          </div>
        )}
        <div className="props-row">
          <span className="props-row-lbl">Opacidade</span>
          <div className="slider-row" style={{ flex: 1 }}>
            <input type="range" min="0" max="100" value={Math.round((el.opacity ?? 1) * 100)} onChange={(e) => update({ opacity: parseInt(e.target.value) / 100 })}/>
            <span className="slider-val">{Math.round((el.opacity ?? 1) * 100)}%</span>
          </div>
        </div>
      </div>
      <div className="props-section">
        <div className="props-section-title">Cor</div>
        <ColorPicker value={el.color || "#fff"} onChange={(c) => update({ color: c })}/>
      </div>
      <PositionSection el={el} update={update}/>
      <div className="props-section">
        <button className="btn btn-ghost" style={{ width: "100%", justifyContent: "center", color: "#fca5a5", borderColor: "rgba(239,68,68,.2)" }} onClick={onDelete}>
          <Icon name="trash"/> Excluir elemento
        </button>
      </div>
    </>
  );
}

export function ImageProps({
  el,
  update,
  onDelete,
  onRegenerate,
}: {
  el: IElement;
  update: (p: Partial<IElement>) => void;
  onDelete: () => void;
  onRegenerate: () => void;
}) {
  return (
    <>
      <div className="props-section">
        <div className="props-section-title">Imagem em box</div>
        {(el.imageUrl || el.photoUrl) ? (
          <div style={{ borderRadius: 10, overflow: "hidden", marginBottom: 10, aspectRatio: "1/1", background: "#000" }}>
            <img src={el.imageUrl || el.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}/>
          </div>
        ) : (
          <div style={{ borderRadius: 10, background: "#111", aspectRatio: "1/1", marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontSize: 13 }}>
            Sem imagem
          </div>
        )}
        <div className="props-section-title" style={{ marginBottom: 6 }}>Prompt da imagem</div>
        <textarea
          className="textarea"
          placeholder="Descreva a imagem que deve ser gerada..."
          value={el.imagePrompt || ""}
          onChange={(e) => update({ imagePrompt: e.target.value })}
          style={{ minHeight: 70, marginBottom: 10 }}
        />
        <button className="btn btn-pri" style={{ width: "100%", justifyContent: "center", marginBottom: 8 }} onClick={onRegenerate}>
          <Icon name="sparkle"/> {(el.imageUrl || el.photoUrl) ? "Regerar imagem" : "Gerar imagem"}
        </button>
      </div>
      <div className="props-section">
        <div className="props-section-title">Borda arredondada</div>
        <div className="props-row">
          <span className="props-row-lbl">Raio</span>
          <div className="slider-row" style={{ flex: 1 }}>
            <input type="range" min="0" max="200" value={el.radius || 18} onChange={(e) => update({ radius: parseInt(e.target.value) })}/>
            <span className="slider-val">{el.radius || 18}</span>
          </div>
        </div>
      </div>
      <PositionSection el={el} update={update}/>
      <div className="props-section">
        <button className="btn btn-ghost" style={{ width: "100%", justifyContent: "center", color: "#fca5a5", borderColor: "rgba(239,68,68,.2)" }} onClick={onDelete}>
          <Icon name="trash"/> Excluir elemento
        </button>
      </div>
    </>
  );
}

export function ProfileProps({ el, update, onDelete }: { el: IElement; update: (p: Partial<IElement>) => void; onDelete: () => void }) {
  return (
    <>
      <div className="props-section">
        <div className="props-section-title">Perfil</div>
        <div className="props-row">
          <span className="props-row-lbl">Handle</span>
          <input className="input" value={el.text || ""} onChange={(e) => update({ text: e.target.value })} placeholder="@seuinstagram"/>
        </div>
        <div style={{ marginTop: 12 }}>
          <div className="props-section-title" style={{ marginBottom: 6 }}>URL da foto</div>
          <input className="input" value={el.photoUrl || ""} onChange={(e) => update({ photoUrl: e.target.value })} placeholder="https://..."/>
        </div>
        <div className="props-row" style={{ marginTop: 12 }}>
          <span className="props-row-lbl">Tamanho</span>
          <div className="slider-row" style={{ flex: 1 }}>
            <input type="range" min="32" max="120" value={el.h || 56} onChange={(e) => update({ h: parseInt(e.target.value) })}/>
            <span className="slider-val">{el.h || 56}</span>
          </div>
        </div>
      </div>
      <div className="props-section">
        <div className="props-section-title">Cor do texto</div>
        <ColorPicker value={el.color || "#fff"} onChange={(c) => update({ color: c })}/>
      </div>
      <PositionSection el={el} update={update}/>
      <div className="props-section">
        <button className="btn btn-ghost" style={{ width: "100%", justifyContent: "center", color: "#fca5a5", borderColor: "rgba(239,68,68,.2)" }} onClick={onDelete}>
          <Icon name="trash"/> Excluir elemento
        </button>
      </div>
    </>
  );
}

export function BackgroundPropsPanel({
  slide,
  update,
  onRegenBg,
}: {
  slide: ISlide;
  update: (p: Partial<ISlide>) => void;
  onRegenBg?: () => void;
}) {
  return (
    <>
      {slide.bgImageUrl && (
        <div className="props-section">
          <div className="props-section-title">Imagem gerada</div>
          <div style={{ borderRadius: 10, overflow: "hidden", marginBottom: 12, aspectRatio: "4/5", background: "#000" }}>
            <img src={slide.bgImageUrl} alt="bg" style={{ width: "100%", height: "100%", objectFit: "cover" }}/>
          </div>

          <div className="props-section-title" style={{ marginBottom: 8 }}>Posição horizontal</div>
          <div className="props-row">
            <div className="slider-row" style={{ flex: 1 }}>
              <input type="range" min="0" max="100" value={slide.bgPositionX ?? 50}
                onChange={(e) => update({ bgPositionX: parseInt(e.target.value) })}/>
              <span className="slider-val">{slide.bgPositionX ?? 50}%</span>
            </div>
          </div>

          <div className="props-section-title" style={{ marginBottom: 8 }}>Posição vertical</div>
          <div className="props-row">
            <div className="slider-row" style={{ flex: 1 }}>
              <input type="range" min="0" max="100" value={slide.bgPositionY ?? 50}
                onChange={(e) => update({ bgPositionY: parseInt(e.target.value) })}/>
              <span className="slider-val">{slide.bgPositionY ?? 50}%</span>
            </div>
          </div>

          <div className="props-section-title" style={{ marginBottom: 8 }}>Escala</div>
          <div className="props-row">
            <div className="slider-row" style={{ flex: 1 }}>
              <input type="range" min="100" max="250" value={Math.round((slide.bgScale ?? 1) * 100)}
                onChange={(e) => update({ bgScale: parseInt(e.target.value) / 100 })}/>
              <span className="slider-val">{Math.round((slide.bgScale ?? 1) * 100)}%</span>
            </div>
          </div>

          {onRegenBg && (
            <button className="btn btn-pri" style={{ width: "100%", justifyContent: "center", marginBottom: 8 }} onClick={onRegenBg}>
              <Icon name="sparkle"/> Gerar outra imagem
            </button>
          )}

          <button className="btn btn-ghost" style={{ width: "100%", justifyContent: "center", color: "#fca5a5", borderColor: "rgba(239,68,68,.2)" }}
            onClick={() => update({ bgImageUrl: undefined })}>
            <Icon name="trash"/> Remover imagem
          </button>
        </div>
      )}
      <div className="props-section">
        <div className="props-section-title">Fundo predefinido</div>
        <div className="bg-grid">
          {BG_PRESETS.map((p) => (
            <button key={p.id}
              className={`bg-tile ${slide.bgKey === p.id && !slide.bgOverride && !slide.bgImageUrl ? "active" : ""}`}
              style={{ background: p.bg }}
              onClick={() => update({ bgKey: p.id, bgOverride: undefined, bgImageUrl: undefined })}
              title={p.id}/>
          ))}
        </div>
      </div>
      <div className="props-section">
        <div className="props-section-title">Cor sólida</div>
        <ColorPicker value={slide.bgOverride || ""} onChange={(c) => update({ bgOverride: c, bgImageUrl: undefined })}/>
      </div>
    </>
  );
}

export function SlidePropsPanel({ slide, idx, totalSlides, onDuplicate, onDelete }: { slide: ISlide; idx: number; totalSlides: number; onDuplicate: () => void; onDelete: () => void }) {
  return (
    <>
      <div className="props-section">
        <div className="props-section-title">Slide {String(idx + 1).padStart(2, "0")}</div>
        <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}>
          {slide.elements.length} elemento{slide.elements.length !== 1 ? "s" : ""} · {idx === 0 ? "capa" : idx === totalSlides - 1 ? "CTA final" : "desenvolvimento"}
          {slide.bgImageUrl && <><br/><span style={{ color: "#4ADE80" }}>✓ imagem gerada</span></>}
        </div>
      </div>
      <div className="props-section">
        <button className="btn btn-ghost" style={{ width: "100%", justifyContent: "center", marginBottom: 8 }} onClick={onDuplicate}>
          <Icon name="copy"/> Duplicar slide
        </button>
        <button className="btn btn-ghost" style={{ width: "100%", justifyContent: "center", color: "#fca5a5", borderColor: "rgba(239,68,68,.2)" }} onClick={onDelete} disabled={totalSlides === 1}>
          <Icon name="trash"/> Excluir slide
        </button>
      </div>
      <div className="props-section">
        <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.65 }}>
          Clique para selecionar. Duplo clique em texto para editar. Esc para desselecionar.
        </div>
      </div>
    </>
  );
}

export function LayersList({ slide, selected, onSelect, onDelete }: { slide: ISlide; selected: string | null; onSelect: (id: string) => void; onDelete: (id: string) => void }) {
  return (
    <div className="props-section">
      <div className="props-section-title">Camadas — {slide.elements.length}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {[...slide.elements].reverse().map((elItem) => (
          <div key={elItem.id}
            onClick={() => onSelect(elItem.id)}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "8px 10px", borderRadius: 8, cursor: "pointer", fontSize: 12, color: "#fff",
              background: selected === elItem.id ? "rgba(108,39,190,.18)" : "var(--bg3)",
              border: selected === elItem.id ? "1px solid rgba(168,85,247,.4)" : "1px solid var(--b)",
            }}>
            <Icon name={elItem.type === "text" ? "type" : elItem.type === "image" ? "layout" : elItem.type === "profile" ? "user" : "shapes"} size={13}/>
            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {elItem.type === "text" ? (elItem.text?.slice(0, 28) || "Texto")
                : elItem.type === "image" ? "Imagem box"
                : elItem.type === "profile" ? (elItem.text || "Perfil")
                : `Forma · ${elItem.shape}`}
            </span>
            <button className="btn-icon" style={{ width: 22, height: 22 }} onClick={(e) => { e.stopPropagation(); onDelete(elItem.id); }}>
              <Icon name="x" size={11}/>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── AddSlideModal ─────────────────────────────────────────────────
export function AddSlideModal({
  onClose,
  onBlank,
  onAI,
}: {
  onClose: () => void;
  onBlank: () => void;
  onAI: (hasImage: boolean) => void;
}) {
  const [hasImage, setHasImage] = useState(false);

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onClose}
    >
      <div
        style={{ background: "var(--bg2)", border: "1px solid var(--b)", borderRadius: 18, padding: 28, width: 440, maxWidth: "90vw" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Adicionar slide</h3>
          <button className="btn-icon" onClick={onClose}><Icon name="x" size={16}/></button>
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, cursor: "pointer", fontSize: 14, padding: "12px 14px", borderRadius: 10, border: "1px solid var(--b)", background: "var(--bg3)" }}>
          <input
            type="checkbox"
            checked={hasImage}
            onChange={(e) => setHasImage(e.target.checked)}
            style={{ width: 16, height: 16, accentColor: "#A855F7" }}
          />
          <div>
            <div style={{ fontWeight: 600 }}>Incluir imagem gerada por IA</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>Adiciona um card de imagem contextual ao slide</div>
          </div>
        </label>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            className="btn btn-pri"
            style={{ justifyContent: "center" }}
            onClick={() => onAI(hasImage)}
          >
            <Icon name="sparkle"/> Gerar com IA
            <span style={{ fontSize: 11, opacity: 0.7, marginLeft: 6 }}>analisa o carrossel e cria conteúdo</span>
          </button>
          <button
            className="btn btn-ghost"
            style={{ justifyContent: "center" }}
            onClick={onBlank}
          >
            Slide em branco
          </button>
        </div>
      </div>
    </div>
  );
}
