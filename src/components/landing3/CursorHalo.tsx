"use client";

import { useEffect, useRef } from "react";

export function CursorHalo() {
  const haloRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const halo = haloRef.current;
    if (!halo) return;

    let raf = 0;
    let x = -200;
    let y = -200;

    const move = (event: PointerEvent) => {
      x = event.clientX;
      y = event.clientY;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        halo.style.transform = `translate3d(${x - 160}px, ${y - 160}px, 0)`;
        raf = 0;
      });
    };

    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      window.removeEventListener("pointermove", move);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return <div ref={haloRef} className="landing3-cursor-halo" aria-hidden />;
}
