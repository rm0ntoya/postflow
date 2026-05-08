"use client";

import { useState, useEffect, useRef, useCallback, ReactNode } from "react";
import { useRouter } from "next/navigation";
import "./landing-new.css";
import ViralGallery from "@/components/ViralGallery";
import CreatorsTicker from "@/components/CreatorsTicker";
import CeoSection from "@/components/CeoSection";

/* ─────────────────────────────────────────
   DATA
───────────────────────────────────────── */
const features = [
  { num: "01", ico: "✦", title: "Geração com IA", desc: "De zero a carrossel completo com copy, estrutura e prompts de imagem em menos de 60 segundos. Gemini 2.0 Flash.", isNew: false },
  { num: "02", ico: "🎨", title: "Paletas de Cores", desc: "Crie grupos de cores personalizados. Selecione sua paleta ao gerar e a IA aplica automaticamente em todos os elementos.", isNew: true },
  { num: "03", ico: "📅", title: "Planejador de Conteúdo", desc: "Calendário editorial com ideias geradas por IA. Selecione dias, informe o nicho e objetivo — a IA planeja por você.", isNew: true },
  { num: "04", ico: "📋", title: "Paste & Transform", desc: "Cole um artigo, thread, transcrição ou e-mail. A IA detecta o formato, extrai os pontos e transforma em slides virais.", isNew: true },
  { num: "05", ico: "🔥", title: "Modo Debate", desc: "Estrutura provocativa que desafia crenças comuns. 'Todo mundo diz X. Mas a realidade é Y.' Alto potencial viral.", isNew: true },
  { num: "06", ico: "📚", title: "Biblioteca de Hooks", desc: "8 templates de hook com alto potencial viral, organizados por objetivo. Clique e o carrossel é estruturado a partir dele.", isNew: false },
];

const testimonials = [
  { emoji: "😊", name: "Lucas Ferreira", role: "Coach de Produtividade", followers: "34k seg.", text: "Em 2 meses meu perfil saiu de 8k para <strong>34 mil seguidores</strong>. O planejador de conteúdo com IA mudou como eu trabalho." },
  { emoji: "💁", name: "Mariana Costa", role: "Nutricionista", followers: "19k seg.", text: "Gero <strong>5 posts por semana</strong> sem estresse. O consultório lotou em 45 dias com o conteúdo gerado." },
  { emoji: "🧑‍💼", name: "Rafael Mendes", role: "Especialista em Vendas", followers: "52k seg.", text: "Antes terceirizava design por R$3k/mês. Agora pago R$67 e tenho <strong>resultado muito melhor</strong>. As paletas de cores são incríveis." },
  { emoji: "👩‍🎨", name: "Julia Santos", role: "Social Media Freelancer", followers: "", text: "Gerencio <strong>8 clientes</strong> sozinha. O modo debate e o paste & transform economizaram horas do meu dia." },
  { emoji: "🏋️", name: "Bruno Lima", role: "Personal Trainer", followers: "28k seg.", text: "Meus posts viralizaram 3 vezes esse mês. <strong>Nunca tive resultados assim</strong>. O hook library é ouro puro." },
  { emoji: "👩‍💻", name: "Amanda Rocha", role: "Dev & Criadora", followers: "15k seg.", text: "Finalmente consigo manter consistência no perfil com <strong>zero esforço extra</strong>. A IA aprende meu tom." },
];

