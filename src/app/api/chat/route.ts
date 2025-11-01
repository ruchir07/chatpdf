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
//     const geminiMessages = [
//       ...previousMessages, // Add conversation history first (older messages)
//       {
//         role: "user",
//         parts: [
//           {
//             text: `Context from PDF:
// ${context}

// ---

// Question: "${lastMessage.content}"

// Analyze the context and extract the answer. Look for direct quotes, numbers, names, and facts. Be thorough.`,
//           },
//         ],
//       },
//     ];
const geminiMessages = [
  ...previousMessages, // Keep conversation history for continuity
  {
    role: "user",
    parts: [
      {
        text: `You are an intelligent document question-answering system specialized in understanding complex PDFs.

Follow these strict instructions carefully:

1. First, analyze the **entire document context semantically** — do not rely only on exact keyword matches.
   - You must consider near and far relationships between ideas, concepts, and terminology.
   - For example, if a question relates to something conceptually described (even if phrased differently), it is considered *in-context*.
2. If the question is **completely unrelated** to the document (no direct or conceptual relation), reply shortly with:
   "There is no mention of such things in the given document."
3. If the question is **partially related**, extract and provide only the relevant portion of the document’s context — do not fabricate or infer beyond it.
4. If the question is **clearly within context**, provide a **precise, factual, and well-structured** answer based strictly on the document.
5. In every answer that has some context, you must also include:
   - The **page number(s)** where the relevant information appears in the document.
   - Use the format: (Found on page X) or (Relevant details on pages X–Y).
6. Never use information or assumptions not found or implied in the document.
7. Keep out-of-context answers short. In-context answers should be informative but concise.

---

Document Context:
${context}

---

Question: "${lastMessage.content}"

Now:
1. Determine if the question is in-context (full or partial) or out-of-context.
2. Respond according to the above rules.
3. If relevant, mention the corresponding page numbers.`,
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
