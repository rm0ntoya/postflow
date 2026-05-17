"use client";

import React from "react";
import { Navbar } from "@/components/landing2/Navbar";
import { Hero } from "@/components/landing2/Hero";
import { ViralGallery } from "@/components/landing2/ViralGallery";
import { FeatureGrid } from "@/components/landing2/FeatureGrid";

export default function Landing2Page() {
  return (
    <main className="bg-bg-base min-h-screen selection:bg-accent/30 selection:text-text-primary">
      <Navbar />
      <Hero />
      <ViralGallery />
      <FeatureGrid />

      {/* Ticker de Prova Social */}
      <div className="w-full border-y border-border-subtle py-4 bg-bg-surface/30 overflow-hidden whitespace-nowrap">
        <div className="flex gap-12 animate-scroll-h text-micro text-text-tertiary uppercase tracking-[0.2em] font-medium" style={{ "--duration": "30s" } as React.CSSProperties}>
          {[1, 2, 3, 4].map((i) => (
            <span key={i} className="flex gap-12">
              <span>28.421 CRIADORES ATIVOS</span>
              <span>✦</span>
              <span>4.2M POSTS GERADOS</span>
              <span>✦</span>
              <span>98% SATISFAÇÃO</span>
              <span>✦</span>
              <span>GEMINI 2.0 FLASH</span>
              <span>✦</span>
            </span>
          ))}
        </div>
      </div>

      <section id="pricing" className="py-24 px-6 text-center">
        <h2 className="text-display-sm text-text-primary mb-12">Simples & Transparente</h2>
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
           <div className="p-8 rounded-xl border border-border-subtle bg-bg-surface flex flex-col items-center">
              <span className="text-micro text-text-secondary uppercase mb-2">Starter</span>
              <div className="text-display-sm text-text-primary mb-6">R$ 67<span className="text-body text-text-secondary">/mês</span></div>
              <ul className="text-small text-text-secondary space-y-3 mb-8 text-left w-full">
                 <li>✓ 10 Carrosséis por mês</li>
                 <li>✓ Exportação HD</li>
                 <li>✓ Suporte via Chat</li>
              </ul>
              <button className="w-full py-3 rounded-sm border border-border-strong text-text-primary font-bold uppercase text-caption hover:bg-bg-surface-2 transition-colors">Selecionar</button>
           </div>

           <div className="p-8 rounded-xl border border-accent bg-bg-surface flex flex-col items-center relative shadow-[0_0_40px_rgba(198,248,78,0.05)]">
              <div className="absolute -top-3 px-3 py-1 bg-accent text-black text-[10px] font-bold uppercase rounded-full">Recomendado</div>
              <span className="text-micro text-text-secondary uppercase mb-2">Pro</span>
              <div className="text-display-sm text-text-primary mb-6">R$ 197<span className="text-body text-text-secondary">/mês</span></div>
              <ul className="text-small text-text-secondary space-y-3 mb-8 text-left w-full">
                 <li>✓ Carrosséis Ilimitados</li>
                 <li>✓ Modo Notícia Ilimitado</li>
                 <li>✓ Prioridade na Fila IA</li>
                 <li>✓ Suporte VIP 24/7</li>
              </ul>
              <button className="w-full py-3 rounded-sm bg-accent text-black font-bold uppercase text-caption hover:bg-accent/90 transition-colors">Assinar Agora</button>
           </div>
        </div>
      </section>

      <footer className="py-12 border-t border-border-subtle text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-4 h-4 bg-accent rounded-sm" />
          <span className="text-small font-bold text-text-primary">NovaCraft</span>
        </div>
        <p className="text-micro text-text-tertiary">© 2026 NOVACRAFT. TODOS OS DIREITOS RESERVADOS.</p>
      </footer>
    </main>
  );
}
