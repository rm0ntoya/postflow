# implementacaoplano.md — Plano de Implementação da Landing `/landing3`

**Data:** 2026-05-15  
**Status:** pronto para implementação futura  
**Escopo:** criar uma landing page profissional em `/landing3`, sem alterar `/landing`, `/landing2` ou `/dashboard`.

> **Obrigatório antes de codar:** usar a skill `frontend-design` (`/Users/r.montoya/.agents/skills/frontend-design/SKILL.md`) para manter direção visual autoral, produção premium e evitar estética genérica de IA.

---

## 1. Objetivo

Implementar uma landing page pública para o NovaCraft em `/landing3`, convertendo a identidade do dashboard em uma página de venda clara, sofisticada e orientada a produto.

A landing deve parecer uma extensão natural do dashboard redesenhado:

- preto editorial como fundo principal;
- verde-limão `#C6F84E` como único acento cromático;
- bordas finas de 1px, superfícies escuras e hierarquia tipográfica forte;
- previews realistas do produto, principalmente dashboard, carrosséis e Modo Notícia;
- zero herança visual antiga de roxo, gradiente decorativo, glassmorphism pesado ou orbs.

Esta implementação deve criar uma nova rota isolada. Não substituir a landing antiga.

---

## 2. Fontes de Verdade

Antes de implementar, ler nesta ordem:

- [ ] `DESIGN.md` — identidade visual principal do dashboard.
- [ ] `LANSINGPAGEDESING.md` — spec visual da landing, se o arquivo existir.
- [ ] `LANDINGPAGE.md` — referência antiga apenas para entender intenção; não copiar decisões visuais conflitantes.
- [ ] `src/app/landing/page.tsx` e `src/app/landing/landing-new.css` — referência do que evitar: roxo, gradiente e glass pesado.
- [ ] `src/app/landing2/page.tsx` e `src/components/landing2/*` — referência parcial de estrutura; não copiar componentes sem adaptar à nova identidade.
- [ ] `src/styles/tokens.css`, `src/styles/typography.css` e `tailwind.config.ts` — tokens e escala visual disponíveis.

Se `LANSINGPAGEDESING.md` ainda não existir no momento da implementação, usar `DESIGN.md` + este plano como base decisória.

---

## 3. Regras Obrigatórias

- [ ] Invocar `frontend-design` antes de escrever qualquer UI.
- [ ] Não implementar em `/landing` nem `/landing2`; criar somente `/landing3`.
- [ ] Não alterar rotas ou componentes do dashboard.
- [ ] Usar tokens atuais de `src/styles/tokens.css`; evitar hex solto em componentes, exceto quando documentando o acento `#C6F84E`.
- [ ] Usar `lucide-react` para ícones, com `strokeWidth={1.5}`.
- [ ] Manter o verde-limão como único acento cromático de marca.
- [ ] Não usar roxo, violeta, gradientes decorativos, orbs, bokeh, glassmorphism pesado ou sombras grandes.
- [ ] Não criar landing genérica com hero previsível e cards decorativos sem função.
- [ ] Não hospedar automaticamente em `localhost:3000`; rodar servidor apenas se solicitado ou durante QA final.
- [ ] Manter todo texto em PT-BR.

---

## 4. Arquitetura Técnica

### Arquivos a criar

- [ ] `src/app/landing3/page.tsx`
- [ ] `src/components/landing3/Landing3Nav.tsx`
- [ ] `src/components/landing3/Landing3Hero.tsx`
- [ ] `src/components/landing3/DashboardPreview.tsx`
- [ ] `src/components/landing3/WorkflowSection.tsx`
- [ ] `src/components/landing3/CarouselGallery.tsx`
- [ ] `src/components/landing3/FeatureEditorialGrid.tsx`
- [ ] `src/components/landing3/NewsModeSection.tsx`
- [ ] `src/components/landing3/SocialProofStrip.tsx`
- [ ] `src/components/landing3/PricingSection.tsx`
- [ ] `src/components/landing3/FAQSection.tsx`
- [ ] `src/components/landing3/Landing3Footer.tsx`

### CSS

Preferir Tailwind com tokens existentes. Criar CSS dedicado somente se necessário:

- [ ] `src/app/landing3/landing3.css`

Usar CSS dedicado para:

- textura leve de fundo;
- keyframes curtos;
- `prefers-reduced-motion`;
- grids ou máscaras que fiquem mais legíveis fora do JSX.

### Reuso permitido

- `LogoMark` / lockup de `src/components/Logo.tsx`
- `Button`, `Chip`, `Badge`, `Card` e primitives em `src/components/ui/*`, se estiverem alinhados ao design
- assets de `public/img/*` para carrosséis e galeria
- `framer-motion`, se já estiver no projeto e não pesar a página desnecessariamente

---

## 5. Direção Visual

### Conceito

**Dashboard como manifesto.** A landing não deve parecer uma página de marketing separada do produto. Ela deve dar a sensação de que o visitante já está vendo a ferramenta em ação.

