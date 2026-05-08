"use client";

import { useState, useEffect, FormEvent, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Script from "next/script";

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

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [recaptchaSiteKey, setRecaptchaSiteKey] = useState("");
  const [recaptchaEnabled, setRecaptchaEnabled] = useState(false);
  const [recaptchaWidgetId, setRecaptchaWidgetId] = useState<number | null>(null);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);

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

  // Render reCAPTCHA v2 checkbox once siteKey is available
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
        <Script
          src="https://www.google.com/recaptcha/api.js"
          strategy="lazyOnload"
        />
      )}
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="card w-full max-w-md space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Criar conta</h1>
            <p className="mt-1 text-sm text-gray-400">Comece a criar carrosséis virais</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-300">Nome</label>
              <input
                className="input"
                type="text"
                placeholder="Seu nome"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-300">Email</label>
              <input
                className="input"
                type="email"
                placeholder="seu@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-300">Senha</label>
              <input
                className="input"
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={8}
              />
            </div>

            {recaptchaEnabled && recaptchaSiteKey && (
              <div ref={recaptchaContainerRef} />
            )}

            {error && (
              <p className="rounded-lg border border-red-800 bg-red-950 px-4 py-2 text-sm text-red-400">
                {error}
              </p>
            )}

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? "Criando conta..." : "Criar conta"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400">
            Já tem conta?{" "}
            <Link href="/login" className="text-brand-500 hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}
