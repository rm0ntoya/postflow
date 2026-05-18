import { IElement } from "@/models/Carousel";

export const CANVAS_W = 1080;
export const CANVAS_H = 1350;

const TBF = "TheBoldFont";
const SG  = "Space Grotesk";
const W = CANVAS_W;
const H = CANVAS_H;

export interface TemplateParams {
  cid: string;
  i: number;
  title: string;
  body: string;
  accentColor: string;
  handle: string;
  imagePrompt?: string;
}

export type TemplateCategory = "texto" | "imagem" | "cta";

export interface SlideTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  bestFor: ("cover" | "middle" | "cta" | "any")[];
  build: (p: TemplateParams) => IElement[];
}

function pfx(p: TemplateParams, suffix: string) {
  return `${p.cid}-s${p.i}-${suffix}`;
}

function profileEl(p: TemplateParams, y: number, x = 60, w = 500): IElement {
  return { id: pfx(p, "profile"), type: "profile", text: p.handle, photoUrl: "",
    x, y, w, h: 56, fontSize: 28, weight: 700, color: "#FFFFFF", font: SG } as IElement;
}

// ─── TEXT-ONLY TEMPLATES ───────────────────────────────────────────────────

export const tpl_centeredPower: SlideTemplate = {
  id: "centered-power", name: "Centrado Impacto", description: "Título enorme centrado, corpo abaixo, dot accent no topo",
  category: "texto", bestFor: ["middle", "any"],
  build(p) {
    const els: IElement[] = [];
    els.push({ id: pfx(p,"c1"), type:"shape", shape:"circle", x:-300, y:-300, w:900, h:900, color:p.accentColor, opacity:0.06 } as IElement);
    els.push({ id: pfx(p,"c2"), type:"shape", shape:"circle", x:W-200, y:H-400, w:700, h:700, color:p.accentColor, opacity:0.05 } as IElement);
    els.push({ id: pfx(p,"dot"), type:"shape", shape:"circle", x:W/2-16, y:90, w:32, h:32, color:p.accentColor, opacity:1 } as IElement);
    els.push(profileEl(p, 150));
    els.push({ id: pfx(p,"h"), type:"text", text:p.title, x:60, y:260, w:W-120, h:440, fontSize:148, weight:900, color:"#FFFFFF", font:TBF, align:"center", lineHeight:0.9 } as IElement);
    els.push({ id: pfx(p,"rule"), type:"shape", shape:"rect", x:W/2-60, y:720, w:120, h:6, color:p.accentColor, radius:3, opacity:1 } as IElement);
    els.push({ id: pfx(p,"p"), type:"text", text:p.body, x:80, y:760, w:W-160, h:420, fontSize:40, weight:500, color:"#D0D0D0", font:SG, align:"center", lineHeight:1.6 } as IElement);
    return els;
  }
};

export const tpl_editorialCentered: SlideTemplate = {
  id: "editorial-centered", name: "Editorial Centrado", description: "Barra accent topo, título grande, regras duplas, corpo",
  category: "texto", bestFor: ["middle", "any"],
  build(p) {
    const els: IElement[] = [];
    els.push({ id: pfx(p,"c1"), type:"shape", shape:"circle", x:W/2-400, y:H/2-400, w:800, h:800, color:p.accentColor, opacity:0.05 } as IElement);
    els.push({ id: pfx(p,"topbar"), type:"shape", shape:"rect", x:60, y:60, w:W-120, h:3, color:p.accentColor, opacity:0.4, radius:2 } as IElement);
    els.push(profileEl(p, 90));
    els.push({ id: pfx(p,"h"), type:"text", text:p.title, x:60, y:210, w:W-120, h:420, fontSize:140, weight:900, color:"#FFFFFF", font:TBF, align:"center", lineHeight:0.88 } as IElement);
    els.push({ id: pfx(p,"rule1"), type:"shape", shape:"rect", x:60, y:655, w:W-120, h:2, color:"#fff", opacity:0.08, radius:1 } as IElement);
    els.push({ id: pfx(p,"rule2"), type:"shape", shape:"rect", x:60, y:663, w:W-120, h:2, color:p.accentColor, opacity:0.5, radius:1 } as IElement);
    els.push({ id: pfx(p,"p"), type:"text", text:p.body, x:80, y:700, w:W-160, h:520, fontSize:42, weight:400, color:"#C8C8C8", font:SG, align:"center", lineHeight:1.6 } as IElement);
    return els;
  }
};

export const tpl_impact: SlideTemplate = {
  id: "impact", name: "Impacto", description: "Título domina metade superior, corpo ocupa metade inferior",
  category: "texto", bestFor: ["middle", "any"],
  build(p) {
    const els: IElement[] = [];
    els.push({ id: pfx(p,"c1"), type:"shape", shape:"circle", x:W-200, y:-150, w:600, h:600, color:p.accentColor, opacity:0.06 } as IElement);
    els.push({ id: pfx(p,"c2"), type:"shape", shape:"circle", x:-150, y:H-500, w:600, h:600, color:p.accentColor, opacity:0.04 } as IElement);
    els.push(profileEl(p, 80));
    els.push({ id: pfx(p,"h"), type:"text", text:p.title, x:60, y:190, w:W-120, h:500, fontSize:155, weight:900, color:"#FFFFFF", font:TBF, align:"center", lineHeight:0.86 } as IElement);
    els.push({ id: pfx(p,"accent"), type:"shape", shape:"rect", x:W/2-80, y:710, w:160, h:7, color:p.accentColor, radius:4, opacity:1 } as IElement);
    els.push({ id: pfx(p,"p"), type:"text", text:p.body, x:70, y:760, w:W-140, h:460, fontSize:40, weight:500, color:"#D4D4D4", font:SG, align:"center", lineHeight:1.6 } as IElement);
    return els;
  }
};

