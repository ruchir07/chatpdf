import { GoogleGenAI } from "@google/genai";

const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in environment variables");
  }
  return new GoogleGenAI({ apiKey });
};

export async function getEmbeddings(text: string): Promise<number[]> {
  try {
    const ai = getAiClient();
    const response = await ai.models.embedContent({
      model: "gemini-embedding-001",
      contents: text,
    });

    // SAFE extraction
    const embed = response.embeddings?.[0]?.values;
    if (!embed) {
      throw new Error("Failed to generate embeddings");
    }

    return embed;
  } catch (err) {
    console.error("Gemini Embedding Error:", err);
    throw err;
  }
}