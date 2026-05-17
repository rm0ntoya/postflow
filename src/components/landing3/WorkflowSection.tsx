import { ArrowRight, FileText, PenLine, Sparkles } from "lucide-react";

const steps = [
  {
    label: "01",
    title: "Escreva uma ideia ou cole uma matéria",
    copy: "Comece com um tema cru, uma URL de notícia ou um briefing da sua marca.",
    icon: FileText,
  },
  {
    label: "02",
    title: "A IA estrutura narrativa e slides",
    copy: "O NovaCraft separa gancho, desenvolvimento, prova e CTA em um carrossel editável.",
    icon: Sparkles,
  },
  {
    label: "03",
    title: "Você edita, exporta e publica",
    copy: "Ajuste detalhes no editor e leve o conteúdo para Instagram, LinkedIn ou sua pauta.",
    icon: PenLine,
  },
];

export function WorkflowSection() {
  return (
    <section className="landing3-container py-20">
      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-micro text-accent">FLUXO DE PRODUÇÃO</p>
          <h2 className="landing3-section-title mt-3 max-w-3xl text-text-primary">
            De uma ideia solta a um post pronto para entrar na pauta.
          </h2>
        </div>
        <p className="max-w-sm text-body text-text-secondary">
          A landing mostra o mesmo raciocínio do painel: menos telas bonitas por vaidade, mais fluxo real para criar.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <article key={step.label} className="landing3-panel p-5">
              <div className="mb-8 flex items-center justify-between">
                <span className="text-micro text-text-tertiary">{step.label}</span>
                <span className="flex h-9 w-9 items-center justify-center rounded-sm border border-border bg-bg-surface-2 text-text-secondary">
                  <Icon size={18} strokeWidth={1.5} />
                </span>
              </div>
              <h3 className="text-h2 text-text-primary">{step.title}</h3>
              <p className="mt-3 text-body text-text-secondary">{step.copy}</p>
              <div className="mt-6 rounded-lg border border-border-subtle bg-bg-base p-3">
                <div className="flex items-center gap-2 text-caption text-text-tertiary">
                  <span className="h-1.5 w-1.5 rounded-pill bg-accent" />
                  {index === 0 && "Tema: 5 erros que derrubam alcance"}
                  {index === 1 && "7 slides · Tom educativo · Hook forte"}
                  {index === 2 && "Exportar PNG · Agendar no calendário"}
                </div>
              </div>
              {index < steps.length - 1 && (
                <ArrowRight className="mt-5 hidden text-text-tertiary md:block" size={18} strokeWidth={1.5} />
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
