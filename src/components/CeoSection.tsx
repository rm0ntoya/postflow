"use client";

interface CeoSectionProps {
  onCta?: () => void;
  ctaLabel?: string;
  theme?: "purple" | "gold";
}

export default function CeoSection({ onCta, ctaLabel = "Quero Parar de Perder Tempo →", theme = "purple" }: CeoSectionProps) {
  const grad = theme === "gold"
    ? "linear-gradient(135deg,#C9A96E,#F0D9A8)"
    : "linear-gradient(135deg,#6C27BE,#A855F7 55%,#F97316)";

  const accent = theme === "gold" ? "#C9A96E" : "#A855F7";
  const accentLt = theme === "gold" ? "#F0D9A8" : "#C4B5FD";

  return (
    <section style={{
      position: "relative", zIndex: 1,
      background: "linear-gradient(180deg,#06060F 0%,#0A0818 40%,#06060F 100%)",
      padding: "100px 0",
      overflow: "hidden",
    }}>
      {/* Background orb */}
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%,-50%)",
        width: 600, height: 400, borderRadius: "50%",
        background: theme === "gold"
          ? "radial-gradient(ellipse, rgba(201,169,110,.07) 0%, transparent 70%)"
          : "radial-gradient(ellipse, rgba(108,39,190,.1) 0%, transparent 70%)",
        pointerEvents: "none",
        filter: "blur(60px)",
      }} />

      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 28px" }}>
        {/* Label */}
        <p style={{
          fontFamily: "'Space Grotesk', system-ui, sans-serif",
          fontSize: 10, fontWeight: 600, letterSpacing: ".18em",
          textTransform: "uppercase", color: accentLt,
          marginBottom: 48, textAlign: "center",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
        }}>
          <span style={{ width: 24, height: 1, background: accent, opacity: .4, flexShrink: 0 }} />
          A verdade do CEO do Instagram
          <span style={{ width: 24, height: 1, background: accent, opacity: .4, flexShrink: 0 }} />
        </p>

        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 64,
          alignItems: "center",
        }}>
          {/* Left: article mockup */}
          <div style={{ position: "relative" }}>
            {/* Glow behind image */}
            <div style={{
              position: "absolute", inset: -20,
              background: theme === "gold"
                ? "radial-gradient(ellipse, rgba(201,169,110,.12) 0%, transparent 65%)"
                : "radial-gradient(ellipse, rgba(108,39,190,.15) 0%, transparent 65%)",
              borderRadius: 32, filter: "blur(24px)",
              zIndex: 0,
            }} />
            <div style={{
              position: "relative", zIndex: 1,
              borderRadius: 20,
              overflow: "hidden",
              boxShadow: "0 24px 80px rgba(0,0,0,.55), 0 0 0 1px rgba(255,255,255,.06)",
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/img/ceo-instagram.webp"
                alt="CEO do Instagram sobre carrosséis"
                style={{ width: "100%", display: "block", borderRadius: 20 }}
                loading="lazy"
              />
            </div>
          </div>

          {/* Right: text */}
          <div>
            <h2 style={{
              fontFamily: "'Space Grotesk', system-ui, sans-serif",
              fontWeight: 400,
              fontSize: "clamp(28px, 4vw, 52px)",
              letterSpacing: "-0.04em",
              color: "#fff",
              lineHeight: 1.05,
              marginBottom: 24,
            }}>
              Aqui está a verdade <span style={{
                background: grad,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>brutal</span> sobre o Instagram em 2026
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                "O CEO do Instagram confirmou: o algoritmo prioriza carrosséis para maximizar o alcance orgânico. Quem não publica esse formato está deixando seguidores na mesa.",
                "Pesquisas apontam que posts com 3+ frames no Carrossel recebem, em média, 19% mais impressões do que posts únicos — e a taxa de retenção chega a ser 3× maior.",
                "A diferença entre quem cresce no Instagram e quem fica parado é exatamente isso: consistência no formato certo. A NovaCraft é a ferramenta que torna isso possível.",
              ].map((text, i) => (
                <p key={i} style={{
                  fontFamily: "'Space Grotesk', system-ui, sans-serif",
                  fontSize: 15, fontWeight: 300, color: "rgba(255,255,255,.5)",
                  lineHeight: 1.75,
                  paddingLeft: 16,
                  borderLeft: `2px solid ${i === 0 ? accent : "rgba(255,255,255,.08)"}`,
                }}>
                  {text}
                </p>
              ))}
            </div>

            {onCta && (
              <button
                onClick={onCta}
                style={{
                  marginTop: 36,
                  padding: "14px 28px",
                  borderRadius: 999,
                  background: grad,
                  color: "#fff",
                  fontSize: 15,
                  fontWeight: 600,
                  fontFamily: "'Space Grotesk', system-ui, sans-serif",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: theme === "gold"
                    ? "0 8px 28px rgba(201,169,110,.3)"
                    : "0 8px 28px rgba(108,39,190,.4)",
                  transition: "transform .2s, box-shadow .2s",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = ""; }}
              >
                {ctaLabel}
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .ceo-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
