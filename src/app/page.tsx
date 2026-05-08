"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import "./landing.css";
import ViralGallery from "@/components/ViralGallery";
import CreatorsTicker from "@/components/CreatorsTicker";
import CeoSection from "@/components/CeoSection";


/* ─────────────────────────────────────────
   Auth Modal
───────────────────────────────────────── */
interface AuthModalProps {
  initialTab?: "login" | "register";
  onClose: () => void;
}

function AuthModal({ initialTab = "login", onClose }: AuthModalProps) {
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "register">(initialTab);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  function set(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })); setError(""); }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    const endpoint = tab === "login" ? "/api/auth/login" : "/api/auth/register";
    const body = tab === "login" ? { email: form.email, password: form.password } : form;

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) { setError(data.error ?? "Erro. Tente novamente."); return; }
    router.push("/dashboard");
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <button className="modal-close" onClick={onClose}>✕</button>

        <div className="modal-logo">
          <div className="modal-logo-icon">✦</div>
          <span className="modal-logo-name">NovaCraft AI</span>
        </div>

        <div className="modal-tabs">
          <button className={`modal-tab${tab === "login" ? " active" : ""}`} onClick={() => { setTab("login"); setError(""); }}>
            Entrar
          </button>
          <button className={`modal-tab${tab === "register" ? " active" : ""}`} onClick={() => { setTab("register"); setError(""); }}>
            Criar conta
          </button>
        </div>

        <p className="modal-title">{tab === "login" ? "Bem-vindo de volta" : "Comece agora"}</p>
        <p className="modal-sub">{tab === "login" ? "Acesse sua conta NovaCraft" : "Crie sua conta — grátis por 7 dias"}</p>

        <form onSubmit={handleSubmit}>
          {tab === "register" && (
            <div className="modal-field">
              <label className="modal-label">Nome</label>
              <input className="modal-input" type="text" placeholder="Seu nome" value={form.name} onChange={(e) => set("name", e.target.value)} required />
            </div>
          )}
          <div className="modal-field">
            <label className="modal-label">Email</label>
            <input className="modal-input" type="email" placeholder="seu@email.com" value={form.email} onChange={(e) => set("email", e.target.value)} required />
          </div>
          <div className="modal-field">
            <label className="modal-label">Senha</label>
            <input className="modal-input" type="password" placeholder={tab === "register" ? "Mínimo 8 caracteres" : "Sua senha"} value={form.password} onChange={(e) => set("password", e.target.value)} required minLength={tab === "register" ? 8 : 1} />
          </div>

          {error && <div className="modal-error">{error}</div>}

          <button type="submit" className="modal-submit" disabled={loading}>
            {loading ? (tab === "login" ? "Entrando..." : "Criando conta...") : (tab === "login" ? "Entrar na plataforma" : "Criar conta grátis")}
          </button>
        </form>

        <p className="modal-switch">
          {tab === "login" ? (
            <>Não tem conta? <button onClick={() => { setTab("register"); setError(""); }}>Criar conta grátis</button></>
          ) : (
            <>Já tem conta? <button onClick={() => { setTab("login"); setError(""); }}>Entrar</button></>
          )}
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Data
───────────────────────────────────────── */
const creators = [
  { emoji: "🎯", name: "@mkt_paula" }, { emoji: "💪", name: "@fit_marcos" },
  { emoji: "📸", name: "@foto_leo" },  { emoji: "🍎", name: "@nutri_ana" },
  { emoji: "💡", name: "@coach_rafa" },{ emoji: "🌍", name: "@travel_ju" },
  { emoji: "👗", name: "@moda_cris" }, { emoji: "📊", name: "@invest_pe" },
  { emoji: "🎵", name: "@music_gab" }, { emoji: "🍕", name: "@chef_tal" },
];

const slides1 = [
  { icon: "📱", label: "Carrossel", title: "5 Erros Fatais no Instagram", body: "Saiba o que trava seu crescimento" },
  { icon: "💰", label: "Vendas", title: "Como Fechar 10x Mais", body: "Estratégia comprovada de conversão" },
  { icon: "🧠", label: "Mindset", title: "Rotina dos 1%", body: "O que separa mediocres de milionários" },
  { icon: "🚀", label: "Growth", title: "0 a 10k em 30 Dias", body: "Framework completo de crescimento" },
];

