# Modo Notícia PRO — Spec de Design

**Data:** 2026-05-17  
**Status:** Aprovado para implementação

---

## 1. Visão Geral

Novo modo do NovaCraft que permite ao usuário **navegar pelas últimas notícias coletadas pela API local**, selecionar uma matéria, configurar o carrossel (número de páginas, prompt de foco, toggle por página) e gerar automaticamente os slides — sem precisar colar URL manualmente.

Diferença do modo atual (`/dashboard/news`): o usuário **não cola URL**. A API já tem as notícias; ele só escolhe e configura.

---

## 2. Rota e Posição no App

| Item | Valor |
|------|-------|
| Rota | `/dashboard/news-pro` |
| Posição no sidebar | Nova entrada "Notícia PRO" abaixo de "Notícias" |
| Relação com modo atual | Coexiste — `/dashboard/news` (URL manual) permanece intacto |

---

## 3. Fluxo Wizard (3 Etapas)

### Step 1 — Selecionar Notícia

- Chama `GET http://localhost:3001/api/news` com paginação
- Exibe cards com: thumbnail (`image_url`), título, fonte (`source`), logo da fonte (`source_logo`), categoria, data (`published_at`)
- Filtros no topo: **fonte** (dropdown), **categoria** (dropdown), **busca por título** (input)
- Paginação: botões Anterior / Próxima, mostra `page X de Y`
- Ao clicar em um card → avança pro Step 2

### Step 2 — Configurar Carrossel

Campos:
- **Número de páginas:** slider de 3 a 12 (padrão: 8)
- **Prompt de foco global:** textarea (ex: `"foque nos impactos econômicos para o brasileiro comum"`) — opcional, pode ficar vazio
- **Lista de páginas:** renderiza N linhas onde cada linha tem:
  - Label: `Página 1`, `Página 2`, etc.
  - Toggle ON/OFF — se OFF, aquela página será gerada como slide de texto simples (sem layout de carrossel visual), útil pra capa ou encerramento
- Botão **"Gerar Carrossel"** no rodapé

### Step 3 — Gerando

- Exibe tela de loading com progresso textual:
  1. "Buscando conteúdo completo da matéria…"
  2. "Analisando com IA…"
  3. "Montando slides…"
  4. Redireciona pro editor (`/dashboard/editor/[id]`) com slides prontos

---

## 4. Contrato de Dados

### 4.1 Article (vindo da API)

```ts
interface Article {
  id: string;
  title: string;
  description: string | null;
  content: string | null;       // null nos scrapers atuais — não usar aqui
  url: string;
  image_url: string | null;
  source: string;
  source_logo: string | null;
  category: string | null;
  published_at: string | null;
  scraped_at: string;
}
```

### 4.2 Configuração do Carrossel

```ts
interface CarouselConfig {
  articleId: string;
  totalPages: number;           // 3–12
  focusPrompt: string;          // prompt global, pode ser vazio
  pageToggles: boolean[];       // índice = página (true = carrossel, false = texto puro)
}
```

### 4.3 Payload enviado pra IA

```ts
interface AIPayload {
  articleTitle: string;
  articleContent: string;       // conteúdo completo extraído pelo novo endpoint
  focusPrompt: string;
  totalPages: number;
  pageToggles: boolean[];
}
```

---

## 5. Novos Endpoints

### 5.1 API Express — Conteúdo Completo

**`GET /api/news/:id/content`**

Adicionado em `api/src/routes/content.ts`.

Lógica:
1. Busca artigo no DB pelo `id` (`getArticleById`)
2. Faz `axios.get(article.url)` com User-Agent de browser
3. Usa Cheerio com seletores genéricos pra extrair body do artigo:
   - Tenta em ordem: `article`, `[class*="content"]`, `[class*="body"]`, `[class*="materia"]`, `main p`
   - Remove: `script`, `style`, `nav`, `header`, `footer`, `aside`, `[class*="ad"]`, `[class*="banner"]`
   - Concatena todos os `<p>` resultantes
4. Retorna `{ success: true, data: { id, title, url, content: string } }`
5. Se falhar (site bloqueado, timeout): retorna `{ success: false, error: { code: 'SCRAPE_FAILED', message: '...' } }`

### 5.2 Next.js Route Handler — Proxy

**`GET /app/api/news-content/[id]/route.ts`**

Proxy simples: recebe `id`, chama `http://localhost:3001/api/news/:id/content`, repassa resposta. Evita CORS no cliente.

---

## 6. Geração com IA

Reutiliza a lógica de geração já existente no projeto (Gemini via `@google/genai`).

Prompt enviado à IA:
```
Você é um criador de carrosséis virais para Instagram.

MATÉRIA:
[título + conteúdo completo]

INSTRUÇÕES:
- Crie exatamente [N] slides
- Tom: notícia viral para redes sociais
- Foco adicional: [focusPrompt se não vazio]
- Páginas com toggle OFF devem ser slides de texto corrido (sem bullet points)
- Páginas com toggle ON devem ter: título curto, 2-3 bullets, gancho emocional

Retorne JSON array com objetos: { page: number, isCarousel: boolean, title: string, bullets: string[], text: string }
```

Resposta da IA é parseada e passada pro editor via query params ou session storage (seguindo o padrão já usado no projeto).

---

## 7. npm run dev com API

**Problema atual:** `npm run dev` só sobe Next.js. API Express na porta 3001 precisa subir junto.

**Solução:** `concurrently` no `package.json` raiz.

```json
{
  "scripts": {
    "dev": "concurrently \"next dev\" \"npm run dev:api\"",
    "dev:api": "cd api && npx tsx src/server.ts",
    "build": "next build",
    "start": "node server.js"
  },
  "devDependencies": {
    "concurrently": "^8.2.2",
    "tsx": "^4.0.0"
  }
}
```

- `tsx` substitui `ts-node-esm` — mais rápido, zero config adicional
- `concurrently` exibe logs de ambos com prefixo colorido `[next]` e `[api]`

---

## 8. Arquivos a Criar / Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/app/dashboard/news-pro/page.tsx` | Criar | Wizard completo (3 steps) |
| `src/app/api/news-content/[id]/route.ts` | Criar | Proxy Next.js → API Express |
| `api/src/routes/content.ts` | Criar | Endpoint de scraping de conteúdo completo |
| `api/src/server.ts` | Modificar | Registrar rota `/api/news/:id/content` |
| `package.json` (raiz) | Modificar | Script `dev` com `concurrently`, adicionar `tsx` |
| `src/app/dashboard/layout.tsx` | Modificar | Adicionar "Notícia PRO" no sidebar |

---

## 9. Tratamento de Erros

| Cenário | Comportamento |
|---------|--------------|
| API offline | Step 1 mostra banner "API de notícias offline. Rode `npm run dev`." |
| Nenhuma notícia no DB | Step 1 mostra estado vazio com botão "Atualizar notícias" (chama `POST /api/news/scrape`) |
| Conteúdo não extraído (site bloqueado) | Step 3 usa `description` como fallback + aviso toast "Conteúdo parcial — matéria pode estar incompleta" |
| IA retorna JSON inválido | Exibe erro com botão "Tentar novamente" |
| Timeout na API | Mensagem específica com instrução de verificar conexão |

---

## 10. Fora do Escopo (desta versão)

- Salvar configurações de carrossel por notícia
- Preview dos slides antes de gerar
- Agendamento de publicação
- Histórico de carrosséis gerados por notícia
