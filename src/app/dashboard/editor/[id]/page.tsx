"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Editor from "@/components/Editor";
import Toast from "@/components/Toast";

export default function EditorPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [carousel, setCarousel] = useState<Parameters<typeof Editor>[0]["carousel"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(""), 2500); };

  const [generatingSlide, setGeneratingSlide] = useState<number | null>(null);
  const [generatingProgress, setGeneratingProgress] = useState(0);
  const [externallyGeneratedImages, setExternallyGeneratedImages] = useState<Record<number, string>>({});
  const hasStartedGen = useRef(false);

  useEffect(() => {
    fetch(`/api/carousel/${id}`)
      .then((r) => r.json())
      .then((d) => { if (d.carousel) setCarousel(d.carousel); })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!carousel) return;
    if (hasStartedGen.current) return;

    // Build queue of work items (backgrounds and elements)
    const queue: { slideIndex: number, elementId?: string }[] = [];
    
    carousel.slides.forEach((slide, sIdx) => {
      // Generate bg when slide has imagePrompt — covers first/last regardless of imageSlides list
      const needsBg = !!slide.imagePrompt
        && !slide.bgImageUrl
        && !externallyGeneratedImages[sIdx];
      if (needsBg) {
        queue.push({ slideIndex: sIdx });
      }

      // Check elements
      slide.elements.forEach(el => {
        if (el.type === "image" && el.imagePrompt && !el.imageUrl) {
          queue.push({ slideIndex: sIdx, elementId: el.id });
        }
      });
    });

    if (queue.length === 0) return;
    hasStartedGen.current = true;

    async function processQueue() {
      for (const item of queue) {
        setGeneratingSlide(item.slideIndex);
        setGeneratingProgress(0);

        let progress = 0;
        const progressInterval = setInterval(() => {
          progress += Math.floor(Math.random() * 15) + 5;
          if (progress > 90) progress = 90;
          setGeneratingProgress(progress);
        }, 1500);

        try {
          console.log(`[EditorPage] Gerando imagem para slide ${item.slideIndex}${item.elementId ? ` elemento ${item.elementId}` : " fundo"}...`);
          const res = await fetch(`/api/carousel/${id}/generate-image`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              slideIndex: item.slideIndex,
              elementId: item.elementId 
            }),
          });
          
          const data = await res.json();
          clearInterval(progressInterval);

          if (res.ok && data.url) {
            setGeneratingProgress(100);
            if (!item.elementId) {
              setExternallyGeneratedImages((prev) => ({ ...prev, [item.slideIndex]: data.url }));
            } else {
              // Update element image directly in carousel state — no refetch needed
              setCarousel((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  slides: prev.slides.map((s, sIdx) => {
                    if (sIdx !== item.slideIndex) return s;
                    return {
                      ...s,
                      elements: s.elements.map((el) =>
                        el.id === item.elementId
                          ? { ...el, imageUrl: data.url, photoUrl: data.url }
                          : el
                      ),
                    };
                  }),
                };
              });
            }
          } else {
             showToast("Erro ao gerar imagem: " + (data.error || "Desconhecido"));
          }
        } catch (e) {
          clearInterval(progressInterval);
          console.error(`[EditorPage] Erro no fetch:`, e);
        }
        
        await new Promise((r) => setTimeout(r, 800));
      }
      setGeneratingSlide(null);
      // Final refresh to ensure everything is synced
      const finalRefresh = await fetch(`/api/carousel/${id}`);
      const d = await finalRefresh.json();
      if (d.carousel) setCarousel(d.carousel);
    }

    processQueue();
  }, [carousel]);

  async function handleSave(updated: Parameters<typeof Editor>[0]["carousel"]) {
    const res = await fetch(`/api/carousel/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: updated.title,
        theme: updated.theme,
        slides: updated.slides,
        status: updated.status,
        accent: updated.accent,
        fontPair: updated.fontPair,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setCarousel(data.carousel);
      showToast("Alterações salvas");
    } else {
      showToast("Erro ao salvar");
    }
  }

  if (loading) {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "#06060F", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 32, height: 32, border: "3px solid rgba(255,255,255,.1)", borderTopColor: "#A855F7", borderRadius: "50%", animation: "spin 1s linear infinite" }}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (!carousel) {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "#06060F", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, fontFamily: "'Space Grotesk',system-ui", color: "rgba(255,255,255,.6)" }}>
        <p style={{ fontSize: 18 }}>Carrossel não encontrado</p>
        <button onClick={() => router.push("/dashboard")} style={{ padding: "10px 20px", borderRadius: 10, background: "rgba(108,39,190,.2)", border: "1px solid rgba(168,85,247,.3)", color: "#fff", cursor: "pointer", fontFamily: "inherit" }}>
          Voltar ao dashboard
        </button>
      </div>
    );
  }

  return (
    <>
      <Editor
        carousel={carousel}
        generatingSlide={generatingSlide}
        generatingProgress={generatingProgress}
        externallyGeneratedImages={externallyGeneratedImages}
        onBack={() => { router.push("/dashboard"); router.refresh(); }}
        onSave={handleSave}
      />
      {toast && <Toast msg={toast}/>}
    </>
  );
}
