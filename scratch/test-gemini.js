const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = "AIzaSyC3hII1cm1DHG22YYgLrf8tgYFTgCaZVrM";

async function main() {
  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  console.log("Enviando pergunta...");
  const result = await model.generateContent("Qual a capital do Brasil? Responda em uma frase curta.");
  console.log("Resposta:", result.response.text());
}

main().catch((err) => {
  console.error("ERRO:", err.message);
  process.exit(1);
});
