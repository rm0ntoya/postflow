import type { ISegment } from "@/models/Carousel";

export const CANVAS_W = 1080;
export const CANVAS_H = 1350;

export function parseSegments(title: string, accentColor: string): ISegment[] {
  const segments: ISegment[] = [];
  const parts = title.split(/(\*\*[^*]+\*\*)/g);
  for (const part of parts) {
    if (!part) continue;
    if (part.startsWith("**") && part.endsWith("**")) {
      segments.push({ text: part.slice(2, -2).toUpperCase(), color: accentColor });
    } else {
      segments.push({ text: part.toUpperCase(), color: "#FFFFFF" });
    }
  }
  return segments.length > 0 ? segments : [{ text: title.toUpperCase(), color: "#FFFFFF" }];
}