const faqs = [
  { q: "Preciso saber design ou edição?", a: "Não. Você descreve o tema e a IA cria tudo — copy, estrutura de slides e prompts de imagem. Sem experiência em design necessária." },
  { q: "O que é o planejador de conteúdo?", a: "Um calendário onde você seleciona os dias que quer postar, informa seu nicho e objetivo, e a IA gera ideias de carrosséis virais para cada dia. Com 1 clique você transforma qualquer ideia em carrossel." },
  { q: "O que são as paletas de cores?", a: "Você cria grupos de cores que representam sua identidade visual. Na hora de gerar um carrossel, selecione a paleta e a IA aplica as cores automaticamente nos destaques de texto e nas imagens." },
  { q: "Como funciona o Paste & Transform?", a: "Cole qualquer texto — artigo, thread do Twitter/X, transcrição de vídeo, e-mail — e a IA extrai os pontos principais e transforma em slides otimizados para Instagram." },
  { q: "Minha Gemini API Key fica segura?", a: "Sim. Sua chave é criptografada com AES-256-GCM antes de ser salva. Nem nossa equipe tem acesso à chave em texto puro." },
  { q: "Posso cancelar quando quiser?", a: "Sim, sem multas ou períodos mínimos. Cancele quando quiser pelo painel de configurações. 7 dias grátis para testar." },
];

const tickerItems = [
  { label: "+28.000", desc: "criadores ativos" },
  { label: "+4,2M", desc: "posts gerados" },
  { label: "3.4×", desc: "mais engajamento" },
  { label: "4.9★", desc: "avaliação média" },
  { label: "7 dias", desc: "de teste grátis" },
  { label: "<60s", desc: "por carrossel" },
];

const heroCards = [
  {
    label: "CARROSSEL VIRAL",
    title: "5 erros que matam seu engajamento no Instagram",
    body: "O algoritmo pune quem faz isso — e você provavelmente faz.",
    tag: "MODO DEBATE",
  },
  {
    label: "COPY ESTRATÉGICA",
    title: "A rotina secreta dos criadores com 100k+",
    body: "Não é sobre postar mais. É sobre postar certo.",
    tag: "ALTO VIRAL",
  },
  {
    label: "PALETA: MARCA",
    title: "Como triplicar alcance orgânico em 30 dias",
    body: "Framework validado com dados de 500+ perfis analisados.",
    tag: "PLANEJADO",
  },
];


/* ─────────────────────────────────────────
   MAGNETIC BUTTON
───────────────────────────────────────── */
function MagneticBtn({ children, className, onClick, style }: { children: ReactNode; className?: string; onClick?: () => void; style?: React.CSSProperties }) {
  const ref = useRef<HTMLButtonElement>(null);

  const handleMove = useCallback((e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) * 0.28;
    const y = (e.clientY - rect.top - rect.height / 2) * 0.28;
    el.style.transform = `translate(${x}px, ${y}px)`;
  }, []);

  const handleLeave = useCallback(() => {
    if (ref.current) ref.current.style.transform = "";
  }, []);

  return (
    <button
      ref={ref}
      className={className}
      onClick={onClick}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ transition: "transform .45s cubic-bezier(.23,1,.32,1)", ...style }}
    >
      {children}
    </button>
  );
}

