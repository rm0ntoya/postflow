"use client";
import * as React from "react";
import Link from "next/link";
import { MoreHorizontal, Newspaper } from "lucide-react";
import { Badge, BadgeStatus } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";
import SlidePreview from "@/components/SlidePreview";

export interface CarouselCardData {
  id: string;
  title: string;
  thumbnail?: string;
  coverSlide?: any | null;
  slideCount: number;
  status: BadgeStatus;
  isNews?: boolean;
  updatedRelative: string;
}

export function CarouselCard({ data }: { data: CarouselCardData }) {
  return (
    <Link href={`/dashboard/editor/${data.id}`} className="group block">
      <div className="relative aspect-[4/5] rounded-lg overflow-hidden border border-border-subtle bg-bg-surface-2 transition-all duration-fast group-hover:-translate-y-0.5 group-hover:border-accent">
        {data.coverSlide
          ? <div className="absolute inset-0 overflow-hidden">
              <SlidePreview slide={data.coverSlide as any} scale={280 / 1080} />
            </div>
          : <div className="w-full h-full bg-bg-surface-2" />}
        <div className="absolute inset-0" style={{ background: "linear-gradient(0deg, rgba(0,0,0,0.7) 0%, transparent 40%)" }} />
        {data.isNews && (
          <span className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-pill bg-bg-overlay border border-border text-caption text-text-primary backdrop-blur-sm">
            <Newspaper size={12} strokeWidth={1.5} /> Modo Notícia
          </span>
        )}
        <button
          className="absolute top-2 right-2 h-7 w-7 rounded-sm bg-bg-overlay border border-border opacity-0 group-hover:opacity-100 transition-opacity duration-fast flex items-center justify-center text-text-primary"
          onClick={(e) => { e.preventDefault(); }}
          aria-label="Ações"
        >
          <MoreHorizontal size={14} strokeWidth={1.5} />
        </button>
        <div className="absolute left-0 right-0 bottom-0 p-3 flex items-end gap-2">
          <h3 className="flex-1 text-body-strong text-text-primary line-clamp-2">{data.title}</h3>
          <Badge status={data.status} className="shrink-0" />
        </div>
      </div>
      <div className="mt-2 text-caption text-text-tertiary tnum">
        {data.updatedRelative} · {data.slideCount} slides
      </div>
    </Link>
  );
}

export function NewCarouselCard({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={cn(
        "aspect-[4/5] rounded-lg border border-dashed border-border flex flex-col items-center justify-center gap-2 text-text-secondary",
        "hover:border-accent hover:text-accent transition-colors duration-fast"
      )}>
      <span className="text-[32px] leading-none">+</span>
      <span className="text-body-strong">Novo carrossel</span>
    </button>
  );
}