export const tpl_quoteStyle: SlideTemplate = {
  id: "quote-style", name: "Estilo Quote", description: "Corpo como citação no topo, título + handle em baixo",
  category: "texto", bestFor: ["middle", "any"],
  build(p) {
    const els: IElement[] = [];
    els.push({ id: pfx(p,"qmark1"), type:"shape", shape:"rect", x:60, y:100, w:8, h:240, color:p.accentColor, opacity:1, radius:4 } as IElement);
    els.push({ id: pfx(p,"qmark2"), type:"shape", shape:"rect", x:W-68, y:100, w:8, h:240, color:p.accentColor, opacity:0.3, radius:4 } as IElement);
    els.push({ id: pfx(p,"c1"), type:"shape", shape:"circle", x:-100, y:-100, w:500, h:500, color:p.accentColor, opacity:0.05 } as IElement);
    els.push({ id: pfx(p,"body"), type:"text", text:`"${p.body}"`, x:90, y:100, w:W-180, h:520, fontSize:52, weight:500, color:"#F0F0F0", font:SG, align:"center", lineHeight:1.55 } as IElement);
    els.push({ id: pfx(p,"rule"), type:"shape", shape:"rect", x:W/2-60, y:H/2+60, w:120, h:5, color:p.accentColor, radius:3, opacity:1 } as IElement);
    els.push(profileEl(p, H/2+110));
    els.push({ id: pfx(p,"h"), type:"text", text:p.title, x:60, y:H/2+200, w:W-120, h:320, fontSize:110, weight:900, color:"#FFFFFF", font:TBF, align:"center", lineHeight:0.92 } as IElement);
    return els;
  }
};

export const tpl_stackedBold: SlideTemplate = {
  id: "stacked-bold", name: "Empilhado Bold", description: "Handle + título enorme no topo, corpo generoso abaixo",
  category: "texto", bestFor: ["middle", "any"],
  build(p) {
    const els: IElement[] = [];
    els.push({ id: pfx(p,"c1"), type:"shape", shape:"circle", x:W-350, y:H-450, w:700, h:700, color:p.accentColor, opacity:0.05 } as IElement);
    els.push({ id: pfx(p,"topline"), type:"shape", shape:"rect", x:60, y:60, w:80, h:7, color:p.accentColor, radius:4, opacity:1 } as IElement);
    els.push(profileEl(p, 90));
    els.push({ id: pfx(p,"h"), type:"text", text:p.title, x:60, y:210, w:W-120, h:500, fontSize:144, weight:900, color:"#FFFFFF", font:TBF, align:"center", lineHeight:0.88 } as IElement);
    els.push({ id: pfx(p,"rule"), type:"shape", shape:"rect", x:60, y:730, w:W-120, h:2, color:"#fff", opacity:0.1, radius:1 } as IElement);
    els.push({ id: pfx(p,"p"), type:"text", text:p.body, x:70, y:770, w:W-140, h:460, fontSize:42, weight:400, color:"#C2C2C2", font:SG, align:"center", lineHeight:1.65 } as IElement);
    return els;
  }
};

export const tpl_minimalCorners: SlideTemplate = {
  id: "minimal-corners", name: "Cantos Mínimos", description: "Círculos decorativos nos cantos, título centrado, pontos accent",
  category: "texto", bestFor: ["middle", "any"],
  build(p) {
    const els: IElement[] = [];
    els.push({ id: pfx(p,"tl"), type:"shape", shape:"circle", x:-120, y:-120, w:340, h:340, color:p.accentColor, opacity:0.08 } as IElement);
    els.push({ id: pfx(p,"br"), type:"shape", shape:"circle", x:W-220, y:H-220, w:340, h:340, color:p.accentColor, opacity:0.08 } as IElement);
    els.push(profileEl(p, H/2-440));
    els.push({ id: pfx(p,"h"), type:"text", text:p.title, x:60, y:H/2-360, w:W-120, h:480, fontSize:150, weight:900, color:"#FFFFFF", font:TBF, align:"center", lineHeight:0.88 } as IElement);
    els.push({ id: pfx(p,"d1"), type:"shape", shape:"circle", x:W/2-40, y:H/2+130, w:10, h:10, color:p.accentColor, opacity:1 } as IElement);
    els.push({ id: pfx(p,"d2"), type:"shape", shape:"circle", x:W/2-14, y:H/2+130, w:10, h:10, color:p.accentColor, opacity:0.5 } as IElement);
    els.push({ id: pfx(p,"d3"), type:"shape", shape:"circle", x:W/2+12, y:H/2+130, w:10, h:10, color:p.accentColor, opacity:0.25 } as IElement);
    els.push({ id: pfx(p,"p"), type:"text", text:p.body, x:80, y:H/2+170, w:W-160, h:480, fontSize:42, weight:400, color:"#BEBEBE", font:SG, align:"center", lineHeight:1.6 } as IElement);
    return els;
  }
};

