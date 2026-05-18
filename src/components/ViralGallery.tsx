"use client";

const ALL_IMGS = [
  "viral-01.jpg","viral-02.jpg","viral-03.jpg","viral-04.jpg","viral-05.jpg","viral-06.jpg",
  "viral-07.jpg","viral-08.jpg","viral-09.jpg","viral-10.jpg","viral-11.jpg","viral-12.jpg",
  "viral-13.jpg","viral-14.jpg","viral-15.jpg","viral-16.jpg","viral-17.jpg","viral-18.jpg",
  "viral-19.jpg","viral-20.jpg","viral-21.jpg","viral-22.jpg","viral-23.jpg","viral-24.jpg",
  "viral-25.jpg","viral-26.jpg","viral-27.jpg","viral-28.jpg","viral-29.jpg","viral-30.jpg",
  "viral-31.jpg","viral-32.jpg","viral-33.jpg","viral-35.jpg","viral-36.jpg","viral-38.jpg",
];

const ROW1 = ALL_IMGS.slice(0, 12);
const ROW2 = ALL_IMGS.slice(12, 24);
const ROW3 = ALL_IMGS.slice(24);

const IMG_W = 220;
const IMG_H = 275;
const GAP = 12;

const css = `
@keyframes vg-right {
  0%   { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
@keyframes vg-left {
  0%   { transform: translateX(-50%); }
  100% { transform: translateX(0); }
}
.vg-outer {
  overflow: hidden;
  width: 100%;
  -webkit-mask-image: linear-gradient(90deg, transparent 0%, #000 6%, #000 94%, transparent 100%);
  mask-image: linear-gradient(90deg, transparent 0%, #000 6%, #000 94%, transparent 100%);
}
.vg-track {
  display: flex;
  gap: ${GAP}px;
  width: max-content;
  will-change: transform;
}
.vg-track-right  { animation: vg-right 38s linear infinite; }
.vg-track-left   { animation: vg-left  44s linear infinite; }
.vg-track-right2 { animation: vg-right 32s linear infinite; }
.vg-img {
  width: ${IMG_W}px;
  height: ${IMG_H}px;
  border-radius: 14px;
  overflow: hidden;
  flex-shrink: 0;
  position: relative;
}
.vg-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform .4s ease;
}
.vg-img:hover img { transform: scale(1.04); }
`;

function Row({ imgs, cls }: { imgs: string[]; cls: string }) {
  const doubled = [...imgs, ...imgs];
  return (
    <div className="vg-outer">
      <div className={`vg-track ${cls}`}>
        {doubled.map((src, i) => (
          <div key={i} className="vg-img">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/img/${src}`} alt="" loading="lazy" />
          </div>
        ))}
      </div>
    </div>
  );
}

interface ViralGalleryProps {
  title?: string;
  subtitle?: string;
  accent?: "purple" | "gold";
}

export default function ViralGallery({ title = "Imagens geradas com", subtitle = "fator viral", accent = "purple" }: ViralGalleryProps) {
  const accentColor = accent === "gold" ? "#C9A96E" : "#A855F7";
  const gradText = accent === "gold"
    ? "linear-gradient(90deg,#C9A96E,#F0D9A8,#C9A96E)"
    : "linear-gradient(135deg,#6C27BE,#A855F7 50%,#F97316)";

  return (
    <section style={{ padding: "80px 0 0", overflow: "hidden", position: "relative", zIndex: 1 }}>
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 28px", textAlign: "center", marginBottom: 48 }}>
        <p style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          fontFamily: "'Space Grotesk',system-ui,sans-serif",
          fontSize: 10, fontWeight: 600, letterSpacing: ".16em", textTransform: "uppercase",
          color: accentColor, marginBottom: 14,
        }}>
          <span style={{ display: "inline-block", width: 20, height: 1, background: accentColor, opacity: .5 }} />
          Exemplos reais
        </p>
        <h2 style={{
          fontFamily: "'Space Grotesk',system-ui,sans-serif",
          fontSize: "clamp(28px,4vw,48px)", fontWeight: 400,
          letterSpacing: "-0.03em", color: "#fff", lineHeight: 1.1,
        }}>
          {title}{" "}
          <span style={{
            background: gradText,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            {subtitle}
          </span>
        </h2>
        <p style={{
          fontFamily: "'Space Grotesk',system-ui,sans-serif",
          fontSize: 15, fontWeight: 300, color: "rgba(255,255,255,.45)",
          marginTop: 12, lineHeight: 1.7,
        }}>
          Cada imagem foi gerada pelo Gemini AI a partir dos prompts criados pela Carrossel AI — prontas para publicar no Instagram.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Row imgs={ROW1} cls="vg-track-right" />
        <Row imgs={ROW2} cls="vg-track-left" />
        <Row imgs={ROW3} cls="vg-track-right2" />
      </div>
    </section>
  );
}
