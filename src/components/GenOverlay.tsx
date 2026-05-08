import Icon from "./Icon";

const STEPS = [
  { id: "analyze", label: "Analisando contexto e tema" },
  { id: "outline", label: "Estruturando narrativa" },
  { id: "copy",    label: "Escrevendo copy slide a slide" },
  { id: "visual",  label: "Aplicando design e imagens" },
  { id: "finish",  label: "Montando carrossel final" },
];

interface GenOverlayProps {
  progress: number;
  statusText: string;
}

export default function GenOverlay({ progress, statusText }: GenOverlayProps) {
  return (
    <div className="gen-overlay">
      <div className="gen-anim"><Icon name="sparkle" size={32}/></div>
      <div className="gen-title">Criando seu carrossel</div>
      <div className="gen-sub">{statusText}</div>
      <div className="gen-steps">
        {STEPS.map((s, i) => {
          const state = i < progress ? "done" : i === progress ? "active" : "";
          return (
            <div key={s.id} className={`gen-step ${state}`}>
              <div className="gen-step-ico">
                {state === "done" && <Icon name="check"/>}
              </div>
              {s.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}