export const tpl_twoColumnStat: SlideTemplate = {
  id: "two-column-stat", name: "Duas Colunas", description: "Divisor vertical, título na coluna esquerda, corpo na direita",
  category: "texto", bestFor: ["middle", "any"],
  build(p) {
    const els: IElement[] = [];
    els.push({ id: pfx(p,"c1"), type:"shape", shape:"circle", x:-150, y:200, w:500, h:500, color:p.accentColor, opacity:0.06 } as IElement);
    els.push({ id: pfx(p,"c2"), type:"shape", shape:"circle", x:W-100, y:H-600, w:500, h:500, color:p.accentColor, opacity:0.04 } as IElement);
    els.push({ id: pfx(p,"vdiv"), type:"shape", shape:"rect", x:520, y:100, w:2, h:H-200, color:"#ffffff", opacity:0.07, radius:1 } as IElement);
    els.push(profileEl(p, 80, 60, 420));
    els.push({ id: pfx(p,"h"), type:"text", text:p.title, x:50, y:200, w:440, h:620, fontSize:148, weight:900, color:"#FFFFFF", font:TBF, align:"center", lineHeight:0.88 } as IElement);
    els.push({ id: pfx(p,"dot"), type:"shape", shape:"circle", x:210, y:872, w:16, h:16, color:p.accentColor, opacity:1 } as IElement);
    els.push({ id: pfx(p,"rule"), type:"shape", shape:"rect", x:80, y:890, w:300, h:4, color:p.accentColor, radius:2, opacity:0.7 } as IElement);
    els.push({ id: pfx(p,"p"), type:"text", text:p.body, x:560, y:160, w:460, h:960, fontSize:40, weight:400, color:"#CCCCCC", font:SG, align:"left", lineHeight:1.65 } as IElement);
    return els;
  }
};

export const tpl_checklistDecorative: SlideTemplate = {
  id: "checklist", name: "Checklist", description: "Título + bullets accent à esquerda + corpo",
  category: "texto", bestFor: ["middle", "any"],
  build(p) {
    const els: IElement[] = [];
    els.push({ id: pfx(p,"c1"), type:"shape", shape:"circle", x:W-300, y:-100, w:600, h:600, color:p.accentColor, opacity:0.05 } as IElement);
    els.push(profileEl(p, 70));
    els.push({ id: pfx(p,"h"), type:"text", text:p.title, x:60, y:190, w:W-120, h:300, fontSize:118, weight:900, color:"#FFFFFF", font:TBF, align:"left", lineHeight:0.9 } as IElement);
    els.push({ id: pfx(p,"b1"), type:"shape", shape:"rect", x:60, y:510, w:8, h:200, color:p.accentColor, opacity:1, radius:4 } as IElement);
    els.push({ id: pfx(p,"b2"), type:"shape", shape:"rect", x:60, y:730, w:8, h:200, color:p.accentColor, opacity:0.6, radius:4 } as IElement);
    els.push({ id: pfx(p,"b3"), type:"shape", shape:"rect", x:60, y:950, w:8, h:200, color:p.accentColor, opacity:0.3, radius:4 } as IElement);
    els.push({ id: pfx(p,"p"), type:"text", text:p.body, x:100, y:500, w:W-160, h:720, fontSize:40, weight:400, color:"#C8C8C8", font:SG, align:"left", lineHeight:1.65 } as IElement);
    return els;
  }
};

export const tpl_leftAlign: SlideTemplate = {
  id: "left-align", name: "Alinhado Esquerda", description: "Barra accent vertical esquerda, texto alinhado à esquerda",
  category: "texto", bestFor: ["middle", "any"],
  build(p) {
    const els: IElement[] = [];
    els.push({ id: pfx(p,"c1"), type:"shape", shape:"circle", x:-200, y:H-400, w:600, h:600, color:p.accentColor, opacity:0.06 } as IElement);
    els.push({ id: pfx(p,"bar"), type:"shape", shape:"rect", x:60, y:100, w:6, h:H-200, color:p.accentColor, radius:3, opacity:0.5 } as IElement);
    els.push(profileEl(p, 100, 100));
    els.push({ id: pfx(p,"h"), type:"text", text:p.title, x:100, y:220, w:W-160, h:480, fontSize:138, weight:900, color:"#FFFFFF", font:TBF, align:"left", lineHeight:0.9 } as IElement);
    els.push({ id: pfx(p,"rule"), type:"shape", shape:"rect", x:100, y:720, w:200, h:5, color:p.accentColor, radius:3, opacity:1 } as IElement);
    els.push({ id: pfx(p,"p"), type:"text", text:p.body, x:100, y:760, w:W-160, h:480, fontSize:42, weight:400, color:"#C0C0C0", font:SG, align:"left", lineHeight:1.6 } as IElement);
    return els;
  }
};

