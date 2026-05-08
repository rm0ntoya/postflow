"use client";

const CREATORS = [
  { file: "@heron_reis.png",                  handle: "@heron_reis" },
  { file: "alinesampaio.nutricionista.jpeg",  handle: "@alinesampaio.nutricionista" },
  { file: "danilomoraes.oficial.jpeg",        handle: "@danilomoraes.oficial" },
  { file: "eu.raykaguimaraes.jpg",            handle: "@raykaguimaraes" },
  { file: "fernandaluz.ia.jpeg",              handle: "@fernandaluz.ia" },
  { file: "igorivasbr.png",                   handle: "@igorivasbr" },
  { file: "kellyferreiradovalle.jpeg",        handle: "@kellyferreiradovalle" },
  { file: "mtuliobarbosa.jpeg",               handle: "@mtuliobarbosa" },
  { file: "ruarcke.png",                      handle: "@ruarcke" },
];

const doubled = [...CREATORS, ...CREATORS, ...CREATORS];

const css = `
@keyframes ct-scroll {
  0%   { transform: translateX(0); }
  100% { transform: translateX(calc(-100% / 3)); }
}
.ct-outer {
  overflow: hidden;
  -webkit-mask-image: linear-gradient(90deg, transparent 0%, #000 8%, #000 92%, transparent 100%);
  mask-image: linear-gradient(90deg, transparent 0%, #000 8%, #000 92%, transparent 100%);
}
.ct-track {
  display: flex;
  gap: 28px;
  width: max-content;
  animation: ct-scroll 30s linear infinite;
  will-change: transform;
}
.ct-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
  cursor: default;
}
.ct-ring {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  padding: 2.5px;
  background: linear-gradient(135deg, #6C27BE, #A855F7 50%, #F97316);
  flex-shrink: 0;
  position: relative;
}
.ct-ring::after {
  content: '';
  position: absolute;
  inset: 2px;
  border-radius: 50%;
  background: #06060F;
}
.ct-ring img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  position: relative;
  z-index: 1;
  border: 2px solid #06060F;
}
.ct-handle {
  font-family: 'Space Grotesk', system-ui, sans-serif;
  font-size: 11px;
  font-weight: 400;
  color: rgba(255,255,255,.4);
  white-space: nowrap;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
}
`;

interface CreatorsTickerProps {
  accentColor?: string;
}

export default function CreatorsTicker({ accentColor = "#A855F7" }: CreatorsTickerProps) {
  return (
    <section style={{ padding: "64px 0", position: "relative", zIndex: 1 }}>
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <p style={{
          fontFamily: "'Space Grotesk', system-ui, sans-serif",
          fontSize: 11, fontWeight: 600, letterSpacing: ".16em",
          textTransform: "uppercase", color: accentColor,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
        }}>
          <span style={{ display: "inline-block", width: 24, height: 1, background: accentColor, opacity: .5 }} />
          Usado por creators, agências e equipes de conteúdo
          <span style={{ display: "inline-block", width: 24, height: 1, background: accentColor, opacity: .5 }} />
        </p>
      </div>

      <div className="ct-outer">
        <div className="ct-track">
          {doubled.map((c, i) => (
            <div key={i} className="ct-item">
              <div className="ct-ring">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/criadores/${encodeURIComponent(c.file)}`} alt={c.handle} loading="lazy" />
              </div>
              <span className="ct-handle">{c.handle}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
