"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { GenOverlay } from "@/components/GenOverlay";
import { cn } from "@/lib/cn";

type Tone = "profissional" | "casual" | "educativo" | "provocativo" | "storytelling";
const TONES: { v: Tone; title: string; desc: string }[] = [
  { v: "profissional",  title: "Profissional",  desc: "Tom de relatório, direto." },
  { v: "casual",        title: "Casual",        desc: "Linguagem do dia-a-dia." },
  { v: "educativo",     title: "Educativo",     desc: "Explica como um professor." },
  { v: "provocativo",   title: "Provocativo",   desc: "Ganchos, perguntas fortes." },
  { v: "storytelling",  title: "Storytelling",  desc: "História com começo, meio e fim." },
];
const ACCENTS = ["#C6F84E", "#7DD3FC", "#F472B6", "#FBBF24", "#A78BFA", "#34D399", "#FB7185", "#F5F5F7"];
const SUGGESTIONS = ["Marketing", "Vendas", "Saúde", "Tech", "Lifestyle", "Educação"];

// Compat: legacy settings shape consumed by parent pages.
export interface GenerateSettings {
  theme: string;
  pasteContent?: string;
  tone: string;
  detail: string;
  slideCount: number;
  viral: boolean;
  modeDebate: boolean;
  imageSlides: number[];
  faceSlides: number[];
  accentColor: string;
  paletteColors?: string[];
  paletteId?: string;
  useFace: boolean;
}

export interface CreateModalProps {
  /** New API (DESIGN.md §4.4). Optional — when absent the modal assumes it is mounted conditionally by the parent (legacy behavior). */
  open?: boolean;
  /** Legacy alias. */
  isOpen?: boolean;
  onClose: () => void;
  /** New: receives created carousel id after POST /api/carousel/generate succeeds. */
  onCreated?: (id: string) => void;
  /** Legacy: parent handles generation. When provided, the modal does NOT fetch — it just delegates the settings. */
  onGenerate?: (settings: GenerateSettings) => void;
  prefill?: { theme?: string; tone?: string };
}