export const tpl_numberHero: SlideTemplate = {
  id: "number-hero", name: "Número Herói", description: "Número gigante ghost, título por cima, corpo abaixo",
  category: "texto", bestFor: ["middle", "cover"],
  build(p) {
    const els: IElement[] = [];
    els.push({ id: pfx(p,"num"), type:"text", text:String(p.i+1).padStart(2,"0"), x:0, y:80, w:W, h:600, fontSize:500, weight:900, color:p.accentColor, font:TBF, align:"center", lineHeight:0.9, letterSpacing:-0.05 } as IElement);
    els.push(profileEl(p, 100));
    els.push({ id: pfx(p,"h"), type:"text", text:p.title, x:60, y:580, w:W-120, h:320, fontSize:110, weight:900, color:"#FFFFFF", font:TBF, align:"center", lineHeight:0.92 } as IElement);
    els.push({ id: pfx(p,"line"), type:"shape", shape:"rect", x:W/2-80, y:920, w:160, h:5, color:p.accentColor, radius:3, opacity:1 } as IElement);
    els.push({ id: pfx(p,"p"), type:"text", text:p.body, x:80, y:960, w:W-160, h:300, fontSize:38, weight:400, color:"#C0C0C0", font:SG, align:"center", lineHeight:1.6 } as IElement);
    return els;
  }
};

export const tpl_dramatic: SlideTemplate = {
  id: "dramatic", name: "Dramático", description: "Linha horizontal colorida, título enorme à esquerda, corpo abaixo",
  category: "texto", bestFor: ["middle", "cover"],
  build(p) {
    const els: IElement[] = [];
    els.push({ id: pfx(p,"faixa"), type:"shape", shape:"rect", x:-100, y:580, w:W+200, h:8, color:p.accentColor, opacity:0.8, radius:0 } as IElement);
    els.push({ id: pfx(p,"h"), type:"text", text:p.title, x:60, y:100, w:W-120, h:460, fontSize:160, weight:900, color:"#FFFFFF", font:TBF, align:"left", lineHeight:0.86 } as IElement);
    els.push({ id: pfx(p,"p"), type:"text", text:p.body, x:60, y:640, w:W-120, h:500, fontSize:48, weight:500, color:"#E0E0E0", font:SG, align:"left", lineHeight:1.5 } as IElement);
    els.push(profileEl(p, H-120));
    return els;
  }
};

export const tpl_textDominant: SlideTemplate = {
  id: "text-dominant", name: "Texto Dominante", description: "Fundo sólido, tipografia preenche o slide, sem imagem",
  category: "texto", bestFor: ["middle", "any"],
  build(p) {
    const els: IElement[] = [];
    els.push({ id: pfx(p,"dot"), type:"shape", shape:"circle", x:60, y:80, w:18, h:18, color:p.accentColor, opacity:1 } as IElement);
    els.push({ id: pfx(p,"h"), type:"text", text:p.title, x:60, y:120, w:W-120, h:680, fontSize:170, weight:900, color:"#FFFFFF", font:TBF, align:"left", lineHeight:0.84 } as IElement);
    els.push({ id: pfx(p,"line"), type:"shape", shape:"rect", x:60, y:820, w:W-120, h:3, color:p.accentColor, opacity:0.4, radius:2 } as IElement);
    els.push({ id: pfx(p,"p"), type:"text", text:p.body, x:60, y:850, w:W-120, h:360, fontSize:44, weight:400, color:"#C0C0C0", font:SG, align:"left", lineHeight:1.55 } as IElement);
    els.push(profileEl(p, H-120));
    return els;
  }
};

export const tpl_bigQuestion: SlideTemplate = {
  id: "big-question", name: "Pergunta Grande", description: "Ponto de interrogação gigante ghost, pergunta provocativa centrada",
  category: "texto", bestFor: ["middle", "any"],
  build(p) {
    const els: IElement[] = [];
    els.push({ id: pfx(p,"qbg"), type:"text", text:"?", x:0, y:-100, w:W, h:H, fontSize:900, weight:900, color:p.accentColor, font:TBF, align:"center", lineHeight:1 } as IElement);
    els.push({ id: pfx(p,"h"), type:"text", text:p.title, x:60, y:320, w:W-120, h:500, fontSize:90, weight:900, color:"#FFFFFF", font:TBF, align:"center", lineHeight:1.0 } as IElement);
    els.push({ id: pfx(p,"p"), type:"text", text:p.body, x:80, y:860, w:W-160, h:240, fontSize:38, weight:400, color:"#CCCCCC", font:SG, align:"center", lineHeight:1.5 } as IElement);
    els.push(profileEl(p, H-120));
    return els;
  }
};

export const tpl_testimonial: SlideTemplate = {
  id: "testimonial", name: "Testemunho", description: "Aspas grandes, citação, handle + avaliação",
  category: "texto", bestFor: ["middle", "any"],
  build(p) {
    const els: IElement[] = [];
    els.push({ id: pfx(p,"q1"), type:"text", text:"“", x:40, y:60, w:200, h:200, fontSize:220, weight:900, color:p.accentColor, font:TBF, align:"left", lineHeight:1 } as IElement);
    els.push({ id: pfx(p,"body"), type:"text", text:`"${p.body}"`, x:80, y:230, w:W-160, h:520, fontSize:52, weight:500, color:"#F0F0F0", font:SG, align:"center", lineHeight:1.55 } as IElement);
    els.push({ id: pfx(p,"line"), type:"shape", shape:"rect", x:W/2-60, y:800, w:120, h:4, color:p.accentColor, radius:2, opacity:1 } as IElement);
    els.push(profileEl(p, 840));
    els.push({ id: pfx(p,"name"), type:"text", text:p.title, x:60, y:950, w:W-120, h:100, fontSize:42, weight:700, color:"#FFFFFF", font:SG, align:"center", lineHeight:1 } as IElement);
    els.push({ id: pfx(p,"stars"), type:"text", text:"★★★★★", x:60, y:1060, w:W-120, h:80, fontSize:48, weight:700, color:p.accentColor, font:SG, align:"center", lineHeight:1 } as IElement);
    return els;
  }
};