### Paleta

Usar os tokens do dashboard:

- `--bg-base`
- `--bg-surface`
- `--bg-surface-2`
- `--bg-surface-3`
- `--border-subtle`
- `--border-default`
- `--border-strong`
- `--text-primary`
- `--text-secondary`
- `--text-tertiary`
- `--accent`
- `--accent-muted`
- `--accent-glow`

### Tipografia

Basear-se na escala do `DESIGN.md`:

- `display` para hero e momentos de alta conversão;
- `h1`, `h2`, `h3` para seções;
- `body`, `caption`, `micro` para interface, labels e métricas.

Para o hero da landing, é aceitável usar um display responsivo maior, desde que:

- a escala seja documentada no CSS;
- não cause quebra ruim em mobile;
- não use tracking negativo exagerado;
- preserve o estilo editorial do dashboard.

### Motion

Motion deve comunicar produto, não decorar:

- entrada inicial discreta;
- hover de cards e previews;
- animação curta no dashboard preview;
- sem parallax ornamental;
- sem animação infinita chamativa.

Respeitar `prefers-reduced-motion`.

---

## 6. Estrutura da Página

### 6.1 `Landing3Nav`

Objetivo: navegação compacta, premium e claramente conectada ao app.

Requisitos:

- [ ] fixa no topo, com altura compacta;
- [ ] fundo `--bg-base` com borda inferior `--border-subtle`;
- [ ] logo NovaCraft à esquerda;
- [ ] links: `Produto`, `Modo Notícia`, `Exemplos`, `Preços`;
- [ ] ações à direita: `Entrar` e CTA `Criar conta`;
- [ ] no mobile, reduzir links e manter CTA principal visível.

Não usar pill glass arredondada flutuante.

### 6.2 `Landing3Hero`

Objetivo: primeira dobra forte, não genérica, com produto visível.

Conteúdo sugerido:

- eyebrow: `NOVACRAFT PARA CRIADORES`
- headline: `Crie carrosséis que parecem pensados por uma equipe.`
- subtítulo: `Transforme ideias, artigos e contexto da sua marca em posts prontos para publicar, com a mesma velocidade de um painel profissional.`
- CTA primário: `Começar agora`
- CTA secundário: `Ver Modo Notícia`

Layout:

- desktop: composição assimétrica com texto à esquerda e `DashboardPreview` à direita;
- mobile: texto primeiro, preview abaixo, sem sobreposição quebrada;
- deixar um pedaço da próxima seção visível na primeira dobra.

### 6.3 `DashboardPreview`

Objetivo: mostrar a landing como produto real, não ilustração genérica.

Incluir:

- sidebar fina;
- topbar com busca `⌘K`;
- hero strip de métricas;
- chips de filtro;
- cards 4:5 de carrosséis;
- card `Novo carrossel`;
- destaque sutil no Modo Notícia.

O preview pode ser fake em CSS/JSX, mas deve respeitar a linguagem visual real do dashboard.

### 6.4 `WorkflowSection`

Objetivo: explicar o fluxo do produto sem parecer tutorial.

Estrutura:

1. `Escreva uma ideia ou cole uma matéria`
2. `A IA estrutura narrativa e slides`
3. `Você edita, exporta e publica`

Visual:

- timeline horizontal no desktop;
- stack vertical no mobile;
- cada etapa com mini UI, não ícone solto.

### 6.5 `CarouselGallery`

Objetivo: prova visual forte.

Requisitos:

- [ ] usar imagens existentes de `public/img`;
- [ ] cards em aspect ratio 4:5;
- [ ] grid editorial, com algumas variações de tamanho controladas;
- [ ] hover com borda `--accent`, sem zoom exagerado;
- [ ] overlay sutil apenas para legibilidade.

Evitar ticker infinito se prejudicar performance ou legibilidade.

### 6.6 `FeatureEditorialGrid`

Objetivo: vender recursos com cara de produto.

Cards sugeridos:

- `Geração com IA`
- `Modo Notícia`
- `Contexto da marca`
- `Calendário editorial`
- `Paletas e templates`
- `Exportação para redes`

Layout:

- grid editorial assimétrico;
- um card maior para Modo Notícia;
- conteúdo visual dentro dos cards deve parecer interface, não ilustração decorativa.

### 6.7 `NewsModeSection`

Objetivo: ser a seção mais memorável da landing.

Conteúdo:

- headline: `Cole uma notícia. Receba um carrossel.`
- subtítulo: `O Modo Notícia lê a matéria, extrai o essencial e transforma em slides com tom factual, viral ou popular.`

Visual:

- painel dividido em `ARTIGO ORIGINAL` e `CARROSSEL NOVACRAFT`;
- setas e highlights usando `--accent`;
- cards de tom: `Notícia`, `Fofoca`, `Viral`;
- simular estágio 01, 02, 03 da tela `/dashboard/news`.