const slides2 = [
  { icon: "✨", label: "Branding", title: "Identidade Visual que Vende", body: "Psicologia das cores aplicada" },
  { icon: "📈", label: "Analytics", title: "Leia seus Dados como Pro", body: "Métricas que realmente importam" },
  { icon: "🎯", label: "Nicho", title: "Encontre seu Público Ideal", body: "Posicionamento estratégico preciso" },
  { icon: "💬", label: "Copy", title: "Copy que Converte", body: "Templates prontos para usar hoje" },
];

const testimonials = [
  { emoji: "😊", name: "Lucas Ferreira", role: "Coach de Produtividade · 34k seg.", text: "Em 2 meses meu perfil saiu de 8k para <b>34 mil seguidores</b>. O conteúdo é absurdamente bom." },
  { emoji: "💁", name: "Mariana Costa", role: "Nutricionista · 19k seg.", text: "Gero <b>5 posts por semana</b> sem estresse. Meu consultório lotou em 45 dias." },
  { emoji: "🧑‍💼", name: "Rafael Mendes", role: "Especialista em Vendas · 52k seg.", text: "Antes terceirizava design por R$3k/mês. Agora pago R$67 e tenho <b>resultado muito melhor</b>." },
  { emoji: "👩‍🎨", name: "Julia Santos", role: "Social Media Freelancer", text: "Gerencio 8 clientes sozinha. NovaCraft <b>triplicou minha produtividade</b>." },
  { emoji: "🏋️", name: "Bruno Lima", role: "Personal Trainer · 28k seg.", text: "Meus posts viralizaram 3 vezes esse mês. <b>Nunca tive resultados assim</b> antes." },
  { emoji: "👩‍💻", name: "Amanda Rocha", role: "Dev & Criadora · 15k seg.", text: "Finalmente consigo manter consistência no perfil com <b>zero esforço extra</b>." },
];

const faqs = [
  { q: "Preciso saber design ou edição para usar a NovaCraft?", a: "Não. A plataforma foi criada para quem não tem nenhuma experiência em design. Você apenas descreve o tema e a IA cria tudo — copy, estrutura de slides e prompts de imagem." },
  { q: "Minha Gemini API Key fica segura?", a: "Sim. Sua chave é criptografada com AES-256-GCM antes de ser salva no banco de dados. Nem nossa equipe tem acesso à sua chave em texto puro." },
  { q: "Quantos carrosséis posso gerar?", a: "No plano Pro você gera carrosséis ilimitados. Os limites dependem apenas da cota da sua API Key do Google Gemini, que no plano gratuito deles é generosa para uso pessoal." },
  { q: "Funciona para qualquer nicho?", a: "Sim. Marketing, saúde, finanças, culinária, moda, desenvolvimento pessoal, tecnologia — a IA se adapta ao contexto que você fornecer." },
  { q: "O que é o Modo Debate / Contraintuitivo?", a: "É um modo especial que cria carrosséis com estrutura provocativa — desafia crenças comuns com argumentos sólidos. Altíssimo potencial viral por contrariedade controlada. Ativa ao criar um carrossel." },
  { q: "O que são Paletas de Cores?", a: "Você cria grupos de cores que representam sua identidade visual. Na hora de gerar um carrossel, basta escolher a paleta e a IA aplicará as cores automaticamente nos destaques de texto e nas imagens." },
  { q: "Posso colar um texto longo e transformar em carrossel?", a: "Sim! Com o recurso 'Colar Qualquer Coisa', você cola qualquer conteúdo — artigo, thread, transcrição, e-mail — e a IA extrai os pontos principais e transforma em slides. Perfeito para reaproveitar conteúdo existente." },
  { q: "Posso cancelar a qualquer momento?", a: "Sim, sem multas ou períodos mínimos. Cancele quando quiser pelo painel de configurações." },
];