export default function CreateModal(props: CreateModalProps) {
  const { onClose, onCreated, onGenerate, prefill } = props;
  const open = props.open ?? props.isOpen ?? true;
  const router = useRouter();
  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const [theme, setTheme] = React.useState(prefill?.theme || "");
  const [useBrand, setUseBrand] = React.useState(true);
  const [tone, setTone] = React.useState<Tone>("educativo");
  const [slides, setSlides] = React.useState(7);
  const [accent, setAccent] = React.useState(ACCENTS[0]);
  const [aiImages, setAiImages] = React.useState(true);
  const [faceSlides, setFaceSlides] = React.useState<number[]>([]);
  const [hasFaceImages, setHasFaceImages] = React.useState(false);
  const [genStep, setGenStep] = React.useState<number | null>(null);

  React.useEffect(() => {
    fetch("/api/user/profile").then(r => r.json()).then(d => setHasFaceImages(!!d.hasFaceImages)).catch(() => {});
  }, []);

  const reset = () => { setStep(1); setTheme(prefill?.theme || ""); setGenStep(null); setFaceSlides([]); };

  async function submit() {
    // Legacy path: delegate to parent.
    if (onGenerate) {
      const imageSlides = aiImages ? Array.from({ length: slides }, (_, i) => i) : [];
      onGenerate({
        theme,
        tone,
        detail: "medium",
        slideCount: slides,
        viral: true,
        modeDebate: false,
        imageSlides,
        faceSlides,
        accentColor: accent,
        useFace: false,
      });
      return;
    }
    // New path: own the fetch + redirect.
    setGenStep(0);
    try {
      const res = await fetch("/api/carousel/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme, tone, slides, accent, aiImages, useBrand, faceSlides }),
      });
      for (let i = 1; i <= 4; i++) { await wait(700); setGenStep(i); }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setGenStep(null);
        if (res.status === 403) {
          const msg = data?.reason === "LIMIT_REACHED"
            ? "Limite de 100 carrosséis mensais atingido. Faça upgrade para Studio."
            : "Seu período de acesso expirou. Assine um plano para continuar.";
          alert(msg + "\n\nRedirecionando para upgrade...");
          router.push("/dashboard/upgrade");
        } else {
          alert(data?.error || "Erro ao gerar carrossel.");
        }
        return;
      }
      const id = data?.id ?? data?._id ?? data?.carouselId;
      if (id) {
        onCreated?.(id);
        router.push(`/dashboard/editor/${id}`);
      }
    } finally { /* keep overlay until route change */ }
  }

  return (
    <>
      <Modal
        open={open && genStep === null}
        onClose={() => { onClose(); reset(); }}
        size="lg"
        title="Novo carrossel"
        footer={
          <>
            {step > 1 && <Button variant="ghost" onClick={() => setStep((s) => (s - 1) as any)}>Voltar</Button>}
            {step < 3 && (
              <Button variant="primary" onClick={() => setStep((s) => (s + 1) as any)} disabled={step === 1 && !theme.trim()}>
                Continuar
              </Button>
            )}
            {step === 3 && <Button variant="primary" size="lg" onClick={submit}>Gerar agora</Button>}
          </>
        }
      >
        <Stepper step={step} />
        {step === 1 && (
          <div className="flex flex-col gap-4">
            <Input
              label="Sobre o que é o carrossel?"
              helper="Seja específico. Ex: '5 erros que fazem você perder seguidores no Instagram em 2026'."
              inputSize="lg"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              autoFocus
            />
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <Chip key={s} onClick={() => setTheme((t) => t ? t : s)}>{s}</Chip>
              ))}
            </div>
            <label className="flex items-center gap-2 mt-2">
              <Switch checked={useBrand} onChange={setUseBrand} />
              <span className="text-body text-text-secondary">Usar contexto da minha marca</span>
            </label>
          </div>
        )}
        {step === 2 && (
          <div className="grid grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-caption text-text-secondary">Tom de voz</label>
              {TONES.map((t) => (
                <button key={t.v} type="button" onClick={() => setTone(t.v)}
                  className={cn(
                    "text-left p-3 rounded-md border transition-colors duration-fast",
                    tone === t.v ? "border-accent bg-accent-muted" : "border-border-subtle bg-bg-surface-2 hover:border-border"
                  )}>
                  <div className="text-body-strong text-text-primary">{t.title}</div>
                  <div className="text-caption text-text-tertiary">{t.desc}</div>
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-caption text-text-secondary block mb-1.5">Quantidade de slides: <span className="text-text-primary tnum">{slides}</span></label>
                <input type="range" min={4} max={10} value={slides}
                  onChange={(e) => setSlides(Number(e.target.value))} className="w-full accent-accent" />
              </div>
              <div>
                <label className="text-caption text-text-secondary block mb-1.5">Cor de acento</label>
                <div className="flex flex-wrap gap-2">
                  {ACCENTS.map((c) => (
                    <button key={c} onClick={() => setAccent(c)}
                      className={cn("h-7 w-7 rounded-pill border-2 transition-colors duration-fast", accent === c ? "border-text-primary" : "border-transparent")}
                      style={{ background: c }} aria-label={c} />
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2">
                <Switch checked={aiImages} onChange={setAiImages} />
                <span className="text-body text-text-secondary">Gerar imagens com IA</span>
              </label>
              {hasFaceImages && aiImages && (
                <div className="pt-2">
                  <div className="text-caption text-text-secondary mb-2">Usar meu rosto nas imagens</div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {Array.from({ length: slides }, (_, i) => {
                      const hasFace = faceSlides.includes(i);
                      return (
                        <button
                          key={i}
                          onClick={() => {
                            const next = hasFace
                              ? faceSlides.filter(s => s !== i)
                              : [...faceSlides, i];
                            setFaceSlides(next);
                          }}
                          className={cn(
                            "py-1.5 px-2 rounded-md border text-caption transition-all",
                            hasFace
                              ? "border-accent bg-accent/10 text-accent"
                              : "border-border-subtle text-text-tertiary hover:border-border"
                          )}
                        >
                          {hasFace ? "😊" : "🖼️"} {i + 1}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button onClick={() => setFaceSlides(Array.from({ length: slides }, (_, i) => i))} className="text-caption text-accent hover:underline">Todos</button>
                    <span className="text-caption text-text-tertiary">·</span>
                    <button onClick={() => setFaceSlides([])} className="text-caption text-text-tertiary hover:underline">Nenhum</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="flex flex-col gap-4">
            <Spec label="Tema" value={theme || "—"} />
            <Spec label="Estilo" value={`${cap(tone)} · ${slides} slides · Acento ${accent}`} />
            <Spec label="Imagens" value={aiImages ? `Gerar com IA (custa ${slides} imagens do plano)` : "Sem imagens IA"} />
          </div>
        )}
      </Modal>
      {genStep !== null && <GenOverlay stepIndex={genStep} />}
    </>
  );
}

function Stepper({ step }: { step: 1 | 2 | 3 }) {
  const items = [{ n: 1, l: "Tema" }, { n: 2, l: "Estilo" }, { n: 3, l: "Revisão" }];
  return (
    <div className="flex items-center gap-3 mb-6">
      {items.map((it, i) => (
        <React.Fragment key={it.n}>
          <div className={cn("flex items-center gap-2 text-caption",
            step === it.n ? "text-accent" : step > it.n ? "text-text-secondary" : "text-text-tertiary")}>
            <span className={cn(
              "h-5 w-5 rounded-pill flex items-center justify-center text-[11px] tnum",
              step === it.n ? "bg-accent text-text-inverse" : step > it.n ? "bg-bg-surface-2 border border-border" : "bg-bg-surface-2 text-text-tertiary"
            )}>{it.n}</span>
            <span>{it.l}</span>
          </div>
          {i < items.length - 1 && <span className="text-text-tertiary">→</span>}
        </React.Fragment>
      ))}
    </div>
  );
}

function Spec({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border-l-2 border-border-subtle pl-3">
      <div className="text-micro text-text-tertiary">{label}</div>
      <div className="text-body text-text-primary mt-0.5">{value}</div>
    </div>
  );
}

function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
      className={cn("h-5 w-9 rounded-pill p-0.5 transition-colors duration-fast",
        checked ? "bg-accent" : "bg-bg-surface-3 border border-border")}>
      <span className={cn("block h-4 w-4 rounded-pill bg-text-inverse transition-transform duration-fast",
        checked ? "translate-x-4" : "translate-x-0")} />
    </button>
  );
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
