import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LogoLockup } from "@/components/Logo";

const links = [
  { href: "#produto", label: "Produto" },
  { href: "#modo-noticia", label: "Modo Notícia" },
  { href: "#exemplos", label: "Exemplos" },
  { href: "#precos", label: "Preços" },
];

export function Landing3Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border-subtle bg-bg-base">
      <nav className="landing3-container flex h-14 items-center gap-4">
        <Link href="/landing3" aria-label="Carrossel AI landing" className="shrink-0">
          <LogoLockup />
        </Link>

        <div className="ml-8 hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-sm px-3 py-2 text-caption text-text-secondary transition-colors duration-fast hover:bg-bg-surface-2 hover:text-text-primary"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/login"
            className="hidden h-9 items-center rounded-sm px-3 text-body-strong text-text-secondary transition-colors duration-fast hover:bg-bg-surface-2 hover:text-text-primary sm:inline-flex"
          >
            Entrar
          </Link>
          <Link
            href="/register"
            className="inline-flex h-9 items-center gap-2 rounded-sm bg-accent px-4 text-body-strong text-text-inverse transition-colors duration-fast hover:bg-accent-hover"
          >
            Criar conta
            <ArrowRight size={16} strokeWidth={1.5} />
          </Link>
        </div>
      </nav>
    </header>
  );
}