const newFeatures = [
  {
    icon: "🎨",
    title: "Paletas de Cores",
    desc: "Crie grupos de paletas com múltiplas cores. Selecione sua paleta na hora de gerar e a IA aplica automaticamente em textos e imagens.",
    badge: "Novo",
  },
  {
    icon: "📋",
    title: "Colar Qualquer Coisa",
    desc: "Cole um artigo, thread, transcrição de vídeo ou e-mail. A IA detecta o formato, extrai os pontos e transforma em slides prontos.",
    badge: "Novo",
  },
  {
    icon: "🔥",
    title: "Modo Debate",
    desc: "Estrutura provocativa que desafia crenças comuns. Alto potencial viral por contrariedade controlada com argumentos sólidos.",
    badge: "Novo",
  },
  {
    icon: "📚",
    title: "Biblioteca de Hooks",
    desc: "Hooks com comprovado potencial viral organizados por objetivo. Selecione um com 1 clique e a IA constrói o carrossel a partir dele.",
    badge: "Novo",
  },
  {
    icon: "⚡",
    title: "Geração Ultra-Rápida",
    desc: "De zero a carrossel completo com copy, estrutura e prompts de imagem em menos de 60 segundos. Geração paralela de slides.",
    badge: "Core",
  },
  {
    icon: "🖼️",
    title: "Templates Dinâmicos",
    desc: "9+ templates de slide com layouts únicos — capas cinematográficas, layouts duplos, split vertical, quote style e mais.",
    badge: "Core",
  },
];

