"use client";

import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Menu, Lock, Key, CreditCard, Palette, Keyboard, Trash2 } from "lucide-react";

type Section = "perfil" | "conta" | "api" | "plano" | "aparencia" | "atalhos";

/* Settings Switch Component */
interface SettingsSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

function SettingsSwitch({ checked, onChange, disabled = false }: SettingsSwitchProps) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`relative h-6 w-11 rounded-full transition-colors duration-fast ${
        checked ? "bg-accent" : "bg-bg-surface-2 border border-border"
      } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
      role="switch"
      aria-checked={checked}
    >
      <div
        className={`absolute top-1 h-4 w-4 rounded-full bg-bg-base transition-transform duration-fast ${
          checked ? "right-1" : "left-1"
        }`}
      />
    </button>
  );
}

/* Settings Row Component */
interface SettingsRowProps {
  label: string;
  helper?: string;
  children: React.ReactNode;
}

function SettingsRow({ label, helper, children }: SettingsRowProps) {
  return (
    <div className="flex gap-8 items-start py-5 border-b border-border-subtle last:border-0">
      <div className="flex-[0_0_280px]">
        <div className="text-body font-medium text-text-primary mb-1">{label}</div>
        {helper && <div className="text-caption text-text-tertiary">{helper}</div>}
      </div>
      <div className="flex-1 pt-1">
        {children}
      </div>
    </div>
  );
}

/* Shortcuts Table */
const KEYBOARD_SHORTCUTS = [
  { action: "Abrir Paleta de Comandos", shortcut: "⌘K" },
  { action: "Ir para Dashboard", shortcut: "g d" },
  { action: "Ir para Modo Notícia", shortcut: "g n" },
  { action: "Ir para Calendário", shortcut: "g c" },
  { action: "Ir para Contexto", shortcut: "g x" },
  { action: "Criar novo carrossel", shortcut: "c" },
  { action: "Mostrar atalhos", shortcut: "?" },
  { action: "Buscar local", shortcut: "/" },
];

function ShortcutsTable() {
  return (
    <div className="border border-border-subtle rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-subtle bg-bg-surface-2">
            <th className="px-5 py-4 text-left text-caption font-medium text-text-secondary">
              Ação
            </th>
            <th className="px-5 py-4 text-right text-caption font-medium text-text-secondary">
              Atalho
            </th>
          </tr>
        </thead>
        <tbody>
          {KEYBOARD_SHORTCUTS.map((item, idx) => (
            <tr key={idx} className="border-b border-border-subtle last:border-0 hover:bg-bg-surface-2">
              <td className="px-5 py-4 text-body text-text-primary">{item.action}</td>
              <td className="px-5 py-4 text-right">
                <code className="inline-block px-2 py-1 rounded bg-bg-surface-3 border border-border text-caption text-text-secondary font-mono">
                  {item.shortcut}
                </code>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* Main Settings Page */
export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<Section>("perfil");
  const [formState, setFormState] = useState({
    nome: "Ruan Pablo",
    email: "ruan@example.com",
    geminiKey: "",
    denseMode: false,
    reduceMotion: false,
  });
  const [dirtyFields, setDirtyFields] = useState<Record<string, boolean>>({});
  const [savedMessage, setSavedMessage] = useState("");

  const isDirty = Object.values(dirtyFields).some(Boolean);

  const handleFieldChange = useCallback(
    (fieldName: string, value: string | boolean) => {
      setFormState((prev) => ({ ...prev, [fieldName]: value }));
      setDirtyFields((prev) => ({ ...prev, [fieldName]: true }));
      setSavedMessage("");
    },
    []
  );

  const handleSave = async () => {
    console.log("Saving form state:", formState);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setSavedMessage("Configurações salvas com sucesso");
    setDirtyFields({});
    setTimeout(() => setSavedMessage(""), 3000);
  };

  const handleDiscard = () => {
    setFormState({
      nome: "Ruan Pablo",
      email: "ruan@example.com",
      geminiKey: "",
      denseMode: false,
      reduceMotion: false,
    });
    setDirtyFields({});
    setSavedMessage("");
  };

  const SECTIONS: { id: Section; label: string; icon: any }[] = [
    { id: "perfil", label: "Perfil", icon: Menu },
    { id: "conta", label: "Conta", icon: Lock },
    { id: "api", label: "API & Integrações", icon: Key },
    { id: "plano", label: "Plano & Cobrança", icon: CreditCard },
    { id: "aparencia", label: "Aparência", icon: Palette },
    { id: "atalhos", label: "Atalhos", icon: Keyboard },
  ];

  return (
    <div className="flex gap-8 p-8 pb-40">
      {/* Left Sidebar */}
      <div className="flex-[0_0_220px] sticky top-12">
        <nav className="flex flex-col gap-1">
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`px-4 py-3 rounded-sm text-left text-body transition-colors duration-fast flex items-center gap-3 relative ${
                activeSection === section.id
                  ? "text-accent bg-accent-muted"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-surface-2"
              }`}
            >
              <section.icon size={18} className="flex-shrink-0" />
              <span>{section.label}</span>
              {activeSection === section.id && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent" />
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Content Area */}
      <div className="flex-1 max-w-2xl">
        {/* Perfil Section */}
        {activeSection === "perfil" && (
          <div>
            <h2 className="text-h2 text-text-primary mb-8">Perfil</h2>
            <div className="bg-bg-surface border border-border-subtle rounded-lg p-8">
              <SettingsRow label="Nome completo">
                <Input
                  type="text"
                  value={formState.nome}
                  onChange={(e) => handleFieldChange("nome", e.target.value)}
                  inputSize="lg"
                  placeholder="Seu nome"
                />
              </SettingsRow>
              <SettingsRow label="E-mail" helper="O endereço associado à sua conta">
                <Input
                  type="email"
                  value={formState.email}
                  onChange={(e) => handleFieldChange("email", e.target.value)}
                  inputSize="lg"
                  placeholder="seu@email.com"
                />
              </SettingsRow>
            </div>
          </div>
        )}

        {/* Conta Section */}
        {activeSection === "conta" && (
          <div>
            <h2 className="text-h2 text-text-primary mb-8">Conta</h2>
            <div className="bg-bg-surface border border-border-subtle rounded-lg p-8 space-y-5">
              <div className="flex items-center justify-between py-4 border-b border-border-subtle">
                <div>
                  <div className="text-body font-medium text-text-primary mb-1">
                    Alterar senha
                  </div>
                  <div className="text-caption text-text-tertiary">
                    Atualize sua senha regularmente por segurança
                  </div>
                </div>
                <Button variant="secondary" size="md" iconLeft={<Lock size={16} />}>
                  Alterar senha
                </Button>
              </div>
              <div className="flex items-center justify-between py-4">
                <div>
                  <div className="text-body font-medium text-text-primary mb-1">
                    Excluir conta
                  </div>
                  <div className="text-caption text-text-tertiary">
                    Isso não pode ser desfeito
                  </div>
                </div>
                <Button variant="danger" size="md" iconLeft={<Trash2 size={16} />}>
                  Excluir
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* API & Integrações Section */}
        {activeSection === "api" && (
          <div>
            <h2 className="text-h2 text-text-primary mb-8">API & Integrações</h2>
            <div className="bg-bg-surface border border-border-subtle rounded-lg p-8">
              <SettingsRow
                label="Chave API Gemini"
                helper="Mantida privada. Usada apenas em seu navegador."
              >
                <Input
                  type="password"
                  value={formState.geminiKey}
                  onChange={(e) => handleFieldChange("geminiKey", e.target.value)}
                  inputSize="lg"
                  placeholder="Sua chave API Gemini"
                />
              </SettingsRow>
            </div>
          </div>
        )}

        {/* Plano & Cobrança Section */}
        {activeSection === "plano" && (
          <div>
            <h2 className="text-h2 text-text-primary mb-8">Plano & Cobrança</h2>
            <div className="bg-bg-surface border border-border-subtle rounded-lg p-8">
              <div className="flex items-center justify-between py-6">
                <div>
                  <div className="text-body font-medium text-text-primary mb-1">
                    Plano atual
                  </div>
                  <div className="text-caption text-text-secondary">
                    Você está no plano <strong>Gratuito</strong>
                  </div>
                </div>
                <Button variant="primary" size="md">
                  Fazer upgrade
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Aparência Section */}
        {activeSection === "aparencia" && (
          <div>
            <h2 className="text-h2 text-text-primary mb-8">Aparência</h2>
            <div className="bg-bg-surface border border-border-subtle rounded-lg p-8">
              <SettingsRow label="Tema" helper="Selecione como a interface aparece">
                <div className="text-body text-text-secondary">
                  Escuro
                  <span className="ml-2 inline-block px-2 py-1 rounded bg-bg-surface-2 border border-border text-caption">
                    Em breve: Modo claro
                  </span>
                </div>
              </SettingsRow>
              <SettingsRow label="Densidade compacta" helper="Reduz espaçamento na interface">
                <SettingsSwitch
                  checked={formState.denseMode}
                  onChange={(value) => handleFieldChange("denseMode", value)}
                />
              </SettingsRow>
              <SettingsRow label="Reduzir motion" helper="Desativa animações para maior conforto">
                <SettingsSwitch
                  checked={formState.reduceMotion}
                  onChange={(value) => handleFieldChange("reduceMotion", value)}
                />
              </SettingsRow>
            </div>
          </div>
        )}

        {/* Atalhos Section */}
        {activeSection === "atalhos" && (
          <div>
            <h2 className="text-h2 text-text-primary mb-8">Atalhos de teclado</h2>
            <div>
              <ShortcutsTable />
            </div>
          </div>
        )}
      </div>

      {/* Footer Bar for Dirty State */}
      {isDirty && (
        <div className="fixed bottom-0 right-0 left-0 bg-bg-base border-t border-border-subtle">
          <div className="flex items-center justify-between px-8 py-4 max-w-[calc(100%-220px)] ml-auto">
            <div className="flex-1">
              <div className="text-body-strong text-text-primary">
                Você tem alterações não salvas
              </div>
              {savedMessage && (
                <div className="text-caption text-state-success mt-1">
                  {savedMessage}
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                size="md"
                onClick={handleDiscard}
              >
                Descartar
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleSave}
              >
                Salvar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
