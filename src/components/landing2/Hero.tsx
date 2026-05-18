"use client";

import React from "react";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";

export const Hero = () => {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      <div className="max-w-screen-xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/20 bg-accent/5 mb-6">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-accent">
              Carrossel AI 2.0 is live
            </span>
          </div>

          <h1 className="text-display-md text-text-primary mb-6 leading-[1.1]">
            O fim das horas perdidas no <span className="text-accent">Canva.</span>
          </h1>

          <p className="text-body-lg text-text-secondary mb-8 max-w-lg">
            IA que escreve, desenha e planeja seu conteúdo viral em menos de 60 segundos. O terminal de comando para criadores de elite.
          </p>

          <div className="flex items-center gap-4">
            <Button
              variant="primary"
              size="lg"
              className="bg-accent text-black font-bold uppercase px-8"
            >
              Começar Agora
            </Button>
            <Button variant="ghost" size="lg" className="text-text-secondary">
              Ver demonstração
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative"
        >
          {/* Dashboard Preview Simulation */}
          <div className="relative aspect-[4/3] rounded-xl border border-border-strong bg-bg-surface overflow-hidden shadow-pop">
            <div className="absolute top-0 w-full h-8 border-b border-border-subtle bg-bg-surface-2 flex items-center px-4 gap-2">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-border-strong" />
                <div className="w-2.5 h-2.5 rounded-full bg-border-strong" />
                <div className="w-2.5 h-2.5 rounded-full bg-border-strong" />
              </div>
            </div>

            <div className="mt-8 p-4 grid grid-cols-12 gap-4 h-full">
              <div className="col-span-3 border-r border-border-subtle pr-4 flex flex-col gap-2">
                <div className="h-4 w-full bg-bg-surface-3 rounded-sm" />
                <div className="h-4 w-2/3 bg-bg-surface-3 rounded-sm" />
                <div className="h-4 w-3/4 bg-bg-surface-3 rounded-sm" />
              </div>
              <div className="col-span-9 grid grid-cols-2 gap-3 pb-8">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="aspect-square bg-bg-surface-2 border border-border-subtle rounded-md p-2 flex flex-col gap-2">
                     <div className="flex-1 bg-bg-surface-3 rounded-sm overflow-hidden relative">
                        {i === 1 && <div className="absolute inset-0 bg-accent/20 flex items-center justify-center text-[10px] text-accent">VIRAL</div>}
                     </div>
                     <div className="h-2 w-1/2 bg-bg-surface-3 rounded-sm" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Decorator */}
          <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-accent/10 rounded-full blur-3xl -z-10" />
        </motion.div>
      </div>
    </section>
  );
};
