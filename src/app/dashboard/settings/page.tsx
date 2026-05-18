"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Menu, Lock, Key, CreditCard, Palette, Keyboard, Trash2, Camera, User, Plus, X } from "lucide-react";

type Section = "perfil" | "conta" | "api" | "plano" | "aparencia" | "atalhos";

function SettingsRow({ label, helper, children }: { label: string; helper?: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-8 items-start py-5 border-b border-border-subtle last:border-0">
      <div className="flex-[0_0_280px]">
        <div className="text-body font-medium text-text-primary mb-1">{label}</div>
        {helper && <div className="text-caption text-text-tertiary">{helper}</div>}
      </div>
      <div className="flex-1 pt-1">{children}</div>
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const KEYBOARD_SHORTCUTS = [
  { action: "Abrir Paleta de Comandos", shortcut: "⌘K" },
  { action: "Novo carrossel", shortcut: "C" },
  { action: "Ir para Dashboard", shortcut: "G D" },
  { action: "Ir para Notícias", shortcut: "G N" },
  { action: "Ir para Notícia PRO", shortcut: "G P" },
  { action: "Ir para Calendário", shortcut: "G C" },
  { action: "Ir para Configurações", shortcut: "G S" },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<Section>("perfil");
  const [toast, setToast] = useState("");
  const [saving, setSaving] = useState(false);

  // Profile state
  const [name, setName] = useState("");
  const [profileAvatar, setProfileAvatar] = useState<string>("");
  const [faceImages, setFaceImages] = useState<string[]>([]);

  // Plan state
  const [planInfo, setPlanInfo] = useState<{
    plan: string;
    trialEndsAt: string | null;
    planExpiresAt: string | null;
    carouselsThisMonth: number;
  } | null>(null);
  const [openingPortal, setOpeningPortal] = useState(false);

  async function handleManageSubscription() {
    setOpeningPortal(true);
    try {
      const res = await fetch("/api/checkout/portal", { method: "POST" });
      const data = await res.json();
      if (data.portalUrl) {
        window.location.href = data.portalUrl;
      } else {
        showToast(data.error || "Erro ao abrir portal.");
      }
    } catch {
      showToast("Erro de conexão.");
    } finally {
      setOpeningPortal(false);
    }
  }

  // API key state
  const [geminiKey, setGeminiKey] = useState("");
  const [savingKey, setSavingKey] = useState(false);
  const [textModel, setTextModel] = useState("gemini-2.5-flash");
  const [imageModel, setImageModel] = useState("gemini-2.5-flash-image");
  const [savingModel, setSavingModel] = useState(false);

  const TEXT_MODELS = [
    { id: "gemini-2.5-flash",       label: "Gemini 2.5 Flash (Recomendado)" },
    { id: "gemini-2.5-flash-lite",  label: "Gemini 2.5 Flash-Lite" },
    { id: "gemini-2.5-pro",         label: "Gemini 2.5 Pro" },
    { id: "gemini-3-flash-preview",  label: "Gemini 3 Flash (Preview)" },
    { id: "gemini-3.1-flash-lite",  label: "Gemini 3.1 Flash-Lite" },
    { id: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro (Preview)" },
  ];

  const IMAGE_MODELS = [
    { id: "gemini-2.5-flash-image",         label: "Nano Banana — Gemini 2.5 Flash Image (Recomendado)" },
    { id: "gemini-3.1-flash-image-preview", label: "Nano Banana 2 — Gemini 3.1 Flash Image" },
    { id: "gemini-3-pro-image-preview",     label: "Nano Banana Pro — Gemini 3 Pro Image" },
    { id: "imagen-4.0-fast-generate-001",   label: "Imagen 4 Fast" },
    { id: "imagen-4.0-generate-001",        label: "Imagen 4" },
    { id: "imagen-4.0-ultra-generate-001",  label: "Imagen 4 Ultra" },
  ];

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const faceInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  // Load profile on mount
  useEffect(() => {
    fetch("/api/user/profile")
      .then(r => r.json())
      .then(d => {
        setName(d.name || "");
        setProfileAvatar(d.profileAvatarUrl || "");
        setFaceImages(d.faceReferenceImages || []);
      })
      .catch(() => {});
    fetch("/api/user/api-key")
      .then(r => r.json())
      .then(d => {
        if (d.textModel) setTextModel(d.textModel);
        if (d.imageModel) setImageModel(d.imageModel);
      })
      .catch(() => {});
    fetch("/api/user/profile")
      .then(r => r.json())
      .then(d => setPlanInfo({
        plan: d.plan || "free",
        trialEndsAt: d.trialEndsAt || null,
        planExpiresAt: d.planExpiresAt || null,
        carouselsThisMonth: d.carouselsThisMonth || 0,
      }))
      .catch(() => {});
  }, []);

  async function handleSaveProfile() {
    setSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, profileAvatarUrl: profileAvatar, faceReferenceImages: faceImages }),
      });
      if (res.ok) showToast("Perfil salvo com sucesso.");
      else showToast("Erro ao salvar perfil.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { showToast("Foto muito grande. Máximo 2MB."); return; }
    const b64 = await fileToBase64(file);
    setProfileAvatar(b64);
  }

  async function handleFaceUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (faceImages.length >= 4) { showToast("Máximo 4 fotos de rosto."); return; }
    const remaining = 4 - faceImages.length;
    const toProcess = files.slice(0, remaining);
    const converted = await Promise.all(
      toProcess.filter(f => f.size <= 2 * 1024 * 1024).map(f => fileToBase64(f))
    );
    setFaceImages(prev => [...prev, ...converted].slice(0, 4));
    if (faceInputRef.current) faceInputRef.current.value = "";
  }

  function removeFaceImage(idx: number) {
    setFaceImages(prev => prev.filter((_, i) => i !== idx));
  }

  async function handleSaveGeminiKey() {
    if (!geminiKey.trim()) return;
    setSavingKey(true);
    try {
      const res = await fetch("/api/user/api-key", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: geminiKey.trim() }),
      });
      if (res.ok) { showToast("Chave API salva com sucesso."); setGeminiKey(""); }
      else { const d = await res.json(); showToast(d.error || "Erro ao salvar chave."); }
    } finally {
      setSavingKey(false);
    }
  }

  async function handleSaveModels() {
    setSavingModel(true);
    try {
      const res = await fetch("/api/user/api-key", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ textModel, imageModel }),
      });
      if (res.ok) showToast("Modelos salvos com sucesso.");
      else { const d = await res.json(); showToast(d.error || "Erro ao salvar modelos."); }
    } finally {
      setSavingModel(false);
    }
  }

  const SECTIONS: { id: Section; label: string; icon: React.ElementType }[] = [
    { id: "perfil", label: "Perfil", icon: Menu },
    { id: "conta", label: "Conta", icon: Lock },
    { id: "api", label: "API & Integrações", icon: Key },
    { id: "plano", label: "Plano & Cobrança", icon: CreditCard },
    { id: "aparencia", label: "Aparência", icon: Palette },
    { id: "atalhos", label: "Atalhos", icon: Keyboard },
  ];

  return (
    <div className="flex gap-8 p-8 pb-40">
      {/* Sidebar */}
      <div className="flex-[0_0_220px] sticky top-12">
        <nav className="flex flex-col gap-1">
          {SECTIONS.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`px-4 py-3 rounded-sm text-left text-body transition-colors duration-fast flex items-center gap-3 relative ${
                activeSection === section.id
                  ? "bg-bg-surface text-text-primary font-medium"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-surface"
              }`}
            >
              {activeSection === section.id && (
                <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-accent rounded-full" />
              )}
              <section.icon size={18} className="flex-shrink-0" />
              <span>{section.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-2xl space-y-6">

        {/* PERFIL */}
        {activeSection === "perfil" && (
          <div className="space-y-6">
            <h2 className="text-h2 text-text-primary">Perfil</h2>

            {/* Foto de perfil + Nome */}
            <div className="bg-bg-surface border border-border-subtle rounded-lg p-8">
              <SettingsRow label="Foto de perfil" helper="Aparece nos slides como foto do criador.">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-bg-surface-2 border-2 border-border-subtle overflow-hidden flex items-center justify-center">
                      {profileAvatar
                        ? <img src={profileAvatar} alt="Avatar" className="w-full h-full object-cover" />
                        : <User size={28} className="text-text-tertiary" />
                      }
                    </div>
                    <button
                      onClick={() => avatarInputRef.current?.click()}
                      className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-accent flex items-center justify-center hover:bg-accent-hover transition-colors"
                    >
                      <Camera size={12} className="text-text-inverse" />
                    </button>
                    <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                  </div>
                  <div className="space-y-1">
                    <Button variant="secondary" size="sm" onClick={() => avatarInputRef.current?.click()}>
                      Trocar foto
                    </Button>
                    {profileAvatar && (
                      <button onClick={() => setProfileAvatar("")} className="block text-caption text-text-tertiary hover:text-red-400 transition-colors">
                        Remover foto
                      </button>
                    )}
                    <p className="text-caption text-text-tertiary">JPG, PNG ou WebP. Máx 2MB.</p>
                  </div>
                </div>
              </SettingsRow>

              <SettingsRow label="Nome completo">
                <Input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  inputSize="lg"
                  placeholder="Seu nome"
                />
              </SettingsRow>
            </div>

            {/* Referências de Rosto */}
            <div className="bg-bg-surface border border-border-subtle rounded-lg p-8">
              <div className="mb-6">
                <h3 className="text-body-strong text-text-primary mb-1">Referências de Rosto</h3>
                <p className="text-body text-text-secondary">
                  Envie até 4 fotos do seu rosto. Ao gerar carrosséis com IA, você pode ativar o uso do seu rosto nas imagens geradas — slide a slide.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 mb-4">
                {faceImages.map((img, idx) => (
                  <div key={idx} className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-border-subtle group">
                    <img src={img} alt={`Rosto ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeFaceImage(idx)}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <X size={20} className="text-white" />
                    </button>
                    <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                      <span className="text-[10px] text-white font-bold">{idx + 1}</span>
                    </div>
                  </div>
                ))}

                {faceImages.length < 4 && (
                  <button
                    onClick={() => faceInputRef.current?.click()}
                    className="w-24 h-24 rounded-xl border-2 border-dashed border-border-subtle hover:border-accent hover:text-accent text-text-tertiary transition-colors flex flex-col items-center justify-center gap-1"
                  >
                    <Plus size={20} />
                    <span className="text-micro">Adicionar</span>
                  </button>
                )}
                <input ref={faceInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFaceUpload} />
              </div>

              <p className="text-caption text-text-tertiary">
                {faceImages.length}/4 fotos · Use fotos com rosto visível e boa iluminação para melhores resultados.
              </p>
            </div>

            {/* Save button */}
            <div className="flex justify-end">
              <Button variant="primary" size="lg" onClick={handleSaveProfile} loading={saving}>
                Salvar perfil
              </Button>
            </div>
          </div>
        )}

        {/* CONTA */}
        {activeSection === "conta" && (
          <div>
            <h2 className="text-h2 text-text-primary mb-8">Conta</h2>
            <div className="bg-bg-surface border border-border-subtle rounded-lg p-8 space-y-5">
              <div className="flex items-center justify-between py-4 border-b border-border-subtle">
                <div>
                  <div className="text-body font-medium text-text-primary mb-1">Alterar senha</div>
                  <div className="text-caption text-text-tertiary">Atualize sua senha regularmente por segurança</div>
                </div>
                <Button variant="secondary" size="md" iconLeft={<Lock size={16} />}>Alterar senha</Button>
              </div>
              <div className="flex items-center justify-between py-4">
                <div>
                  <div className="text-body font-medium text-text-primary mb-1">Excluir conta</div>
                  <div className="text-caption text-text-tertiary">Isso não pode ser desfeito</div>
                </div>
                <Button variant="danger" size="md" iconLeft={<Trash2 size={16} />}>Excluir</Button>
              </div>
            </div>
          </div>
        )}

        {/* API */}
        {activeSection === "api" && (
          <div className="space-y-6">
            <h2 className="text-h2 text-text-primary">API & Integrações</h2>
            <div className="bg-bg-surface border border-border-subtle rounded-lg p-8">
              <SettingsRow label="Chave API Gemini" helper="Salva de forma encriptada. Nunca exposta.">
                <div className="space-y-3">
                  <Input
                    type="password"
                    value={geminiKey}
                    onChange={e => setGeminiKey(e.target.value)}
                    inputSize="lg"
                    placeholder="AIza..."
                  />
                  <Button variant="primary" size="md" onClick={handleSaveGeminiKey} loading={savingKey} disabled={!geminiKey.trim()}>
                    Salvar chave
                  </Button>
                </div>
              </SettingsRow>
              <SettingsRow label="Modelo de Texto" helper="Usado para gerar o conteúdo dos carrosséis.">
                <select
                  value={textModel}
                  onChange={e => setTextModel(e.target.value)}
                  className="w-full px-3 py-2 bg-bg-base border border-border-subtle rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent"
                >
                  {TEXT_MODELS.map(m => (
                    <option key={m.id} value={m.id}>{m.label}</option>
                  ))}
                </select>
              </SettingsRow>
              <SettingsRow label="Modelo de Imagem" helper="Usado para gerar imagens nos slides.">
                <select
                  value={imageModel}
                  onChange={e => setImageModel(e.target.value)}
                  className="w-full px-3 py-2 bg-bg-base border border-border-subtle rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent"
                >
                  {IMAGE_MODELS.map(m => (
                    <option key={m.id} value={m.id}>{m.label}</option>
                  ))}
                </select>
              </SettingsRow>
              <div className="pt-4">
                <Button variant="primary" size="md" onClick={handleSaveModels} loading={savingModel}>
                  Salvar modelos
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* PLANO */}
        {activeSection === "plano" && (
          <div>
            <h2 className="text-h2 text-text-primary mb-8">Plano & Cobrança</h2>
            <div className="bg-bg-surface border border-border-subtle rounded-lg p-8 space-y-0">
              {planInfo ? (() => {
                const now = new Date();
                const trialEnd = planInfo.trialEndsAt ? new Date(planInfo.trialEndsAt) : null;
                const planEnd = planInfo.planExpiresAt ? new Date(planInfo.planExpiresAt) : null;
                const isInTrial = !!(trialEnd && trialEnd > now);
                const isPro = planInfo.plan === "pro" && !!(planEnd && planEnd > now);
                const isStudio = planInfo.plan === "studio" && !!(planEnd && planEnd > now);
                const daysLeft = (date: Date) => Math.max(0, Math.ceil((date.getTime() - now.getTime()) / 86400000));

                const planLabel = isStudio ? "Studio" : isPro ? "Pro" : isInTrial ? "Trial" : "Free";
                const planColor = isStudio ? "text-purple-400" : isPro ? "text-accent" : isInTrial ? "text-yellow-400" : "text-text-secondary";

                return (
                  <>
                    <SettingsRow label="Plano atual" helper="Seu plano de acesso ativo">
                      <div className={`text-h3 font-bold ${planColor}`}>{planLabel}</div>
                    </SettingsRow>

                    {isInTrial && (
                      <SettingsRow label="Trial expira em" helper="Após isso, upgrade necessário para continuar">
                        <div className="flex items-center gap-3">
                          <span className="text-h3 font-bold text-yellow-400">{daysLeft(trialEnd!)} dias</span>
                          <span className="text-caption text-text-tertiary">({trialEnd!.toLocaleDateString("pt-BR")})</span>
                        </div>
                      </SettingsRow>
                    )}

                    {(isPro || isStudio) && planEnd && (
                      <SettingsRow label="Plano expira em" helper="Renovação automática via Stripe">
                        <div className="flex items-center gap-3">
                          <span className="text-h3 font-bold text-accent">{daysLeft(planEnd)} dias</span>
                          <span className="text-caption text-text-tertiary">({planEnd.toLocaleDateString("pt-BR")})</span>
                        </div>
                      </SettingsRow>
                    )}

                    {isPro && (
                      <SettingsRow label="Carrosséis este mês" helper="Limite: 100/mês no Pro">
                        <div className="flex items-center gap-2">
                          <div className="w-40 h-2 bg-bg-base rounded-full overflow-hidden">
                            <div
                              className="h-full bg-accent rounded-full transition-all"
                              style={{ width: `${Math.min(100, (planInfo.carouselsThisMonth / 100) * 100)}%` }}
                            />
                          </div>
                          <span className="text-caption text-text-secondary">{planInfo.carouselsThisMonth}/100</span>
                        </div>
                      </SettingsRow>
                    )}

                    <div className="pt-6 flex gap-3">
                      <a href="/dashboard/upgrade">
                        <Button variant={isPro || isStudio ? "secondary" : "primary"} size="md">
                          {isPro || isStudio ? "Ver planos" : "Fazer upgrade"}
                        </Button>
                      </a>
                      {(isPro || isStudio) && (
                        <Button
                          variant="secondary"
                          size="md"
                          onClick={handleManageSubscription}
                          loading={openingPortal}
                        >
                          Gerenciar assinatura
                        </Button>
                      )}
                    </div>
                  </>
                );
              })() : (
                <div className="py-6 text-text-tertiary text-caption">Carregando...</div>
              )}
            </div>
          </div>
        )}

        {/* APARÊNCIA */}
        {activeSection === "aparencia" && (
          <div>
            <h2 className="text-h2 text-text-primary mb-8">Aparência</h2>
            <div className="bg-bg-surface border border-border-subtle rounded-lg p-8">
              <p className="text-body text-text-tertiary">Opções de tema em breve.</p>
            </div>
          </div>
        )}

        {/* ATALHOS */}
        {activeSection === "atalhos" && (
          <div>
            <h2 className="text-h2 text-text-primary mb-8">Atalhos de Teclado</h2>
            <div className="bg-bg-surface border border-border-subtle rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="border-b border-border-subtle">
                  <tr>
                    <th className="px-6 py-3 text-left text-micro text-text-tertiary">Ação</th>
                    <th className="px-6 py-3 text-right text-micro text-text-tertiary">Atalho</th>
                  </tr>
                </thead>
                <tbody>
                  {KEYBOARD_SHORTCUTS.map((item, i) => (
                    <tr key={i} className="border-b border-border-subtle last:border-0 hover:bg-bg-surface-2 transition-colors">
                      <td className="px-6 py-4 text-body text-text-primary">{item.action}</td>
                      <td className="px-6 py-4 text-right">
                        <kbd className="px-2 py-1 text-caption text-text-secondary bg-bg-base border border-border-subtle rounded font-mono">{item.shortcut}</kbd>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-bg-surface border border-border-subtle rounded-xl px-5 py-3 text-body text-text-primary shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}
