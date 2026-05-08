"use client";

import { useState, useEffect, useMemo } from "react";
import Icon from "@/components/Icon";
import Toast from "@/components/Toast";

interface AiContext {
  brandName: string;
  brandDescription: string;
  audience: string;
  tone: string;
  structure: string;
  themesYes: string[];
  themesNo: string[];
  rules: string;
  instagramHandle: string;
  instagramBio: string;
}

const DEFAULT: AiContext = {
  brandName: "", brandDescription: "", audience: "", tone: "", structure: "",
  themesYes: [], themesNo: [], rules: "", instagramHandle: "", instagramBio: "",
};

function TagInput({ tags, onChange, placeholder, variant }: { tags: string[]; onChange: (t: string[]) => void; placeholder: string; variant: "ok" | "bad" }) {
  const [val, setVal] = useState("");
  const add = () => {
    const v = val.trim();
    if (!v || tags.includes(v)) { setVal(""); return; }
    onChange([...tags, v]);
    setVal("");
  };
  return (
    <div className="tag-input-wrap">
      {tags.map((t, i) => (
        <span key={i} className={`tag ${variant === "bad" ? "bad" : ""}`}>
          {t}
          <button className="tag-x" onClick={() => onChange(tags.filter((_, j) => j !== i))}>×</button>
        </span>
      ))}
      <input value={val} onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } }}
        onBlur={add}
        placeholder={tags.length === 0 ? placeholder : ""}/>
    </div>
  );
}

