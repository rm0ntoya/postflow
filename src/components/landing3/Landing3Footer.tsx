import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LogoLockup } from "@/components/Logo";

export function Landing3Footer() {
  return (
    <footer className="border-t border-border-subtle bg-bg-surface">
      <div className="landing3-container flex flex-col gap-8 py-10 md:flex-row md:items-center">
        <div className="flex-1">
          <LogoLockup />
          <p className="mt-3 max-w-md text-body text-text-secondary">
            O painel profissional para transformar ideias, notícias e contexto de marca em carrosséis publicáveis.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-caption text-text-secondary">
          <a href="#produto" className="hover:text-text-primary">Produto</a>
          <a href="#modo-noticia" className="hover:text-text-primary">Modo Notícia</a>
          <a href="#exemplos" className="hover:text-text-primary">Exemplos</a>
          <a href="#precos" className="hover:text-text-primary">Preços</a>
        </div>

        <Link
          href="/register"
          className="inline-flex h-9 items-center justify-center gap-2 rounded-sm bg-accent px-4 text-body-strong text-text-inverse transition-colors duration-fast hover:bg-accent-hover"
        >
          Criar conta
          <ArrowRight size={16} strokeWidth={1.5} />
        </Link>
      </div>
      <div className="landing3-container border-t border-border-subtle py-4 text-caption text-text-tertiary">
        © 2026 NovaCraft. Todos os direitos reservados.
      </div>
    </footer>
  );
}
