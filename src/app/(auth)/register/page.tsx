"use client";

import { useState, useEffect, FormEvent, useRef } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { LogoLockup } from "@/components/Logo";
import { cn } from "@/lib/cn";

declare global {
  interface Window {
    grecaptcha: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, opts: { action: string }) => Promise<string>;
      render: (el: HTMLElement | string, opts: object) => number;
      getResponse: (widgetId?: number) => string;
      reset: (widgetId?: number) => void;
    };
  }
}

function getPasswordStrength(password: string): number {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++;
  return score;
}

const STRENGTH_LABELS = ["", "Fraca", "Razoável", "Boa", "Forte"];
const STRENGTH_COLORS = [
  "",
  "bg-state-danger",
  "bg-state-warning",
  "bg-state-success",
  "bg-accent",
];

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [recaptchaSiteKey, setRecaptchaSiteKey] = useState("");
  const [recaptchaEnabled, setRecaptchaEnabled] = useState(false);
  const [recaptchaWidgetId, setRecaptchaWidgetId] = useState<number | null>(null);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);

  const strength = getPasswordStrength(form.password);

  useEffect(() => {
    fetch("/api/public/config")
      .then(async (r) => {
        if (!r.ok) return;
        const d = await r.json();
        if (d.recaptchaEnabled && d.recaptchaSiteKey) {
          setRecaptchaEnabled(true);
          setRecaptchaSiteKey(d.recaptchaSiteKey);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!recaptchaEnabled || !recaptchaSiteKey || !recaptchaContainerRef.current) return;
    if (typeof window === "undefined" || !window.grecaptcha) return;
    const id = window.grecaptcha.render(recaptchaContainerRef.current, {
      sitekey: recaptchaSiteKey,
      theme: "dark",
    });
    setRecaptchaWidgetId(id);
  }, [recaptchaEnabled, recaptchaSiteKey]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    let recaptchaToken = "";
    if (recaptchaEnabled && recaptchaSiteKey) {
      recaptchaToken = window.grecaptcha?.getResponse(recaptchaWidgetId ?? undefined) ?? "";
      if (!recaptchaToken) {
        setError("Complete a verificação reCAPTCHA.");
        setLoading(false);
        return;
      }
    }

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, recaptchaToken }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Erro ao criar conta.");
      window.grecaptcha?.reset(recaptchaWidgetId ?? undefined);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <>
      {recaptchaEnabled && recaptchaSiteKey && (
        <Script src="https://www.google.com/recaptcha/api.js" strategy="lazyOnload" />
      )}

      <div className="min-h-screen flex bg-bg-base">
        {/* ── ESQUERDA — Formulário ── */}
        <div className="w-full lg:w-[40%] min-w-0 lg:min-w-[480px] flex items-center px-8 lg:px-16 py-16">
          <div className="w-full max-w-[400px] mx-auto flex flex-col gap-6">
            <LogoLockup size={24} />

            <div className="flex flex-col gap-1">
              <h1 className="text-display text-text-primary">Crie sua conta.</h1>
              <p className="text-body text-text-secondary">Comece grátis. Sem cartão de crédito.</p>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-md border border-state-danger/40 bg-state-danger/10 text-body text-state-danger">
                <AlertCircle size={16} strokeWidth={1.5} aria-hidden />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                label="Nome completo"
                type="text"
                inputSize="lg"
                placeholder="Seu nome"
                autoComplete="name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />

              <Input
                label="Email"
                type="email"
                inputSize="lg"
                placeholder="seu@email.com"
                autoComplete="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />

              <div className="flex flex-col gap-1.5">
                <Input
                  label="Senha"
                  type={showPwd ? "text" : "password"}
                  inputSize="lg"
                  placeholder="Mínimo 8 caracteres"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  iconRight={
                    <button
                      type="button"
                      onClick={() => setShowPwd((s) => !s)}
                      className="text-text-tertiary hover:text-text-primary transition-colors duration-fast"
                      aria-label={showPwd ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {showPwd ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
                    </button>
                  }
                />

                {form.password.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex gap-1">
                      {[0, 1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={cn(
                            "h-1 flex-1 rounded-pill transition-colors duration-base",
                            i < strength ? STRENGTH_COLORS[strength] : "bg-bg-surface-3"
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-caption text-text-tertiary">
                      {STRENGTH_LABELS[strength]}
                    </span>
                  </div>
                )}
              </div>

              {recaptchaEnabled && recaptchaSiteKey && (
                <div ref={recaptchaContainerRef} className="flex justify-start" />
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full"
              >
                Criar conta gratuita
              </Button>
            </form>

            <p className="text-caption text-text-secondary text-center">
              Já tem conta?{" "}
              <a
                href="/login"
                className="text-accent hover:text-accent-hover transition-colors duration-fast"
              >
                Entrar
              </a>
            </p>
          </div>
        </div>

        {/* ── DIREITA — Painel de marca ── */}
        <div className="hidden lg:flex w-[60%] bg-bg-surface items-center justify-center px-16">
          <div className="flex flex-col gap-8 max-w-[480px]">
            <div
              className="font-mono leading-tight"
              style={{ fontSize: 56, letterSpacing: "-0.04em" }}
            >
              <div className="text-text-primary">Seu primeiro carrossel</div>
              <div className="text-accent">em 30 segundos.</div>
            </div>

            <div className="h-px bg-border-subtle" />

            <div className="font-mono text-caption text-text-tertiary flex flex-wrap gap-x-4 gap-y-1">
              <span>10k+ criadores</span>
              <span>·</span>
              <span>50k+ carrosséis</span>
              <span>·</span>
              <span>1M+ imagens IA</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
