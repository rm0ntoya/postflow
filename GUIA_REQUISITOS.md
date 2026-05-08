# Guia de Estilo e Requisitos - NovaCraft AI Carousel

Este documento resume as diretrizes de design, comportamento de IA e requisitos técnicos solicitados para o sistema de criação de carrosséis virais.

## 1. Comportamento das Imagens (IA)
### O Pedido:
"Quero que as imagens geradas tenham contexto direto com o que está sendo falado naquele slide específico... imagens surreais e criativas que chamem a atenção."
### Por que:
Para evitar imagens genéricas de "banco de dados" que não conectam com a mensagem, garantindo que o carrossel seja visualmente impactante e viral.
### O que deve ser feito:
- Os prompts de imagem devem usar **metáforas visuais** baseadas no texto do slide.
- Se o slide fala de "destruir hábitos", a imagem pode mostrar algo sendo fisicamente destruído de forma surrealista.
- **Diversidade de Poses:** Quando usar um rosto de referência, alternar entre close-ups, perfis, ângulos baixos (hero angle) e expressões variadas (foco, surpresa, determinação).

## 2. Design e Tipografia
### O Pedido:
"Texto bem maior e centralizado... títulos nunca estão tendo cores de destaque... usar a fonte Posterman como principal."
### Por que:
Para garantir legibilidade imediata (mesmo em telas pequenas) e criar uma hierarquia visual onde as palavras-chave saltam aos olhos.
### O que deve ser feito:
- **Títulos:** Tamanho grande (124px na capa, ~94px no conteúdo), sempre em **CAIXA ALTA** e centralizados.
- **Destaque:** Converter automaticamente palavras entre `**asteriscos**` para a cor de acento (`accentColor`).
- **Contraste:** Aplicar um degradê preto (`linear-gradient`) de baixo para cima via CSS para garantir leitura sobre qualquer fundo.

## 3. Layout e Templates
### O Pedido:
"Quero que tenha formatações diferentes... quando a página não vai ter foto, aquela página específica tem que ser bem mais detalhada."
### Por que:
Para manter o engajamento do usuário ao longo de todo o carrossel, evitando a monotonia de layouts repetitivos ou páginas "vazias".
### O que deve ser feito:
- **Rotação de Templates:** Alternar entre imagem no topo, imagem no fundo, duas imagens laterais e layouts de texto puro.
- **Slides de Texto:** Em slides sem imagem, usar formas geométricas decorativas (círculos, gradientes) com baixa opacidade para preencher o espaço visual.
- **Prevenção de Sobreposição:** Ajustar dinamicamente a posição vertical (Y) para que títulos longos não cubram o corpo do texto.

## 4. Customização Técnica
### O Pedido:
"Adicionar configuração onde o usuário pode alterar o tamanho da imagem do fundo, e também o espaçamento entre linhas e entre letras."
### Por que:
Para dar controle total ao usuário sobre o ajuste fino do design, permitindo correções manuais em casos de textos específicos.
### O que deve ser feito:
- Implementar controles de `line-height` (Entre Linhas) e `letter-spacing` (Entre Letras) no editor.
- Implementar controle de `background-size` (Cover vs Contain) para os fundos de slide.

---
*Este guia deve ser seguido por qualquer agente de IA trabalhando na evolução deste código.*
