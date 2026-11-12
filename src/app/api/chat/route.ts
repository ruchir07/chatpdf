import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { Message, OpenAIStream, StreamingTextResponse } from "ai";
import { getContext } from "@/lib/context";
import { db } from "@/lib/db";
import { chats, messages as _messages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { messages, chatId } = await req.json();

    // 1. Validate chat
    const [chat] = await db.select().from(chats).where(eq(chats.id, chatId));
    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    const fileKey = chat.filekey;
    const lastMessage = messages[messages.length - 1];
    
    // 2. Fetch semantic context from Pinecone using embeddings
    const context = await getContext(lastMessage.content, fileKey);

    // 3. Save user message to DB before streaming starts
    await db.insert(_messages).values({
      chatId,
      content: lastMessage.content,
      role: "user",
    });

    const systemPrompt = `You are an intelligent document question-answering system specialized in understanding complex PDFs.

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
${context}`;

    // PATH A: Use OpenRouter if OPENROUTER_API_KEY is configured
    const openrouterKey = process.env.OPENROUTER_API_KEY;
    if (openrouterKey) {
      const openai = new OpenAI({
        apiKey: openrouterKey,
        baseURL: "https://openrouter.ai/api/v1",
        defaultHeaders: {
          "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://chatpdf.vercel.app",
          "X-Title": "ChatPDF",
        },
      });

      const conversationHistory = messages
        .filter((m: Message) => m.role === "user" || m.role === "assistant" || m.role === "system")
        .slice(0, -1)
        .slice(-6)
        .map((m: Message) => ({
          role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
          content: m.content,
        }));

      const openAiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        {
          role: "system",
          content: systemPrompt,
        },
        ...conversationHistory,
        {
          role: "user",
          content: lastMessage.content,
        },
      ];

      const response = await openai.chat.completions.create({
        model: "google/gemini-2.5-flash",
        stream: true,
        messages: openAiMessages,
      });

      const stream = OpenAIStream(response, {
        async onCompletion(completion) {
          try {
            await db.insert(_messages).values({
              chatId,
              content: completion,
              role: "system",
            });
          } catch (dbErr) {
            console.error("Failed to save assistant message to DB:", dbErr);
          }
        },
      });

      return new StreamingTextResponse(stream);
    }

    // PATH B: Fallback to direct Google Gemini API if OPENROUTER_API_KEY is not set
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!geminiKey) {
      return NextResponse.json(
        { error: "No AI API key found. Please configure OPENROUTER_API_KEY or GEMINI_API_KEY." },
        { status: 500 }
      );
    }

    const gemini = new GoogleGenerativeAI(geminiKey);
    const previousMessages = messages
      .filter((m: Message) => m.role === "user" || m.role === "assistant")
      .slice(0, -1)
      .slice(-4)
      .map((m: Message) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

    const geminiMessages = [
      ...previousMessages,
      {
        role: "user",
        parts: [
          {
            text: `${systemPrompt}

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

    const model = gemini.getGenerativeModel({ model: "gemini-2.5-flash" });
    const response = await model.generateContentStream({
      contents: geminiMessages,
    });

    let fullResponse = "";
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response.stream) {
            const text = chunk.text();
            fullResponse += text;
            const data = encoder.encode(text);
            controller.enqueue(data);
          }
          controller.close();

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
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Chat route error:", errorMsg, error);
    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    );
  }
}
