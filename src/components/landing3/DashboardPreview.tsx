import type { ReactNode } from "react";
import { Calendar, LayoutGrid, Newspaper, Plus, Search } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { Badge } from "@/components/ui/Badge";

const cards = [
  { title: "5 erros que travam seu alcance", status: "Pronto", tone: "Viral", accent: true },
  { title: "Como criar uma pauta semanal", status: "Rascunho", tone: "Educação" },
  { title: "Notícia: nova regra muda tudo", status: "Pronto", tone: "Modo Notícia", news: true },
  { title: "O framework dos 7 slides", status: "Publicado", tone: "Storytelling" },
];

export function DashboardPreview() {
  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
      <div className="flex h-[420px] min-h-0 md:h-[520px]">
        <aside className="hidden w-14 shrink-0 border-r border-border-subtle bg-bg-surface md:flex md:flex-col md:items-center md:gap-3 md:py-4">
          <LogoMark className="text-text-primary" />
          <button className="mt-2 flex h-10 w-10 items-center justify-center rounded-sm bg-accent text-text-inverse" aria-label="Novo carrossel">
            <Plus size={18} strokeWidth={1.5} />
          </button>
          <PreviewIcon active icon={<LayoutGrid size={18} strokeWidth={1.5} />} />
          <PreviewIcon icon={<Newspaper size={18} strokeWidth={1.5} />} />
          <PreviewIcon icon={<Calendar size={18} strokeWidth={1.5} />} />
        </aside>

        <section className="min-w-0 flex-1">
          <div className="flex h-12 items-center gap-3 border-b border-border-subtle px-4">
            <div className="text-caption text-text-secondary">Dashboard</div>
            <div className="ml-auto hidden h-8 w-56 items-center gap-2 rounded-sm border border-border bg-bg-surface-2 px-3 text-caption text-text-tertiary sm:flex">
              <Search size={14} strokeWidth={1.5} />
              Buscar ou executar comando
              <span className="ml-auto rounded-xs border border-border-subtle px-1.5 py-0.5 text-[10px]">⌘K</span>
            </div>
          </div>

          <div className="border-b border-border-subtle px-4 py-4 md:px-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
              <div className="flex-1">
                <h2 className="text-h1 text-text-primary">Olá, criador.</h2>
                <p className="mt-1 text-body text-text-secondary">
                  Você tem <span className="text-text-primary">12 carrosséis</span> ativos e gerou <span className="text-text-primary">3</span> esta semana.
                </p>
              </div>
              <div className="grid grid-cols-3 divide-x divide-border-subtle text-right">
                <MiniMetric value="12" label="ativos" />
                <MiniMetric value="47" label="slides" />
                <MiniMetric value="8/100" label="IA usadas" />
              </div>
            </div>
          </div>

          <div className="flex h-12 items-center gap-2 border-b border-border-subtle px-4 md:px-6">
            {["Todos", "Prontos", "Modo Notícia"].map((item, index) => (
              <span key={item} className={`rounded-pill border px-2.5 py-1 text-caption ${index === 0 ? "border-accent bg-accent-muted text-accent" : "border-border bg-bg-surface-2 text-text-secondary"}`}>
                {item}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 p-4 md:grid-cols-3 md:p-6">
            <button className="aspect-[4/5] rounded-lg border border-dashed border-border bg-bg-base text-text-secondary transition-colors hover:border-accent hover:text-accent">
              <Plus className="mx-auto mb-2" size={28} strokeWidth={1.5} />
              <span className="text-body-strong">Novo carrossel</span>
            </button>
            {cards.map((card) => (
              <article key={card.title} className="group overflow-hidden rounded-lg border border-border-subtle bg-bg-surface-2 transition-all duration-fast hover:-translate-y-0.5 hover:border-accent">
                <div className="relative aspect-[4/5] landing3-surface-grid p-3">
                  {card.news && (
                    <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-pill border border-border bg-bg-overlay px-2 py-0.5 text-[10px] text-text-primary">
                      <Newspaper size={11} strokeWidth={1.5} />
                      Notícia
                    </span>
                  )}
                  <div className="mt-8 h-2 w-12 rounded-pill bg-accent" />
                  <div className="mt-5 space-y-2">
                    <div className="h-2 w-4/5 rounded-pill bg-text-secondary" />
                    <div className="h-2 w-3/5 rounded-pill bg-text-tertiary" />
                  </div>
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="line-clamp-2 text-body-strong text-text-primary">{card.title}</p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-caption text-text-tertiary">{card.tone}</span>
                      <Badge status={card.status === "Publicado" ? "publicado" : card.status === "Pronto" ? "pronto" : "rascunho"} />
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function PreviewIcon({ icon, active = false }: { icon: ReactNode; active?: boolean }) {
  return (
    <span className={`flex h-10 w-10 items-center justify-center rounded-sm ${active ? "bg-accent-muted text-accent" : "text-text-secondary"}`}>
      {icon}
    </span>
  );
}

function MiniMetric({ value, label }: { value: string; label: string }) {
  return (
    <div className="px-4">
      <div className="text-h3 text-text-primary tnum">{value}</div>
      <div className="text-caption text-text-tertiary">{label}</div>
    </div>
  );
}