### 6.8 `SocialProofStrip`

Objetivo: mostrar tração sem virar seção inflada.

Usar métricas tipográficas:

- `+28k criadores`
- `4.2M posts gerados`
- `<60s por carrossel`
- `7 dias grátis`

Separar por bordas verticais, no estilo `MetricStrip` do dashboard.

### 6.9 `PricingSection`

Objetivo: conversão clara, compacta e alinhada ao `/dashboard/upgrade`.

Planos:

- `Starter`
- `Pro` destacado

Requisitos:

- [ ] card Pro com borda `--accent`;
- [ ] badge `RECOMENDADO`;
- [ ] CTA único primário no plano Pro;
- [ ] botões secundários nos demais;
- [ ] lista de features com check `--accent`.

### 6.10 `FAQSection`

Objetivo: reduzir objeções.

Perguntas:

- `Preciso saber design?`
- `O que é o Modo Notícia?`
- `Posso usar meu contexto de marca?`
- `Consigo editar antes de publicar?`
- `Posso cancelar quando quiser?`

Usar acordeão simples, sem biblioteca nova.

### 6.11 `Landing3Footer`

Objetivo: fechamento limpo.

Incluir:

- logo;
- links essenciais;
- copyright;
- CTA discreto para criar conta.

---

## 7. Implementação por Fases

### Fase 1 — Preparação

- [ ] Ler skill `frontend-design`.
- [ ] Ler `DESIGN.md`.
- [ ] Ler `LANSINGPAGEDESING.md`, se existir.
- [ ] Inspecionar tokens e primitives existentes.
- [ ] Escolher lista final de imagens para galeria.

### Fase 2 — Rota e composição

- [ ] Criar `src/app/landing3/page.tsx`.
- [ ] Importar componentes da pasta `landing3`.
- [ ] Montar ordem final das seções.
- [ ] Garantir que nenhum código de `/landing` e `/landing2` seja alterado.

### Fase 3 — Componentes principais

- [ ] Implementar `Landing3Nav`.
- [ ] Implementar `Landing3Hero`.
- [ ] Implementar `DashboardPreview`.
- [ ] Implementar `WorkflowSection`.
- [ ] Implementar `CarouselGallery`.

### Fase 4 — Conversão e conteúdo

- [ ] Implementar `FeatureEditorialGrid`.
- [ ] Implementar `NewsModeSection`.
- [ ] Implementar `SocialProofStrip`.
- [ ] Implementar `PricingSection`.
- [ ] Implementar `FAQSection`.
- [ ] Implementar `Landing3Footer`.

### Fase 5 — Responsividade e refinamento

- [ ] Ajustar desktop grande.
- [ ] Ajustar laptop comum.
- [ ] Ajustar tablet.
- [ ] Ajustar mobile.
- [ ] Verificar que textos não sobrepõem nem quebram feio.
- [ ] Conferir estados de hover, focus e active.
- [ ] Conferir `prefers-reduced-motion`.

---

## 8. Test Plan

Executar antes de entregar:

- [ ] `npm run build`
- [ ] Abrir `/landing3` em desktop.
- [ ] Abrir `/landing3` em mobile.
- [ ] Conferir que `/landing` continua intacta.
- [ ] Conferir que `/landing2` continua intacta.
- [ ] Conferir que `/dashboard` continua intacto.
- [ ] Verificar navegação por teclado.
- [ ] Verificar foco visível em todos os elementos interativos.
- [ ] Verificar contraste AA nos textos.
- [ ] Verificar reduced motion.
- [ ] Conferir CTAs e links de âncora.

Checklist visual:

- [ ] nenhum roxo/violeta;
- [ ] nenhum gradiente decorativo;
- [ ] nenhum orb/bokeh;
- [ ] nenhum glassmorphism pesado;
- [ ] nenhuma sombra grande fora das regras do dashboard;
- [ ] verde-limão aparece com moderação;
- [ ] cards de carrossel mantêm proporção 4:5;
- [ ] landing parece parte do sistema NovaCraft.

---

## 9. Critérios de Aceitação

A implementação futura estará pronta quando:

- `/landing3` renderizar sem erro;
- a landing estiver completa em desktop e mobile;
- o visual estiver alinhado ao `DESIGN.md`;
- os componentes parecerem produto real, não placeholders genéricos;
- `npm run build` passar;
- não houver regressão em `/landing`, `/landing2` ou `/dashboard`;
- o resultado for profissional o suficiente para substituir uma landing de produção quando o usuário decidir publicar.

---

## 10. Assumptions

- A rota final será `/landing3`.
- O arquivo de spec visual será `LANSINGPAGEDESING.md`; se ausente, a implementação seguirá `DESIGN.md` e este plano.
- A stack é Next.js App Router, TypeScript, Tailwind CSS, Lucide React e componentes locais.
- Esta etapa cria apenas o plano `implementacaoplano.md`; a landing em código será feita em uma tarefa separada.
