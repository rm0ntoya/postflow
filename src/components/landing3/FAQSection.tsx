import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "Preciso saber design?",
    a: "Não. O Carrossel AI organiza a estrutura, sugere a copy e entrega um carrossel editável. Você entra para ajustar direção, tom e detalhes finais.",
  },
  {
    q: "O que é o Modo Notícia?",
    a: "É um fluxo para colar uma URL de matéria, extrair os pontos principais e gerar um carrossel em tom factual, popular ou viral.",
  },
  {
    q: "Posso usar meu contexto de marca?",
    a: "Sim. O contexto informa público, tom de voz, restrições e preferências para a IA escrever de forma mais consistente.",
  },
  {
    q: "Consigo editar antes de publicar?",
    a: "Sim. O carrossel abre no editor para você revisar texto, imagens, ordem dos slides e exportação.",
  },
  {
    q: "Posso cancelar quando quiser?",
    a: "Sim. A proposta é uma operação simples: criar, publicar e manter consistência sem contrato longo.",
  },
];

export function FAQSection() {
  return (
    <section className="border-t border-border-subtle py-20">
      <div className="landing3-container grid gap-10 md:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="text-micro text-accent">FAQ</p>
          <h2 className="landing3-section-title mt-3 text-text-primary">
            Perguntas antes de criar o primeiro carrossel.
          </h2>
        </div>

        <div className="space-y-2">
          {faqs.map((faq, index) => (
            <details key={faq.q} className="group rounded-lg border border-border-subtle bg-bg-surface">
              <summary className="flex cursor-pointer list-none items-center gap-4 px-5 py-4 text-body-strong text-text-primary">
                <span className="text-caption text-text-tertiary tnum">{String(index + 1).padStart(2, "0")}</span>
                <span className="flex-1">{faq.q}</span>
                <ChevronDown size={16} strokeWidth={1.5} className="text-text-tertiary transition-transform duration-fast group-open:rotate-180" />
              </summary>
              <div className="border-t border-border-subtle px-5 py-4 pl-14 text-body text-text-secondary">
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
