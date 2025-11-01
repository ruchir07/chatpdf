// src/app/api/v1/documents/route.ts
import { NextRequest } from 'next/server';
import {
  authenticateAPIRequest,
  logAPIUsage,
  createAPIErrorResponse,
  createAPISuccessResponse,
} from '@/lib/api-middleware';
import { db } from '@/lib/db';
import { chats } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * GET /api/v1/documents
 * List all documents for authenticated user
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const auth = await authenticateAPIRequest(request);
    
    if (!auth.authenticated) {
      return createAPIErrorResponse(auth.error || 'Authentication failed', 401);
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = (page - 1) * limit;

    // Fetch documents
    const documents = await db
      .select({
        id: chats.id,
        name: chats.pdfName,
        url: chats.pdfUrl,
        fileKey: chats.filekey,
        createdAt: chats.createdAt,
      })
      .from(chats)
      .where(eq(chats.userId, auth.apiKeyData!.userId))
      .limit(limit)
      .offset(offset)
      .orderBy(chats.createdAt);

    // Get total count
    const totalDocs = await db
      .select()
      .from(chats)
      .where(eq(chats.userId, auth.apiKeyData!.userId));

    await logAPIUsage(
      auth.apiKeyData!.id,
      '/api/v1/documents',
      'GET',
      200,
      Date.now() - startTime
    );

    return createAPISuccessResponse({
      documents,
      pagination: {
        page,
        limit,
        total: totalDocs.length,
        totalPages: Math.ceil(totalDocs.length / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return createAPIErrorResponse('Failed to fetch documents', 500);
  }
}

/**
 * DELETE /api/v1/documents
 * Delete a document
 */
export async function DELETE(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const auth = await authenticateAPIRequest(request);
    
    if (!auth.authenticated) {
      return createAPIErrorResponse(auth.error || 'Authentication failed', 401);
    }

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('id');

    if (!documentId) {
      return createAPIErrorResponse('Document ID is required', 400);
    }

    // Delete document (verify ownership)
    const result = await db
      .delete(chats)
      .where(
        and(
          eq(chats.id, parseInt(documentId)),
          eq(chats.userId, auth.apiKeyData!.userId)
        )
      )
      .returning();

    if (result.length === 0) {
      return createAPIErrorResponse('Document not found', 404);
    }

    await logAPIUsage(
      auth.apiKeyData!.id,
      '/api/v1/documents',
      'DELETE',
      200,
      Date.now() - startTime
    );

    return createAPISuccessResponse({
      message: 'Document deleted successfully',
      documentId: result[0].id,
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    return createAPIErrorResponse('Failed to delete document', 500);
  }
}

// Add OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, X-API-Secret',
    },
  });
}