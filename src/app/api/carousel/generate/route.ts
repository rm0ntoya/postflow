import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Carousel, { IElement, ISlide } from "@/models/Carousel";
import { getSessionUser } from "@/lib/auth";
import { decryptApiKey } from "@/lib/encryption";
import { CANVAS_W, CANVAS_H, parseSegments } from "@/lib/canvas";

export const maxDuration = 60;

const GEMINI_MODEL = "gemini-2.0-flash";

interface GeminiSlide {
  slideNumber: number;
  title: string;
  body: string;
  imagePrompt: string;
  imagePrompt2?: string;
}

function buildCanvasSlides(
  geminiSlides: GeminiSlide[],
  cid: string,
  viral: boolean,
  accentColor: string,
  handle: string,
  imageSlides: number[],
  profilePhotoUrl?: string
): ISlide[] {
  const count = geminiSlides.length;
  const W = CANVAS_W;
  const H = CANVAS_H;

  // Count text-only slides to rotate their template independently
  let textSlideCount = 0;

  return geminiSlides.map((gs, i) => {
    const els: IElement[] = [];
    const segments = parseSegments(gs.title, accentColor);
    const isFirst = i === 0;
    const isLast = i === count - 1;

    const addProfile = (y: number, x = 60, w = 500) => {
      els.push({
        id: `${cid}-s${i}-profile`, type: "profile", text: handle, photoUrl: profilePhotoUrl || "",
        x, y, w, h: 56, fontSize: 28, weight: 700, color: "#FFFFFF", font: "Space Grotesk",
      });
    };

    const addPageNum = () => {
      els.push({
        id: `${cid}-s${i}-page`, type: "text", text: String(i + 1),
        x: W - 120, y: H - 80, w: 100, h: 40, fontSize: 22, weight: 700,
        color: "rgba(255,255,255,0.35)", font: "Space Grotesk", align: "right",
      });
    };

    const hasImage = imageSlides.includes(i) || isFirst || isLast;

    const TBF = "TheBoldFont";
    const SG  = "Space Grotesk";
    const titleText = gs.title.replace(/\*\*/g, "").toUpperCase();

    // ─── TEXT-ONLY SLIDES ──────────────────────────────────────────────────────
    // All centered, big TheBoldFont titles, more body content
    if (!hasImage && !isFirst && !isLast) {
      const tpl = textSlideCount % 11;
      textSlideCount++;

      if (tpl === 0) {
        // Centered power: huge title center, accent dot above profile, body below
        els.push({ id: `${cid}-s${i}-c1`, type: "shape", shape: "circle", x: -300, y: -300, w: 900, h: 900, color: accentColor, opacity: 0.06 });
        els.push({ id: `${cid}-s${i}-c2`, type: "shape", shape: "circle", x: W-200, y: H-400, w: 700, h: 700, color: accentColor, opacity: 0.05 });
        els.push({ id: `${cid}-s${i}-dot`, type: "shape", shape: "circle", x: W/2-16, y: 90, w: 32, h: 32, color: accentColor, opacity: 1 });
        addProfile(150);
        els.push({ id: `${cid}-s${i}-h`, type: "text", text: titleText, segments, x: 60, y: 260, w: W-120, h: 440, fontSize: 148, weight: 900, color: "#FFFFFF", font: TBF, align: "center", lineHeight: 0.9 });
        els.push({ id: `${cid}-s${i}-rule`, type: "shape", shape: "rect", x: W/2-60, y: 720, w: 120, h: 6, color: accentColor, radius: 3, opacity: 1 });
        els.push({ id: `${cid}-s${i}-p`, type: "text", text: gs.body, x: 80, y: 760, w: W-160, h: 420, fontSize: 40, weight: 500, color: "#D0D0D0", font: SG, align: "center", lineHeight: 1.6 });

      } else if (tpl === 1) {
        // Editorial centered: label top, massive title, two-line rule, big body
        els.push({ id: `${cid}-s${i}-c1`, type: "shape", shape: "circle", x: W/2-400, y: H/2-400, w: 800, h: 800, color: accentColor, opacity: 0.05 });
        els.push({ id: `${cid}-s${i}-topbar`, type: "shape", shape: "rect", x: 60, y: 60, w: W-120, h: 3, color: accentColor, opacity: 0.4, radius: 2 });
        addProfile(90);
        els.push({ id: `${cid}-s${i}-h`, type: "text", text: titleText, segments, x: 60, y: 210, w: W-120, h: 420, fontSize: 140, weight: 900, color: "#FFFFFF", font: TBF, align: "center", lineHeight: 0.88 });
        els.push({ id: `${cid}-s${i}-rule1`, type: "shape", shape: "rect", x: 60, y: 655, w: W-120, h: 2, color: "#fff", opacity: 0.08, radius: 1 });
        els.push({ id: `${cid}-s${i}-rule2`, type: "shape", shape: "rect", x: 60, y: 663, w: W-120, h: 2, color: accentColor, opacity: 0.5, radius: 1 });
        els.push({ id: `${cid}-s${i}-p`, type: "text", text: gs.body, x: 80, y: 700, w: W-160, h: 520, fontSize: 42, weight: 400, color: "#C8C8C8", font: SG, align: "center", lineHeight: 1.6 });

      } else if (tpl === 2) {
        // Impact: title dominates top half, body fills bottom, accent left bar
        els.push({ id: `${cid}-s${i}-c1`, type: "shape", shape: "circle", x: W-200, y: -150, w: 600, h: 600, color: accentColor, opacity: 0.06 });
        els.push({ id: `${cid}-s${i}-c2`, type: "shape", shape: "circle", x: -150, y: H-500, w: 600, h: 600, color: accentColor, opacity: 0.04 });
        addProfile(80);
        els.push({ id: `${cid}-s${i}-h`, type: "text", text: titleText, segments, x: 60, y: 190, w: W-120, h: 500, fontSize: 155, weight: 900, color: "#FFFFFF", font: TBF, align: "center", lineHeight: 0.86 });
        els.push({ id: `${cid}-s${i}-accent`, type: "shape", shape: "rect", x: W/2-80, y: 710, w: 160, h: 7, color: accentColor, radius: 4, opacity: 1 });
        els.push({ id: `${cid}-s${i}-p`, type: "text", text: gs.body, x: 70, y: 760, w: W-140, h: 460, fontSize: 40, weight: 500, color: "#D4D4D4", font: SG, align: "center", lineHeight: 1.6 });

      } else if (tpl === 3) {
        // Quote style: body as highlighted quote top, title + profile bottom
        els.push({ id: `${cid}-s${i}-qmark1`, type: "shape", shape: "rect", x: 60, y: 100, w: 8, h: 240, color: accentColor, opacity: 1, radius: 4 });
        els.push({ id: `${cid}-s${i}-qmark2`, type: "shape", shape: "rect", x: W-68, y: 100, w: 8, h: 240, color: accentColor, opacity: 0.3, radius: 4 });
        els.push({ id: `${cid}-s${i}-c1`, type: "shape", shape: "circle", x: -100, y: -100, w: 500, h: 500, color: accentColor, opacity: 0.05 });
        els.push({ id: `${cid}-s${i}-body`, type: "text", text: `"${gs.body}"`, x: 90, y: 100, w: W-180, h: 520, fontSize: 52, weight: 500, color: "#F0F0F0", font: SG, align: "center", lineHeight: 1.55 });
        els.push({ id: `${cid}-s${i}-rule`, type: "shape", shape: "rect", x: W/2-60, y: H/2+60, w: 120, h: 5, color: accentColor, radius: 3, opacity: 1 });
        addProfile(H/2 + 110);
        els.push({ id: `${cid}-s${i}-h`, type: "text", text: titleText, segments, x: 60, y: H/2+200, w: W-120, h: 320, fontSize: 110, weight: 900, color: "#FFFFFF", font: TBF, align: "center", lineHeight: 0.92 });

      } else if (tpl === 4) {
        // Stacked bold: profile + huge title fills top 2/3, generous body bottom
        els.push({ id: `${cid}-s${i}-c1`, type: "shape", shape: "circle", x: W-350, y: H-450, w: 700, h: 700, color: accentColor, opacity: 0.05 });
        els.push({ id: `${cid}-s${i}-topline`, type: "shape", shape: "rect", x: 60, y: 60, w: 80, h: 7, color: accentColor, radius: 4, opacity: 1 });
        addProfile(90);
        els.push({ id: `${cid}-s${i}-h`, type: "text", text: titleText, segments, x: 60, y: 210, w: W-120, h: 500, fontSize: 144, weight: 900, color: "#FFFFFF", font: TBF, align: "center", lineHeight: 0.88 });
        els.push({ id: `${cid}-s${i}-rule`, type: "shape", shape: "rect", x: 60, y: 730, w: W-120, h: 2, color: "#fff", opacity: 0.1, radius: 1 });
        els.push({ id: `${cid}-s${i}-p`, type: "text", text: gs.body, x: 70, y: 770, w: W-140, h: 460, fontSize: 42, weight: 400, color: "#C2C2C2", font: SG, align: "center", lineHeight: 1.65 });

      } else if (tpl === 5) {
        // tpl === 5: Minimal center with accent circles decorating corners
        els.push({ id: `${cid}-s${i}-tl`, type: "shape", shape: "circle", x: -120, y: -120, w: 340, h: 340, color: accentColor, opacity: 0.08 });
        els.push({ id: `${cid}-s${i}-br`, type: "shape", shape: "circle", x: W-220, y: H-220, w: 340, h: 340, color: accentColor, opacity: 0.08 });
        addProfile(H/2 - 440);
        els.push({ id: `${cid}-s${i}-h`, type: "text", text: titleText, segments, x: 60, y: H/2-360, w: W-120, h: 480, fontSize: 150, weight: 900, color: "#FFFFFF", font: TBF, align: "center", lineHeight: 0.88 });
        els.push({ id: `${cid}-s${i}-dots`, type: "shape", shape: "circle", x: W/2-40, y: H/2+130, w: 10, h: 10, color: accentColor, opacity: 1 });
        els.push({ id: `${cid}-s${i}-dots2`, type: "shape", shape: "circle", x: W/2-14, y: H/2+130, w: 10, h: 10, color: accentColor, opacity: 0.5 });
        els.push({ id: `${cid}-s${i}-dots3`, type: "shape", shape: "circle", x: W/2+12, y: H/2+130, w: 10, h: 10, color: accentColor, opacity: 0.25 });
        els.push({ id: `${cid}-s${i}-p`, type: "text", text: gs.body, x: 80, y: H/2+170, w: W-160, h: 480, fontSize: 42, weight: 400, color: "#BEBEBE", font: SG, align: "center", lineHeight: 1.6 });

      } else if (tpl === 6) {
        // Two-column stat: huge title left, body right
        els.push({ id: `${cid}-s${i}-c1`, type: "shape", shape: "circle", x: -150, y: 200, w: 500, h: 500, color: accentColor, opacity: 0.06 });
        els.push({ id: `${cid}-s${i}-c2`, type: "shape", shape: "circle", x: W-100, y: H-600, w: 500, h: 500, color: accentColor, opacity: 0.04 });
        els.push({ id: `${cid}-s${i}-vdiv`, type: "shape", shape: "rect", x: 520, y: 100, w: 2, h: H-200, color: "#ffffff", opacity: 0.07, radius: 1 });
        addProfile(80, 60, 420);
        els.push({ id: `${cid}-s${i}-h`, type: "text", text: titleText, segments, x: 50, y: 200, w: 440, h: 620, fontSize: 148, weight: 900, color: "#FFFFFF", font: TBF, align: "center", lineHeight: 0.88 });
        els.push({ id: `${cid}-s${i}-dot`, type: "shape", shape: "circle", x: 210, y: 872, w: 16, h: 16, color: accentColor, opacity: 1 });
        els.push({ id: `${cid}-s${i}-rule`, type: "shape", shape: "rect", x: 80, y: 890, w: 300, h: 4, color: accentColor, radius: 2, opacity: 0.7 });
        els.push({ id: `${cid}-s${i}-p`, type: "text", text: gs.body, x: 560, y: 160, w: 460, h: 960, fontSize: 40, weight: 400, color: "#CCCCCC", font: SG, align: "left", lineHeight: 1.65 });

      } else if (tpl === 7) {
        // Decorative checklist: title + accent bullets left-margin + body
        els.push({ id: `${cid}-s${i}-c1`, type: "shape", shape: "circle", x: W-300, y: -100, w: 600, h: 600, color: accentColor, opacity: 0.05 });
        addProfile(70);
        els.push({ id: `${cid}-s${i}-h`, type: "text", text: titleText, segments, x: 60, y: 170, w: W-120, h: 240, fontSize: 92, weight: 900, color: "#FFFFFF", font: TBF, align: "center", lineHeight: 0.9 });
        els.push({ id: `${cid}-s${i}-rule`, type: "shape", shape: "rect", x: W/2-80, y: 420, w: 160, h: 4, color: accentColor, radius: 2, opacity: 1 });
        const bulletYs = [460, 610, 760, 910];
        const bulletOpacities = [1, 0.8, 0.6, 0.4];
        for (let b = 0; b < 4; b++) {
          els.push({ id: `${cid}-s${i}-bx${b}`, type: "shape", shape: "rect", x: 60, y: bulletYs[b], w: 36, h: 36, color: accentColor, radius: 6, opacity: bulletOpacities[b] });
          if (b < 3) els.push({ id: `${cid}-s${i}-sep${b}`, type: "shape", shape: "rect", x: 60, y: bulletYs[b]+52, w: W-120, h: 1.5, color: "#ffffff", opacity: 0.06, radius: 1 });
        }
        els.push({ id: `${cid}-s${i}-p`, type: "text", text: gs.body, x: 120, y: 446, w: W-180, h: 580, fontSize: 36, weight: 500, color: "#D0D0D0", font: SG, align: "left", lineHeight: 1.72 });

      } else if (tpl === 8) {
        // Before/After: two stacked contrast boxes
        addProfile(60);
        els.push({ id: `${cid}-s${i}-h`, type: "text", text: titleText, segments, x: 60, y: 160, w: W-120, h: 200, fontSize: 88, weight: 900, color: "#FFFFFF", font: TBF, align: "center", lineHeight: 0.9 });
        // BEFORE box
        els.push({ id: `${cid}-s${i}-box-a`, type: "shape", shape: "rect", x: 40, y: 380, w: W-80, h: 340, color: "#ef4444", opacity: 0.08, radius: 16 });
        els.push({ id: `${cid}-s${i}-box-a-border`, type: "shape", shape: "rect", x: 40, y: 380, w: 4, h: 340, color: "#ef4444", opacity: 0.6, radius: 2 });
        els.push({ id: `${cid}-s${i}-lbl-a`, type: "text", text: "❌  ANTES", x: 70, y: 405, w: 300, h: 50, fontSize: 26, weight: 700, color: "#ef4444", font: SG, align: "left" });
        const _sentences8 = gs.body.split(/(?<=[.!?])\s+|\n/).map((s: string) => s.trim()).filter(Boolean);
        const _half8 = Math.ceil(_sentences8.length / 2);
        const _txtA8 = (_sentences8.slice(0, _half8).join(" ") || gs.body.slice(0, Math.floor(gs.body.length / 2))).slice(0, 220);
        const _txtB8 = (_sentences8.slice(_half8).join(" ") || gs.body.slice(Math.floor(gs.body.length / 2))).slice(0, 220);
        els.push({ id: `${cid}-s${i}-txt-a`, type: "text", text: _txtA8, x: 70, y: 460, w: W-150, h: 240, fontSize: 34, weight: 400, color: "#C8C8C8", font: SG, align: "left", lineHeight: 1.5 });
        // VS separator
        els.push({ id: `${cid}-s${i}-vs`, type: "shape", shape: "circle", x: W/2-28, y: 704, w: 56, h: 56, color: "#1a1a1a", opacity: 1 });
        els.push({ id: `${cid}-s${i}-vs-txt`, type: "text", text: "VS", x: W/2-28, y: 708, w: 56, h: 48, fontSize: 18, weight: 900, color: "rgba(255,255,255,0.5)", font: SG, align: "center" });
        // AFTER box
        els.push({ id: `${cid}-s${i}-box-b`, type: "shape", shape: "rect", x: 40, y: 780, w: W-80, h: 340, color: "#22c55e", opacity: 0.08, radius: 16 });
        els.push({ id: `${cid}-s${i}-box-b-border`, type: "shape", shape: "rect", x: 40, y: 780, w: 4, h: 340, color: "#22c55e", opacity: 0.7, radius: 2 });
        els.push({ id: `${cid}-s${i}-lbl-b`, type: "text", text: "✓  DEPOIS", x: 70, y: 805, w: 300, h: 50, fontSize: 26, weight: 700, color: "#22c55e", font: SG, align: "left" });
        els.push({ id: `${cid}-s${i}-txt-b`, type: "text", text: _txtB8, x: 70, y: 860, w: W-150, h: 240, fontSize: 34, weight: 400, color: "#C8C8C8", font: SG, align: "left", lineHeight: 1.5 });

      } else if (tpl === 9) {
        // Vertical timeline with 3 numbered steps
        els.push({ id: `${cid}-s${i}-c1`, type: "shape", shape: "circle", x: W-250, y: H-350, w: 500, h: 500, color: accentColor, opacity: 0.05 });
        els.push({ id: `${cid}-s${i}-h`, type: "text", text: titleText, segments, x: 60, y: 70, w: W-120, h: 200, fontSize: 88, weight: 900, color: "#FFFFFF", font: TBF, align: "center", lineHeight: 0.9 });
        addProfile(310);
        // Timeline vertical line
        els.push({ id: `${cid}-s${i}-line`, type: "shape", shape: "rect", x: 96, y: 420, w: 4, h: 680, color: accentColor, opacity: 0.25, radius: 2 });
        // Steps
        const stepYs = [420, 650, 880];
        const stepOpacities = [1, 0.75, 0.5];
        const bodyLines = gs.body.split(/\n|[.!?]\s+/).filter(Boolean);
        for (let s = 0; s < 3; s++) {
          els.push({ id: `${cid}-s${i}-sc${s}`, type: "shape", shape: "circle", x: 62, y: stepYs[s], w: 72, h: 72, color: accentColor, opacity: stepOpacities[s] });
          els.push({ id: `${cid}-s${i}-sn${s}`, type: "text", text: String(s + 1), x: 62, y: stepYs[s]+4, w: 72, h: 64, fontSize: 28, weight: 900, color: "#000000", font: TBF, align: "center" });
          els.push({ id: `${cid}-s${i}-st${s}`, type: "text", text: bodyLines[s] || gs.body.slice(s * 80, (s + 1) * 80) || "—", x: 160, y: stepYs[s]+4, w: W-220, h: 60, fontSize: 34, weight: 600, color: "#FFFFFF", font: SG, align: "left" });
          if (bodyLines[s + 3]) els.push({ id: `${cid}-s${i}-sd${s}`, type: "text", text: bodyLines[s + 3], x: 160, y: stepYs[s]+52, w: W-220, h: 50, fontSize: 28, weight: 400, color: "#A0A0A0", font: SG, align: "left" });
        }

      } else if (tpl === 10) {
        // Editorial split: giant title left column, body right column
        els.push({ id: `${cid}-s${i}-topbar`, type: "shape", shape: "rect", x: 60, y: 60, w: W-120, h: 3, color: accentColor, opacity: 0.5, radius: 2 });
        els.push({ id: `${cid}-s${i}-label`, type: "shape", shape: "rect", x: 60, y: 75, w: 100, h: 6, color: accentColor, opacity: 0.35, radius: 3 });
        els.push({ id: `${cid}-s${i}-h`, type: "text", text: titleText, segments, x: 60, y: 110, w: 440, h: 900, fontSize: 138, weight: 900, color: "#FFFFFF", font: TBF, align: "left", lineHeight: 0.87 });
        els.push({ id: `${cid}-s${i}-vdiv`, type: "shape", shape: "rect", x: 540, y: 110, w: 1, h: 960, color: "#ffffff", opacity: 0.07, radius: 1 });
        addProfile(100, 580, 460);
        els.push({ id: `${cid}-s${i}-p`, type: "text", text: gs.body, x: 580, y: 200, w: 440, h: 860, fontSize: 38, weight: 400, color: "#C0C0C0", font: SG, align: "left", lineHeight: 1.68 });
        els.push({ id: `${cid}-s${i}-botbar`, type: "shape", shape: "rect", x: 60, y: H-100, w: W-120, h: 2, color: "#ffffff", opacity: 0.07, radius: 1 });
      }

      addPageNum();
      return {
        id: `${cid}-s${i}`,
        bgKey: "noir",
        bgOverride: "#000000",
        bgImageUrl: undefined,
        imagePrompt: undefined,
        elements: els,
      };
    }

    // ─── IMAGE SLIDES ──────────────────────────────────────────────────────────
    let imgTpl: number;
    if (isFirst) imgTpl = 0;
    else if (isLast) imgTpl = 1;
    else imgTpl = 2 + (i % 13); // templates 2–14 for middle image slides

    if (imgTpl === 0 || imgTpl === 1) {
      // Cover / CTA: text bottom over full-bleed background image
      addProfile(H - 640);
      els.push({ id: `${cid}-s${i}-h`, type: "text", text: titleText, segments, x: 60, y: H-560, w: W-120, h: 320, fontSize: 126, weight: 900, color: "#FFFFFF", font: TBF, align: "center", lineHeight: 1.0 });
      els.push({ id: `${cid}-s${i}-p`, type: "text", text: gs.body, x: 100, y: H-230, w: W-200, h: 160, fontSize: 34, weight: 500, color: "#EAEAEA", font: SG, align: "center", lineHeight: 1.4 });

    } else if (imgTpl === 2) {
      // Text top + 1 wide image bottom
      addProfile(100);
      els.push({ id: `${cid}-s${i}-h`, type: "text", text: titleText, segments, x: 60, y: 200, w: W-120, h: 220, fontSize: 100, weight: 900, color: "#FFFFFF", font: TBF, align: "center", lineHeight: 0.95 });
      els.push({ id: `${cid}-s${i}-p`, type: "text", text: gs.body, x: 100, y: 400, w: W-200, h: 180, fontSize: 34, weight: 500, color: "#D4D4D4", font: SG, align: "center", lineHeight: 1.4 });
      els.push({ id: `${cid}-s${i}-img1`, type: "image", imagePrompt: gs.imagePrompt, x: 60, y: 680, w: W-120, h: 580, radius: 24 });

    } else if (imgTpl === 3) {
      // 2 square images top + profile + text bottom
      els.push({ id: `${cid}-s${i}-img1`, type: "image", imagePrompt: gs.imagePrompt, x: 60, y: 100, w: 450, h: 450, radius: 40 });
      els.push({ id: `${cid}-s${i}-img2`, type: "image", imagePrompt: gs.imagePrompt2 || gs.imagePrompt, x: 570, y: 100, w: 450, h: 450, radius: 40 });
      addProfile(610);
      els.push({ id: `${cid}-s${i}-h`, type: "text", text: titleText, segments, x: 60, y: 720, w: W-120, h: 260, fontSize: 96, weight: 900, color: "#FFFFFF", font: TBF, align: "center", lineHeight: 0.95 });
      els.push({ id: `${cid}-s${i}-p`, type: "text", text: gs.body, x: 80, y: 1000, w: W-160, h: 240, fontSize: 34, weight: 500, color: "#D0D0D0", font: SG, align: "center", lineHeight: 1.45 });

    } else if (imgTpl === 4) {
      // Text top + 2 images bottom
      addProfile(100);
      els.push({ id: `${cid}-s${i}-h`, type: "text", text: titleText, segments, x: 60, y: 200, w: W-120, h: 240, fontSize: 100, weight: 900, color: "#FFFFFF", font: TBF, align: "center", lineHeight: 0.95 });
      els.push({ id: `${cid}-s${i}-p`, type: "text", text: gs.body, x: 100, y: 420, w: W-200, h: 180, fontSize: 34, weight: 500, color: "#D4D4D4", font: SG, align: "center", lineHeight: 1.4 });
      els.push({ id: `${cid}-s${i}-img1`, type: "image", imagePrompt: gs.imagePrompt, x: 60, y: 720, w: 450, h: 450, radius: 40 });
      els.push({ id: `${cid}-s${i}-img2`, type: "image", imagePrompt: gs.imagePrompt2 || gs.imagePrompt, x: 570, y: 720, w: 450, h: 450, radius: 40 });

    } else if (imgTpl === 5) {
      // 1 wide image top + text bottom
      els.push({ id: `${cid}-s${i}-img1`, type: "image", imagePrompt: gs.imagePrompt, x: 60, y: 100, w: W-120, h: 580, radius: 24 });
      addProfile(740);
      els.push({ id: `${cid}-s${i}-h`, type: "text", text: titleText, segments, x: 60, y: 840, w: W-120, h: 260, fontSize: 96, weight: 900, color: "#FFFFFF", font: TBF, align: "center", lineHeight: 0.95 });
      els.push({ id: `${cid}-s${i}-p`, type: "text", text: gs.body, x: 100, y: 1110, w: W-200, h: 180, fontSize: 34, weight: 500, color: "#D4D4D4", font: SG, align: "center", lineHeight: 1.4 });

    } else if (imgTpl === 6) {
      // Vertical split: tall image left half, text right half
      els.push({ id: `${cid}-s${i}-img1`, type: "image", imagePrompt: gs.imagePrompt, x: 0, y: 0, w: 500, h: H, radius: 0 });
      els.push({ id: `${cid}-s${i}-divider`, type: "shape", shape: "rect", x: 514, y: 60, w: 3, h: H-120, color: accentColor, opacity: 0.25, radius: 2 });
      addProfile(100, 548, 480);
      els.push({ id: `${cid}-s${i}-h`, type: "text", text: titleText, segments, x: 548, y: 210, w: 460, h: 340, fontSize: 80, weight: 900, color: "#FFFFFF", font: TBF, align: "left", lineHeight: 0.92 });
      els.push({ id: `${cid}-s${i}-bar`, type: "shape", shape: "rect", x: 548, y: 570, w: 80, h: 5, color: accentColor, opacity: 1, radius: 3 });
      els.push({ id: `${cid}-s${i}-p`, type: "text", text: gs.body, x: 548, y: 600, w: 460, h: 340, fontSize: 30, weight: 500, color: "#C8C8C8", font: SG, align: "left", lineHeight: 1.5 });

    } else if (imgTpl === 7) {
      // Small image top-right, text dominates left/center
      els.push({ id: `${cid}-s${i}-img1`, type: "image", imagePrompt: gs.imagePrompt, x: W-340, y: 80, w: 280, h: 280, radius: 28 });
      addProfile(80);
      els.push({ id: `${cid}-s${i}-h`, type: "text", text: titleText, segments, x: 60, y: 200, w: W-420, h: 340, fontSize: 86, weight: 900, color: "#FFFFFF", font: TBF, align: "left", lineHeight: 0.95 });
      els.push({ id: `${cid}-s${i}-rule`, type: "shape", shape: "rect", x: 60, y: H/2-40, w: W-120, h: 2, color: "#ffffff", opacity: 0.08, radius: 1 });
      els.push({ id: `${cid}-s${i}-p`, type: "text", text: gs.body, x: 60, y: H/2, w: W-120, h: 340, fontSize: 38, weight: 500, color: "#CCCCCC", font: SG, align: "left", lineHeight: 1.5 });

    } else if (imgTpl === 8) {
      // Three images: 2 portrait top + 1 wide bottom
      els.push({ id: `${cid}-s${i}-img1`, type: "image", imagePrompt: gs.imagePrompt, x: 60, y: 100, w: 448, h: 360, radius: 20 });
      els.push({ id: `${cid}-s${i}-img2`, type: "image", imagePrompt: gs.imagePrompt2 || gs.imagePrompt, x: 572, y: 100, w: 448, h: 360, radius: 20 });
      addProfile(524);
      els.push({ id: `${cid}-s${i}-h`, type: "text", text: titleText, segments, x: 60, y: 620, w: W-120, h: 220, fontSize: 90, weight: 900, color: "#FFFFFF", font: TBF, align: "center", lineHeight: 0.95 });
      els.push({ id: `${cid}-s${i}-p`, type: "text", text: gs.body, x: 80, y: 860, w: W-160, h: 160, fontSize: 30, weight: 500, color: "#D0D0D0", font: SG, align: "center", lineHeight: 1.45 });
      els.push({ id: `${cid}-s${i}-img3`, type: "image", imagePrompt: gs.imagePrompt, x: 60, y: 1050, w: W-120, h: 210, radius: 20 });

    } else if (imgTpl === 9) {
      // imgTpl === 9: Text overlay top + wide image bottom (large)
      addProfile(80);
      els.push({ id: `${cid}-s${i}-h`, type: "text", text: titleText, segments, x: 60, y: 190, w: W-120, h: 280, fontSize: 102, weight: 900, color: "#FFFFFF", font: TBF, align: "left", lineHeight: 0.92 });
      els.push({ id: `${cid}-s${i}-accent`, type: "shape", shape: "rect", x: 60, y: 490, w: 60, h: 6, color: accentColor, opacity: 1, radius: 3 });
      els.push({ id: `${cid}-s${i}-p`, type: "text", text: gs.body, x: 60, y: 520, w: W-120, h: 200, fontSize: 34, weight: 500, color: "#C8C8C8", font: SG, align: "left", lineHeight: 1.45 });
      els.push({ id: `${cid}-s${i}-img1`, type: "image", imagePrompt: gs.imagePrompt, x: 60, y: 780, w: W-120, h: 480, radius: 24 });

    } else if (imgTpl === 10) {
      // Circular portrait image centered top + title/body below
      els.push({ id: `${cid}-s${i}-ring`, type: "shape", shape: "circle", x: 160, y: 50, w: 760, h: 760, color: accentColor, opacity: 0.18 });
      els.push({ id: `${cid}-s${i}-img1`, type: "image", imagePrompt: gs.imagePrompt, x: 190, y: 80, w: 700, h: 700, radius: 350 });
      els.push({ id: `${cid}-s${i}-dot`, type: "shape", shape: "circle", x: W/2-12, y: 36, w: 24, h: 24, color: accentColor, opacity: 1 });
      addProfile(848);
      els.push({ id: `${cid}-s${i}-h`, type: "text", text: titleText, segments, x: 60, y: 920, w: W-120, h: 220, fontSize: 96, weight: 900, color: "#FFFFFF", font: TBF, align: "center", lineHeight: 0.92 });
      els.push({ id: `${cid}-s${i}-rule`, type: "shape", shape: "rect", x: W/2-60, y: 1158, w: 120, h: 5, color: accentColor, radius: 3, opacity: 1 });
      els.push({ id: `${cid}-s${i}-p`, type: "text", text: gs.body, x: 100, y: 1178, w: W-200, h: 130, fontSize: 34, weight: 500, color: "#D0D0D0", font: SG, align: "center", lineHeight: 1.4 });

    } else if (imgTpl === 11) {
      // Full-bleed bg image + diagonal accent faixa + text bottom
      // bgImageUrl set via imagePrompt at slide level (handled in return)
      els.push({ id: `${cid}-s${i}-faixa`, type: "shape", shape: "rect", x: 0, y: 576, w: W, h: 10, color: accentColor, opacity: 0.75, radius: 0 });
      els.push({ id: `${cid}-s${i}-overlay`, type: "shape", shape: "rect", x: 0, y: 586, w: W, h: H-586, color: "rgba(0,0,0,0.72)", opacity: 1, radius: 0 });
      addProfile(640);
      els.push({ id: `${cid}-s${i}-h`, type: "text", text: titleText, segments, x: 60, y: 730, w: W-120, h: 280, fontSize: 104, weight: 900, color: "#FFFFFF", font: TBF, align: "center", lineHeight: 0.92 });
      els.push({ id: `${cid}-s${i}-p`, type: "text", text: gs.body, x: 100, y: 1024, w: W-200, h: 220, fontSize: 36, weight: 500, color: "#E0E0E0", font: SG, align: "center", lineHeight: 1.4 });

    } else if (imgTpl === 12) {
      // 3-image mosaic: 1 tall left + 2 stacked right
      addProfile(44);
      els.push({ id: `${cid}-s${i}-img1`, type: "image", imagePrompt: gs.imagePrompt, x: 40, y: 120, w: 468, h: 1000, radius: 20 });
      els.push({ id: `${cid}-s${i}-img2`, type: "image", imagePrompt: gs.imagePrompt2 || gs.imagePrompt, x: 548, y: 120, w: 492, h: 480, radius: 20 });
      els.push({ id: `${cid}-s${i}-img3`, type: "image", imagePrompt: gs.imagePrompt, x: 548, y: 620, w: 492, h: 500, radius: 20 });
      els.push({ id: `${cid}-s${i}-rule`, type: "shape", shape: "rect", x: 40, y: 1140, w: W-80, h: 3, color: accentColor, opacity: 0.5, radius: 2 });
      els.push({ id: `${cid}-s${i}-h`, type: "text", text: titleText, segments, x: 40, y: 1160, w: W-80, h: 140, fontSize: 76, weight: 900, color: "#FFFFFF", font: TBF, align: "center", lineHeight: 0.92 });

    } else if (imgTpl === 13) {
      // Full-bleed bg + frosted card overlay with title/body centered
      // bgImageUrl set via imagePrompt at slide level (handled in return)
      els.push({ id: `${cid}-s${i}-card`, type: "shape", shape: "rect", x: 60, y: 270, w: 960, h: 680, color: "rgba(0,0,0,0.65)", opacity: 1, radius: 20 });
      els.push({ id: `${cid}-s${i}-cardtop`, type: "shape", shape: "rect", x: 60, y: 270, w: 220, h: 5, color: accentColor, opacity: 1, radius: 3 });
      addProfile(320, 100, 500);
      els.push({ id: `${cid}-s${i}-h`, type: "text", text: titleText, segments, x: 100, y: 420, w: 880, h: 300, fontSize: 106, weight: 900, color: "#FFFFFF", font: TBF, align: "center", lineHeight: 0.9 });
      els.push({ id: `${cid}-s${i}-rule`, type: "shape", shape: "rect", x: W/2-50, y: 740, w: 100, h: 4, color: accentColor, radius: 2, opacity: 1 });
      els.push({ id: `${cid}-s${i}-p`, type: "text", text: gs.body, x: 120, y: 760, w: 840, h: 160, fontSize: 34, weight: 500, color: "#EAEAEA", font: SG, align: "center", lineHeight: 1.4 });

    } else if (imgTpl === 14) {
      // Title + body top + panoramic 3-image strip bottom
      addProfile(60);
      els.push({ id: `${cid}-s${i}-h`, type: "text", text: titleText, segments, x: 60, y: 160, w: W-120, h: 260, fontSize: 100, weight: 900, color: "#FFFFFF", font: TBF, align: "center", lineHeight: 0.92 });
      els.push({ id: `${cid}-s${i}-rule`, type: "shape", shape: "rect", x: W/2-60, y: 430, w: 120, h: 4, color: accentColor, radius: 2, opacity: 1 });
      els.push({ id: `${cid}-s${i}-p`, type: "text", text: gs.body, x: 100, y: 450, w: W-200, h: 140, fontSize: 34, weight: 500, color: "#D0D0D0", font: SG, align: "center", lineHeight: 1.4 });
      els.push({ id: `${cid}-s${i}-img1`, type: "image", imagePrompt: gs.imagePrompt, x: 40, y: 610, w: 316, h: 400, radius: 16 });
      els.push({ id: `${cid}-s${i}-img2`, type: "image", imagePrompt: gs.imagePrompt2 || gs.imagePrompt, x: 382, y: 610, w: 316, h: 400, radius: 16 });
      els.push({ id: `${cid}-s${i}-img3`, type: "image", imagePrompt: gs.imagePrompt, x: 724, y: 610, w: 316, h: 400, radius: 16 });
      els.push({ id: `${cid}-s${i}-accrule`, type: "shape", shape: "rect", x: 40, y: 1028, w: W-80, h: 3, color: accentColor, opacity: 0.35, radius: 2 });
    }

    addPageNum();

    return {
      id: `${cid}-s${i}`,
      bgKey: "noir",
      bgOverride: (imgTpl === 0 || imgTpl === 1 || imgTpl === 11 || imgTpl === 13) ? undefined : "#000000",
      bgImageUrl: undefined,
      imagePrompt: (imgTpl === 0 || imgTpl === 1 || imgTpl === 11 || imgTpl === 13) ? gs.imagePrompt : undefined,
      elements: els,
    };
  });
}
function buildPrompt(
  theme: string,
  slideCount: number,
  tone: string,
  detail: string,
  viral: boolean,
  context?: Record<string, string>,
  pasteContent?: string,
  modeDebate?: boolean,
  paletteColors?: string[]
): string {
  const ctxBlock = context?.brandName
    ? `\nCONTEXTO DA MARCA:\n- Nome: ${context.brandName}\n- Tom: ${context.tone || ""}\n- Handle: ${context.instagramHandle || ""}`
    : "";

  const toneMap: Record<string, string> = {
    direct: "direto e sem rodeios",
    editorial: "editorial e autoral",
    didactic: "didático passo a passo",
    provocative: "provocativo e contraintuitivo",
    casual: "casual e conversacional",
    authoritive: "autoritativo de especialista",
  };

  const detailMap: Record<string, string> = {
    high: "argumentos completos com dados e exemplos",
    medium: "pontos-chave com profundidade equilibrada",
    short: "frases curtas e diretas ao ponto",
  };

  const pasteBlock = pasteContent
    ? `\nCONTEÚDO DE REFERÊNCIA (extraia os pontos principais deste conteúdo para montar o carrossel):\n---\n${pasteContent.slice(0, 3000)}\n---`
    : "";

  const debateBlock = modeDebate
    ? `\nMODO DEBATE ATIVO: Use estrutura provocativa. Slide 1 deve desafiar uma crença comum com gancho forte tipo "Todo mundo diz X. Mas a realidade é Y." Os slides intermediários devem apresentar argumentos sólidos que contradizem a crença popular com dados e exemplos reais. Use tom desafiador e contraintuitivo ao longo de todo o carrossel.`
    : "";

  const colorHint = paletteColors && paletteColors.length > 0
    ? `\nESQUEMA DE CORES DA PALETA: ${paletteColors.join(", ")} — mencione estas cores sutilmente nos prompts de imagem para garantir coerência visual.`
    : "";

  return `Você é especialista em marketing digital para Instagram.
Crie um carrossel viral com ${slideCount} slides sobre: "${theme}".

TOM: ${toneMap[tone] || "direto"}
NÍVEL DE DETALHE: ${detailMap[detail] || "equilibrado"}
${viral ? "MODO VIRAL: Ative ganchos fortes. REGRA ABSOLUTA: Você DEVE envolver 1 a 2 palavras de cada título com **asteriscos duplos** (ex: O SEGREDO DO **SUCESSO**). ISSO É OBRIGATÓRIO PARA APLICAR A COR NEON!" : "REGRA ABSOLUTA: Você DEVE envolver 1 a 2 palavras de cada título com **asteriscos duplos** (ex: **PALAVRA**) para aplicar a cor de destaque. ISSO É OBRIGATÓRIO."}${debateBlock}${pasteBlock}${colorHint}${ctxBlock}

ESTRUTURA OBRIGATÓRIA:
- Slide 1: título impactante (máx 8 palavras) + gancho/subtítulo curto (1-2 linhas)
- Slides 2 a ${slideCount - 1}: título do ponto (máx 6 palavras) + copy persuasivo DETALHADO (3-5 linhas com dados, exemplos concretos ou argumentos sólidos — slides sem imagem precisam de texto rico)
- Slide ${slideCount}: CTA clara e direta

Para imagePrompt de cada slide: crie em INGLÊS uma cena EXCLUSIVA e altamente criativa que represente exatamente o conteúdo do slide. Seja específico e surpreendente. A cena deve estar DIRETAMENTE ligada ao texto do slide — não use metáforas genéricas.

REGRA OBRIGATÓRIA PARA imagePrompt2: você SEMPRE deve fornecer "imagePrompt2" para TODOS os slides de conteúdo (slides 2 até ${slideCount - 1}). imagePrompt2 DEVE ser uma cena DIFERENTE mas COMPLEMENTAR ao imagePrompt — os dois juntos devem contar a mesma história pelo slide. Exemplo: se imagePrompt mostra "the problem", imagePrompt2 mostra "the solution". Se imagePrompt mostra "before", imagePrompt2 mostra "after". Eles precisam fazer sentido juntos visualmente.

Responda APENAS com JSON válido, sem markdown:
{
  "slides": [
    {
      "slideNumber": 1,
      "title": "Título com **palavras** de destaque",
      "body": "Copy persuasivo do slide",
      "imagePrompt": "cinematic scene description in English",
      "imagePrompt2": "optional second scene description in English"
    }
  ]
}`;
}