// ─── IMAGE TEMPLATES ───────────────────────────────────────────────────────

export const tpl_coverCTA: SlideTemplate = {
  id: "cover-cta", name: "Capa / CTA", description: "Texto no rodapé sobre imagem full-bleed",
  category: "imagem", bestFor: ["cover", "cta"],
  build(p) {
    const els: IElement[] = [];
    els.push(profileEl(p, H-640));
    els.push({ id: pfx(p,"h"), type:"text", text:p.title, x:60, y:H-560, w:W-120, h:320, fontSize:126, weight:900, color:"#FFFFFF", font:TBF, align:"center", lineHeight:1.0 } as IElement);
    els.push({ id: pfx(p,"p"), type:"text", text:p.body, x:100, y:H-230, w:W-200, h:160, fontSize:34, weight:500, color:"#EAEAEA", font:SG, align:"center", lineHeight:1.4 } as IElement);
    return els;
  }
};

export const tpl_textTopImageBottom: SlideTemplate = {
  id: "text-top-img-bottom", name: "Texto Topo + Imagem Base", description: "Texto no topo, imagem larga embaixo",
  category: "imagem", bestFor: ["middle", "any"],
  build(p) {
    const els: IElement[] = [];
    els.push(profileEl(p, 100));
    els.push({ id: pfx(p,"h"), type:"text", text:p.title, x:60, y:200, w:W-120, h:220, fontSize:100, weight:900, color:"#FFFFFF", font:TBF, align:"center", lineHeight:0.95 } as IElement);
    els.push({ id: pfx(p,"pp"), type:"text", text:p.body, x:100, y:400, w:W-200, h:180, fontSize:34, weight:500, color:"#D4D4D4", font:SG, align:"center", lineHeight:1.4 } as IElement);
    els.push({ id: pfx(p,"img"), type:"image", imagePrompt:p.imagePrompt||p.title, x:60, y:680, w:W-120, h:580, radius:24 } as IElement);
    return els;
  }
};

export const tpl_twoSquaresTop: SlideTemplate = {
  id: "two-squares-top", name: "Dois Quadrados + Texto", description: "Duas imagens quadradas no topo, título e corpo abaixo",
  category: "imagem", bestFor: ["middle", "any"],
  build(p) {
    const els: IElement[] = [];
    els.push({ id: pfx(p,"img1"), type:"image", imagePrompt:p.imagePrompt||p.title, x:60, y:100, w:450, h:450, radius:40 } as IElement);
    els.push({ id: pfx(p,"img2"), type:"image", imagePrompt:p.imagePrompt||p.title, x:570, y:100, w:450, h:450, radius:40 } as IElement);
    els.push(profileEl(p, 610));
    els.push({ id: pfx(p,"h"), type:"text", text:p.title, x:60, y:720, w:W-120, h:260, fontSize:96, weight:900, color:"#FFFFFF", font:TBF, align:"center", lineHeight:0.95 } as IElement);
    els.push({ id: pfx(p,"pp"), type:"text", text:p.body, x:80, y:1000, w:W-160, h:240, fontSize:34, weight:500, color:"#D0D0D0", font:SG, align:"center", lineHeight:1.45 } as IElement);
    return els;
  }
};

export const tpl_imageTopTextBottom: SlideTemplate = {
  id: "img-top-text-bottom", name: "Imagem Topo + Texto Base", description: "Imagem larga no topo, título e corpo abaixo",
  category: "imagem", bestFor: ["middle", "any"],
  build(p) {
    const els: IElement[] = [];
    els.push({ id: pfx(p,"img"), type:"image", imagePrompt:p.imagePrompt||p.title, x:60, y:100, w:W-120, h:580, radius:24 } as IElement);
    els.push(profileEl(p, 740));
    els.push({ id: pfx(p,"h"), type:"text", text:p.title, x:60, y:840, w:W-120, h:260, fontSize:96, weight:900, color:"#FFFFFF", font:TBF, align:"center", lineHeight:0.95 } as IElement);
    els.push({ id: pfx(p,"pp"), type:"text", text:p.body, x:100, y:1110, w:W-200, h:180, fontSize:34, weight:500, color:"#D4D4D4", font:SG, align:"center", lineHeight:1.4 } as IElement);
    return els;
  }
};

