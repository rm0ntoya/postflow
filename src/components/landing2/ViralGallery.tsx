"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { cn } from "@/lib/cn";

const IMGS = [
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1614850523296-e8c041df43a4?q=80&w=2670&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=2574&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?q=80&w=2574&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1633167606207-d840b5070fc2?q=80&w=2531&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=2670&auto=format&fit=crop",
];

const Row = ({ images, speed, reverse = false }: { images: string[], speed: number, reverse?: boolean }) => {
  return (
    <div className="flex w-full overflow-hidden select-none mask-fade-h">
      <div
        className={cn(
          "flex gap-4 py-2 animate-scroll-h",
          reverse && "animate-scroll-h-reverse"
        )}
        style={{ "--duration": `${speed}s` } as React.CSSProperties}
      >
        {[...images, ...images].map((src, i) => (
          <div
            key={i}
            className="relative w-64 h-80 rounded-lg overflow-hidden border border-border-subtle group"
          >
            <Image
              src={src}
              alt="Social Media Preview"
              fill
              className="object-cover transition-transform duration-slow group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-opacity" />
          </div>
        ))}
      </div>
    </div>
  );
};

export const ViralGallery = () => {
  return (
    <section id="gallery" className="py-20 bg-bg-base overflow-hidden">
      <div className="max-w-screen-xl mx-auto px-6 mb-12 text-center">
        <h2 className="text-display-sm text-text-primary mb-4">
          Imagens com fator viral
        </h2>
        <p className="text-body text-text-secondary max-w-xl mx-auto">
          IA treinada para criar estéticas de alta performance no Instagram.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <Row images={IMGS} speed={40} />
        <Row images={IMGS.slice().reverse()} speed={50} reverse />
        <Row images={IMGS.slice(2).concat(IMGS.slice(0, 2))} speed={35} />
      </div>
    </section>
  );
};
