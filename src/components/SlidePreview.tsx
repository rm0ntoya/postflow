import { ISlide, IElement } from "@/models/Carousel";

export const CANVAS_W = 1080;
export const CANVAS_H = 1350;

const BG_PRESETS = [
  { id: "noir",   bg: "#0a0a14" },
  { id: "plum",   bg: "linear-gradient(135deg,#1a0d2e 0%,#3b1763 100%)" },
  { id: "sunset", bg: "linear-gradient(135deg,#3a0e5e 0%,#7c2d12 100%)" },
  { id: "lilac",  bg: "linear-gradient(135deg,#6C27BE 0%,#A855F7 100%)" },
  { id: "flame",  bg: "linear-gradient(135deg,#A855F7 0%,#F97316 100%)" },
  { id: "cream",  bg: "#f4eee0" },
  { id: "paper",  bg: "#ffffff" },
  { id: "ocean",  bg: "linear-gradient(135deg,#0c4a6e 0%,#1e3a8a 100%)" },
  { id: "matcha", bg: "linear-gradient(135deg,#14532d 0%,#365314 100%)" },
];

export { BG_PRESETS };

export function resolveBgStyle(slide: {
  bgKey?: string;
  bgOverride?: string;
  bgImageUrl?: string;
  bgSize?: string;
  bgPositionX?: number;
  bgPositionY?: number;
  bgScale?: number;
}): React.CSSProperties {
  if (slide.bgImageUrl && slide.bgImageUrl !== "__has_image__") {
    const px = slide.bgPositionX ?? 50;
    const py = slide.bgPositionY ?? 50;
    const scale = slide.bgScale ?? 1;
    const sizeValue = scale === 1 ? (slide.bgSize || "cover") : `${Math.round(scale * 100)}%`;
    return {
      backgroundImage: `url(${slide.bgImageUrl})`,
      backgroundSize: sizeValue,
      backgroundPosition: `${px}% ${py}%`,
      backgroundRepeat: "no-repeat",
    };
  }
  if (slide.bgOverride) return { background: slide.bgOverride };
  const preset = BG_PRESETS.find((p) => p.id === slide.bgKey) || BG_PRESETS[0];
  return { background: preset.bg };
}

function ElementView({ el }: { el: IElement }) {
  if (el.type === "text") {
    const hasSegments = Array.isArray(el.segments) && el.segments.length > 0;
    return (
      <div
        style={{
          position: "absolute",
          left: el.x, top: el.y, width: el.w, minHeight: el.h,
          fontSize: el.fontSize, fontWeight: el.weight,
          color: hasSegments ? undefined : el.color,
          fontFamily: `'${el.font || "Space Grotesk"}', sans-serif`,
          textAlign: (el.align as "left" | "center" | "right") || "left",
          lineHeight: el.lineHeight || 1.12,
          letterSpacing: el.letterSpacing !== undefined ? `${el.letterSpacing}em` : ((el.fontSize || 16) > 50 ? "-0.03em" : "-0.01em"),
          zIndex: 2,
        }}
      >
        {hasSegments
          ? el.segments!.map((seg, i) => (
              <span key={i} style={{ color: seg.color }}>{seg.text}</span>
            ))
          : el.text
        }
      </div>
    );
  }
  if (el.type === "image") {
    const finalUrl = el.imageUrl || el.photoUrl;
    return (
      <div
        style={{
          position: "absolute",
          left: el.x, top: el.y, width: el.w, height: el.h,
          borderRadius: el.radius || 18,
          overflow: "hidden",
          background: "#111",
          zIndex: 2,
        }}
      >
        {finalUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={finalUrl} alt="" style={{ width: "100%", height: "100%", objectFit: el.backgroundSize === "contain" ? "contain" : "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.2)" }}>
             Gerando imagem...
          </div>
        )}
      </div>
    );
  }
  if (el.type === "shape") {
    return (
      <div
        style={{
          position: "absolute",
          left: el.x, top: el.y, width: el.w, height: el.h,
          background: el.color || "#fff",
          borderRadius: el.shape === "circle" ? "50%" : (el.radius || 8),
          opacity: el.opacity ?? 1,
          zIndex: 2,
        }}
      />
    );
  }
  if (el.type === "profile") {
    const avatarSize = el.h;
    return (
      <div
        style={{
          position: "absolute",
          left: el.x, top: el.y,
          display: "flex", alignItems: "center", gap: 14,
          zIndex: 3,
        }}
      >
        {el.photoUrl ? (
          <div style={{
            width: avatarSize, height: avatarSize, borderRadius: "50%",
            overflow: "hidden", flexShrink: 0,
            border: "2px solid rgba(255,255,255,0.3)",
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={el.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        ) : (
          <div style={{
            width: avatarSize, height: avatarSize, borderRadius: "50%",
            background: "rgba(255,255,255,0.12)", flexShrink: 0,
            border: "2px solid rgba(255,255,255,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width={avatarSize * 0.5} height={avatarSize * 0.5} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
        )}
        <span style={{
          fontSize: el.fontSize || 26,
          fontWeight: el.weight || 600,
          color: el.color || "rgba(255,255,255,0.75)",
          fontFamily: `'${el.font || "Space Grotesk"}', sans-serif`,
          letterSpacing: "-0.01em",
        }}>
          {el.text}
        </span>
      </div>
    );
  }
  return null;
}

interface SlidePreviewProps {
  slide: ISlide;
  scale?: number;
  style?: React.CSSProperties;
}

export default function SlidePreview({ slide, scale = 1, style }: SlidePreviewProps) {
  const bgStyle = resolveBgStyle(slide);
  return (
    <div
      style={{
        ...style,
        width: CANVAS_W * scale,
        height: CANVAS_H * scale,
        ...bgStyle,
        position: "relative",
        overflow: "hidden",
        borderRadius: 8 * scale,
        flexShrink: 0,
      }}
    >
      {/* Gradient overlay — dark bottom, transparent top */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 1,
        background: "linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.9) 45%, rgba(0,0,0,0.4) 75%, transparent 100%)",
        pointerEvents: "none",
      }}/>

      <div
        style={{
          position: "absolute", top: 0, left: 0,
          width: CANVAS_W, height: CANVAS_H,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        {(slide.elements || []).map((el) => (
          <ElementView key={el.id} el={el} />
        ))}
      </div>
    </div>
  );
}
