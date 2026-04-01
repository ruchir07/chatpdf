import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY!,
});

export async function getEmbeddings(text: string): Promise<number[]> {
  try {
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