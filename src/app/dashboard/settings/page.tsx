"use client";

import { useState, useEffect, FormEvent, useRef } from "react";
import Icon from "@/components/Icon";
import Toast from "@/components/Toast";

type Section = "api" | "visual" | "palettes" | "profile";

const ACCENT_PRESETS = [
  "#FFD700", "#F97316", "#A855F7", "#22D3EE",
  "#4ADE80", "#F43F5E", "#FFFFFF", "#60A5FA",
];

const PALETTE_COLOR_PRESETS = [
  "#FFD700", "#F97316", "#A855F7", "#22D3EE", "#4ADE80", "#F43F5E",
  "#FFFFFF", "#60A5FA", "#FB923C", "#34D399", "#F472B6", "#FBBF24",
  "#C084FC", "#38BDF8", "#6EE7B7", "#FDA4AF", "#FCD34D", "#818CF8",
];

interface ColorPalette {
  id: string;
  name: string;
  colors: string[];
}

function resizeImageToBase64(file: File, maxPx = 512): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = e.target!.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/* ── Palette Editor Modal ── */
function PaletteModal({
  palette,
  onSave,
  onClose,
}: {
  palette?: ColorPalette;
  onSave: (name: string, colors: string[]) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(palette?.name || "");
  const [colors, setColors] = useState<string[]>(palette?.colors || []);
  const [customColor, setCustomColor] = useState("#A855F7");
  const [customHex, setCustomHex] = useState("#A855F7");

  const addColor = (hex: string) => {
    if (colors.includes(hex)) return;
    if (colors.length >= 12) return;
    setColors((p) => [...p, hex]);
  };

  const removeColor = (hex: string) => setColors((p) => p.filter((c) => c !== hex));

  const handleSave = () => {
    if (!name.trim() || colors.length === 0) return;
    onSave(name.trim(), colors);
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(0,0,0,.8)", backdropFilter: "blur(12px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: "var(--bg2)", border: "1px solid rgba(168,85,247,.25)",
        borderRadius: 20, padding: 28, width: "100%", maxWidth: 520,
        boxShadow: "0 24px 64px rgba(0,0,0,.6)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <h3 style={{ fontSize: 18, fontWeight: 500, color: "#fff" }}>
            {palette ? "Editar paleta" : "Nova paleta"}
          </h3>
          <button
            onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid var(--b)", background: "rgba(255,255,255,.05)", color: "var(--muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}
          >×</button>
        </div>

        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,.5)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Nome da paleta</div>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='ex: "Marca Principal"'
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,.5)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
            Cores selecionadas ({colors.length}/12)
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, minHeight: 40 }}>
            {colors.length === 0 && (
              <span style={{ fontSize: 13, color: "var(--dim)" }}>Nenhuma cor adicionada ainda</span>
            )}
            {colors.map((hex) => (
              <div
                key={hex}
                style={{ position: "relative", cursor: "pointer" }}
                onClick={() => removeColor(hex)}
                title={`${hex} — clique para remover`}
              >
                <div style={{ width: 36, height: 36, borderRadius: 8, background: hex, border: "2px solid rgba(255,255,255,.2)" }} />
                <div style={{
                  position: "absolute", top: -6, right: -6, width: 16, height: 16,
                  borderRadius: "50%", background: "#ef4444", border: "1px solid #000",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, color: "#fff", fontWeight: 700,
                }}>×</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,.5)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Adicionar cor predefinida</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {PALETTE_COLOR_PRESETS.map((hex) => (
              <button
                key={hex}
                onClick={() => addColor(hex)}
                title={hex}
                style={{
                  width: 32, height: 32, borderRadius: 8, background: hex,
                  border: colors.includes(hex) ? "2px solid #fff" : "2px solid rgba(255,255,255,.15)",
                  cursor: "pointer",
                  boxShadow: colors.includes(hex) ? `0 0 0 2px ${hex}55` : "none",
                  opacity: colors.includes(hex) ? 0.5 : 1,
                }}
              />
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,.5)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Cor personalizada</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input
              type="color"
              value={customColor.length === 7 ? customColor : "#A855F7"}
              onChange={(e) => { setCustomColor(e.target.value); setCustomHex(e.target.value); }}
              style={{ width: 44, height: 44, borderRadius: 10, border: "none", cursor: "pointer", background: "transparent", padding: 0 }}
            />
            <input
              className="input"
              value={customHex}
              onChange={(e) => {
                setCustomHex(e.target.value);
                if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) setCustomColor(e.target.value);
              }}
              placeholder="#A855F7"
              style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 13, width: 110 }}
            />
            <button
              className="btn btn-ghost"
              onClick={() => addColor(customColor)}
              disabled={!(/^#[0-9A-Fa-f]{6}$/.test(customColor)) || colors.includes(customColor) || colors.length >= 12}
            >
              Adicionar
            </button>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button
            className="btn btn-pri"
            onClick={handleSave}
            disabled={!name.trim() || colors.length === 0}
          >
            <Icon name="check" /> {palette ? "Salvar alterações" : "Criar paleta"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [section, setSection] = useState<Section>("api");

  // API key
  const [maskedKey, setMaskedKey] = useState<string | null>(null);
  const [hasKey, setHasKey] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  // Visual identity
  const [accentColor, setAccentColor] = useState("#FFD700");
  const [faceImages, setFaceImages] = useState<string[]>([]);
  const [profileAvatarUrl, setProfileAvatarUrl] = useState("");
  const [visualLoading, setVisualLoading] = useState(false);
  const [savingVisual, setSavingVisual] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarFileRef = useRef<HTMLInputElement>(null);

  // Palettes
  const [palettes, setPalettes] = useState<ColorPalette[]>([]);
  const [palettesLoading, setPalettesLoading] = useState(false);
  const [paletteModal, setPaletteModal] = useState<{ open: boolean; editing?: ColorPalette }>({ open: false });

  const [toast, setToast] = useState("");
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(""), 2500); };

  useEffect(() => {
    fetch("/api/user/api-key")
      .then(async (r) => {
        if (!r.ok) return;
        const d = await r.json();
        setHasKey(d.hasKey);
        setMaskedKey(d.maskedKey);
      })
      .catch(() => showToast("Erro ao carregar configurações"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (section !== "visual") return;
    setVisualLoading(true);
    fetch("/api/user/profile")
      .then(async (r) => {
        if (!r.ok) return;
        const d = await r.json();
        if (d.brandAccentColor) setAccentColor(d.brandAccentColor);
        if (Array.isArray(d.faceReferenceImages)) setFaceImages(d.faceReferenceImages);
        if (typeof d.profileAvatarUrl === "string") setProfileAvatarUrl(d.profileAvatarUrl);
      })
      .catch(() => showToast("Erro ao carregar perfil visual"))
      .finally(() => setVisualLoading(false));
  }, [section]);

  useEffect(() => {
    if (section !== "palettes") return;
    setPalettesLoading(true);
    fetch("/api/user/palettes")
      .then(async (r) => {
        if (!r.ok) return;
        const d = await r.json();
        setPalettes(d.palettes || []);
      })
      .catch(() => showToast("Erro ao carregar paletas"))
      .finally(() => setPalettesLoading(false));
  }, [section]);

  async function handleFaceUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const remaining = 3 - faceImages.length;
    const toProcess = files.slice(0, remaining);
    const converted = await Promise.all(toProcess.map((f) => resizeImageToBase64(f)));
    setFaceImages((prev) => [...prev, ...converted].slice(0, 3));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSaveVisual() {
    setSavingVisual(true);
    const res = await fetch("/api/user/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brandAccentColor: accentColor, faceReferenceImages: faceImages, profileAvatarUrl }),
    });
    setSavingVisual(false);
    if (res.ok) showToast("Identidade visual salva!");
    else showToast("Erro ao salvar.");
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/user/api-key", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey: newKey }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { showToast(`Erro: ${data.error}`); return; }
    showToast("API Key salva com sucesso!");
    setNewKey(""); setHasKey(true);
    const updated = await fetch("/api/user/api-key").then((r) => r.json());
    setMaskedKey(updated.maskedKey);
  }

  async function handleRemove() {
    if (!confirm("Remover sua Gemini API Key? Você não poderá gerar carrosséis sem ela.")) return;
    setRemoving(true);
    await fetch("/api/user/api-key", { method: "DELETE" });
    setHasKey(false); setMaskedKey(null); setRemoving(false);
    showToast("API Key removida.");
  }

  async function handleCreatePalette(name: string, colors: string[]) {
    const res = await fetch("/api/user/palettes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, colors }),
    });
    const data = await res.json();
    if (res.ok) {
      setPalettes((p) => [...p, data.palette]);
      setPaletteModal({ open: false });
      showToast("Paleta criada!");
    } else {
      showToast(data.error || "Erro ao criar paleta.");
    }
  }

  async function handleUpdatePalette(id: string, name: string, colors: string[]) {
    const res = await fetch("/api/user/palettes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name, colors }),
    });
    const data = await res.json();
    if (res.ok) {
      setPalettes((p) => p.map((pal) => (pal.id === id ? data.palette : pal)));
      setPaletteModal({ open: false });
      showToast("Paleta atualizada!");
    } else {
      showToast(data.error || "Erro ao atualizar paleta.");
    }
  }

  async function handleDeletePalette(id: string) {
    if (!confirm("Excluir esta paleta?")) return;
    const res = await fetch(`/api/user/palettes?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setPalettes((p) => p.filter((pal) => pal.id !== id));
      showToast("Paleta excluída.");
    } else {
      showToast("Erro ao excluir paleta.");
    }
  }

  return (
    <div className="main">
      <div className="topbar">
        <div className="tb-left">
          <h1>Configurações</h1>
          <p>Gerencie sua conta e integrações</p>
        </div>
      </div>

      <div className="content">
        <div className="settings-grid">
          <nav className="settings-side">
            <button className={`settings-side-link ${section === "api" ? "active" : ""}`} onClick={() => setSection("api")}><Icon name="key"/> API Keys</button>
            <button className={`settings-side-link ${section === "visual" ? "active" : ""}`} onClick={() => setSection("visual")}><Icon name="image"/> Identidade Visual</button>
            <button className={`settings-side-link ${section === "palettes" ? "active" : ""}`} onClick={() => setSection("palettes")}><Icon name="sparkle"/> Paletas de Cores</button>
            <button className={`settings-side-link ${section === "profile" ? "active" : ""}`} onClick={() => setSection("profile")}><Icon name="user"/> Conta</button>
          </nav>

          <div>
            {/* ── API KEY ── */}
            {section === "api" && (
              <div className="card">
                <div className="card-h">
                  <div>
                    <h2>Gemini API Key</h2>
                    <p>Conecte sua chave do Google Gemini para gerar conteúdo com IA. Armazenada criptografada com AES-256-GCM.</p>
                  </div>
                  <div className={`api-key-status ${hasKey ? "" : "off"}`}>
                    <Icon name={hasKey ? "check" : "key"}/>
                    {hasKey ? "Conectado" : "Desconectado"}
                  </div>
                </div>

                {loading ? (
                  <div style={{ fontSize: 13, color: "var(--muted)" }}>Carregando…</div>
                ) : (
                  <>
                    {hasKey && maskedKey && (
                      <div className="kv-row" style={{ gridTemplateColumns: "1fr auto" }}>
                        <div>
                          <div className="kv-row-key">Chave ativa</div>
                          <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 13, color: "var(--green)", marginTop: 4 }}>{maskedKey}</div>
                        </div>
                        <button className="btn btn-ghost" style={{ color: "#fca5a5", alignSelf: "center" }} onClick={handleRemove} disabled={removing}>
                          {removing ? "Removendo…" : "Remover"}
                        </button>
                      </div>
                    )}

                    <form onSubmit={handleSave} style={{ marginTop: hasKey ? 16 : 0 }}>
                      <div className="kv-row">
                        <div>
                          <div className="kv-row-key">{hasKey ? "Substituir chave" : "Adicionar chave"}</div>
                          <div className="kv-row-key-sub">Obtenha sua chave em <span style={{ color: "#C4B5FD" }}>aistudio.google.com/apikey</span></div>
                        </div>
                        <div className="kv-row-val">
                          <div className="api-key-input">
                            <input className="input" type={showKey ? "text" : "password"} placeholder="AIzaSy…" value={newKey}
                              onChange={(e) => setNewKey(e.target.value)}
                              required
                              style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12 }}/>
                            <button type="button" className="btn btn-ghost" onClick={() => setShowKey(!showKey)}>
                              <Icon name={showKey ? "eyeOff" : "eye"}/>
                            </button>
                          </div>
                          <button type="submit" className="btn btn-pri" disabled={saving || !newKey} style={{ alignSelf: "flex-start" }}>
                            <Icon name="check"/> {saving ? "Salvando…" : "Salvar e validar"}
                          </button>
                        </div>
                      </div>
                    </form>

                    <div className="kv-row">
                      <div>
                        <div className="kv-row-key">Como obter sua chave</div>
                      </div>
                      <div className="kv-row-val" style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7 }}>
                        1. Acesse <span style={{ color: "#C4B5FD" }}>aistudio.google.com/apikey</span><br/>
                        2. Faça login com Google<br/>
                        3. Clique em &ldquo;Create API Key&rdquo;<br/>
                        4. Copie e cole acima
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── VISUAL IDENTITY ── */}
            {section === "visual" && (
              <div className="card">
                <div className="card-h">
                  <div>
                    <h2>Identidade Visual</h2>
                    <p>Configure cor de destaque e fotos de referência facial para seus carrosséis.</p>
                  </div>
                </div>

                {visualLoading ? (
                  <div style={{ fontSize: 13, color: "var(--muted)" }}>Carregando…</div>
                ) : (
                  <>
                    <div className="kv-row">
                      <div>
                        <div className="kv-row-key">Cor de destaque padrão</div>
                        <div className="kv-row-key-sub">Usada nos títulos e na iluminação das imagens geradas quando nenhuma paleta é selecionada</div>
                      </div>
                      <div className="kv-row-val">
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                          {ACCENT_PRESETS.map((c) => (
                            <button
                              key={c}
                              onClick={() => setAccentColor(c)}
                              style={{
                                width: 32, height: 32, borderRadius: "50%",
                                background: c, border: accentColor === c ? "3px solid #fff" : "2px solid rgba(255,255,255,0.2)",
                                cursor: "pointer",
                                boxShadow: accentColor === c ? `0 0 0 2px ${c}66` : "none",
                              }}
                            />
                          ))}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 40, height: 40, borderRadius: 8, background: accentColor, border: "2px solid rgba(255,255,255,0.2)", flexShrink: 0 }}/>
                          <input
                            type="text"
                            className="input"
                            value={accentColor}
                            onChange={(e) => { if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) setAccentColor(e.target.value); }}
                            placeholder="#FFD700"
                            style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 13, width: 110 }}
                          />
                          <input
                            type="color"
                            value={accentColor.length === 7 ? accentColor : "#FFD700"}
                            onChange={(e) => setAccentColor(e.target.value)}
                            style={{ width: 40, height: 40, borderRadius: 8, border: "none", cursor: "pointer", background: "transparent", padding: 0 }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="kv-row">
                      <div>
                        <div className="kv-row-key">Foto do perfil nos slides</div>
                        <div className="kv-row-key-sub">Aparece ao lado do @instagram em cada slide. Deixe vazio para usar ícone genérico.</div>
                      </div>
                      <div className="kv-row-val">
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                          {profileAvatarUrl ? (
                            <div style={{ position: "relative" }}>
                              <div style={{ width: 64, height: 64, borderRadius: "50%", overflow: "hidden", border: "2px solid rgba(255,255,255,0.3)" }}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={profileAvatarUrl} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }}/>
                              </div>
                              <button onClick={() => setProfileAvatarUrl("")} style={{ position: "absolute", top: -4, right: -4, width: 20, height: 20, borderRadius: "50%", background: "#ef4444", border: "none", color: "#fff", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                            </div>
                          ) : (
                            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "2px dashed rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}>
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                            </div>
                          )}
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <button onClick={() => avatarFileRef.current?.click()} className="btn btn-ghost" style={{ fontSize: 12 }}>
                              <Icon name="image"/> {profileAvatarUrl ? "Trocar foto" : "Escolher foto"}
                            </button>
                          </div>
                        </div>
                        <input
                          ref={avatarFileRef}
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const b64 = await resizeImageToBase64(file, 256);
                              setProfileAvatarUrl(b64);
                            }
                            if (avatarFileRef.current) avatarFileRef.current.value = "";
                          }}
                        />
                        <div style={{ fontSize: 12, color: "var(--dim)" }}>Redimensionada para 256px. Use foto de rosto em boa qualidade.</div>
                      </div>
                    </div>

                    <div className="kv-row">
                      <div>
                        <div className="kv-row-key">Fotos de referência facial</div>
                        <div className="kv-row-key-sub">Até 3 fotos do seu rosto. Quando ativo, o Gemini usa seu rosto para gerar as imagens.</div>
                      </div>
                      <div className="kv-row-val">
                        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
                          {faceImages.map((img, idx) => (
                            <div key={idx} style={{ position: "relative" }}>
                              <div style={{ width: 80, height: 80, borderRadius: 12, overflow: "hidden", border: "2px solid rgba(255,255,255,0.2)" }}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={img} alt={`face ${idx + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }}/>
                              </div>
                              <button
                                onClick={() => setFaceImages((prev) => prev.filter((_, i) => i !== idx))}
                                style={{ position: "absolute", top: -6, right: -6, width: 22, height: 22, borderRadius: "50%", background: "#ef4444", border: "none", color: "#fff", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                              >×</button>
                            </div>
                          ))}
                          {faceImages.length < 3 && (
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              style={{ width: 80, height: 80, borderRadius: 12, border: "2px dashed rgba(255,255,255,0.25)", background: "var(--bg3)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, color: "var(--muted)", fontSize: 11 }}
                            >
                              <Icon name="image" size={20}/>
                              <span>Adicionar</span>
                            </button>
                          )}
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          multiple
                          style={{ display: "none" }}
                          onChange={handleFaceUpload}
                        />
                        <div style={{ fontSize: 12, color: "var(--dim)" }}>
                          Imagens redimensionadas automaticamente para 512px. Use fotos nítidas do rosto de frente.
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                      <button className="btn btn-pri" onClick={handleSaveVisual} disabled={savingVisual}>
                        <Icon name="check"/> {savingVisual ? "Salvando…" : "Salvar identidade visual"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── PALETTES ── */}
            {section === "palettes" && (
              <div className="card">
                <div className="card-h">
                  <div>
                    <h2>Paletas de Cores</h2>
                    <p>Crie grupos de cores para usar na geração dos seus carrosséis. Cada paleta pode ter múltiplas cores.</p>
                  </div>
                  <button className="btn btn-pri" onClick={() => setPaletteModal({ open: true })}>
                    <Icon name="sparkle"/> Nova paleta
                  </button>
                </div>

                {palettesLoading ? (
                  <div style={{ fontSize: 13, color: "var(--muted)" }}>Carregando…</div>
                ) : palettes.length === 0 ? (
                  <div style={{
                    border: "2px dashed rgba(255,255,255,.1)", borderRadius: 16,
                    padding: "40px 24px", textAlign: "center",
                  }}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>🎨</div>
                    <div style={{ fontSize: 15, fontWeight: 500, color: "#fff", marginBottom: 8 }}>Nenhuma paleta criada</div>
                    <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 20 }}>
                      Crie paletas de cores para usar na geração dos seus carrosséis.<br/>
                      Na hora de criar um carrossel, você poderá escolher qual paleta usar.
                    </div>
                    <button className="btn btn-pri" onClick={() => setPaletteModal({ open: true })}>
                      <Icon name="sparkle"/> Criar primeira paleta
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {palettes.map((pal) => (
                      <div
                        key={pal.id}
                        style={{
                          background: "var(--bg3)", border: "1px solid var(--b)",
                          borderRadius: 14, padding: "16px 18px",
                          display: "flex", alignItems: "center", gap: 16,
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 500, color: "#fff", marginBottom: 10 }}>{pal.name}</div>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            {pal.colors.map((hex) => (
                              <div
                                key={hex}
                                title={hex}
                                style={{ width: 28, height: 28, borderRadius: 6, background: hex, border: "1px solid rgba(255,255,255,.15)" }}
                              />
                            ))}
                            {pal.colors.length === 0 && (
                              <span style={{ fontSize: 12, color: "var(--dim)" }}>Sem cores</span>
                            )}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                          <button
                            className="btn btn-ghost"
                            style={{ fontSize: 12 }}
                            onClick={() => setPaletteModal({ open: true, editing: pal })}
                          >
                            Editar
                          </button>
                          <button
                            className="btn btn-ghost"
                            style={{ fontSize: 12, color: "#fca5a5" }}
                            onClick={() => handleDeletePalette(pal.id)}
                          >
                            Excluir
                          </button>
                        </div>
                      </div>
                    ))}
                    <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 4 }}>
                      {palettes.length} paleta{palettes.length !== 1 ? "s" : ""} · Selecione uma paleta ao criar um carrossel para aplicar as cores automaticamente.
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── PROFILE ── */}
            {section === "profile" && (
              <div className="card">
                <div className="card-h"><div><h2>Conta</h2><p>Informações da sua conta NovaCraft.</p></div></div>
                <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7, padding: "16px 0" }}>
                  <p>Para alterar senha ou email, use o menu de logout e registre-se novamente.</p>
                  <p style={{ marginTop: 8, color: "var(--dim)" }}>Mais opções de conta em breve.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {paletteModal.open && (
        <PaletteModal
          palette={paletteModal.editing}
          onSave={(name, colors) => {
            if (paletteModal.editing) {
              handleUpdatePalette(paletteModal.editing.id, name, colors);
            } else {
              handleCreatePalette(name, colors);
            }
          }}
          onClose={() => setPaletteModal({ open: false })}
        />
      )}

      {toast && <Toast msg={toast}/>}
    </div>
  );
}
