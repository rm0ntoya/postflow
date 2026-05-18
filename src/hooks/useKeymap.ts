"use client";
import * as React from "react";
import { useRouter } from "next/navigation";

export function useKeymap() {
  const router = useRouter();
  React.useEffect(() => {
    let chord: string | null = null;
    let chordTimer: any = null;
    const map: Record<string, string> = {
      "g d": "/dashboard",
      "g n": "/dashboard/news",
      "g p": "/dashboard/news-pro",
      "g c": "/dashboard/calendar",
      "g x": "/dashboard/context",
      "g s": "/dashboard/settings",
    };
    const isTyping = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      return ["INPUT", "TEXTAREA"].includes(t.tagName) || t.isContentEditable;
    };
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (chord) {
        const combo = `${chord} ${k}`;
        chord = null;
        clearTimeout(chordTimer);
        if (map[combo]) { e.preventDefault(); router.push(map[combo]); }
        return;
      }
      if (k === "g") {
        chord = "g";
        chordTimer = setTimeout(() => { chord = null; }, 900);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);
}