export async function POST(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  let theme: string, slideCount: number, tone: string, detail: string;
  let viral: boolean, imageSlides: number[], accentColor: string;
  let pasteContent: string | undefined, modeDebate: boolean, paletteColors: string[] | undefined;

  try {
    const body = await req.json();
    theme = (body.theme ?? "").trim();
    slideCount = Math.min(Math.max(Number(body.slideCount) || 7, 3), 15);
    tone = body.tone || "direct";
    detail = body.detail || "medium";
    viral = body.viral !== false;
    modeDebate = body.modeDebate === true;
    imageSlides = Array.isArray(body.imageSlides) ? body.imageSlides : [];
    accentColor = /^#[0-9A-Fa-f]{6}$/.test(body.accentColor || "") ? body.accentColor : "#FFD700";
    pasteContent = typeof body.pasteContent === "string" && body.pasteContent.trim() ? body.pasteContent.trim() : undefined;
    paletteColors = Array.isArray(body.paletteColors) ? body.paletteColors.filter((c: unknown) => typeof c === "string" && /^#[0-9A-Fa-f]{6}$/.test(c as string)) : undefined;
  } catch {
    return NextResponse.json({ error: "Body JSON inválido." }, { status: 400 });
  }

  if (!theme) return NextResponse.json({ error: "Campo 'theme' é obrigatório." }, { status: 400 });

  await connectDB();

  const user = await User.findById(session.userId).select(
    "+encryptedGeminiKey +geminiKeyIv +geminiKeyAuthTag hasGeminiKey aiContext brandAccentColor profileAvatarUrl"
  );
  if (!user) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
  if (!user.hasGeminiKey) {
    return NextResponse.json({ error: "Nenhuma Gemini API Key configurada. Acesse Configurações para adicionar." }, { status: 422 });
  }

  let geminiApiKey: string;
  try {
    geminiApiKey = decryptApiKey({
      ciphertext: user.encryptedGeminiKey!,
      iv: user.geminiKeyIv!,
      authTag: user.geminiKeyAuthTag!,
    });
  } catch {
    return NextResponse.json({ error: "Falha ao descriptografar a API Key. Re-salve sua chave em Configurações." }, { status: 500 });
  }

  const cid = `c${Date.now()}`;
  const title = theme.length > 60 ? theme.slice(0, 60) + "…" : theme;
  const aiContext = user.aiContext as Record<string, string> | undefined;
  const handle = aiContext?.instagramHandle || "@seuhandle";
  const resolvedAccent = accentColor !== "#FFD700" ? accentColor : (user.brandAccentColor || "#FFD700");

  const carousel = await Carousel.create({
    userId: session.userId,
    title,
    theme: "Recém gerado",
    slides: [],
    status: "generating",
    accentColor: resolvedAccent,
    viral,
    imageSlides,
  });

  try {
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const prompt = buildPrompt(theme, slideCount, tone, detail, viral, aiContext, pasteContent, modeDebate, paletteColors);

    const result = await model.generateContent(prompt);
    const rawText = result.response.text().trim();
    const jsonText = rawText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    const parsed = JSON.parse(jsonText) as { slides: GeminiSlide[] };

    if (!Array.isArray(parsed.slides) || parsed.slides.length === 0) {
      throw new Error("Gemini retornou estrutura de slides inválida.");
    }

    const canvasSlides = buildCanvasSlides(
      parsed.slides,
      cid,
      viral,
      resolvedAccent,
      handle,
      imageSlides,
      user.profileAvatarUrl || undefined
    );

    carousel.slides = canvasSlides;
    carousel.status = "draft";
    await carousel.save();

    return NextResponse.json({
      message: "Carrossel gerado com sucesso! Inicie a geração de imagens para completar.",
      carousel: {
        _id: carousel._id,
        title: carousel.title,
        theme: carousel.theme,
        status: carousel.status,
        accent: carousel.accent,
        accentColor: carousel.accentColor,
        viral: carousel.viral,
        imageSlides: carousel.imageSlides,
        fontPair: carousel.fontPair,
        slides: carousel.slides,
        createdAt: carousel.createdAt,
        updatedAt: carousel.updatedAt,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";

    const isApiKeyError =
      message.includes("API_KEY_INVALID") ||
      message.includes("API key not valid") ||
      message.includes("PERMISSION_DENIED");
    const isQuotaError = message.includes("RESOURCE_EXHAUSTED") || message.includes("quota");

    carousel.status = "error";
    carousel.errorMessage = message;
    await carousel.save();

    if (isApiKeyError) return NextResponse.json({ error: "Gemini API Key inválida. Verifique sua chave em Configurações." }, { status: 401 });
    if (isQuotaError) return NextResponse.json({ error: "Cota da Gemini API esgotada. Aguarde ou verifique seu plano no Google AI Studio." }, { status: 429 });

    console.error("[carousel/generate]", message);
    return NextResponse.json({ error: `Erro ao gerar carrossel: ${message}` }, { status: 502 });
  }
}
