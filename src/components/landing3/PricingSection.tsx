import Link from "next/link";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "R$ 67",
    copy: "Para começar a criar com consistência.",
    cta: "Começar Starter",
    featured: false,
    features: ["10 carrosséis por mês", "Exportação em alta qualidade", "Contexto básico da marca", "Suporte via chat"],
  },
  {
    name: "Pro",
    price: "R$ 197",
    copy: "Para transformar conteúdo em operação semanal.",
    cta: "Assinar Pro",
    featured: true,
    features: ["Carrosséis ilimitados", "Modo Notícia ilimitado", "Calendário editorial", "Fila IA prioritária", "Paletas e templates salvos"],
  },
];

export function PricingSection() {
  return (
    <section id="precos" className="landing3-container py-20">
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <p className="text-micro text-accent">PREÇOS</p>
        <h2 className="landing3-section-title mt-3 text-text-primary">
          Simples para começar. Forte para virar rotina.
        </h2>
        <p className="mt-4 text-body text-text-secondary">
          Escolha o plano pelo volume da sua operação, não por uma lista confusa de truques.
        </p>
      </div>

      <div className="mx-auto grid max-w-4xl gap-3 md:grid-cols-2">
        {plans.map((plan) => (
          <article
            key={plan.name}
            className={`landing3-panel relative p-6 ${plan.featured ? "border-accent" : ""}`}
          >
            {plan.featured && (
              <div className="absolute right-5 top-5 rounded-pill border border-accent bg-accent-muted px-3 py-1 text-micro text-accent">
                recomendado
              </div>
            )}
            <h3 className="text-h2 text-text-primary">{plan.name}</h3>
            <p className="mt-2 max-w-xs text-body text-text-secondary">{plan.copy}</p>
            <div className="mt-8 flex items-end gap-2">
              <span className="text-display text-text-primary">{plan.price}</span>
              <span className="pb-1 text-body text-text-secondary">/mês</span>
            </div>
            <div className="my-6 h-px bg-border-subtle" />
            <ul className="space-y-3">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-body text-text-secondary">
                  <Check size={15} strokeWidth={1.5} className="mt-0.5 shrink-0 text-accent" />
                  {feature}
                </li>
              ))}
            </ul>
            <Link
              href="/register"
              className={`mt-8 inline-flex h-11 w-full items-center justify-center rounded-sm text-[15px] font-medium transition-colors duration-fast ${
                plan.featured
                  ? "bg-accent text-text-inverse hover:bg-accent-hover"
                  : "border border-border bg-bg-surface-2 text-text-primary hover:border-border-strong"
              }`}
            >
              {plan.cta}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