export const tpl_splitVertical: SlideTemplate = {
  id: "split-vertical", name: "Split Vertical", description: "Imagem metade esquerda, texto metade direita",
  category: "imagem", bestFor: ["middle", "any"],
  build(p) {
    const els: IElement[] = [];
    els.push({ id: pfx(p,"img"), type:"image", imagePrompt:p.imagePrompt||p.title, x:0, y:0, w:500, h:H, radius:0 } as IElement);
    els.push({ id: pfx(p,"divider"), type:"shape", shape:"rect", x:514, y:60, w:3, h:H-120, color:p.accentColor, opacity:0.25, radius:2 } as IElement);
    els.push(profileEl(p, 100, 548, 480));
    els.push({ id: pfx(p,"h"), type:"text", text:p.title, x:548, y:210, w:460, h:340, fontSize:80, weight:900, color:"#FFFFFF", font:TBF, align:"left", lineHeight:0.92 } as IElement);
    els.push({ id: pfx(p,"bar"), type:"shape", shape:"rect", x:548, y:570, w:80, h:5, color:p.accentColor, opacity:1, radius:3 } as IElement);
    els.push({ id: pfx(p,"pp"), type:"text", text:p.body, x:548, y:600, w:460, h:340, fontSize:30, weight:500, color:"#C8C8C8", font:SG, align:"left", lineHeight:1.5 } as IElement);
    return els;
  }
};

export const tpl_smallImgTopRight: SlideTemplate = {
  id: "small-img-top-right", name: "Imagem Canto Direito", description: "Foto pequena canto superior direito, texto domina esquerda",
  category: "imagem", bestFor: ["middle", "any"],
  build(p) {
    const els: IElement[] = [];
    els.push({ id: pfx(p,"img"), type:"image", imagePrompt:p.imagePrompt||p.title, x:W-340, y:80, w:280, h:280, radius:28 } as IElement);
    els.push(profileEl(p, 80));
    els.push({ id: pfx(p,"h"), type:"text", text:p.title, x:60, y:200, w:W-420, h:340, fontSize:86, weight:900, color:"#FFFFFF", font:TBF, align:"left", lineHeight:0.95 } as IElement);
    els.push({ id: pfx(p,"rule"), type:"shape", shape:"rect", x:60, y:H/2-40, w:W-120, h:2, color:"#ffffff", opacity:0.08, radius:1 } as IElement);
    els.push({ id: pfx(p,"pp"), type:"text", text:p.body, x:60, y:H/2, w:W-120, h:340, fontSize:38, weight:500, color:"#CCCCCC", font:SG, align:"left", lineHeight:1.5 } as IElement);
    return els;
  }
};

export const tpl_circlePortrait: SlideTemplate = {
  id: "circle-portrait", name: "Retrato Circular", description: "Foto em círculo centralizado no topo, título e corpo abaixo",
  category: "imagem", bestFor: ["middle", "cover"],
  build(p) {
    const els: IElement[] = [];
    els.push({ id: pfx(p,"ring"), type:"shape", shape:"circle", x:160, y:50, w:760, h:760, color:p.accentColor, opacity:0.18 } as IElement);
    els.push({ id: pfx(p,"img"), type:"image", imagePrompt:p.imagePrompt||p.title, x:190, y:80, w:700, h:700, radius:350 } as IElement);
    els.push({ id: pfx(p,"dot"), type:"shape", shape:"circle", x:W/2-12, y:36, w:24, h:24, color:p.accentColor, opacity:1 } as IElement);
    els.push(profileEl(p, 848));
    els.push({ id: pfx(p,"h"), type:"text", text:p.title, x:60, y:920, w:W-120, h:220, fontSize:96, weight:900, color:"#FFFFFF", font:TBF, align:"center", lineHeight:0.92 } as IElement);
    els.push({ id: pfx(p,"rule"), type:"shape", shape:"rect", x:W/2-60, y:1158, w:120, h:5, color:p.accentColor, radius:3, opacity:1 } as IElement);
    els.push({ id: pfx(p,"pp"), type:"text", text:p.body, x:100, y:1178, w:W-200, h:130, fontSize:34, weight:500, color:"#D0D0D0", font:SG, align:"center", lineHeight:1.4 } as IElement);
    return els;
  }
};

export const tpl_frostedCard: SlideTemplate = {
  id: "frosted-card", name: "Card Frosted", description: "Fundo imagem full-bleed, card escuro centralizado",
  category: "imagem", bestFor: ["middle", "cover"],
  build(p) {
    const els: IElement[] = [];
    els.push({ id: pfx(p,"card"), type:"shape", shape:"rect", x:60, y:270, w:960, h:680, color:"rgba(0,0,0,0.65)", opacity:1, radius:20 } as IElement);
    els.push({ id: pfx(p,"cardtop"), type:"shape", shape:"rect", x:60, y:270, w:220, h:5, color:p.accentColor, opacity:1, radius:3 } as IElement);
    els.push(profileEl(p, 320, 100, 500));
    els.push({ id: pfx(p,"h"), type:"text", text:p.title, x:100, y:420, w:880, h:300, fontSize:106, weight:900, color:"#FFFFFF", font:TBF, align:"center", lineHeight:0.9 } as IElement);
    els.push({ id: pfx(p,"rule"), type:"shape", shape:"rect", x:W/2-50, y:740, w:100, h:4, color:p.accentColor, radius:2, opacity:1 } as IElement);
    els.push({ id: pfx(p,"pp"), type:"text", text:p.body, x:120, y:760, w:840, h:160, fontSize:34, weight:500, color:"#EAEAEA", font:SG, align:"center", lineHeight:1.4 } as IElement);
    return els;
  }
};

