"use client";
import { useEffect, useState } from "react";

interface AppConfig {
  maintenanceMode: boolean;
  maintenanceBanner: string;
  announcementBanner: string;
  announcementActive: boolean;
  stripeSecretKey: string;
  stripePublishableKey: string;
  stripePriceIdPro: string;
  stripePriceIdStudio: string;
  stripeWebhookSecret: string;
  stripeEnabled: boolean;
  trialDays: number;
  recaptchaSiteKey: string;
  recaptchaSecretKey: string;
  recaptchaEnabled: boolean;
}

const inputS: React.CSSProperties = {
  background: "#0d0d0d", border: "1px solid #2a2a2a", color: "#fff",
  borderRadius: 8, padding: "10px 14px", fontSize: 14, width: "100%",
  boxSizing: "border-box", outline: "none", fontFamily: "inherit",
};

const labelS: React.CSSProperties = { fontSize: 13, color: "#777", fontWeight: 600, marginBottom: 8, display: "block" };
const cardS: React.CSSProperties = { background: "#111", border: "1px solid #1e1e1e", borderRadius: 12, padding: 24, marginBottom: 16 };
const fieldS: React.CSSProperties = { marginBottom: 16 };

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} style={{
      width: 52, height: 28, borderRadius: 14, border: "none", cursor: "pointer",
      background: on ? "#a855f7" : "#2a2a2a", position: "relative", transition: "background 0.2s", flexShrink: 0,
    }}>
      <div style={{
        position: "absolute", top: 3, left: on ? 27 : 3,
        width: 22, height: 22, borderRadius: "50%", background: "#fff", transition: "left 0.2s",
      }} />
    </button>
  );
}

function SectionHeader({ icon, title, desc, on, onChange }: { icon: string; title: string; desc: string; on?: boolean; onChange?: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
      <div>
        <div style={{ fontWeight: 700, fontSize: 16 }}>{icon} {title}</div>
        <div style={{ fontSize: 13, color: "#555", marginTop: 4 }}>{desc}</div>
      </div>
      {onChange !== undefined && on !== undefined && <Toggle on={on} onChange={onChange} />}
    </div>
  );
}

