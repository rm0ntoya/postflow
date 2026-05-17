import { ArrowDown, Check, Link2, Newspaper } from "lucide-react";

const tones = ["Notícia", "Fofoca", "Viral"];

export function NewsModeSection() {
  return (
    <section id="modo-noticia" className="border-y border-border-subtle bg-bg-surface py-20">
      <div className="landing3-container grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <p className="text-micro text-accent">MODO NOTÍCIA</p>
          <h2 className="landing3-section-title mt-3 text-text-primary">
            Cole uma notícia. Receba um carrossel.
          </h2>
          <p className="mt-5 max-w-xl text-body text-text-secondary">
            O Modo Notícia lê a matéria, extrai o essencial e transforma em slides com tom factual, viral ou popular.
          </p>

          <div className="mt-8 grid gap-2 sm:grid-cols-3">
            {tones.map((tone, index) => (
              <div
                key={tone}
                className={`rounded-lg border p-4 ${
                  index === 2 ? "border-accent bg-accent-muted text-accent" : "border-border-subtle bg-bg-surface text-text-secondary"
                }`}
              >
                <div className="text-micro">{tone}</div>
                <p className="mt-3 text-caption text-current">
                  {index === 0 && "Direto, factual e limpo."}
                  {index === 1 && "Drama, reação e linguagem popular."}
                  {index === 2 && "Ganchos fortes e curiosidade."}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="landing3-panel overflow-hidden">
          <div className="border-b border-border-subtle px-5 py-4">
            <div className="flex items-center gap-2 text-caption text-text-secondary">
              <Newspaper size={16} strokeWidth={1.5} />
              Workflow editorial em 3 estágios
            </div>
          </div>

          <div className="grid gap-0 md:grid-cols-2">
            <div className="border-b border-border-subtle p-5 md:border-b-0 md:border-r md:border-border-subtle">
              <div className="mb-4 flex items-center gap-2 text-micro text-text-tertiary">
                <Link2 size={14} strokeWidth={1.5} />
                ARTIGO ORIGINAL
              </div>
              <div className="rounded-lg border border-border-subtle bg-bg-base p-4">
                <div className="mb-4 h-2 w-24 rounded-pill bg-text-tertiary" />
                <h3 className="text-h3 text-text-primary">
                  Nova regra muda como criadores podem distribuir conteúdo nas redes
                </h3>
                <p className="mt-3 text-caption leading-5 text-text-secondary">
                  Especialistas apontam impactos diretos em alcance, frequência de postagem e reaproveitamento de materiais.
                </p>
              </div>
            </div>

            <div className="p-5">
              <div className="mb-4 flex items-center gap-2 text-micro text-accent">
                <ArrowDown size={14} strokeWidth={1.5} />
                CARROSSEL NOVACRAFT
              </div>
              <div className="space-y-3">
                {[
                  "O que muda para criadores a partir de agora",
                  "Por que isso afeta seu alcance semanal",
                  "Como adaptar sua pauta em 3 passos",
                ].map((item, index) => (
                  <div key={item} className="flex items-start gap-3 rounded-lg border border-border-subtle bg-bg-base p-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-accent text-text-inverse">
                      {index + 1}
                    </span>
                    <p className="text-body-strong text-text-primary">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-border-subtle p-5">
            <div className="flex items-center gap-2 text-caption text-text-secondary">
              <Check size={15} strokeWidth={1.5} className="text-accent" />
              Fonte preservada no último slide · 7 slides · tom viral
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
