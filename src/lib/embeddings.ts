import { GoogleGenAI } from "@google/genai";

/**
 * Generates embeddings using either OpenRouter (recommended when Google AI Studio credits expire)
 * or Google Gemini API directly.
 * 
 * Both use model "google/gemini-embedding-001" which generates 768-dimensional vectors,
 * ensuring 100% compatibility with your existing Pinecone index.
 */
export async function getEmbeddings(text: string): Promise<number[]> {
  try {
    const cleanedText = text.replace(/\n/g, " ");

    // 1. If OpenRouter API key is provided, use OpenRouter's OpenAI-compatible endpoint
    const openrouterKey = process.env.OPENROUTER_API_KEY;
    if (openrouterKey) {
      const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openrouterKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://chatpdf.vercel.app",
          "X-Title": "ChatPDF",
        },
        body: JSON.stringify({
          model: "google/gemini-embedding-001",
          input: cleanedText,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData?.error?.message ||
          `OpenRouter embeddings failed (${response.status} ${response.statusText})`
        );
      }

      const json = await response.json();
      const embedding = json.data?.[0]?.embedding;
      if (!embedding || !Array.isArray(embedding)) {
        throw new Error("Invalid embedding format received from OpenRouter");
      }
      return embedding;
    }

    // 2. Fallback to direct Google Gemini API
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!geminiKey) {
      throw new Error(
        "No API key configured for embeddings. Please set OPENROUTER_API_KEY or GEMINI_API_KEY."
      );
    }

    const ai = new GoogleGenAI({ apiKey: geminiKey });
    const response = await ai.models.embedContent({
      model: "gemini-embedding-001",
      contents: cleanedText,
    });

    const embed = response.embeddings?.[0]?.values;
    if (!embed) {
      throw new Error("Failed to generate embeddings from Gemini");
    }

    return embed;
  } catch (err) {
    console.error("Embedding generation error:", err);
    throw err;
  }
}
