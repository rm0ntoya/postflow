import { GoogleGenAI } from "@google/genai";

// Passe sua chave aqui ou via variavel de ambiente GEMINI_API_KEY
const apiKey = process.env.GEMINI_API_KEY || "AIzaSyA5LESFALE3FDhtifCgso8KimdlKYuVBh0";

if (apiKey === "SUA_CHAVE_AQUI") {
  console.error("⚠️ ERRO: Por favor, substitua SUA_CHAVE_AQUI no arquivo test-image.mjs pela sua chave da API do Gemini.");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

async function generateTestImage() {
  console.log("Iniciando geração de imagem...");
  try {
    const response = await ai.models.generateContentStream({
      model: "gemini-3-pro-image-preview",
      config: {
        imageConfig: {
          aspectRatio: "4:5",
          imageSize: "1K",
        },
        responseModalities: ["IMAGE", "TEXT"],
      },
      contents: [{ role: "user", parts: [{ text: "A futuristic cyberpunk city at night with neon lights" }] }],
    });

    for await (const chunk of response) {
      const parts = chunk.candidates?.[0]?.content?.parts;
      if (parts) {
        for (const part of parts) {
          if (part.inlineData?.data) {
            console.log("✅ Imagem gerada com sucesso!");
            console.log("MimeType:", part.inlineData.mimeType);
            console.log("Base64 (primeiros 100 caracteres):", part.inlineData.data.substring(0, 100) + "...");
            return;
          }
        }
      }
    }
    console.log("⚠️ Stream finalizado sem retornar imagem.");
  } catch (err) {
    console.error("❌ Erro ao gerar imagem:", err);
  }
}

generateTestImage();