/* ─────────────────────────────────────────
   Landing Page
───────────────────────────────────────── */
export default function LandingPage() {
  const router = useRouter();
  const [modal, setModal] = useState<"login" | "register" | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [featTab, setFeatTab] = useState(0);
  const [isAnual, setIsAnual] = useState(false);
  const [price1, setPrice1] = useState("R$67");
  const [price2, setPrice2] = useState("R$197");
  const [note1, setNote1] = useState("Cobrado mensalmente");
  const [note2, setNote2] = useState("Cobrado mensalmente · Cancele quando quiser");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    fetch("/api/user/profile").then((r) => {
      if (r.ok) setIsLoggedIn(true);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); obs.unobserve(e.target); } }),
      { threshold: 0.12 }
    );
    document.querySelectorAll(".aos").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  function togglePlano() {
    const next = !isAnual;
    setIsAnual(next);
    setPrice1(next ? "R$40" : "R$67");
    setPrice2(next ? "R$118" : "R$197");
    setNote1(next ? "Cobrado anualmente (R$480/ano)" : "Cobrado mensalmente");
    setNote2(next ? "Cobrado anualmente (R$1.416/ano) · Cancele quando quiser" : "Cobrado mensalmente · Cancele quando quiser");
  }

  const allCreators = [...creators, ...creators];

  return (
    <>
      {/* ── TOPBAR ── */}
      <div className="lp-topbar">
        <span className="tp-pill">Novo</span>
        <span><b>Oferta de lançamento:</b> 50% OFF nos primeiros 3 meses — acaba em 48h</span>
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </div>

      {/* ── NAVBAR ── */}
      <header className={`lp-nav${scrolled ? " scrolled" : ""}`}>
        <nav className="nav-inner">
          <a href="#" className="nav-logo">
            <div className="nav-logo-icon">✦</div>
            NovaCraft AI
          </a>
          <ul className="nav-links">
            <li><a href="#recursos">Recursos</a></li>
            <li><a href="#novidades">Novidades</a></li>
            <li><a href="#como-funciona">Como funciona</a></li>
            <li><a href="#precos">Preços</a></li>
            <li><a href="#faq">FAQ</a></li>
          </ul>
          <div className="nav-cta">
            <button className="nav-btn-ghost" onClick={() => isLoggedIn ? router.push("/dashboard") : setModal("login")}>Entrar</button>
            <button className="nav-btn" onClick={() => isLoggedIn ? router.push("/dashboard") : setModal("register")}>Criar conta grátis →</button>
          </div>
        </nav>
      </header>

      {/* ── HERO ── */}
      <section className="lp-hero">
        <div className="orb" style={{ width: 700, height: 700, top: -250, left: -250, background: "rgba(108,39,190,.16)" }} />
        <div className="orb" style={{ width: 550, height: 550, top: 0, right: -200, background: "rgba(249,115,22,.1)" }} />
        <div className="orb" style={{ width: 400, height: 400, bottom: -100, left: "40%", background: "rgba(168,85,247,.08)" }} />
        <div className="lp-container" style={{ position: "relative", zIndex: 1 }}>
          <div className="hero-badge">
            <div className="hero-badge-dot">✦</div>
            IA de última geração · Paletas · Modo Debate · Paste &amp; Transform
          </div>
          <h1>
            Gere conteúdo viral<br />
            para o Instagram<br />
            <span className="gt">em segundos.</span>
          </h1>
          <p className="hero-sub">
            Chega de horas perdidas criando posts. A NovaCraft AI gera carrosséis completos com paletas de cores personalizadas, hooks de alta performance e imagens impactantes — tudo pronto para publicar.
          </p>
          <div className="hero-cta">
            <button className="lp-btn-primary pg" onClick={() => isLoggedIn ? router.push("/dashboard") : setModal("register")}>
              Criar meu conteúdo agora
              <div className="arr"><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg></div>
            </button>
            <a href="#como-funciona" className="lp-btn-outline">
              Ver como funciona
              <div className="arr"><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg></div>
            </a>
          </div>
          <p className="hero-fine">
            <span>✓ Sem cartão de crédito</span> &nbsp;·&nbsp;
            <span>✓ 7 dias grátis</span> &nbsp;·&nbsp;
            <span>✓ Cancele quando quiser</span>
          </p>
          <div className="hero-stats">
            <div><div className="hero-stat-num gt">+28.000</div><div className="hero-stat-lbl">criadores ativos</div></div>
            <div className="hero-divider" />
            <div><div className="hero-stat-num gt">+4,2M</div><div className="hero-stat-lbl">posts gerados</div></div>
            <div className="hero-divider" />
            <div><div className="hero-stat-num gt">3.4×</div><div className="hero-stat-lbl">mais engajamento médio</div></div>
            <div className="hero-divider" />
            <div><div className="hero-stat-num gt">4.9★</div><div className="hero-stat-lbl">avaliação dos usuários</div></div>
          </div>
        </div>

        {/* Creator carousel */}
        <div className="creator-outer">
        </div>
      </section>

      <div className="lp-div" style={{ maxWidth: 1120, margin: "0 auto" }} />

      {/* ── GALLERY ── */}
      <section style={{ padding: "80px 0", overflow: "hidden" }}>
        <div className="lp-container" style={{ marginBottom: 40 }}>
          <p className="sec-lbl" style={{ marginBottom: 14 }}>Exemplos gerados</p>
          <h2 className="sec-title">Conteúdo que <span className="gt">para o scroll</span></h2>
          <p className="sec-sub" style={{ maxWidth: 520 }}>Cada post gerado pela NovaCraft é otimizado para máximo alcance e engajamento.</p>
        </div>
        <div className="mq-outer">
          <div className="mq-track">
            {[...slides1, ...slides1].map((s, i) => (
              <div key={i} className="mq-slide">
                <div className="slide-inner">
                  <div className="slide-visual">{s.icon}</div>
                  <span className="slide-label">{s.label}</span>
                  <div className="slide-title">{s.title}</div>
                  <div className="slide-body">{s.body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ marginTop: 20 }}>
          <div className="mq-outer">
            <div className="mq-track mq-track--rev">
              {[...slides2, ...slides2].map((s, i) => (
                <div key={i} className="mq-slide">
                  <div className="slide-inner">
                    <div className="slide-visual">{s.icon}</div>
                    <span className="slide-label">{s.label}</span>
                    <div className="slide-title">{s.title}</div>
                    <div className="slide-body">{s.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── VIRAL IMAGE GALLERY ── */}
      <ViralGallery accent="purple" />

      <div className="lp-div" style={{ maxWidth: 1120, margin: "80px auto 0" }} />

      {/* ── STATS ── */}
      <section className="sec-pad">
        <div className="lp-container">
          <div style={{ textAlign: "center", marginBottom: 56 }} className="aos">
            <span className="sec-lbl" style={{ marginBottom: 14 }}>Resultados reais</span>
            <h2 className="sec-title">Números que <span className="gt">falam por si</span></h2>
          </div>
          <div className="stats-grid aos">
            <div className="stat-box">
              <div className="stat-num gt">+28.000</div>
              <div className="stat-desc">Criadores ativos gerando conteúdo todo dia com NovaCraft</div>
            </div>
            <div className="stat-box">
              <div className="stat-num gt">+4,2M</div>
              <div className="stat-desc">Posts e carrosséis gerados desde o lançamento</div>
            </div>
            <div className="stat-box">
              <div className="stat-num gt">3.4×</div>
              <div className="stat-desc">Mais engajamento em média comparado a posts manuais</div>
            </div>
          </div>
        </div>
      </section>

      <div className="lp-div" style={{ maxWidth: 1120, margin: "0 auto" }} />

      {/* ── FEATURES ── */}
      <section className="sec-pad" id="recursos">
        <div className="lp-container">
          <div className="aos" style={{ marginBottom: 40 }}>
            <span className="sec-lbl" style={{ marginBottom: 14 }}>Recursos</span>
            <h2 className="sec-title">Tudo que você precisa<br /><span className="gt">em um só lugar</span></h2>
            <p className="sec-sub" style={{ maxWidth: 500 }}>Cada funcionalidade foi pensada para maximizar seu alcance e minimizar seu esforço.</p>
          </div>
          <div className="feat-tabs">
            {["Carrossel Viral", "Copy Estratégica", "Prompts de Imagem"].map((t, i) => (
              <button key={i} className={`feat-tab${featTab === i ? " active" : ""}`} onClick={() => setFeatTab(i)}>{t}</button>
            ))}
          </div>
          {featTab === 0 && (
            <div className="feat-stage active">
              <div className="feat-stage-left">
                <span className="feat-chip">Carrossel</span>
                <div className="feat-title">Estrutura de carrossel que retém até o último slide</div>
                <div className="feat-desc">A IA analisa os padrões de conteúdo viral do seu nicho e cria uma sequência de slides com gancho, desenvolvimento e CTA irresistível. Suporte a Modo Debate para conteúdo provocativo de alto engajamento.</div>
                <ul className="feat-bullets">
                  <li><div className="feat-ck">✓</div>Título de abertura com gatilho de curiosidade</li>
                  <li><div className="feat-ck">✓</div>Slides de conteúdo com copy persuasivo e rico</li>
                  <li><div className="feat-ck">✓</div>Modo Debate: estrutura contraintuitiva viral</li>
                  <li><div className="feat-ck">✓</div>CTA final que converte seguidores em clientes</li>
                </ul>
              </div>
              <div className="feat-stage-right feat-stage-carousel">
                <div className="feat-slide-mock">
                  <div className="feat-slide-badge">CARROSSEL VIRAL</div>
                  <div className="feat-slide-title">Todo mundo diz <span style={{ color: "#A855F7" }}>POSTAR TODO DIA.</span><br/>Mas o algoritmo quer outra coisa.</div>
                  <div className="feat-slide-body">Dados de 500+ perfis analisados mostram o padrão real por trás do alcance orgânico.</div>
                  <div className="feat-slide-swipe">deslize →</div>
                </div>
              </div>
            </div>
          )}
          {featTab === 1 && (
            <div className="feat-stage active">
              <div className="feat-stage-left">
                <span className="feat-chip">Copy</span>
                <div className="feat-title">Textos que vendem enquanto você dorme</div>
                <div className="feat-desc">Cada palavra é escolhida com base em princípios de copywriting testados. Gatilhos mentais, urgência e benefícios claros em todo conteúdo. Cole qualquer texto existente e transforme em carrossel viral.</div>
                <ul className="feat-bullets">
                  <li><div className="feat-ck">✓</div>Legendas otimizadas para algoritmo e conversão</li>
                  <li><div className="feat-ck">✓</div>Biblioteca de hooks com alto potencial viral</li>
                  <li><div className="feat-ck">✓</div>Paste &amp; Transform: cole qualquer conteúdo</li>
                  <li><div className="feat-ck">✓</div>Tom de voz consistente com sua marca</li>
                </ul>
              </div>
              <div className="feat-stage-right feat-stage-copy">
                <div className="feat-copy-mock">
                  <div className="feat-copy-line" style={{ color: "#F97316" }}>📋 Paste &amp; Transform</div>
                  <div className="feat-copy-input">Cole seu artigo, thread, transcrição...</div>
                  <div className="feat-copy-arrow">↓ IA extrai e organiza</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {["Slide 1", "Slide 2", "Slide 3", "CTA"].map((s) => (
                      <div key={s} className="feat-copy-tag">{s}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          {featTab === 2 && (
            <div className="feat-stage active">
              <div className="feat-stage-left">
                <span className="feat-chip">Imagens</span>
                <div className="feat-title">Paletas de cores + prompts cinematográficos</div>
                <div className="feat-desc">Crie paletas de cores personalizadas e aplique em todos os seus carrosséis com um clique. Cada slide recebe um prompt em inglês otimizado para geração de imagens com sua paleta.</div>
                <ul className="feat-bullets">
                  <li><div className="feat-ck">✓</div>Paletas personalizadas com múltiplas cores</li>
                  <li><div className="feat-ck">✓</div>Prompts testados em múltiplas ferramentas de IA</li>
                  <li><div className="feat-ck">✓</div>Cores aplicadas automaticamente em textos e imagens</li>
                  <li><div className="feat-ck">✓</div>Dimensões e proporções corretas para Instagram</li>
                </ul>
              </div>
              <div className="feat-stage-right feat-stage-palette">
                <div className="feat-palette-mock">
                  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(255,255,255,.4)", marginBottom: 10 }}>Minha Paleta</div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                    {["#A855F7", "#F97316", "#22D3EE", "#4ADE80"].map((hex) => (
                      <div key={hex} style={{ width: 36, height: 36, borderRadius: 10, background: hex, border: "2px solid rgba(255,255,255,.2)" }} />
                    ))}
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,.5)", marginBottom: 8 }}>Aplicar em carrossel:</div>
                  <div style={{ display: "flex", gap: 4 }}>
                    {["Slide 1", "Slide 2", "Slide 3"].map((s, i) => (
                      <div key={s} style={{ flex: 1, height: 48, borderRadius: 8, background: ["#A855F7", "#F97316", "#22D3EE"][i], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff", fontWeight: 600 }}>{s}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="lp-div" style={{ maxWidth: 1120, margin: "0 auto" }} />

      {/* ── NEW FEATURES ── */}
      <section className="sec-pad" id="novidades">
        <div className="lp-container">
          <div style={{ textAlign: "center", marginBottom: 56 }} className="aos">
            <span className="sec-lbl" style={{ marginBottom: 14 }}>Novidades</span>
            <h2 className="sec-title">Funcionalidades que <span className="gt">mudam o jogo</span></h2>
            <p className="sec-sub" style={{ maxWidth: 540, margin: "14px auto 0" }}>Recursos exclusivos que nenhuma outra ferramenta de carrossel oferece hoje.</p>
          </div>
          <div className="new-feat-grid aos">
            {newFeatures.map((f, i) => (
              <div key={i} className="new-feat-card">
                <div className="new-feat-header">
                  <div className="new-feat-ico">{f.icon}</div>
                  <span className={`new-feat-badge ${f.badge === "Novo" ? "new" : "core"}`}>{f.badge}</span>
                </div>
                <div className="new-feat-title">{f.title}</div>
                <div className="new-feat-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="lp-div" style={{ maxWidth: 1120, margin: "0 auto" }} />

      {/* ── HOW IT WORKS ── */}
      <section className="sec-pad" id="como-funciona">
        <div className="lp-container">
          <div style={{ textAlign: "center", marginBottom: 56 }} className="aos">
            <span className="sec-lbl" style={{ marginBottom: 14 }}>Como funciona</span>
            <h2 className="sec-title">De zero a carrossel viral<br /><span className="gt">em 3 passos</span></h2>
          </div>
          <div className="steps-grid">
            {[
              { ico: "🎯", num: "Passo 01", title: "Descreva ou cole seu conteúdo", desc: "Digite o tema, cole um artigo, thread ou transcrição. Nossa IA entende o contexto, extrai os pontos principais e já sabe qual tipo de conteúdo terá mais impacto." },
              { ico: "⚡", num: "Passo 02", title: "A IA cria tudo em segundos", desc: "Em menos de 60 segundos você tem um carrossel completo com slides, prompts de imagem e copy estratégico — aplicando sua paleta de cores automaticamente." },
              { ico: "📱", num: "Passo 03", title: "Publique e veja crescer", desc: "Edite no canvas visual, gere as imagens e publique. Acompanhe o crescimento e repita a fórmula com novas paletas e modos de conteúdo." },
            ].map((s, i) => (
              <div key={i} className="step-card aos" data-num={`0${i + 1}`}>
                <div className="step-ico">{s.ico}</div>
                <div className="step-num">{s.num}</div>
                <div className="step-title">{s.title}</div>
                <div className="step-desc">{s.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 48 }}>
            <button className="lp-btn-primary pg" onClick={() => isLoggedIn ? router.push("/dashboard") : setModal("register")}>
              Criar meu primeiro post agora
              <div className="arr"><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg></div>
            </button>
            <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 14 }}>✓ Grátis por 7 dias · Sem cartão de crédito</p>
          </div>
        </div>
      </section>

      <div className="lp-div" style={{ maxWidth: 1120, margin: "0 auto" }} />

      {/* ── PROBLEM / SOLUTION ── */}
      <section className="sec-pad">
        <div className="lp-container">
          <div className="prob-sol-grid aos">
            <div className="prob-col">
              <div className="prob-header">
                <span className="prob-badge bad">❌ Sem NovaCraft</span>
              </div>
              <ul className="prob-list bad">
                <li>Horas criando posts manualmente</li>
                <li>Design inconsistente entre carrosséis</li>
                <li>Cores e identidade visual dispersas</li>
                <li>Não sabe quais hooks performam melhor</li>
                <li>Conteúdo antigo desperdiçado</li>
                <li>Paga R$3.000+/mês em designers</li>
              </ul>
            </div>
            <div className="prob-vs">vs</div>
            <div className="prob-col">
              <div className="prob-header">
                <span className="prob-badge good">✦ Com NovaCraft</span>
              </div>
              <ul className="prob-list good">
                <li>Carrossel completo em menos de 60 segundos</li>
                <li>Design profissional em 9+ templates únicos</li>
                <li>Paletas de cores salvas e aplicadas com 1 clique</li>
                <li>Biblioteca de hooks com alto potencial viral</li>
                <li>Paste &amp; Transform converte qualquer conteúdo</li>
                <li>A partir de R$67/mês com resultado superior</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── CREATORS TICKER ── */}
      <CreatorsTicker accentColor="#A855F7" />

      {/* ── CEO SECTION ── */}
      <CeoSection theme="purple" onCta={() => setModal("register")} />

      <div className="lp-div" style={{ maxWidth: 1120, margin: "0 auto" }} />

      {/* ── PRICING ── */}
      <section className="sec-pad" id="precos">
        <div className="lp-container">
          <div style={{ textAlign: "center", marginBottom: 48 }} className="aos">
            <span className="sec-lbl" style={{ marginBottom: 14 }}>Preços</span>
            <h2 className="sec-title">Simples e <span className="gt">transparente</span></h2>
            <p className="sec-sub">Sem surpresas na fatura. Escolha o plano ideal para o seu momento.</p>
          </div>
          <div className="tog-wrap">
            <span className={`tog-lbl${!isAnual ? " on" : ""}`} onClick={togglePlano}>Mensal</span>
            <div className={`tog${isAnual ? " on" : ""}`} onClick={togglePlano}><div className="tog-k" /></div>
            <span className={`tog-lbl${isAnual ? " on" : ""}`} onClick={togglePlano}>
              Anual <span className="tog-save">−40%</span>
            </span>
          </div>
          <div className="plans-grid">
            {/* Plano Starter */}
            <div className="plan-card">
              <div className="plan-name">Starter</div>
              <div className="plan-price">
                <span className="plan-price-big">{price1}</span>
                <span className="plan-price-sm">/mês</span>
              </div>
              <div className="plan-price-note">{note1}</div>
              <div className="plan-sep" />
              <ul className="plan-feat-list">
                {[
                  "<b>30 carrosséis</b>/mês",
                  "Até <b>10 slides</b> por carrossel",
                  "Copy + prompts de imagem",
                  "<b>Paletas de cores</b> ilimitadas",
                  "Paste &amp; Transform",
                  "Suporte por email",
                ].map((f, i) => (
                  <li key={i}><div className="pck">✓</div><span dangerouslySetInnerHTML={{ __html: f }} /></li>
                ))}
              </ul>
              <div className="plan-cta">
                <button className="plan-outline-btn" onClick={() => isLoggedIn ? router.push("/dashboard") : setModal("register")}>Começar grátis →</button>
              </div>
            </div>
            {/* Plano Pro */}
            <div className="plan-card pop">
              <div className="plan-pop-inner">
                <div className="plan-badge">✦ Mais popular</div>
                <div className="plan-name">Pro</div>
                <div className="plan-price">
                  <span className="plan-price-big">{price2}</span>
                  <span className="plan-price-sm">/mês</span>
                </div>
                <div className="plan-price-note">{note2}</div>
                <div className="plan-sep" />
                <ul className="plan-feat-list">
                  {[
                    "<b>Carrosséis ilimitados</b>",
                    "Até <b>15 slides</b> por carrossel",
                    "Copy + prompts de imagem",
                    "Prioridade no suporte",
                    "<b>API Key própria</b> (use sua cota Gemini)",
                    "<b>Paletas de cores</b> ilimitadas",
                    "<b>Modo Debate</b> + Biblioteca de Hooks",
                    "<b>Paste &amp; Transform</b> de qualquer conteúdo",
                    "Acesso antecipado a novidades",
                  ].map((f, i) => (
                    <li key={i}><div className="pck">✓</div><span dangerouslySetInnerHTML={{ __html: f }} /></li>
                  ))}
                </ul>
                <div className="plan-cta">
                  <button className="plan-full-btn" onClick={() => isLoggedIn ? router.push("/dashboard") : setModal("register")}>Começar agora →</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="lp-div" style={{ maxWidth: 1120, margin: "0 auto" }} />

      {/* ── FAQ ── */}
      <section className="sec-pad" id="faq">
        <div className="lp-container" style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }} className="aos">
            <span className="sec-lbl" style={{ marginBottom: 14 }}>FAQ</span>
            <h2 className="sec-title">Perguntas <span className="gt">frequentes</span></h2>
          </div>
          <div className="faq-list">
            {faqs.map((f, i) => (
              <div key={i} className={`faq-item${openFaq === i ? " open" : ""}`} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <div className="faq-header">
                  <span className="faq-q">{f.q}</span>
                  <div className="faq-icon">+</div>
                </div>
                <div className="faq-ans-wrap">
                  <div className="faq-ans-inner">
                    <div className="faq-ans">{f.a}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BAND ── */}
      <section className="sec-pad">
        <div className="lp-container">
          <div className="activation aos">
            <div className="activation-inner">
              <div>
                <div className="act-title">Comece a criar conteúdo<br />viral <span className="gt">hoje mesmo</span></div>
                <p className="act-sub">Mais de 28.000 criadores já estão gerando posts que viralizam. Com paletas de cores, modo debate e paste &amp; transform. Sua vez chegou.</p>
              </div>
              <div className="act-cta">
                <button className="lp-btn-primary pg" onClick={() => isLoggedIn ? router.push("/dashboard") : setModal("register")}>
                  Criar conta grátis
                  <div className="arr"><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg></div>
                </button>
                <p className="act-note">✓ 7 dias grátis · Sem cartão de crédito</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer>
        <div className="lp-container">
          <div className="ft-grid">
            <div>
              <div className="ft-logo">
                <div className="ft-logo-icon">✦</div>
                <span className="ft-logo-name">NovaCraft AI</span>
              </div>
              <p className="ft-desc">A plataforma que transforma qualquer criador em uma máquina de conteúdo viral para Instagram — com paletas de cores, IA generativa e ferramentas exclusivas.</p>
            </div>
            <div>
              <div className="ft-col-title">Produto</div>
              <ul className="ft-links">
                <li><a href="#recursos">Recursos</a></li>
                <li><a href="#novidades">Novidades</a></li>
                <li><a href="#precos">Preços</a></li>
                <li><button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontFamily: "inherit", fontSize: 13, fontWeight: 300, padding: 0, textAlign: "left" }} onClick={() => isLoggedIn ? router.push("/dashboard") : setModal("register")}>Criar conta</button></li>
                <li><button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontFamily: "inherit", fontSize: 13, fontWeight: 300, padding: 0, textAlign: "left" }} onClick={() => isLoggedIn ? router.push("/dashboard") : setModal("login")}>Entrar</button></li>
              </ul>
            </div>
            <div>
              <div className="ft-col-title">Empresa</div>
              <ul className="ft-links">
                <li><a href="#">Sobre nós</a></li>
                <li><a href="#">Blog</a></li>
                <li><a href="#">Afiliados</a></li>
                <li><a href="#">Contato</a></li>
              </ul>
            </div>
            <div>
              <div className="ft-col-title">Suporte</div>
              <ul className="ft-links">
                <li><a href="#faq">FAQ</a></li>
                <li><a href="#">Central de ajuda</a></li>
                <li><a href="#">Status</a></li>
                <li><a href="#">Comunidade</a></li>
              </ul>
            </div>
          </div>
          <div className="lp-div" />
          <div className="ft-bottom" style={{ marginTop: 28 }}>
            <div className="ft-copy">© 2026 NovaCraft AI. Todos os direitos reservados.</div>
            <div className="ft-legal">
              <a href="#">Privacidade</a>
              <a href="#">Termos de uso</a>
              <a href="#">Cookies</a>
            </div>
          </div>
        </div>
      </footer>

      {/* ── AUTH MODAL ── */}
      {modal && <AuthModal initialTab={modal} onClose={() => setModal(null)} />}
    </>
  );
}
