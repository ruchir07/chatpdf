import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { loadBlobIntoPinecone } from "@/lib/pinecone";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: "unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    // blob_url: full Vercel Blob public URL
    // file_key: pathname (used as a unique key for Pinecone namespace)
    // file_name: original file name
    const { blob_url, file_key, file_name } = body;

    if (!blob_url || !file_name) {
      return NextResponse.json(
        { error: "Missing blob_url or file_name" },
        { status: 400 }
      );
    }

    await loadBlobIntoPinecone(blob_url);

    const chat = await db
      .insert(chats)
      .values({
        filekey: file_key || blob_url,
        pdfName: file_name,
        pdfUrl: blob_url,
        userId,
      })
      .returning({ insertedId: chats.id });

    return NextResponse.json(
      { chat_id: chat[0].insertedId },
      { status: 200 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Error in create-chat route:", message, err);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
