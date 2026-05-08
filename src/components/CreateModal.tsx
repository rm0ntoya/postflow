"use client";

import { useState, useEffect } from "react";
import Icon from "./Icon";

const TONES = [
  { id: "direct",      label: "Direto",       hint: "Curto, sem rodeios" },
  { id: "editorial",   label: "Editorial",    hint: "Revista / autoral" },
  { id: "didactic",    label: "Didático",     hint: "Explica passo a passo" },
  { id: "provocative", label: "Provocativo",  hint: "Faz pensar / contraintuitivo" },
  { id: "casual",      label: "Casual",       hint: "Tom de conversa" },
  { id: "authoritive", label: "Autoritativo", hint: "Especialista que ensina" },
];

const DETAIL_LEVELS = [
  { id: "high",   label: "Detalhado",   hint: "Argumentos completos, dados e fontes" },
  { id: "medium", label: "Equilibrado", hint: "Pontos-chave com profundidade" },
  { id: "short",  label: "Sucinto",     hint: "Direto ao ponto, frases curtas" },
];

const SUGGESTED_THEMES = [
  "5 erros que matam seu engajamento",
  "Como triplicar alcance orgânico",
  "Hooks que travam o dedo do leitor",
  "Por que ninguém compra do seu post",
  "A arquitetura de um carrossel viral",
  "O método que dobrou meu alcance em 30 dias",
  "3 verdades que ninguém te conta sobre crescer no Instagram",
];

const HOOK_LIBRARY = [
  { hook: "Todo mundo diz X. Mas a realidade é Y.", label: "Contraintuitivo" },
  { hook: "Pare de fazer isso se você quer crescer.", label: "Provocativo" },
  { hook: "O segredo que os maiores criadores escondem.", label: "Curiosidade" },
  { hook: "Fiz X experimentos. Aprenda com meus erros.", label: "Prova Social" },
  { hook: "Em 30 dias apliquei isso. Veja o resultado.", label: "Resultado" },
  { hook: "O que ninguém te ensinou sobre [tema].", label: "Gap de Saber" },
  { hook: "Se você faz isso, está perdendo seguidores.", label: "Medo de Perda" },
  { hook: "Método simples que gerou 10x mais resultados.", label: "Simplificação" },
];

interface ColorPalette {
  id: string;
  name: string;
  colors: string[];
}

const ACCENT_PRESETS = [
  { color: "#FFD700", label: "Ouro" },
  { color: "#F97316", label: "Laranja" },
  { color: "#A855F7", label: "Roxo" },
  { color: "#22D3EE", label: "Ciano" },
  { color: "#4ADE80", label: "Verde" },
  { color: "#F43F5E", label: "Vermelho" },
  { color: "#FFFFFF", label: "Branco" },
];

export interface GenerateSettings {
  theme: string;
  pasteContent?: string;
  tone: string;
  detail: string;
  slideCount: number;
  viral: boolean;
  modeDebate: boolean;
  imageSlides: number[];
  accentColor: string;
  paletteColors?: string[];
  paletteId?: string;
  useFace: boolean;
}

interface CreateModalProps {
  onClose: () => void;
  onGenerate: (settings: GenerateSettings) => void;
  prefill?: { theme?: string; tone?: string };
}

