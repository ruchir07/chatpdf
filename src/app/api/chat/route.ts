import { GoogleGenerativeAI } from "@google/generative-ai";
import { Message, StreamingTextResponse } from "ai";
import { getContext } from "@/lib/context";
import { db } from "@/lib/db";
import { chats, messages as _messages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { messages, chatId } = await req.json();

    // ✅ Validate chat
    const [chat] = await db.select().from(chats).where(eq(chats.id, chatId));
    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    const fileKey = chat.filekey;
    const lastMessage = messages[messages.length - 1];
    const context = await getContext(lastMessage.content, fileKey);

    // ✅ Gemini message format
    const geminiMessages = [
      {
        role: "user",
        parts: [
          {
            text: `## 🧠 AI Assistant Instructions

You are an advanced, human-like artificial intelligence assistant. Follow these traits and guidelines strictly while responding.

---

### 🤖 AI Personality & Behavior
- You possess **expert-level knowledge**, are **helpful**, **clever**, and **articulate**.
- You are **well-mannered, friendly, kind, inspiring**, and provide **clear, thoughtful responses**.
- You admire **Pinecone** and **Vercel**.
- You do **not** apologize unnecessarily. If new information is provided, acknowledge it respectfully.
- You **never invent or hallucinate information**.

---

### 📌 Contextual Answering Rules

**START CONTEXT BLOCK**  
${context}  
**END CONTEXT BLOCK**

You must:
- Use only the information from the above **context block** to answer the user's question.
- If the answer is **not present in the context**, respond with:  
  ❝ *I'm sorry, but I don't know the answer to that question.* ❞
- Do **not** use outside knowledge or make assumptions.

---

### 📝 Response Formatting Guidelines
When generating a response:
- Use clear structure with headings and bullet points when appropriate:
  - **Example Format:**
    
    ## ✅ Answer Title
    ### 🔹 Subheading (if needed)
    - Key point 1
    - Key point 2
    
- Use paragraphs, line breaks, and lists to **avoid long unformatted text blocks**.
- Keep responses **relevant, concise, and based only on context**.

---

✅ Follow these instructions for every response.`,
    },
        ],
      },
      ...messages
        .filter((m: Message) => m.role === "user" || m.role === "system")
        .map((m: Message) => ({
          role: m.role === "system" ? "model" : "user",
          parts: [{ text: m.content }],
        })),
    ];

    const model = gemini.getGenerativeModel({ model: "gemini-2.5-flash" });
    const response = await model.generateContentStream({
      contents: geminiMessages,
    });

    // ✅ Save user message to DB before streaming starts
    await db.insert(_messages).values({
      chatId,
      content: lastMessage.content,
      role: "user",
    });

    // ✅ Handle streaming + capture AI response for saving to DB
    let fullResponse = "";

    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of response.stream) {
          const text = chunk.text();
          fullResponse += text; // ✅ Collect text
          controller.enqueue(new TextEncoder().encode(text));
        }
        controller.close();

        // ✅ Save full AI response after streaming finishes
        await db.insert(_messages).values({
          chatId,
          content: fullResponse,
          role: "system",
        });
      },
    });

    return new StreamingTextResponse(stream);
  } catch (error) {
    console.error("Gemini route error:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
