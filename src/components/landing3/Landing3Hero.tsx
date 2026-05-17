import Link from "next/link";
import { ArrowRight, Newspaper } from "lucide-react";
import { DashboardPreview } from "./DashboardPreview";

export function Landing3Hero() {
  return (
    <section id="produto" className="landing3-container grid min-h-[calc(100vh-56px)] items-center gap-10 py-12 lg:grid-cols-[0.92fr_1.08fr] lg:py-16">
      <div className="landing3-reveal">
        <div className="mb-5 inline-flex items-center gap-2 rounded-pill border border-border-subtle bg-bg-surface px-3 py-1 text-micro text-text-secondary">
          <span className="h-1.5 w-1.5 rounded-pill bg-accent" />
          NOVACRAFT PARA CRIADORES
        </div>

        <h1 className="landing3-display max-w-4xl text-text-primary">
          Crie carrosséis que parecem pensados por uma equipe.
        </h1>

        <p className="mt-6 max-w-xl text-[16px] leading-7 text-text-secondary">
          Transforme ideias, artigos e contexto da sua marca em posts prontos para publicar,
          com a mesma velocidade de um painel profissional.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/register"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-sm bg-accent px-5 text-[15px] font-medium text-text-inverse transition-colors duration-fast hover:bg-accent-hover"
          >
            Começar agora
            <ArrowRight size={16} strokeWidth={1.5} />
          </Link>
          <a
            href="#modo-noticia"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-sm border border-border bg-bg-surface-2 px-5 text-[15px] font-medium text-text-primary transition-colors duration-fast hover:border-border-strong"
          >
            <Newspaper size={16} strokeWidth={1.5} />
            Ver Modo Notícia
          </a>
        </div>

        <div className="mt-10 grid max-w-xl grid-cols-3 divide-x divide-border-subtle border-y border-border-subtle py-4">
          <Metric value="<60s" label="por carrossel" />
          <Metric value="4:5" label="formato nativo" />
          <Metric value="⌘K" label="fluxo rápido" />
        </div>
      </div>

      <div className="landing3-reveal landing3-delay-2">
        <DashboardPreview />
      </div>
    </section>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="px-4 first:pl-0">
      <div className="text-h2 text-text-primary tnum">{value}</div>
      <div className="mt-1 text-caption text-text-tertiary">{label}</div>
    </div>
  );
}
