import { GoogleGenAI } from '@google/genai';

// Initialize Vertex with your Cloud project and location
const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_CLOUD_API_KEY,
});
const model = 'gemini-2.5-flash-image';


// Set up generation config
const generationConfig = {
  maxOutputTokens: 32768,
  temperature: 1,
  topP: 0.95,
  responseModalities: ["TEXT", "IMAGE"],
  imageConfig: {
    aspectRatio: "1:1",
    imageSize: "1K",
    outputMimeType: "image/png",
  },
  safetySettings: [
    {
      category: 'HARM_CATEGORY_HATE_SPEECH',
      threshold: 'OFF',
    },
    {
      category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
      threshold: 'OFF',
    },
    {
      category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
      threshold: 'OFF',
    },
    {
      category: 'HARM_CATEGORY_HARASSMENT',
      threshold: 'OFF',
    }
  ],
};


async function generateContent() {
  const req = {
    model: model,
    contents: [
      {role: 'user', parts: [{text: `Gere uma imagem de um olho realista`}]}
    ],
    config: generationConfig,
  };

  const streamingResp = await ai.models.generateContentStream(req);

  for await (const chunk of streamingResp) {
    if (chunk.text) {
      process.stdout.write(chunk.text);
    } else {
      process.stdout.write(JSON.stringify(chunk) + '\n');
    }
  }
}

generateContent();