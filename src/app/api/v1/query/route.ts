// src/app/api/v1/query/route.ts
import { NextRequest } from 'next/server';
import {
  authenticateAPIRequest,
  logAPIUsage,
  createAPIErrorResponse,
  createAPISuccessResponse,
} from '@/lib/api-middleware';
import { getContext } from '@/lib/context';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '@/lib/db';
import { chats } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

/**
 * POST /api/v1/query
 * Query the knowledge base using natural language
 * 
 * Headers:
 *   X-API-Key: Your API key
 *   X-API-Secret: Your API secret
 * 
 * Request Body:
 * {
 *   "question": "What is the company's vacation policy?",
 *   "chatId": 1,  // Optional, specific chat/document
 *   "topK": 5,  // Optional, default 5
 * }
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Authenticate request
    const auth = await authenticateAPIRequest(request);
    
    if (!auth.authenticated) {
      return createAPIErrorResponse(auth.error || 'Authentication failed', 401);
    }

    // Parse request body
    const body = await request.json();
    const { question, chatId, topK = 5 } = body;

    // Validate input
    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return createAPIErrorResponse('Question is required and must be a non-empty string', 400);
    }

    // Get user's chats
    const userChats = await db
      .select()
      .from(chats)
      .where(eq(chats.userId, auth.apiKeyData!.userId));

    if (userChats.length === 0) {
      return createAPIErrorResponse('No documents found. Please upload a PDF first.', 404);
    }

    // If chatId provided, verify ownership and use it
    let targetChat;
    if (chatId) {
      targetChat = userChats.find(c => c.id === chatId);
      if (!targetChat) {
        return createAPIErrorResponse('Chat not found or access denied', 404);
      }
    } else {
      // Use most recent chat
      targetChat = userChats.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];
    }

    // Get context from PDF
    const fileKey = targetChat.filekey;
    const context = await getContext(question.trim(), fileKey);

    // Generate answer using Gemini
    const model = gemini.getGenerativeModel({ model: "gemini-2.5-flash" });
    const geminiMessages = [
      {
        role: "user",
        parts: [
          {
            text: `Context from PDF "${targetChat.pdfName}":
${context}

---

Question: "${question.trim()}"

Provide a clear, accurate answer based on the context above. If the answer cannot be found in the context, say so.`,
          },
        ],
      },
    ];

    const response = await model.generateContent({
      contents: geminiMessages,
    });

    const answer = response.response.text();

    // Format response
    const responseData = {
      question: question.trim(),
      answer,
      documentName: targetChat.pdfName,
      chatId: targetChat.id,
      processingTimeMs: Date.now() - startTime,
    };

    // Log usage
    await logAPIUsage(
      auth.apiKeyData!.id,
      '/api/v1/query',
      'POST',
      200,
      Date.now() - startTime
    );

    return createAPISuccessResponse(responseData);
  } catch (error) {
    console.error('API query error:', error);
    
    // Log error
    // if (auth?.apiKeyData) {
    //   await logAPIUsage(
    //     auth.apiKeyData.id,
    //     '/api/v1/query',
    //     'POST',
    //     500,
    //     Date.now() - startTime
    //   );
    // }

    return createAPIErrorResponse('Internal server error', 500);
  }
}

// Add OPTIONS for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, X-API-Secret',
    },
  });
}