export const tpl_mosaicLeft: SlideTemplate = {
  id: "mosaic-left", name: "Mosaico Esquerda", description: "1 imagem alta à esquerda, 2 imagens empilhadas à direita",
  category: "imagem", bestFor: ["middle", "any"],
  build(p) {
    const els: IElement[] = [];
    els.push(profileEl(p, 44));
    els.push({ id: pfx(p,"img1"), type:"image", imagePrompt:p.imagePrompt||p.title, x:40, y:120, w:468, h:1000, radius:20 } as IElement);
    els.push({ id: pfx(p,"img2"), type:"image", imagePrompt:p.imagePrompt||p.title, x:548, y:120, w:492, h:480, radius:20 } as IElement);
    els.push({ id: pfx(p,"img3"), type:"image", imagePrompt:p.imagePrompt||p.title, x:548, y:620, w:492, h:500, radius:20 } as IElement);
    els.push({ id: pfx(p,"rule"), type:"shape", shape:"rect", x:40, y:1140, w:W-80, h:3, color:p.accentColor, opacity:0.5, radius:2 } as IElement);
    els.push({ id: pfx(p,"h"), type:"text", text:p.title, x:40, y:1145, w:W-80, h:120, fontSize:76, weight:900, color:"#FFFFFF", font:TBF, align:"center", lineHeight:0.92 } as IElement);
    return els;
  }
};

export const tpl_bottomThird: SlideTemplate = {
  id: "bottom-third", name: "Bloco Base", description: "Imagem 65% superior, bloco colorido com texto no rodapé",
  category: "imagem", bestFor: ["middle", "cover"],
  build(p) {
    const els: IElement[] = [];
    els.push({ id: pfx(p,"block"), type:"shape", shape:"rect", x:0, y:880, w:W, h:H-880, color:p.accentColor, opacity:1, radius:0 } as IElement);
    els.push({ id: pfx(p,"img"), type:"image", imagePrompt:p.imagePrompt||p.title, x:0, y:0, w:W, h:900, radius:0 } as IElement);
    els.push({ id: pfx(p,"h"), type:"text", text:p.title, x:60, y:920, w:W-120, h:220, fontSize:86, weight:900, color:"#000000", font:TBF, align:"center", lineHeight:0.92 } as IElement);
    els.push({ id: pfx(p,"pp"), type:"text", text:p.body, x:80, y:1150, w:W-160, h:160, fontSize:34, weight:600, color:"rgba(0,0,0,0.75)", font:SG, align:"center", lineHeight:1.4 } as IElement);
    return els;
  }
};

// ─── CTA TEMPLATES ─────────────────────────────────────────────────────────

export const tpl_ctaDirect: SlideTemplate = {
  id: "cta-direct", name: "CTA Direto", description: "Slide final com ações claras: curtir, salvar, comentar",
  category: "cta", bestFor: ["cta"],
  build(p) {
    const els: IElement[] = [];
    els.push({ id: pfx(p,"h"), type:"text", text:p.title, x:60, y:120, w:W-120, h:280, fontSize:110, weight:900, color:"#FFFFFF", font:TBF, align:"center", lineHeight:0.92 } as IElement);
    els.push({ id: pfx(p,"line"), type:"shape", shape:"rect", x:60, y:420, w:W-120, h:3, color:p.accentColor, opacity:0.5, radius:2 } as IElement);
    els.push({ id: pfx(p,"a1"), type:"text", text:"❤️  Curte o post", x:80, y:480, w:W-160, h:100, fontSize:44, weight:600, color:"#FFFFFF", font:SG, align:"left", lineHeight:1 } as IElement);
    els.push({ id: pfx(p,"a2"), type:"text", text:"🔁  Salva pra depois", x:80, y:600, w:W-160, h:100, fontSize:44, weight:600, color:"#FFFFFF", font:SG, align:"left", lineHeight:1 } as IElement);
    els.push({ id: pfx(p,"a3"), type:"text", text:"💬  Comenta aqui", x:80, y:720, w:W-160, h:100, fontSize:44, weight:600, color:"#FFFFFF", font:SG, align:"left", lineHeight:1 } as IElement);
    els.push({ id: pfx(p,"line2"), type:"shape", shape:"rect", x:60, y:860, w:W-120, h:3, color:p.accentColor, opacity:0.4, radius:2 } as IElement);
    els.push({ id: pfx(p,"handle"), type:"text", text:p.handle, x:60, y:900, w:W-120, h:120, fontSize:72, weight:900, color:p.accentColor, font:TBF, align:"center", lineHeight:1 } as IElement);
    els.push({ id: pfx(p,"pp"), type:"text", text:p.body, x:80, y:1040, w:W-160, h:200, fontSize:36, weight:400, color:"#AAAAAA", font:SG, align:"center", lineHeight:1.4 } as IElement);
    return els;
  }
};

