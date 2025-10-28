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
    console.log("Getting context for chat:", chatId, "query:", lastMessage.content);
    
    const context = await getContext(lastMessage.content, fileKey);
    console.log("Retrieved context length:", context.length);

    // Build conversation history for context (excluding the last message which is being answered now)
    const previousMessages = messages
      .filter((m: Message) => m.role === "user" || m.role === "assistant")
      .slice(0, -1) // All except the last message
      .slice(-4) // Last 4 messages for context
      .map((m: Message) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));
    
    console.log("Previous messages count:", previousMessages.length);
    console.log("Last message content:", lastMessage.content);

    // ✅ Gemini message format with system instruction first, then conversation history
    const geminiMessages = [
      ...previousMessages, // Add conversation history first (older messages)
      {
        role: "user",
        parts: [
          {
            text: `Context from PDF:
${context}

---

Question: "${lastMessage.content}"

Analyze the context and extract the answer. Look for direct quotes, numbers, names, and facts. Be thorough.`,
          },
        ],
      },
    ];

    // ✅ Save user message to DB before streaming starts
    await db.insert(_messages).values({
      chatId,
      content: lastMessage.content,
      role: "user",
    });

    const model = gemini.getGenerativeModel({ model: "gemini-2.5-flash" });
    const response = await model.generateContentStream({
      contents: geminiMessages,
    });

    // ✅ Handle streaming + capture AI response for saving to DB
    let fullResponse = "";

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response.stream) {
            const text = chunk.text();
            fullResponse += text;
            console.log("Streaming:", text.substring(0, 100));
            
            // Format for AI SDK
            const data = encoder.encode(text);
            controller.enqueue(data);
          }
          
          console.log("Stream complete, response length:", fullResponse.length);
          controller.close();

          // Save full AI response after streaming finishes
          await db.insert(_messages).values({
            chatId,
            content: fullResponse,
            role: "system",
          });
        } catch (error) {
          console.error("Streaming error:", error);
          controller.error(error);
        }
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