export default function AdminConfigPage() {
  const [cfg, setCfg] = useState<AppConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/config")
      .then(async (r) => {
        if (!r.ok) return;
        setCfg(await r.json());
      })
      .catch(console.error);
  }, []);

  async function save() {
    if (!cfg) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cfg),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const d = await res.json();
      setCfg({
        maintenanceMode: d.maintenanceMode ?? false,
        maintenanceBanner: d.maintenanceBanner ?? "",
        announcementBanner: d.announcementBanner ?? "",
        announcementActive: d.announcementActive ?? false,
        stripeSecretKey: d.stripeSecretKey ?? "",
        stripePublishableKey: d.stripePublishableKey ?? "",
        stripePriceIdPro: d.stripePriceIdPro ?? "",
        stripePriceIdStudio: d.stripePriceIdStudio ?? "",
        stripeWebhookSecret: d.stripeWebhookSecret ?? "",
        stripeEnabled: d.stripeEnabled ?? false,
        trialDays: d.trialDays ?? 7,
        recaptchaSiteKey: d.recaptchaSiteKey ?? "",
        recaptchaSecretKey: d.recaptchaSecretKey ?? "",
        recaptchaEnabled: d.recaptchaEnabled ?? false,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      console.error(e);
      window.alert("Erro ao salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  const set = <K extends keyof AppConfig>(key: K, val: AppConfig[K]) =>
    setCfg((c) => c ? { ...c, [key]: val } : c);

  if (!cfg) return <div style={{ color: "#444", padding: 40 }}>Carregando...</div>;

  return (
    <div style={{ maxWidth: 660 }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Configurações do Sistema</h1>
      <p style={{ color: "#555", fontSize: 14, marginBottom: 32 }}>Controle global da plataforma</p>

      {/* ── Maintenance ── */}
      <div style={{ ...cardS, borderColor: cfg.maintenanceMode ? "rgba(249,115,22,0.35)" : "#1e1e1e" }}>
        <SectionHeader
          icon="🔧" title="Modo Manutenção"
          desc="Bloqueia o acesso de usuários não-admin ao dashboard"
          on={cfg.maintenanceMode} onChange={() => set("maintenanceMode", !cfg.maintenanceMode)}
        />
        {cfg.maintenanceMode && (
          <div style={{ background: "rgba(249,115,22,0.07)", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "#f97316", marginBottom: 14, fontWeight: 600 }}>
            ⚠️ Manutenção ATIVA agora
          </div>
        )}
        <label style={labelS}>Mensagem exibida para os usuários</label>
        <input value={cfg.maintenanceBanner} onChange={(e) => set("maintenanceBanner", e.target.value)} style={inputS} />
      </div>

      {/* ── Announcement ── */}
      <div style={cardS}>
        <SectionHeader
          icon="📢" title="Banner de Anúncio"
          desc="Faixa no topo do dashboard para todos os usuários"
          on={cfg.announcementActive} onChange={() => set("announcementActive", !cfg.announcementActive)}
        />
        <label style={labelS}>Texto do banner</label>
        <input value={cfg.announcementBanner} onChange={(e) => set("announcementBanner", e.target.value)} style={inputS} placeholder="Ex: Nova funcionalidade lançada! Confira..." />
      </div>

      {/* ── Stripe ── */}
      <div style={{ ...cardS, borderColor: cfg.stripeEnabled ? "rgba(99,102,241,0.35)" : "#1e1e1e" }}>
        <SectionHeader
          icon="💳" title="Stripe"
          desc="Habilita o checkout Pro via Stripe"
          on={cfg.stripeEnabled} onChange={() => set("stripeEnabled", !cfg.stripeEnabled)}
        />
        <div style={{ background: "#0d1020", border: "1px solid #1e2040", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#a5b4fc", marginBottom: 16 }}>
          <b>Webhook URL:</b> <code style={{ color: "#c7d2fe" }}>{typeof window !== "undefined" ? window.location.origin : "https://seu-dominio.com"}/api/webhooks/stripe</code><br />
          Configure esta URL no Stripe Dashboard em Settings → Webhooks → Add endpoint
        </div>
        <div style={fieldS}>
          <label style={labelS}>Stripe Secret Key</label>
          <input
            value={cfg.stripeSecretKey}
            onChange={(e) => set("stripeSecretKey", e.target.value)}
            style={{ ...inputS, fontFamily: "monospace", fontSize: 13 }}
            placeholder="sk_live_... or sk_test_..."
            type="password"
          />
        </div>
        <div style={fieldS}>
          <label style={labelS}>Stripe Publishable Key</label>
          <input
            value={cfg.stripePublishableKey}
            onChange={(e) => set("stripePublishableKey", e.target.value)}
            style={{ ...inputS, fontFamily: "monospace", fontSize: 13 }}
            placeholder="pk_live_... or pk_test_..."
          />
        </div>
        <div style={fieldS}>
          <label style={labelS}>Pro Plan Price ID (Stripe)</label>
          <input
            value={cfg.stripePriceIdPro}
            onChange={(e) => set("stripePriceIdPro", e.target.value)}
            style={{ ...inputS, fontFamily: "monospace", fontSize: 13 }}
            placeholder="price_1ABC123..."
          />
          <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>Price ID do Stripe Dashboard → Products → Select Product → Pricing</div>
        </div>
        <div style={fieldS}>
          <label style={labelS}>Studio Plan Price ID (Stripe)</label>
          <input
            value={cfg.stripePriceIdStudio}
            onChange={(e) => set("stripePriceIdStudio", e.target.value)}
            style={{ ...inputS, fontFamily: "monospace", fontSize: 13 }}
            placeholder="price_1XYZ789..."
          />
          <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>Price ID do Stripe Dashboard</div>
        </div>
        <div style={fieldS}>
          <label style={labelS}>Stripe Webhook Secret</label>
          <input
            value={cfg.stripeWebhookSecret}
            onChange={(e) => set("stripeWebhookSecret", e.target.value)}
            style={{ ...inputS, fontFamily: "monospace", fontSize: 13 }}
            placeholder="whsec_..."
            type="password"
          />
          <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>Signing secret do Stripe Dashboard → Webhooks</div>
        </div>
        <div style={fieldS}>
          <label style={labelS}>Dias de Trial Gratuito</label>
          <input
            value={cfg.trialDays ?? 7}
            onChange={(e) => set("trialDays", Number(e.target.value))}
            style={{ ...inputS, width: 120 }}
            type="number"
            min={0}
          />
          <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>Aplicado a novos cadastros. Não altera trials existentes.</div>
        </div>
      </div>

      {/* ── reCAPTCHA ── */}
      <div style={{ ...cardS, borderColor: cfg.recaptchaEnabled ? "rgba(59,130,246,0.35)" : "#1e1e1e" }}>
        <SectionHeader
          icon="🤖" title="reCAPTCHA v2"
          desc="Proteção anti-bot no formulário de cadastro"
          on={cfg.recaptchaEnabled} onChange={() => set("recaptchaEnabled", !cfg.recaptchaEnabled)}
        />
        <div style={fieldS}>
          <label style={labelS}>Site Key (pública — aparece no frontend)</label>
          <input
            value={cfg.recaptchaSiteKey}
            onChange={(e) => set("recaptchaSiteKey", e.target.value)}
            style={{ ...inputS, fontFamily: "monospace", fontSize: 13 }}
            placeholder="6Le..."
          />
        </div>
        <div style={fieldS}>
          <label style={labelS}>Secret Key (privada — usada no servidor)</label>
          <input
            value={cfg.recaptchaSecretKey}
            onChange={(e) => set("recaptchaSecretKey", e.target.value)}
            style={{ ...inputS, fontFamily: "monospace", fontSize: 13 }}
            placeholder="6Le..."
            type="password"
          />
        </div>
        <div style={{ background: "#0d1220", border: "1px solid #1a2040", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#60a5fa" }}>
          Obtenha as chaves em <b>google.com/recaptcha/admin</b> — escolha reCAPTCHA v2 "checkbox".
        </div>
      </div>

      <button
        onClick={save}
        disabled={saving}
        style={{
          background: saved ? "#22c55e" : "linear-gradient(90deg,#a855f7,#7c3aed)",
          color: "#fff", border: "none", borderRadius: 10, padding: "12px 30px",
          fontSize: 15, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1,
        }}
      >
        {saving ? "Salvando..." : saved ? "✓ Salvo!" : "Salvar Configurações"}
      </button>
    </div>
  );
}
