"use client";

import { useState, useEffect } from "react";
import { Code, Copy, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

interface ContextData {
  brandAbout: string;
  voiceTone: string;
  audience: string;
  avoidTopics: string;
}

const DEFAULT: ContextData = {
  brandAbout: "",
  voiceTone: "",
  audience: "",
  avoidTopics: "",
};

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows: number;
  maxLength?: number;
}

function Field({ label, value, onChange, rows, maxLength = 1000 }: FieldProps) {
  const charCount = value.length;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-caption text-text-secondary">{label}</label>
        <span className="text-caption text-text-tertiary">
          {charCount} / {maxLength}
        </span>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
        rows={rows}
        maxLength={maxLength}
        placeholder={`Adicione ${label.toLowerCase()}...`}
        className="w-full resize-y rounded-sm border border-border bg-bg-surface-2 px-3 py-2 text-body text-text-primary placeholder:text-text-tertiary transition-colors duration-fast focus:border-accent focus:bg-bg-surface focus:ring-2 focus:ring-accent/30 focus:outline-none"
      />
    </div>
  );
}

function buildJsonPreview(data: ContextData): string {
  return JSON.stringify(
    {
      sobreAMarca: data.brandAbout || "(vazio)",
      tomDeVoz: data.voiceTone || "(vazio)",
      publicoAlvo: data.audience || "(vazio)",
      oQueEvitar: data.avoidTopics || "(vazio)",
    },
    null,
    2
  );
}

export default function ContextPage() {
  const toast = useToast();
  const [data, setData] = useState<ContextData>(DEFAULT);
  const [saved, setSaved] = useState<ContextData>(DEFAULT);
  const [isSaving, setIsSaving] = useState(false);
  const [justCopied, setJustCopied] = useState(false);

  const isDirty = JSON.stringify(data) !== JSON.stringify(saved);

  useEffect(() => {
    // TODO: Load from /api/user/context
    // For now, using localStorage for testing
    const stored = localStorage.getItem("contextData");
    if (stored) {
      try {
        const loaded = JSON.parse(stored);
        setData(loaded);
        setSaved(loaded);
      } catch {}
    }
  }, []);

  async function handleSave() {
    setIsSaving(true);
    try {
      // TODO: Replace with actual API call to /api/user/context (PUT)
      localStorage.setItem("contextData", JSON.stringify(data));
      setSaved(data);
      toast.push("success", "Contexto salvo com sucesso");
    } catch {
      toast.push("danger", "Erro ao salvar contexto");
    } finally {
      setIsSaving(false);
    }
  }

  function handleCopy() {
    const json = buildJsonPreview(data);
    navigator.clipboard.writeText(json).then(() => {
      setJustCopied(true);
      toast.push("success", "JSON copiado para a área de transferência");
      setTimeout(() => setJustCopied(false), 2000);
    });
  }

  return (
    <div className="flex flex-col gap-8 p-8 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h1 text-text-primary">Contexto da IA</h1>
          <p className="text-body text-text-secondary mt-2">
            Diretrizes que a IA aplica em todas as gerações
          </p>
        </div>
        {isDirty && (
          <Button
            variant="primary"
            size="md"
            onClick={handleSave}
            loading={isSaving}
          >
            Salvar alterações
          </Button>
        )}
      </div>

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6">
        {/* Left Column: Form */}
        <div className="flex flex-col gap-6">
          <Field
            label="Sobre a marca"
            value={data.brandAbout}
            onChange={(v) => setData({ ...data, brandAbout: v })}
            rows={8}
            maxLength={2000}
          />

          <Field
            label="Tom de voz"
            value={data.voiceTone}
            onChange={(v) => setData({ ...data, voiceTone: v })}
            rows={4}
            maxLength={1000}
          />

          <Field
            label="Público-alvo"
            value={data.audience}
            onChange={(v) => setData({ ...data, audience: v })}
            rows={4}
            maxLength={1000}
          />

          <Field
            label="O que evitar"
            value={data.avoidTopics}
            onChange={(v) => setData({ ...data, avoidTopics: v })}
            rows={3}
            maxLength={800}
          />
        </div>

        {/* Right Column: Sticky Preview Panel */}
        <div className="lg:sticky lg:top-16 lg:h-fit">
          <div className="bg-bg-surface-2 border border-border-subtle rounded-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <Code size={16} className="text-text-secondary" />
                <span className="text-body-strong text-text-primary">
                  Como a IA verá:
                </span>
              </div>
              <button
                onClick={handleCopy}
                className="p-2 rounded-sm text-text-tertiary hover:bg-bg-surface hover:text-text-secondary transition-colors duration-fast"
                title="Copiar JSON"
              >
                {justCopied ? (
                  <CheckCircle2 size={16} className="text-state-success" />
                ) : (
                  <Copy size={16} />
                )}
              </button>
            </div>

            {/* Body: JSON Preview */}
            <div className="p-4 bg-bg-surface overflow-x-auto">
              <pre className="text-caption font-mono text-text-secondary leading-relaxed whitespace-pre-wrap break-words">
                {buildJsonPreview(data)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