export const tpl_ctaQuestion: SlideTemplate = {
  id: "cta-question", name: "CTA Pergunta", description: "Pergunta de engajamento nos comentários, fundo accent vibrante",
  category: "cta", bestFor: ["cta"],
  build(p) {
    const els: IElement[] = [];
    els.push({ id: pfx(p,"h"), type:"text", text:p.title, x:60, y:200, w:W-120, h:560, fontSize:108, weight:900, color:"#000000", font:TBF, align:"center", lineHeight:0.95 } as IElement);
    els.push({ id: pfx(p,"line"), type:"shape", shape:"rect", x:W/2-80, y:800, w:160, h:6, color:"rgba(0,0,0,0.3)", radius:3, opacity:1 } as IElement);
    els.push({ id: pfx(p,"pp"), type:"text", text:p.body, x:80, y:840, w:W-160, h:200, fontSize:42, weight:500, color:"rgba(0,0,0,0.7)", font:SG, align:"center", lineHeight:1.5 } as IElement);
    els.push({ id: pfx(p,"emoji"), type:"text", text:"👇", x:0, y:1050, w:W, h:120, fontSize:90, weight:400, color:"#000000", font:SG, align:"center", lineHeight:1 } as IElement);
    els.push({ id: pfx(p,"handle"), type:"text", text:p.handle, x:60, y:1180, w:W-120, h:80, fontSize:38, weight:600, color:"rgba(0,0,0,0.5)", font:SG, align:"center", lineHeight:1 } as IElement);
    return els;
  }
};

export const tpl_frameWithSummary: SlideTemplate = {
  id: "frame-summary", name: "Resumo Final", description: "Lista de checkmarks com tópicos aprendidos + teaser próximo",
  category: "cta", bestFor: ["cta"],
  build(p) {
    const els: IElement[] = [];
    els.push({ id: pfx(p,"eyebrow"), type:"text", text:"VOCÊ APRENDEU:", x:60, y:80, w:W-120, h:80, fontSize:28, weight:600, color:p.accentColor, font:SG, align:"left", lineHeight:1 } as IElement);
    els.push({ id: pfx(p,"h"), type:"text", text:p.title, x:60, y:180, w:W-120, h:260, fontSize:100, weight:900, color:"#FFFFFF", font:TBF, align:"left", lineHeight:0.92 } as IElement);
    els.push({ id: pfx(p,"c1"), type:"text", text:"✓", x:60, y:480, w:60, h:80, fontSize:52, weight:700, color:p.accentColor, font:SG, align:"left", lineHeight:1 } as IElement);
    els.push({ id: pfx(p,"c2"), type:"text", text:"✓", x:60, y:590, w:60, h:80, fontSize:52, weight:700, color:p.accentColor, font:SG, align:"left", lineHeight:1 } as IElement);
    els.push({ id: pfx(p,"c3"), type:"text", text:"✓", x:60, y:700, w:60, h:80, fontSize:52, weight:700, color:p.accentColor, font:SG, align:"left", lineHeight:1 } as IElement);
    els.push({ id: pfx(p,"pp"), type:"text", text:p.body, x:130, y:470, w:W-190, h:360, fontSize:40, weight:400, color:"#CCCCCC", font:SG, align:"left", lineHeight:1.65 } as IElement);
    els.push({ id: pfx(p,"line"), type:"shape", shape:"rect", x:60, y:880, w:W-120, h:3, color:p.accentColor, opacity:0.4, radius:2 } as IElement);
    els.push({ id: pfx(p,"next"), type:"text", text:"Siga para o próximo →", x:60, y:910, w:W-120, h:100, fontSize:40, weight:600, color:"#AAAAAA", font:SG, align:"left", lineHeight:1 } as IElement);
    els.push(profileEl(p, H-120));
    return els;
  }
};

// ─── REGISTRY ──────────────────────────────────────────────────────────────

export const ALL_TEMPLATES: SlideTemplate[] = [
  tpl_centeredPower,
  tpl_editorialCentered,
  tpl_impact,
  tpl_quoteStyle,
  tpl_stackedBold,
  tpl_minimalCorners,
  tpl_twoColumnStat,
  tpl_checklistDecorative,
  tpl_leftAlign,
  tpl_numberHero,
  tpl_dramatic,
  tpl_textDominant,
  tpl_bigQuestion,
  tpl_testimonial,
  tpl_coverCTA,
  tpl_textTopImageBottom,
  tpl_twoSquaresTop,
  tpl_imageTopTextBottom,
  tpl_splitVertical,
  tpl_smallImgTopRight,
  tpl_circlePortrait,
  tpl_frostedCard,
  tpl_mosaicLeft,
  tpl_bottomThird,
  tpl_ctaDirect,
  tpl_ctaQuestion,
  tpl_frameWithSummary,
];

export const TEXT_TEMPLATES = ALL_TEMPLATES.filter(t => t.category === "texto");
export const IMAGE_TEMPLATES = ALL_TEMPLATES.filter(t => t.category === "imagem");
export const CTA_TEMPLATES = ALL_TEMPLATES.filter(t => t.category === "cta");

export function getTemplate(id: string): SlideTemplate | undefined {
  return ALL_TEMPLATES.find(t => t.id === id);
}

export function getCompatibleTemplates(isFirst: boolean, isLast: boolean, hasImage: boolean): SlideTemplate[] {
  if (isFirst || isLast) {
    return ALL_TEMPLATES.filter(t =>
      t.bestFor.includes("cover") || t.bestFor.includes("cta") || t.bestFor.includes("any")
    );
  }
  if (hasImage) {
    return ALL_TEMPLATES.filter(t =>
      t.category === "imagem" || t.bestFor.includes("any")
    );
  }
  return ALL_TEMPLATES.filter(t =>
    t.category === "texto" || t.bestFor.includes("any")
  );
}
