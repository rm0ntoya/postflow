"use client";

import { useState, FormEvent, useEffect } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { LogoLockup } from "@/components/Logo";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const ROTATING_TAGLINES = [
  { line1: "Crie carrosséis", line2: "em segundos." },
  { line1: "Automatize com", line2: "inteligência." },
  { line1: "Dispare campanhas", line2: "ao instante." },
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [phraseIdx, setPhraseIdx] = useState(0);

  // Rotate taglines every 4.2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIdx((prev) => (prev + 1) % ROTATING_TAGLINES.length);
    }, 4200);
    return () => clearInterval(interval);
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error ?? "Email ou senha incorretos.");
        return;
      }

      // Redirect to dashboard
      window.location.href = "/dashboard";
    } catch (err) {
      setLoading(false);
      setError("Erro ao conectar. Tente novamente.");
    }
  }

  const tagline = ROTATING_TAGLINES[phraseIdx];

  return (
    <main className="flex min-h-screen">
      {/* Left side — Form (40%, min 480px) */}
      <div className="flex w-full flex-col justify-center px-16 py-16 lg:w-2/5 lg:min-w-[480px]">
        <div className="flex flex-col gap-8 max-w-[400px]">
          {/* Logo + Heading */}
          <div className="flex flex-col gap-4">
            <LogoLockup size={24} />
            <div className="flex flex-col gap-2">
              <h1 className="text-display text-text-primary">
                Bem-vindo de volta.
              </h1>
              <p className="text-body text-text-secondary">
                Entre na sua conta NovaCraft.
              </p>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="rounded-sm border border-state-danger/40 bg-state-danger/10 px-4 py-3 text-caption text-state-danger">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* Email input */}
            <Input
              type="email"
              inputSize="lg"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {/* Password input with show/hide toggle */}
            <div className="flex flex-col gap-4">
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  inputSize="lg"
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  iconRight={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="flex items-center justify-center text-text-tertiary hover:text-text-secondary transition-colors"
                      aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {showPassword ? (
                        <EyeOff size={18} strokeWidth={1.5} />
                      ) : (
                        <Eye size={18} strokeWidth={1.5} />
                      )}
                    </button>
                  }
                  required
                />
              </div>
              {/* Forgot password link */}
              <Link
                href="/forgot-password"
                className="text-caption text-text-secondary hover:text-accent transition-colors text-right"
              >
                Esqueci a senha
              </Link>
            </div>

            {/* Submit button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              loading={loading}
            >
              Entrar
            </Button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-caption text-text-tertiary">ou</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Google OAuth button */}
            <Button
              type="button"
              variant="secondary"
              size="lg"
              className="w-full"
              iconLeft={
                <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              }
            >
              Continuar com Google
            </Button>
          </form>

          {/* Sign up link */}
          <p className="text-center text-caption text-text-secondary">
            Não tem conta?{" "}
            <Link
              href="/register"
              className="text-accent hover:text-accent-hover transition-colors font-medium"
            >
              Criar conta gratuita
            </Link>
          </p>
        </div>
      </div>

      {/* Right side — Rotating taglines (60%, hidden on mobile) */}
      <div className="hidden lg:flex w-3/5 items-center justify-center bg-bg-surface">
        <div className="flex flex-col items-center gap-4 text-center px-8 max-w-[600px]">
          {/* Rotating phrases with animation */}
          <div className="h-[120px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-1">
              <p
                className="text-display text-text-primary font-mono transition-opacity duration-300"
                style={{
                  fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace",
                  fontSize: "56px",
                  letterSpacing: "-0.04em",
                  lineHeight: 1.2,
                }}
              >
                {tagline.line1}
              </p>
              <p
                className="text-accent transition-opacity duration-300"
                style={{
                  fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace",
                  fontSize: "56px",
                  letterSpacing: "-0.04em",
                  lineHeight: 1.2,
                  fontWeight: 600,
                }}
              >
                {tagline.line2}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