/* ─────────────────────────────────────────
   AUTH MODAL
───────────────────────────────────────── */
function AuthModal({ tab: initTab, onClose }: { tab: "login" | "register"; onClose: () => void }) {
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "register">(initTab);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k: string, v: string) => { setForm((f) => ({ ...f, [k]: v })); setError(""); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    const endpoint = tab === "login" ? "/api/auth/login" : "/api/auth/register";
    const body = tab === "login" ? { email: form.email, password: form.password } : form;
    const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Erro. Tente novamente."); return; }
    router.push("/dashboard");
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,.8)", backdropFilter: "blur(20px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="glass" style={{ width: "100%", maxWidth: 420, padding: "40px 36px", borderRadius: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
          <div className="navbar-logo-mark">✦</div>
          <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 17, color: "#fff" }}>NovaCraft AI</span>
          <button onClick={onClose} style={{ marginLeft: "auto", width: 30, height: 30, borderRadius: "50%", border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.04)", color: "rgba(255,255,255,.5)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>✕</button>
        </div>

        <div style={{ display: "flex", background: "rgba(255,255,255,.04)", borderRadius: 12, padding: 4, marginBottom: 24 }}>
          {(["login", "register"] as const).map((t) => (
            <button key={t} onClick={() => { setTab(t); setError(""); }} style={{ flex: 1, padding: "9px", borderRadius: 9, fontFamily: "'Space Grotesk',sans-serif", fontSize: 13, fontWeight: tab === t ? 600 : 400, background: tab === t ? "rgba(108,39,190,.18)" : "transparent", color: tab === t ? "#C4B5FD" : "rgba(255,255,255,.45)", border: "none", cursor: "pointer", transition: "all .2s" }}>
              {t === "login" ? "Entrar" : "Criar conta"}
            </button>
          ))}
        </div>

        <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 400, letterSpacing: "-0.03em", fontSize: 22, color: "#fff", marginBottom: 4 }}>
          {tab === "login" ? "Bem-vindo de volta." : "Comece agora."}
        </p>
        <p style={{ fontSize: 13, color: "rgba(240,232,215,.45)", marginBottom: 24 }}>
          {tab === "login" ? "Acesse sua conta" : "7 dias grátis · Sem cartão"}
        </p>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {tab === "register" && (
            <input className="auth-input" type="text" placeholder="Seu nome" value={form.name} onChange={(e) => set("name", e.target.value)} required style={{ width: "100%", padding: "12px 16px", borderRadius: 12, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)", color: "#fff", fontSize: 14, fontFamily: "inherit", outline: "none", transition: "border-color .2s" }} />
          )}
          <input type="email" placeholder="seu@email.com" value={form.email} onChange={(e) => set("email", e.target.value)} required style={{ width: "100%", padding: "12px 16px", borderRadius: 12, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)", color: "#fff", fontSize: 14, fontFamily: "inherit", outline: "none" }} />
          <input type="password" placeholder={tab === "register" ? "Mínimo 8 caracteres" : "Senha"} value={form.password} onChange={(e) => set("password", e.target.value)} required minLength={tab === "register" ? 8 : 1} style={{ width: "100%", padding: "12px 16px", borderRadius: 12, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)", color: "#fff", fontSize: 14, fontFamily: "inherit", outline: "none" }} />

          {error && <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.2)", color: "#fca5a5", fontSize: 13 }}>{error}</div>}

          <button type="submit" disabled={loading} style={{ padding: "14px", borderRadius: 999, background: "linear-gradient(135deg,#6C27BE,#A855F7 55%,#F97316)", color: "#fff", fontSize: 15, fontWeight: 600, fontFamily: "'Space Grotesk',sans-serif", border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, marginTop: 4, boxShadow: "0 6px 24px rgba(108,39,190,.4)", transition: "opacity .2s" }}>
            {loading ? (tab === "login" ? "Entrando..." : "Criando...") : (tab === "login" ? "Entrar na plataforma" : "Criar conta grátis")}
          </button>
        </form>
        <p style={{ fontSize: 13, color: "rgba(240,232,215,.35)", textAlign: "center", marginTop: 16 }}>
          {tab === "login" ? <>Sem conta?&nbsp;<button onClick={() => { setTab("register"); setError(""); }} style={{ background: "none", border: "none", color: "#A855F7", cursor: "pointer", fontSize: 13, textDecoration: "underline", fontFamily: "inherit" }}>Criar conta grátis</button></> : <>Já tem conta?&nbsp;<button onClick={() => { setTab("login"); setError(""); }} style={{ background: "none", border: "none", color: "#A855F7", cursor: "pointer", fontSize: 13, textDecoration: "underline", fontFamily: "inherit" }}>Entrar</button></>}
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   MAIN
───────────────────────────────────────── */
export default function LandingNewPage() {
  const router = useRouter();
  const heroRef = useRef<HTMLElement>(null);
  const orb1Ref = useRef<HTMLDivElement>(null);
  const orb2Ref = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [modal, setModal] = useState<"login" | "register" | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Check auth
  useEffect(() => {
    fetch("/api/user/profile").then((r) => { if (r.ok) setIsLoggedIn(true); }).catch(() => {});
  }, []);

  // Scroll handler
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Parallax orbs
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const handleMove = (e: MouseEvent) => {
      const rect = hero.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      if (orb1Ref.current) orb1Ref.current.style.transform = `translate(${x * 50}px, ${y * 40}px)`;
      if (orb2Ref.current) orb2Ref.current.style.transform = `translate(${x * -35}px, ${y * -28}px)`;
    };
    hero.addEventListener("mousemove", handleMove);
    return () => hero.removeEventListener("mousemove", handleMove);
  }, []);

  // Scroll reveal
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("revealed"); obs.unobserve(e.target); } }),
      { threshold: 0.1 }
    );
    document.querySelectorAll(".reveal").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const openCta = (tab: "register" | "login") => {
    if (isLoggedIn) { router.push("/dashboard"); return; }
    setModal(tab);
  };

  // Ticker double
  const tickerDouble = [...tickerItems, ...tickerItems];

  return (
    <>
      {/* ─── NAVBAR ─── */}
      <header className={`navbar${scrolled ? " scrolled" : ""}`}>
        <div className="container">
          <div className="navbar-inner">
            <a href="#" className="navbar-logo">
              <div className="navbar-logo-mark">✦</div>
              NovaCraft AI
            </a>
            <ul className="navbar-links">
              <li><a href="#recursos">Recursos</a></li>
              <li><a href="#como-funciona">Como funciona</a></li>
              <li><a href="#precos">Preços</a></li>
              <li><a href="#faq">FAQ</a></li>
            </ul>
            <div className="navbar-cta">
              <button className="btn-nav-ghost" onClick={() => openCta("login")}>Entrar</button>
              <button className="btn-nav-primary" onClick={() => openCta("register")}>
                {isLoggedIn ? "Ir para o dashboard →" : "Criar conta grátis →"}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ─── HERO ─── */}
      <section className="hero" ref={heroRef}>
        <div className="hero-bg">
          <div className="orb orb-1" ref={orb1Ref} />
          <div className="orb orb-2" ref={orb2Ref} />
          <div className="orb orb-3" />
        </div>

        <div className="container">
          <div className="hero-content">
            <div>
              <div className="hero-badge">
                <div className="hero-badge-dot">✦</div>
                IA de última geração para criadores
              </div>

              <h1 className="display-xl hero-title">
                Conteúdo que
                <span className="line-2 iridescent">para o scroll.</span>
              </h1>

              <p className="body hero-sub">
                De zero a carrossel viral em segundos. Paletas de cores personalizadas, planejador editorial com IA, modo debate e paste&nbsp;&amp;&nbsp;transform — tudo numa plataforma que pensa como você.
              </p>

              <div className="hero-cta">
                <MagneticBtn className="btn-primary" onClick={() => openCta("register")}>
                  Criar meu conteúdo agora
                  <div className="arrow-box">
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </div>
                </MagneticBtn>
                <button className="btn-ghost" onClick={() => document.getElementById("como-funciona")?.scrollIntoView({ behavior: "smooth" })}>
                  Ver como funciona
                </button>
              </div>

              <div className="hero-trust">
                {["7 dias grátis", "Sem cartão de crédito", "Cancele quando quiser"].map((t) => (
                  <div key={t} className="hero-trust-item">{t}</div>
                ))}
              </div>
            </div>

            {/* Hero Glass Cards */}
            <div className="hero-cards">
              {heroCards.map((card, i) => (
                <div key={i} className={`glass hero-card hero-card-${i + 1}`}>
                  <div className="hero-card-label">{card.label}</div>
                  <div className="hero-card-title">{card.title}</div>
                  <div className="hero-card-body">{card.body}</div>
                  <div className="hero-card-tag">{card.tag}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── TICKER ─── */}
      <div className="ticker-section">
        <div className="ticker-track">
          {tickerDouble.map((item, i) => (
            <div key={i} className="ticker-item">
              <strong>{item.label}</strong>
              <span>{item.desc}</span>
              <span className="ticker-sep">✦</span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── VIRAL GALLERY ─── */}
      <ViralGallery accent="purple" />

      {/* ─── CREATORS TICKER ─── */}
      <CreatorsTicker accentColor="#A855F7" />

      {/* ─── CEO SECTION ─── */}
      <CeoSection theme="purple" onCta={() => openCta("register")} />

      <div className="divider" style={{ maxWidth: 1160, margin: "0 auto" }} />

      {/* ─── STATS ─── */}
      <section className="section-sm">
        <div className="container">
          <div className="stats-grid reveal">
            {[
              { n: "28k+", label: "criadores ativos", desc: "Gerando conteúdo todo dia com NovaCraft" },
              { n: "4,2M+", label: "posts gerados", desc: "Desde o lançamento da plataforma" },
              { n: "3.4×", label: "mais engajamento", desc: "Em média vs. posts criados manualmente" },
              { n: "4.9★", label: "avaliação", desc: "Média de avaliações dos usuários ativos" },
            ].map((s, i) => (
              <div key={i} className="stat-box">
                <div className="stat-num">{s.n}</div>
                <div className="label" style={{ color: "var(--gold)", marginTop: 2 }}>{s.label}</div>
                <div className="stat-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ─── EDITORIAL PROBLEM ─── */}
      <section className="section">
        <div className="container">
          <div className="editorial-grid">
            <div className="reveal">
              <div style={{ position: "relative" }}>
                <div className="big-number">2h</div>
                <div style={{ position: "absolute", bottom: 16, left: 0 }}>
                  <div className="label" style={{ color: "var(--red)", marginBottom: 8 }}>o tempo perdido por post</div>
                </div>
              </div>
            </div>

            <div className="reveal reveal-delay-2">
              <div className="editorial-tag">O PROBLEMA</div>
              <h2 className="display-lg">
                Horas de trabalho.<br />
                <span style={{ color: "var(--gold)" }}>Zero resultado.</span>
              </h2>
              <p className="body" style={{ marginTop: 20 }}>
                Criadores de conteúdo perdem em média 2 horas por post — pesquisando, escrevendo, diagramando. E ainda assim o algoritmo ignora. O problema não é esforço. É método.
              </p>
              <ul className="editorial-list">
                <li>Horas criando posts que mal chegam a 500 pessoas</li>
                <li>Identidade visual inconsistente entre carrosséis</li>
                <li>Não sabe qual hook vai segurar o leitor no slide 1</li>
                <li>Conteúdo antigo desperdiçado — nunca reaproveitado</li>
                <li>Paga R$3k+/mês em designers ou social media</li>
              </ul>
              <div style={{ marginTop: 32 }}>
                <div className="editorial-tag" style={{ background: "rgba(168,85,247,.08)", border: "1px solid rgba(168,85,247,.25)", color: "#C4B5FD" }}>A SOLUÇÃO</div>
                <p className="body" style={{ marginTop: 12 }}>
                  NovaCraft AI resolve cada um desses problemas — em menos de 60 segundos por carrossel. Com paletas, planejador editorial e modo debate.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ─── FEATURES ─── */}
      <section className="section" id="recursos">
        <div className="container">
          <div style={{ marginBottom: 56 }} className="reveal">
            <div className="sec-eyebrow">Recursos</div>
            <h2 className="heading" style={{ maxWidth: 520 }}>
              Tudo que você precisa.<br />
              <span style={{ color: "var(--gold)" }}>Nada que você não vai usar.</span>
            </h2>
          </div>

          <div className="features-grid">
            {features.map((f, i) => (
              <div key={i} className={`glass feature-card reveal reveal-delay-${(i % 3) + 1}`}>
                <span className="feature-num">{f.num}</span>
                <span className="feature-ico">{f.ico}</span>
                <div className="feature-title">{f.title}</div>
                <p className="feature-desc">{f.desc}</p>
                {f.isNew && <div className="feature-new">Novo</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ─── HOW IT WORKS ─── */}
      <section className="section" id="como-funciona">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: 64 }} className="reveal">
            <div className="sec-eyebrow">Como funciona</div>
            <h2 className="display-lg">
              De zero a viral.<br />
              <span className="iridescent">Em 3 passos.</span>
            </h2>
          </div>

          <div className="steps-grid">
            {[
              { n: "01", title: "Descreva ou cole", desc: "Digite o tema, cole um artigo, thread ou transcrição. Use hooks da biblioteca ou deixe a IA sugerir. O planejador editorial seleciona o melhor dia para publicar." },
              { n: "02", title: "A IA cria em segundos", desc: "Em menos de 60 segundos: carrossel completo com copy persuasivo, estrutura de slides, prompts de imagem e paleta de cores aplicada automaticamente." },
              { n: "03", title: "Publique e veja crescer", desc: "Edite no canvas visual, gere as imagens com IA e publique. Repita com o planejador de conteúdo — sua linha editorial nunca mais vai parar." },
            ].map((s, i) => (
              <div key={i} className={`glass step-card reveal reveal-delay-${i + 1}`} style={{ position: "relative" }}>
                <span className="step-number">{s.n}</span>
                <div className="step-title">{s.title}</div>
                <p className="step-desc">{s.desc}</p>
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: 52 }} className="reveal">
            <MagneticBtn className="btn-primary" onClick={() => openCta("register")}>
              Criar meu primeiro post agora
              <div className="arrow-box">
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </div>
            </MagneticBtn>
            <p style={{ fontSize: 12, color: "var(--dim)", marginTop: 12 }}>✓ 7 dias grátis · Sem cartão de crédito</p>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ─── TESTIMONIALS ─── */}
      <section className="section">
        <div className="container">
          <div style={{ marginBottom: 52 }} className="reveal">
            <div className="sec-eyebrow">Depoimentos</div>
            <h2 className="heading">
              O que dizem os criadores.
            </h2>
          </div>

          <div className="testimonials-masonry reveal">
            {testimonials.map((t, i) => (
              <div key={i} className="glass-sm t-card">
                <div className="t-head">
                  <div className="t-avatar">{t.emoji}</div>
                  <div>
                    <div className="t-name">{t.name}</div>
                    <div className="t-role">{t.role}{t.followers && ` · ${t.followers}`}</div>
                  </div>
                </div>
                <div className="t-stars">★★★★★</div>
                <p className="t-text" dangerouslySetInnerHTML={{ __html: `"${t.text}"` }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ─── PRICING ─── */}
      <section className="section" id="precos">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: 56 }} className="reveal">
            <div className="sec-eyebrow">Preços</div>
            <h2 className="display-lg">
              Simples e<br />
              <span style={{ color: "var(--gold)" }}>transparente.</span>
            </h2>
            <p className="body" style={{ marginTop: 14 }}>Sem surpresas na fatura. Sem limite de criatividade.</p>
          </div>

          <div className="pricing-grid">
            {/* Starter */}
            <div className="glass price-card reveal">
              <div className="price-name">Starter</div>
              <div className="price-amount">
                <span className="price-big">R$67</span>
                <span className="price-period">/mês</span>
              </div>
              <div className="price-note">Cobrado mensalmente</div>
              <div className="price-sep" />
              <ul className="price-list">
                {["<strong>30 carrosséis</strong>/mês", "Até <strong>10 slides</strong> por carrossel", "Copy + prompts de imagem", "<strong>Paletas de cores</strong> ilimitadas", "Paste & Transform", "Planejador de conteúdo"].map((f, i) => (
                  <li key={i} dangerouslySetInnerHTML={{ __html: f }} />
                ))}
              </ul>
              <div className="price-cta">
                <button className="btn-price-ghost" onClick={() => openCta("register")}>Começar grátis →</button>
              </div>
            </div>

            {/* Pro */}
            <div className="glass price-card popular reveal reveal-delay-2">
              <div className="price-badge">✦ Mais popular</div>
              <div className="price-name">Pro</div>
              <div className="price-amount">
                <span className="price-big">R$197</span>
                <span className="price-period">/mês</span>
              </div>
              <div className="price-note">Cobrado mensalmente · Cancele quando quiser</div>
              <div className="price-sep" />
              <ul className="price-list">
                {["<strong>Carrosséis ilimitados</strong>", "Até <strong>15 slides</strong> por carrossel", "Copy + prompts de imagem", "<strong>Paletas de cores</strong> ilimitadas", "Planejador + Calendário IA", "<strong>Modo Debate</strong> + Biblioteca de Hooks", "Paste & Transform", "<strong>API Key própria</strong> (cota Gemini)", "Acesso antecipado a novidades"].map((f, i) => (
                  <li key={i} dangerouslySetInnerHTML={{ __html: f }} />
                ))}
              </ul>
              <div className="price-cta">
                <button className="btn-price-primary" onClick={() => openCta("register")}>Começar agora →</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ─── FAQ ─── */}
      <section className="section" id="faq">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: 52 }} className="reveal">
            <div className="sec-eyebrow">FAQ</div>
            <h2 className="heading">Perguntas frequentes.</h2>
          </div>
          <div className="faq-list reveal">
            {faqs.map((f, i) => (
              <div key={i} className={`faq-item${openFaq === i ? " open" : ""}`} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <div className="faq-header">
                  <span className="faq-q">{f.q}</span>
                  <div className="faq-icon">+</div>
                </div>
                <div className="faq-body">
                  <div className="faq-body-inner">
                    <p className="faq-a">{f.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA BAND ─── */}
      <section className="section">
        <div className="container">
          <div className="cta-band reveal">
            <div className="cta-band-border" />
            <div className="cta-inner">
              <div>
                <p className="cta-title-big">
                  Comece a criar conteúdo<br />
                  <span className="iridescent">viral hoje mesmo.</span>
                </p>
                <p className="cta-sub">
                  Mais de 28.000 criadores já estão gerando posts que param o scroll. Com paletas de cores, modo debate e planejador editorial. A sua vez chegou.
                </p>
              </div>
              <div className="cta-cta-area">
                <MagneticBtn className="btn-primary" onClick={() => openCta("register")}>
                  Criar conta grátis
                  <div className="arrow-box">
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </div>
                </MagneticBtn>
                <p className="cta-note">✓ 7 dias grátis · Sem cartão</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <div className="footer-logo">
                <div className="footer-logo-mark">✦</div>
                <span className="footer-logo-name">NovaCraft AI</span>
              </div>
              <p className="footer-desc">A plataforma que transforma qualquer criador em uma máquina de conteúdo viral para Instagram — com IA generativa, paletas de cores e planejador editorial.</p>
            </div>
            {[
              { title: "Produto", links: ["Recursos", "Planejador", "Preços", "Criar conta"] },
              { title: "Empresa", links: ["Sobre nós", "Blog", "Afiliados", "Contato"] },
              { title: "Suporte", links: ["FAQ", "Central de ajuda", "Status", "Comunidade"] },
            ].map((col) => (
              <div key={col.title}>
                <div className="footer-col-title">{col.title}</div>
                <ul className="footer-links">
                  {col.links.map((l) => <li key={l}><a href="#">{l}</a></li>)}
                </ul>
              </div>
            ))}
          </div>
          <div className="divider" />
          <div className="footer-bottom" style={{ marginTop: 28 }}>
            <span className="footer-copy">© 2026 NovaCraft AI. Todos os direitos reservados.</span>
            <div className="footer-legal">
              {["Privacidade", "Termos de uso", "Cookies"].map((l) => <a key={l} href="#">{l}</a>)}
            </div>
          </div>
        </div>
      </footer>

      {/* ─── AUTH MODAL ─── */}
      {modal && <AuthModal tab={modal} onClose={() => setModal(null)} />}
    </>
  );
}
