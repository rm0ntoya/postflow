import { CalendarDays, FileText, Image, Palette, Upload, Wand2 } from "lucide-react";

const features = [
  {
    title: "Geração com IA",
    copy: "Copy, estrutura narrativa e sugestões visuais no mesmo fluxo.",
    icon: Wand2,
    wide: true,
  },
  {
    title: "Modo Notícia",
    copy: "Cole um link e transforme matéria em carrossel com tom configurável.",
    icon: FileText,
    featured: true,
  },
  {
    title: "Contexto da marca",
    copy: "A IA escreve com o que você já definiu sobre público, voz e restrições.",
    icon: Image,
  },
  {
    title: "Calendário editorial",
    copy: "Planeje ideias por dia e transforme a pauta em carrossel.",
    icon: CalendarDays,
  },
  {
    title: "Paletas e templates",
    copy: "Mantenha consistência visual sem abrir mão de velocidade.",
    icon: Palette,
  },
  {
    title: "Exportação",
    copy: "Leve os slides finais para o canal onde sua audiência está.",
    icon: Upload,
  },
];

export function FeatureEditorialGrid() {
  return (
    <section className="landing3-container py-20">
      <div className="mb-10 max-w-3xl">
        <p className="text-micro text-accent">RECURSOS</p>
        <h2 className="landing3-section-title mt-3 text-text-primary">
          Um sistema de criação, não uma caixa de prompts.
        </h2>
      </div>

      <div className="grid gap-3 md:grid-cols-6">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <article
              key={feature.title}
              className={`landing3-panel min-h-[220px] p-5 transition-colors duration-fast hover:border-border-strong ${
                feature.featured ? "md:col-span-3 md:row-span-2" : feature.wide ? "md:col-span-3" : "md:col-span-2"
              }`}
            >
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-sm border border-border bg-bg-surface-2 text-text-secondary">
                    <Icon size={18} strokeWidth={1.5} />
                  </span>
                  {feature.featured && (
                    <span className="rounded-pill border border-accent bg-accent-muted px-2.5 py-1 text-caption text-accent">
                      destaque
                    </span>
                  )}
                </div>
                <div className="mt-auto pt-12">
                  <h3 className="text-h2 text-text-primary">{feature.title}</h3>
                  <p className="mt-3 max-w-sm text-body text-text-secondary">{feature.copy}</p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