export default function CreateModal({ onClose, onGenerate, prefill }: CreateModalProps) {
  const [step, setStep] = useState(1);
  const [theme, setTheme] = useState(prefill?.theme || "");
  const [pasteContent, setPasteContent] = useState("");
  const [showPaste, setShowPaste] = useState(false);
  const [tone, setTone] = useState(prefill?.tone || "direct");
  const [detail, setDetail] = useState("medium");
  const [modeDebate, setModeDebate] = useState(false);
  const [slideCount, setSlideCount] = useState(7);
  const [viral, setViral] = useState(true);
  const [imageSlides, setImageSlides] = useState<Set<number>>(new Set([1, 3]));
  const [accentColor, setAccentColor] = useState("#FFD700");
  const [useFace, setUseFace] = useState(false);
  const [hasFaceImages, setHasFaceImages] = useState(false);

  // Palette state
  const [palettes, setPalettes] = useState<ColorPalette[]>([]);
  const [selectedPaletteId, setSelectedPaletteId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d.brandAccentColor) setAccentColor(d.brandAccentColor);
        if (d.hasFaceImages) setHasFaceImages(true);
      })
      .catch(() => {});

    fetch("/api/user/palettes")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d.palettes)) setPalettes(d.palettes); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setImageSlides((prev) => new Set(Array.from(prev).filter((i) => i < slideCount)));
  }, [slideCount]);

  const selectedPalette = palettes.find((p) => p.id === selectedPaletteId);

  const toggleImage = (i: number) => {
    setImageSlides((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  };

  const useHook = (hook: string) => {
    setTheme(hook);
    setShowPaste(false);
  };

  const canGen = theme.trim().length >= 4;

  const effectiveAccent = selectedPalette && selectedPalette.colors.length > 0
    ? selectedPalette.colors[0]
    : accentColor;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h2><span className="gt">Novo carrossel</span> com IA</h2>
            <p>Etapa {step} de 3 · {step === 1 ? "Tema e formato" : step === 2 ? "Detalhamento e tom" : "Imagens e otimizações"}</p>
          </div>
          <button className="modal-close" onClick={onClose}><Icon name="x"/></button>
        </div>

        <div className="modal-body">
          {/* ── STEP 1: Theme & Format ── */}
          {step === 1 && (
            <>
              <div className="field">
                <div className="field-label">
                  Tema ou assunto do carrossel
                  <span className="field-hint">{theme.length}/200</span>
                </div>
                <textarea
                  className="textarea lg"
                  placeholder='ex: "Como criar uma rotina de conteúdo que aguenta 6 meses"'
                  maxLength={200}
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="field">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div className="field-label" style={{ marginBottom: 0 }}>Sugestões para começar</div>
                  <button
                    onClick={() => setShowPaste(!showPaste)}
                    className="btn btn-ghost"
                    style={{ fontSize: 11, padding: "5px 12px" }}
                  >
                    <Icon name="image"/> {showPaste ? "Ocultar" : "Colar conteúdo existente"}
                  </button>
                </div>
                <div className="chip-grid">
                  {SUGGESTED_THEMES.map((s) => (
                    <button key={s} className="chip" onClick={() => setTheme(s)}>
                      <Icon name="sparkle"/> {s}
                    </button>
                  ))}
                </div>
              </div>

              {showPaste && (
                <div className="field" style={{ background: "rgba(168,85,247,.05)", border: "1px solid rgba(168,85,247,.2)", borderRadius: 14, padding: 16 }}>
                  <div className="field-label" style={{ color: "#C4B5FD" }}>
                    <Icon name="sparkle"/> Colar Qualquer Coisa
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>
                    Cole um post de blog, thread, e-mail, transcrição de vídeo ou qualquer texto. A IA extrai os pontos principais e transforma em carrossel.
                  </div>
                  <textarea
                    className="textarea"
                    style={{ minHeight: 120, fontSize: 13 }}
                    placeholder="Cole aqui seu conteúdo longo... artigo, thread, transcrição, e-mail, etc."
                    value={pasteContent}
                    onChange={(e) => setPasteContent(e.target.value)}
                  />
                  <div style={{ fontSize: 11, color: "var(--dim)", marginTop: 6 }}>
                    A IA vai condensar este conteúdo em slides. O campo &ldquo;tema&rdquo; acima será usado como título geral.
                  </div>
                </div>
              )}

              <div className="field">
                <div className="field-label">Biblioteca de Hooks</div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>Hooks com alto potencial viral — clique para usar como tema</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {HOOK_LIBRARY.map((h) => (
                    <button
                      key={h.hook}
                      onClick={() => useHook(h.hook)}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        background: "var(--bg3)", border: "1px solid var(--b)",
                        borderRadius: 10, padding: "10px 14px",
                        cursor: "pointer", textAlign: "left", gap: 12,
                        transition: "border-color .2s",
                      }}
                      className="hook-btn"
                    >
                      <span style={{ fontSize: 13, color: "rgba(255,255,255,.75)", flex: 1 }}>{h.hook}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".05em", textTransform: "uppercase", color: "#A855F7", flexShrink: 0, background: "rgba(168,85,247,.12)", border: "1px solid rgba(168,85,247,.25)", borderRadius: 999, padding: "2px 8px" }}>{h.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="field">
                <div className="field-label">Número de slides</div>
                <div className="slide-count-row">
                  {[3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <button key={n} className={`slide-count-btn ${slideCount === n ? "active" : ""}`} onClick={() => setSlideCount(n)}>
                      {n}
                    </button>
                  ))}
                </div>
                <div className="field-help">Carrosséis entre 6 e 8 slides têm os melhores índices de retenção no Instagram.</div>
              </div>
            </>
          )}

          {/* ── STEP 2: Tone & Detail ── */}
          {step === 2 && (
            <>
              <div className="field">
                <div className="field-label">Estilo de escrita</div>
                <div className="chip-grid">
                  {TONES.map((t) => (
                    <button key={t.id} className={`chip ${tone === t.id ? "active" : ""}`} onClick={() => setTone(t.id)}>
                      {t.label}
                      <span style={{ color: "rgba(255,255,255,.4)", fontSize: 11 }}>· {t.hint}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="field">
                <div className="field-label">Nível de detalhe do conteúdo</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                  {DETAIL_LEVELS.map((d) => (
                    <button key={d.id}
                      className={`chip ${detail === d.id ? "active" : ""}`}
                      onClick={() => setDetail(d.id)}
                      style={{ flexDirection: "column", alignItems: "flex-start", padding: "14px 16px", height: "auto", textAlign: "left" }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: "#fff" }}>{d.label}</span>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,.5)", marginTop: 4, lineHeight: 1.45 }}>{d.hint}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="field">
                <div className="field-label">Modo especial</div>
                <div
                  className={`toggle-row ${modeDebate ? "on" : ""}`}
                  onClick={() => setModeDebate(!modeDebate)}
                  style={{ background: modeDebate ? "rgba(249,115,22,.08)" : undefined, borderColor: modeDebate ? "rgba(249,115,22,.3)" : undefined }}
                >
                  <div className="toggle-row-text">
                    <div className="toggle-row-title" style={{ color: modeDebate ? "#F97316" : undefined }}>
                      🔥 Modo Debate / Contraintuitivo
                    </div>
                    <div className="toggle-row-sub">
                      Estrutura provocativa: &ldquo;Todo mundo diz X. Mas a realidade é Y. Aqui está a prova.&rdquo; Alto potencial viral por contrariedade controlada.
                    </div>
                  </div>
                  <div className={`tg ${modeDebate ? "on" : ""}`} style={{ background: modeDebate ? "#F97316" : undefined }}><div className="tg-k"/></div>
                </div>
              </div>
            </>
          )}

          {/* ── STEP 3: Images & Palette ── */}
          {step === 3 && (
            <>
              <div className="field">
                <div className="field-label">
                  Quais slides terão imagem?
                  <span className="field-hint">{imageSlides.size} de {slideCount} selecionados</span>
                </div>
                <div className="img-grid" style={{ gridTemplateColumns: `repeat(${Math.min(slideCount, 8)}, 1fr)` }}>
                  {Array.from({ length: slideCount }, (_, i) => (
                    <button key={i} className={`img-tile ${imageSlides.has(i) ? "on" : ""}`} onClick={() => toggleImage(i)}>
                      <div className="img-tile-num">{String(i + 1).padStart(2, "0")}</div>
                      <div className="img-tile-ico">
                        {imageSlides.has(i) ? <Icon name="check"/> : <Icon name="image"/>}
                      </div>
                      <div className="img-tile-lbl">{i === 0 ? "capa" : i === slideCount - 1 ? "cta" : "slide"}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Palette selector */}
              {palettes.length > 0 && (
                <div className="field">
                  <div className="field-label">Paleta de cores</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <button
                      onClick={() => setSelectedPaletteId(null)}
                      style={{
                        display: "flex", alignItems: "center", gap: 12,
                        background: selectedPaletteId === null ? "rgba(108,39,190,.12)" : "var(--bg3)",
                        border: selectedPaletteId === null ? "1px solid rgba(108,39,190,.4)" : "1px solid var(--b)",
                        borderRadius: 12, padding: "12px 16px", cursor: "pointer", textAlign: "left",
                      }}
                    >
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: accentColor, border: "1px solid rgba(255,255,255,.2)", flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: "#fff" }}>Cor de destaque padrão</div>
                        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{accentColor}</div>
                      </div>
                      {selectedPaletteId === null && <div style={{ marginLeft: "auto", color: "#A855F7", fontSize: 12 }}>✓ Selecionado</div>}
                    </button>

                    {palettes.map((pal) => (
                      <button
                        key={pal.id}
                        onClick={() => setSelectedPaletteId(pal.id)}
                        style={{
                          display: "flex", alignItems: "center", gap: 12,
                          background: selectedPaletteId === pal.id ? "rgba(108,39,190,.12)" : "var(--bg3)",
                          border: selectedPaletteId === pal.id ? "1px solid rgba(108,39,190,.4)" : "1px solid var(--b)",
                          borderRadius: 12, padding: "12px 16px", cursor: "pointer", textAlign: "left",
                        }}
                      >
                        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                          {pal.colors.slice(0, 5).map((hex) => (
                            <div key={hex} style={{ width: 20, height: 20, borderRadius: 5, background: hex, border: "1px solid rgba(255,255,255,.15)" }} />
                          ))}
                          {pal.colors.length > 5 && (
                            <div style={{ width: 20, height: 20, borderRadius: 5, background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "var(--muted)" }}>
                              +{pal.colors.length - 5}
                            </div>
                          )}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500, color: "#fff" }}>{pal.name}</div>
                          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{pal.colors.length} cor{pal.colors.length !== 1 ? "es" : ""}</div>
                        </div>
                        {selectedPaletteId === pal.id && <div style={{ marginLeft: "auto", color: "#A855F7", fontSize: 12 }}>✓ Selecionado</div>}
                      </button>
                    ))}
                  </div>
                  <div className="field-help">A primeira cor da paleta será usada nos destaques de texto e nas imagens geradas.</div>
                </div>
              )}

              {/* Custom color picker (shown when no palette selected or no palettes) */}
              {!selectedPaletteId && (
                <div className="field">
                  <div className="field-label">Cor de destaque do carrossel</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    {ACCENT_PRESETS.map((p) => (
                      <button
                        key={p.color}
                        title={p.label}
                        onClick={() => setAccentColor(p.color)}
                        style={{
                          width: 32, height: 32, borderRadius: "50%",
                          background: p.color,
                          border: accentColor === p.color ? "3px solid #fff" : "2px solid rgba(255,255,255,0.2)",
                          cursor: "pointer", flexShrink: 0,
                          boxShadow: accentColor === p.color ? `0 0 0 2px ${p.color}55` : "none",
                        }}
                      />
                    ))}
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 4 }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: accentColor, border: "2px solid rgba(255,255,255,0.3)", flexShrink: 0 }}/>
                      <input
                        type="text"
                        className="input"
                        value={accentColor}
                        onChange={(e) => { if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) setAccentColor(e.target.value); }}
                        style={{ width: 90, fontFamily: "JetBrains Mono, monospace", fontSize: 12 }}
                        placeholder="#FFD700"
                      />
                    </div>
                  </div>
                  <div className="field-help">Cor usada nos destaques de texto e na iluminação das imagens geradas.</div>
                </div>
              )}

              <div className="field">
                <div className="field-label">Otimizações</div>
                <div className={`toggle-row viral ${viral ? "on" : ""}`} onClick={() => setViral(!viral)}>
                  <div className="toggle-row-text">
                    <div className="toggle-row-title"><Icon name="flame"/> Fator viral</div>
                    <div className="toggle-row-sub">Ativa ganchos fortes, imagens surreais e cinematográficas, loops narrativos e CTA estratégico.</div>
                  </div>
                  <div className={`tg ${viral ? "on" : ""}`}><div className="tg-k"/></div>
                </div>

                {hasFaceImages && (
                  <div className={`toggle-row ${useFace ? "on" : ""}`} style={{ marginTop: 8 }} onClick={() => setUseFace(!useFace)}>
                    <div className="toggle-row-text">
                      <div className="toggle-row-title"><Icon name="user"/> Usar meu rosto nas imagens</div>
                      <div className="toggle-row-sub">O Gemini usará suas fotos de referência para gerar imagens com seu rosto como sujeito principal.</div>
                    </div>
                    <div className={`tg ${useFace ? "on" : ""}`}><div className="tg-k"/></div>
                  </div>
                )}
              </div>

              <div className="field">
                <div className="field-label">Resumo</div>
                <div style={{ background: "var(--bg3)", border: "1px solid var(--b)", borderRadius: 12, padding: "14px 16px", fontSize: 12, color: "var(--muted)", lineHeight: 1.7 }}>
                  <div>
                    <b style={{ color: "#fff" }}>{slideCount} slides</b> · tom <b style={{ color: "#fff" }}>{TONES.find((t) => t.id === tone)?.label.toLowerCase()}</b> · detalhe <b style={{ color: "#fff" }}>{DETAIL_LEVELS.find((d) => d.id === detail)?.label.toLowerCase()}</b>
                  </div>
                  <div>
                    Imagens em <b style={{ color: "#fff" }}>{imageSlides.size}</b> slide{imageSlides.size === 1 ? "" : "s"}
                    {viral ? " · " : ""}{viral && <b style={{ color: "#F97316" }}>fator viral ativo</b>}
                    {modeDebate ? " · " : ""}{modeDebate && <b style={{ color: "#F97316" }}>modo debate ativo</b>}
                    {useFace ? " · " : ""}{useFace && <b style={{ color: effectiveAccent }}>rosto de referência ativo</b>}
                    {pasteContent.trim() ? " · " : ""}{pasteContent.trim() && <b style={{ color: "#C4B5FD" }}>conteúdo colado</b>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
                    {selectedPalette ? (
                      <>
                        <div style={{ display: "flex", gap: 3 }}>
                          {selectedPalette.colors.slice(0, 4).map((hex) => (
                            <div key={hex} style={{ width: 12, height: 12, borderRadius: 3, background: hex, flexShrink: 0 }} />
                          ))}
                        </div>
                        <span>Paleta: <b style={{ color: "#C4B5FD" }}>{selectedPalette.name}</b></span>
                      </>
                    ) : (
                      <>
                        <div style={{ width: 12, height: 12, borderRadius: "50%", background: accentColor, flexShrink: 0 }}/>
                        <span>Cor de destaque: <b style={{ color: accentColor }}>{accentColor}</b></span>
                      </>
                    )}
                  </div>
                  <div style={{ marginTop: 6, color: "#C4B5FD" }}>Tema: &ldquo;{theme || "—"}&rdquo;</div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="modal-foot">
          <div className="modal-foot-info">
            <Icon name="zap"/>
            Estimado: ~{Math.max(8, slideCount * 3)}s · 1 crédito Gemini
          </div>
          <div className="modal-foot-actions">
            {step > 1 && <button className="btn btn-ghost" onClick={() => setStep((s) => s - 1)}><Icon name="arrowLeft"/> Voltar</button>}
            {step < 3 && <button className="btn btn-pri" onClick={() => setStep((s) => s + 1)} disabled={step === 1 && !canGen}>Continuar <Icon name="arrowRight"/></button>}
            {step === 3 && (
              <button
                className="btn btn-pri"
                onClick={() => onGenerate({
                  theme,
                  pasteContent: pasteContent.trim() || undefined,
                  tone,
                  detail,
                  slideCount,
                  viral,
                  modeDebate,
                  imageSlides: Array.from(imageSlides),
                  accentColor: effectiveAccent,
                  paletteColors: selectedPalette?.colors,
                  paletteId: selectedPalette?.id,
                  useFace,
                })}
              >
                <Icon name="sparkle"/> Gerar carrossel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
