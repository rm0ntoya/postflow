"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Erro ao fazer login.");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="card w-full max-w-md space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Entrar</h1>
          <p className="mt-1 text-sm text-gray-400">Acesse sua conta NovaCraft</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              placeholder="Sua senha"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          {error && (
            <p className="rounded-lg border border-red-800 bg-red-950 px-4 py-2 text-sm text-red-400">
              {error}
            </p>
          )}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400">
          Não tem conta?{" "}
          <Link href="/register" className="text-brand-500 hover:underline">
            Criar conta grátis
          </Link>
        </p>
      </div>
    </main>
  );
}
