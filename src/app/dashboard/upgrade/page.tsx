"use client";
import { useState } from "react";

export default function UpgradePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isAnual, setIsAnual] = useState(false);

  async function handleCheckout() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/checkout/create", { method: "POST" });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Erro ao iniciar checkout."); setLoading(false); return; }
    window.location.href = data.checkoutUrl || data.sandboxUrl;
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#06060F",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Space Grotesk', sans-serif", color: "#fff", padding: 24,
    }}>
      <div style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✦</div>
        <h1 style={{ fontSize: 28, fontWeight: 400, letterSpacing: "-0.03em", marginBottom: 12 }}>
          Seu período grátis <span style={{ background: "linear-gradient(135deg,#6C27BE,#A855F7,#F97316)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>terminou</span>
        </h1>
        <p style={{ fontSize: 15, color: "rgba(255,255,255,.5)", lineHeight: 1.7, marginBottom: 32 }}>
          Continue gerando carrosséis virais, utilizando paletas de cores personalizadas e todos os recursos da NovaCraft AI.
        </p>

        {/* Toggle */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 32 }}>
          <span style={{ fontSize: 14, color: !isAnual ? "#fff" : "rgba(255,255,255,.4)", cursor: "pointer" }} onClick={() => setIsAnual(false)}>Mensal</span>
          <div onClick={() => setIsAnual(!isAnual)} style={{ width: 44, height: 24, borderRadius: 999, background: isAnual ? "#6C27BE" : "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.15)", cursor: "pointer", position: "relative", transition: "background .3s" }}>
            <div style={{ position: "absolute", top: 3, left: isAnual ? 22 : 3, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left .3s", boxShadow: "0 2px 6px rgba(0,0,0,.35)" }} />
          </div>
          <span style={{ fontSize: 14, color: isAnual ? "#fff" : "rgba(255,255,255,.4)", cursor: "pointer" }} onClick={() => setIsAnual(true)}>
            Anual <span style={{ fontSize: 11, background: "rgba(168,85,247,.2)", color: "#C4B5FD", padding: "2px 8px", borderRadius: 999, border: "1px solid rgba(168,85,247,.3)", marginLeft: 4 }}>-40%</span>
          </span>
        </div>

        {/* Plans */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
          {/* Starter */}
          <div style={{ background: "#0C0C1A", border: "1px solid rgba(255,255,255,.08)", borderRadius: 20, padding: "24px 20px", textAlign: "left" }}>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,.5)", marginBottom: 8 }}>Starter</div>
            <div style={{ fontSize: 36, fontWeight: 400, letterSpacing: "-0.04em", color: "#fff", lineHeight: 1 }}>{isAnual ? "R$40" : "R$67"}<span style={{ fontSize: 14, color: "rgba(255,255,255,.4)", fontWeight: 300 }}>/mês</span></div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.3)", marginTop: 4, marginBottom: 16 }}>{isAnual ? "Cobrado anualmente" : "Cobrado mensalmente"}</div>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
              {["30 carrosséis/mês", "Até 10 slides", "Paletas de cores", "Suporte por email"].map((f) => (
                <li key={f} style={{ fontSize: 13, color: "rgba(255,255,255,.6)", display: "flex", gap: 8 }}>
                  <span style={{ color: "#A855F7" }}>✓</span> {f}
                </li>
              ))}
            </ul>
          </div>
          {/* Pro */}
          <div style={{ background: "linear-gradient(135deg,#6C27BE,#A855F7,#F97316)", padding: 2, borderRadius: 22 }}>
            <div style={{ background: "#0B0B1A", borderRadius: 20, padding: "24px 20px", textAlign: "left", height: "100%" }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", color: "#C4B5FD", background: "rgba(168,85,247,.2)", border: "1px solid rgba(168,85,247,.3)", borderRadius: 999, padding: "3px 10px", width: "fit-content", marginBottom: 8 }}>✦ Popular</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,.5)", marginBottom: 8 }}>Pro</div>
              <div style={{ fontSize: 36, fontWeight: 400, letterSpacing: "-0.04em", color: "#fff", lineHeight: 1 }}>{isAnual ? "R$118" : "R$197"}<span style={{ fontSize: 14, color: "rgba(255,255,255,.4)", fontWeight: 300 }}>/mês</span></div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.3)", marginTop: 4, marginBottom: 16 }}>{isAnual ? "Cobrado anualmente" : "Cobrado mensalmente"}</div>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                {["Carrosséis ilimitados", "Até 15 slides", "Planejador de conteúdo", "Paletas + Modo Debate", "API Key própria", "Suporte prioritário"].map((f) => (
                  <li key={f} style={{ fontSize: 13, color: "rgba(255,255,255,.7)", display: "flex", gap: 8 }}>
                    <span style={{ color: "#A855F7" }}>✓</span> {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {error && <div style={{ color: "#f87171", fontSize: 13, marginBottom: 16, padding: "10px 14px", background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.2)", borderRadius: 10 }}>{error}</div>}

        <button
          onClick={handleCheckout}
          disabled={loading}
          style={{
            width: "100%", padding: "16px 24px", borderRadius: 999,
            background: "linear-gradient(135deg,#6C27BE,#A855F7,#F97316)",
            color: "#fff", fontSize: 16, fontWeight: 600, border: "none",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
            boxShadow: "0 8px 32px rgba(108,39,190,.4)",
            fontFamily: "inherit",
          }}
        >
          {loading ? "Redirecionando..." : "Assinar agora →"}
        </button>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,.3)", marginTop: 12 }}>
          Pagamento seguro via Mercado Pago · Cancele quando quiser
        </p>
        <button
          onClick={() => { fetch("/api/auth/login", { method: "DELETE" }).then(() => window.location.href = "/"); }}
          style={{ marginTop: 16, background: "none", border: "none", color: "rgba(255,255,255,.3)", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}
        >
          Sair da conta
        </button>
      </div>
    </div>
  );
}
