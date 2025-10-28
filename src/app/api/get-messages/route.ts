import { db } from "@/lib/db";
import { messages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const POST = async(req: Request) => {
    const {chatId} = await req.json();
    const _messages = await db.select().from(messages).where(eq(messages.chatId,chatId));
    
    // Transform messages to match the format expected by useChat
    const transformedMessages = _messages.map(msg => ({
        id: msg.id.toString(),
        role: msg.role === 'system' ? 'assistant' : msg.role,
        content: msg.content
    }));
    
    return NextResponse.json(transformedMessages);
}