import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({model: "text-embedding-004"})


export async function getEmbeddings(text: string): Promise<number[]> {
  try {
    const result = await model.embedContent(text);
    return result.embedding.values; // Already float[] vector
  } catch (err) {
    console.error("Gemini Embedding Error:", err);
    throw err;
  }
};