export default function ContextPage() {
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<AiContext>(DEFAULT);
  const [saved, setSaved] = useState<AiContext>(DEFAULT);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(""), 2500); };

  useEffect(() => {
    fetch("/api/user/context")
      .then(async (r) => {
        if (!r.ok) { showToast("Erro ao carregar contexto"); return; }
        const d = await r.json();
        const ctx = { ...DEFAULT, ...d.context };
        setDraft(ctx);
        setSaved(ctx);
      })
      .catch(() => showToast("Erro de conexão. Tente recarregar."))
      .finally(() => setLoading(false));
  }, []);

  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);

  const update = (patch: Partial<AiContext>) => setDraft((d) => ({ ...d, ...patch }));

  async function save() {
    setSaving(true);
    await fetch("/api/user/context", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) });
    setSaved(draft);
    setSaving(false);
    showToast("Contexto atualizado");
  }

  const completeness = useMemo(() => {
    const fields: (keyof AiContext)[] = ["brandName", "brandDescription", "audience", "tone", "structure", "rules", "instagramHandle"];
    const filled = fields.filter((f) => String(draft[f] || "").trim().length > 5).length;
    const tags = (draft.themesYes.length > 0 ? 1 : 0) + (draft.themesNo.length > 0 ? 1 : 0);
    return Math.round(((filled + tags) / (fields.length + 2)) * 100);
  }, [draft]);

  if (loading) return (
    <div className="main" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 24, height: 24, border: "2px solid rgba(255,255,255,.2)", borderTopColor: "#A855F7", borderRadius: "50%", animation: "spin 1s linear infinite" }}/>
    </div>
  );

  return (
    <div className="main">
      <div className="topbar">
        <div className="tb-left">
          <h1>Contexto da IA</h1>
          <p>Diretrizes que a IA aplica em todas as gerações</p>
        </div>
        <div className="tb-right">
          <button className={`btn ${dirty ? "btn-pri" : "btn-ghost"}`} onClick={save} disabled={!dirty || saving}>
            <Icon name="check"/> {saving ? "Salvando…" : dirty ? "Salvar alterações" : "Tudo salvo"}
          </button>
        </div>
      </div>

      <div className="content">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 28, alignItems: "flex-start" }}>
          <div>
            <div className="card">
              <div className="card-h"><div><h2>Sobre o negócio / marca</h2><p>Quem é você, o que vende, o problema que resolve.</p></div></div>
              <div className="kv-row"><div className="kv-row-key">Nome da marca</div><div className="kv-row-val"><input className="input" value={draft.brandName} onChange={(e) => update({ brandName: e.target.value })}/></div></div>
              <div className="kv-row"><div><div className="kv-row-key">Descrição</div><div className="kv-row-key-sub">O que você faz, para quem, com qual diferencial.</div></div><div className="kv-row-val"><textarea className="textarea lg" value={draft.brandDescription} onChange={(e) => update({ brandDescription: e.target.value })}/></div></div>
              <div className="kv-row"><div><div className="kv-row-key">Público-alvo</div><div className="kv-row-key-sub">Idade, perfil, dores e desejos.</div></div><div className="kv-row-val"><textarea className="textarea" value={draft.audience} onChange={(e) => update({ audience: e.target.value })}/></div></div>
            </div>

            <div className="card">
              <div className="card-h"><div><h2>Tom de voz e estilo</h2><p>Como você se comunica. A IA vai imitar este tom em todos os carrosséis.</p></div></div>
              <div className="kv-row"><div className="kv-row-key">Tom de voz</div><div className="kv-row-val"><textarea className="textarea" value={draft.tone} onChange={(e) => update({ tone: e.target.value })}/></div></div>
              <div className="kv-row"><div><div className="kv-row-key">Estrutura padrão</div><div className="kv-row-key-sub">Como você costuma estruturar carrosséis.</div></div><div className="kv-row-val"><textarea className="textarea" value={draft.structure} onChange={(e) => update({ structure: e.target.value })}/></div></div>
            </div>

            <div className="card">
              <div className="card-h"><div><h2>Temas</h2><p>Defina o que a IA pode e o que ela <b>não pode</b> abordar.</p></div></div>
              <div className="kv-row" style={{ gridTemplateColumns: "1fr" }}>
                <div className="ctx-section-grid">
                  <div><div className="kv-row-key" style={{ marginBottom: 8 }}>✓ Pode falar sobre</div><TagInput tags={draft.themesYes} onChange={(t) => update({ themesYes: t })} placeholder="Adicionar tema permitido" variant="ok"/></div>
                  <div><div className="kv-row-key" style={{ marginBottom: 8 }}>✗ Nunca falar sobre</div><TagInput tags={draft.themesNo} onChange={(t) => update({ themesNo: t })} placeholder="Adicionar tema proibido" variant="bad"/></div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-h"><div><h2>Regras personalizadas</h2><p>Diretrizes específicas: limites, terminologias preferidas, CTAs padrão.</p></div></div>
              <textarea className="textarea lg" value={draft.rules} onChange={(e) => update({ rules: e.target.value })} style={{ minHeight: 160, fontFamily: "JetBrains Mono, monospace", fontSize: 12, lineHeight: 1.7 }}/>
              <div className="field-help" style={{ marginTop: 8 }}>Use uma regra por linha. A IA aplica todas em cada geração.</div>
            </div>

            <div className="card">
              <div className="card-h"><div><h2>Instagram</h2><p>Informações da rede social — usadas como assinatura nos slides finais.</p></div></div>
              <div className="kv-row"><div className="kv-row-key">@ do perfil</div><div className="kv-row-val"><input className="input" value={draft.instagramHandle} onChange={(e) => update({ instagramHandle: e.target.value })} placeholder="@seuhandle"/></div></div>
              <div className="kv-row"><div><div className="kv-row-key">Bio do perfil</div><div className="kv-row-key-sub">A IA referencia esta bio para alinhar posicionamento.</div></div><div className="kv-row-val"><textarea className="textarea" value={draft.instagramBio} onChange={(e) => update({ instagramBio: e.target.value })}/></div></div>
            </div>
          </div>

          <div style={{ position: "sticky", top: 18, display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="card" style={{ margin: 0 }}>
              <div style={{ fontSize: 11, color: "var(--dim)", letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 10 }}>Saúde do contexto</div>
              <div style={{ fontSize: 32, fontWeight: 500, color: "#fff", letterSpacing: "-0.03em", marginBottom: 4 }}>{completeness}%</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14, lineHeight: 1.55 }}>Quanto mais completo, mais alinhada à sua marca a IA fica.</div>
              <div style={{ height: 6, background: "rgba(255,255,255,.06)", borderRadius: 999, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${completeness}%`, background: "var(--grad)", borderRadius: 999, transition: "width .4s" }}/>
              </div>
            </div>

            <div className="card" style={{ margin: 0 }}>
              <div style={{ fontSize: 11, color: "var(--dim)", letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 12 }}>
                <Icon name="sparkle" size={11}/> Como a IA usa
              </div>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10, fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}>
                <li><b style={{ color: "#fff" }}>Marca</b> · define posicionamento</li>
                <li><b style={{ color: "#fff" }}>Tom</b> · molda a copy</li>
                <li><b style={{ color: "#fff" }}>Estrutura</b> · arquitetura dos slides</li>
                <li><b style={{ color: "#fff" }}>Temas</b> · evita assuntos sensíveis</li>
                <li><b style={{ color: "#fff" }}>Regras</b> · validação final do output</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {toast && <Toast msg={toast}/>}
    </div>
  );
}
