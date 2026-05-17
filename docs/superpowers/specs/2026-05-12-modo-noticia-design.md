# Modo Notícia / Fofoca — Design Spec

**Data:** 2026-05-12

## Visão Geral

Página separada no dashboard que permite ao usuário colar a URL de uma matéria/notícia, o sistema faz scraping do conteúdo, e gera um carrossel no estilo "notícia" ou "fofoca" com as imagens extraídas do artigo (ou geradas por IA se não houver).

---

## Fluxo do Usuário

1. Usuário acessa `/dashboard/news`
2. Cola URL de uma notícia
3. Clica em "Analisar"
4. Sistema faz scraping server-side → exibe preview: título, trecho, imagens encontradas
5. Usuário configura: tom (Fofoca / Notícia / Viral), quantidade de slides
6. Clica em "Gerar Carrossel"
7. Sistema gera o carrossel com Gemini e redireciona para o editor

---

## Arquitetura

### Novas rotas de API

#### `POST /api/news/scrape`
- Input: `{ url: string }`
- Valida URL, faz fetch server-side, parseia HTML com `cheerio`
- Extrai: `title`, `description`, `content` (texto limpo), `images[]` (src absolutos), `source` (domínio)
- Limpa conteúdo: remove scripts, ads, navbars — mantém parágrafos do artigo
- Output: `{ title, description, content, images, source }`
- Erros: URL inválida (400), site bloqueado/timeout (422), parse falhou (500)

#### `POST /api/news/generate`
- Input: `{ title, content, images, tone, slideCount, accentColor }`
- Usa Gemini (textModel do usuário) com prompt adaptado ao tom
- Monta slides com `buildCanvasSlides` (mesmo sistema do carousel/generate)
- Imagens: `bgImageUrl` preenchido com imagens extraídas do scraping (rotação por slide)
- Se não há imagens extraídas → `imagePrompt` gerado para a IA gerar depois no editor
- Cria carrossel no MongoDB com `source: "news"` e `newsUrl` extra
- Output: `{ carouselId }` → frontend redireciona para `/dashboard/editor/[id]`

### Nova página

#### `/dashboard/news/page.tsx`
- Seção 1: campo URL + botão Analisar
- Seção 2 (após scraping): preview card (título, source, imagens em grade)
- Seção 3: configurações (tom, slideCount, accentColor)
- Seção 4: botão Gerar

### Sidebar
- Link novo: "Modo Notícia" com ícone `newspaper` entre Calendário e a linha desabilitada

---

## Prompts por Tom

### Fofoca 🗣️
```
Você é uma página de fofocas do Instagram — animada, dramática, linguagem popular e informal.
NOTÍCIA: [título]
CONTEÚDO: [texto]
Crie [n] slides no estilo fofoca: use linguagem informal, reações emocionais ("GENTE!", "Você não vai acreditar"), drama, emojis no body, mas mantendo os fatos verídicos da matéria.
Tom dos títulos: impactante, sensacionalista mas verdadeiro.
```

### Notícia 📰
```
Você é um comunicador de notícias para Instagram — claro, direto, informativo.
NOTÍCIA: [título]
CONTEÚDO: [texto]
Crie [n] slides no estilo notícia: linguagem clara e objetiva, fatos em ordem de importância, sem sensacionalismo.
Tom dos títulos: informativo e direto.
```

### Viral 🔥
```
Você é um criador de conteúdo viral — provoca curiosidade, usa ganchos fortes, linguagem jovem.
NOTÍCIA: [título]
CONTEÚDO: [texto]
Crie [n] slides transformando esta notícia em conteúdo viral: títulos que geram clique, body que surpreende, use a informação para provocar reação emocional.
```

---

## Imagens

| Situação | Comportamento |
|----------|--------------|
| Artigo tem ≥1 imagem | Usa como `bgImageUrl` nos slides (rotação circular) |
| Artigo tem 0 imagens | `imagePrompt` gerado por Gemini para gerar depois no editor |
| Usuário quer trocar | Pode editar no editor normalmente (já suportado) |

---

## Modelo de Dados

`Carousel` já existente — adicionar campos opcionais:
```ts
newsUrl?: string      // URL original da notícia
newsSource?: string   // Domínio (ex: "g1.globo.com")
mode?: "news"         // Identificador do modo
```

---

## Dependências

- `cheerio` — parsing HTML (instalar)
- `node-fetch` não necessário — Next.js App Router tem `fetch` nativo no server

---

## Itens Fora do Escopo

- Atualização automática de notícias
- Feed de notícias integrado
- Publicação automática no Instagram
- Suporte a sites que requerem JavaScript (SPA) — apenas HTML estático

---

## Plano de Implementação

1. Instalar `cheerio`
2. Adicionar campos `newsUrl`, `newsSource`, `mode` ao model `Carousel`
3. Criar `POST /api/news/scrape`
4. Criar `POST /api/news/generate`
5. Criar `/dashboard/news/page.tsx`
6. Atualizar `Sidebar.tsx` com link "Modo Notícia"
