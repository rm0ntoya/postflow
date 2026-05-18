"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={cn(
        "fixed top-0 w-full h-12 z-50 flex items-center justify-between px-6 transition-all duration-base",
        scrolled
          ? "bg-bg-base/80 backdrop-blur-md border-b border-border-subtle"
          : "bg-transparent"
      )}
    >
      <div className="flex items-center gap-2">
        {/* Logo Símbolo */}
        <div className="w-5 h-5 bg-accent rounded-[4px] flex-shrink-0" />
        <span className="text-body-strong tracking-tight text-text-primary">
          Carrossel AI
        </span>
      </div>

      <div className="hidden md:flex items-center gap-8">
        <Link
          href="#features"
          className="text-micro text-text-secondary hover:text-accent transition-colors"
        >
          Recursos
        </Link>
        <Link
          href="#gallery"
          className="text-micro text-text-secondary hover:text-accent transition-colors"
        >
          Galeria
        </Link>
        <Link
          href="#pricing"
          className="text-micro text-text-secondary hover:text-accent transition-colors"
        >
          Preços
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="text-micro uppercase">
          Entrar
        </Button>
        <Button
          variant="primary"
          size="sm"
          className="text-micro uppercase font-bold"
        >
          Começar Grátis
        </Button>
      </div>
    </nav>
  );
};
