import Link from "next/link";
import { ArrowRight, Images } from "lucide-react";

export function ViralEngineSection() {
  return (
    <section className="landing3-container py-20">
      <div className="landing3-panel grid gap-8 overflow-hidden p-6 md:p-8 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
        <div className="max-w-xl">
          <p className="text-micro text-accent">MOTOR DE IMAGENS</p>
          <h2 className="landing3-section-title mt-3 text-text-primary">
            Imagens geradas para parar o scroll.
          </h2>
          <p className="mt-5 text-body text-text-secondary">
            Nosso motor visual cria cenas com composição, contraste e intenção narrativa.
            Com o <span className="text-text-primary">Modo Viral ativo</span>, cada imagem nasce para sustentar o gancho do carrossel.
          </p>
          <Link
            href="/landing3/images"
            className="mt-8 inline-flex h-11 items-center justify-center gap-2 rounded-sm bg-accent px-5 text-[15px] font-medium text-text-inverse transition-colors duration-fast hover:bg-accent-hover"
          >
            Explorar imagens
            <ArrowRight size={16} strokeWidth={1.5} />
          </Link>
        </div>

        <div className="relative min-h-[320px] rounded-xl border border-border-subtle bg-bg-base p-4">
          <div className="absolute left-4 top-4 flex items-center gap-2 text-caption text-text-secondary">
            <Images size={16} strokeWidth={1.5} />
            Galeria 3D em tela cheia
          </div>
          <div className="grid h-full min-h-[280px] grid-cols-3 gap-3 pt-10">
            {["/img/viral-27.jpg", "/img/viral-33.jpg", "/img/viral-32.jpg", "/img/viral-26.jpg", "/img/viral-18.jpg", "/img/viral-30.jpg"].map((src, index) => (
              <div key={src} className={`overflow-hidden rounded-lg border border-border-subtle bg-bg-surface ${index % 2 ? "translate-y-5" : ""}`}>
                <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
