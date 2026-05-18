"use client";
import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ISlide } from "@/models/Carousel";
import SlidePreview from "@/components/SlidePreview";
import {
  SlideTemplate, TemplateParams, TemplateCategory,
  TEXT_TEMPLATES, IMAGE_TEMPLATES, CTA_TEMPLATES,
} from "@/lib/slideTemplates";

interface TemplatePickerProps {
  slide: ISlide;
  slideIndex: number;
  accentColor: string;
  handle: string;
  onApply: (template: SlideTemplate) => void;
}

export function TemplatePicker({ slide, slideIndex, accentColor, handle, onApply }: TemplatePickerProps) {
  const hasBgImage = !!(slide as any).bgImageUrl;

  // If slide has background image, text-only templates are incompatible — hide them
  const CATEGORIES: { key: TemplateCategory; label: string; templates: SlideTemplate[] }[] = hasBgImage
    ? [
        { key: "imagem", label: "Imagem", templates: IMAGE_TEMPLATES },
        { key: "cta",    label: "CTA",    templates: CTA_TEMPLATES   },
      ]
    : [
        { key: "texto",  label: "Texto",  templates: TEXT_TEMPLATES  },
        { key: "cta",    label: "CTA",    templates: CTA_TEMPLATES   },
      ];

  const defaultTab = hasBgImage ? "imagem" : "texto";
  const [tab, setTab] = React.useState<TemplateCategory>(defaultTab);
  const [hovered, setHovered] = React.useState<string | null>(null);

  // Reset tab when slide changes (might cross hasBgImage boundary)
  React.useEffect(() => {
    setTab(hasBgImage ? "imagem" : "texto");
  }, [hasBgImage]);

  const previewParams: TemplateParams = React.useMemo(() => ({
    cid: "preview",
    i: slideIndex,
    title: slide.elements.find((e: any) => e.type === "text" && e.fontSize && e.fontSize > 60)?.text || "TÍTULO DO SLIDE",
    body: slide.elements.find((e: any) => e.type === "text" && e.fontSize && e.fontSize <= 60 && e.fontSize >= 28)?.text || "Texto do corpo aqui.",
    accentColor,
    handle,
    imagePrompt: slide.elements.find((e: any) => e.type === "image")?.imagePrompt || "editorial photo",
  }), [slide, slideIndex, accentColor, handle]);

  const previewSlide = React.useCallback((template: SlideTemplate): ISlide => {
    const elements = template.build(previewParams);
    return {
      ...slide,
      elements,
      bgImageUrl: template.category === "imagem" ? slide.bgImageUrl : undefined,
    } as ISlide;
  }, [slide, previewParams]);

  const activeCategory = CATEGORIES.find(c => c.key === tab)!;

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 180px)" }}>
      {/* Tabs */}
      <div className="flex border-b border-border-subtle shrink-0">
        {CATEGORIES.map(cat => (
          <button
            key={cat.key}
            onClick={() => setTab(cat.key)}
            className={`flex-1 py-2.5 text-caption font-medium transition-colors duration-150 ${
              tab === cat.key
                ? "text-accent border-b-2 border-accent -mb-px"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {cat.label}
            <span className="ml-1 text-text-tertiary text-micro">({cat.templates.length})</span>
          </button>
        ))}
      </div>

      {/* Scrollable grid */}
      <div className="flex-1 overflow-y-auto p-3 [&::-webkit-scrollbar]:hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className={activeCategory.templates.length === 0 ? "" : "grid grid-cols-2 gap-3"}
          >
            {activeCategory.templates.length === 0 && (
              <div className="col-span-2 flex flex-col items-center justify-center py-12 text-text-tertiary gap-2">
                <span className="text-2xl">✦</span>
                <p className="text-caption">Nenhum modelo nesta categoria.</p>
              </div>
            )}
            {activeCategory.templates.map(template => (
              <button
                key={template.id}
                onClick={() => onApply(template)}
                onMouseEnter={() => setHovered(template.id)}
                onMouseLeave={() => setHovered(null)}
                className={`group flex flex-col text-left rounded-lg overflow-hidden border-2 transition-all duration-150 ${
                  hovered === template.id
                    ? "border-accent shadow-lg shadow-accent/10 -translate-y-0.5"
                    : "border-border-subtle hover:border-border-strong"
                }`}
                title={template.description}
              >
                {/* Thumbnail */}
                <div className="overflow-hidden bg-bg-base shrink-0" style={{ height: 216 }}>
                  <SlidePreview
                    slide={previewSlide(template)}
                    scale={0.16}
                    style={{ borderRadius: 0 }}
                  />
                </div>
                {/* Label */}
                <div className="px-2 py-2 bg-bg-surface">
                  <div className={`text-caption font-medium truncate transition-colors ${
                    hovered === template.id ? "text-accent" : "text-text-primary"
                  }`}>
                    {template.name}
                  </div>
                  <div className="text-micro text-text-tertiary truncate mt-0.5">
                    {template.description}
                  </div>
                </div>
              </button>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
