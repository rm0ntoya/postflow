"use client";

import React from "react";
import { cn } from "@/lib/cn";
import { Layers, Palette, Terminal, Calendar } from "lucide-react";

const FeatureCard = ({
  title,
  description,
  icon: Icon,
  className,
}: {
  title: string;
  description: string;
  icon: any;
  className?: string;
}) => (
  <div
    className={cn(
      "p-8 rounded-xl border border-border-subtle bg-bg-surface hover:border-accent/40 transition-colors group",
      className
    )}
  >
    <div className="w-10 h-10 rounded-lg bg-bg-surface-2 flex items-center justify-center mb-6 border border-border-subtle group-hover:bg-accent/10 transition-colors">
      <Icon className="w-5 h-5 text-text-secondary group-hover:text-accent transition-colors" />
    </div>
    <h3 className="text-body-strong text-text-primary mb-2">{title}</h3>
    <p className="text-small text-text-secondary leading-relaxed">
      {description}
    </p>
  </div>
);

export const FeatureGrid = () => {
  return (
    <section id="features" className="py-24 bg-bg-base">
      <div className="max-w-screen-xl mx-auto px-6">
        <div className="mb-16">
          <span className="text-micro text-accent uppercase tracking-widest font-bold">
            Features
          </span>
          <h2 className="text-display-sm text-text-primary mt-4">
            Power tools for elite creators.
          </h2>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <FeatureCard
            className="md:col-span-2 md:row-span-2"
            icon={Terminal}
            title="Modo Notícia"
            description="Transforme qualquer URL de notícia em um carrossel educativo e viral em segundos. A IA extrai os pontos chave e gera a copy perfeita."
          />
          <FeatureCard
            icon={Palette}
            title="Smart Palettes"
            description="Cores aplicadas com precisão matemática para garantir leitura e retenção."
          />
          <FeatureCard
            icon={Layers}
            title="Editor Profissional"
            description="Interface limpa focada em conteúdo, sem distrações. Menos Canva, mais resultado."
          />
          <FeatureCard
            className="md:col-span-2"
            icon={Calendar}
            title="Planejador Editorial"
            description="Organize seus posts em um calendário denso e funcional. Saiba exatamente o que postar e quando."
          />
        </div>
      </div>
    </section>
  );
};
