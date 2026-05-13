import * as React from "react";

export function MetricStrip({ name, totalActive, weekCreated, imagesUsed, imagesLimit }: {
  name: string; totalActive: number; weekCreated: number; imagesUsed: number; imagesLimit: number;
}) {
  const pct = Math.min(100, (imagesUsed / Math.max(1, imagesLimit)) * 100);
  return (
    <section className="px-6 py-5 border-b border-border-subtle flex items-center gap-8">
      <div className="flex-1 min-w-0">
        <h1 className="text-h1 text-text-primary">Olá, {name}.</h1>
        <p className="text-body text-text-secondary mt-1">
          Você tem <span className="text-text-primary font-medium">{totalActive} carrosséis</span> ativos
          e gerou <span className="text-text-primary font-medium">{weekCreated}</span> esta semana.
        </p>
      </div>
      <div className="flex items-center divide-x divide-border-subtle">
        <Metric value={`${totalActive}`} label="carrosséis ativos" />
        <Metric value={`${weekCreated}`} label="esta semana" />
        <div className="px-5">
          <div className="text-h2 text-text-primary tnum">{imagesUsed}/{imagesLimit}</div>
          <div className="text-caption text-text-tertiary">imagens IA usadas</div>
          <div className="mt-2 h-0.5 w-20 bg-bg-surface-2 rounded-pill overflow-hidden">
            <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>
    </section>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="px-5 first:pl-0">
      <div className="text-h2 text-text-primary tnum">{value}</div>
      <div className="text-caption text-text-tertiary">{label}</div>
    </div>
  );
}
