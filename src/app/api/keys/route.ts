// src/app/api/keys/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateAPICredentials, hashSecret } from '@/lib/api-key-utils';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { apiKeys } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * GET - List all API keys for current user
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const keys = await db
      .select({
        id: apiKeys.id,
        keyName: apiKeys.keyName,
        apiKey: apiKeys.apiKey,
        isActive: apiKeys.isActive,
        rateLimit: apiKeys.rateLimit,
        createdAt: apiKeys.createdAt,
        lastUsedAt: apiKeys.lastUsedAt,
        expiresAt: apiKeys.expiresAt,
      })
      .from(apiKeys)
      .where(eq(apiKeys.userId, userId))
      .orderBy(apiKeys.createdAt);

    return NextResponse.json({
      success: true,
      keys,
    });
  } catch (error) {
    console.error('Error fetching API keys:', error);
    return NextResponse.json(
      { error: 'Failed to fetch API keys' },
      { status: 500 }
    );
  }
}

/**
 * POST - Create new API key
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { keyName, rateLimit = 100, expiresInDays } = body;

    if (!keyName || keyName.trim().length === 0) {
      return NextResponse.json(
        { error: 'Key name is required' },
        { status: 400 }
      );
    }

    // Generate credentials
    const { apiKey, apiSecret } = generateAPICredentials();
    const hashedSecret = hashSecret(apiSecret);

    // Calculate expiration
    let expiresAt = null;
    if (expiresInDays && expiresInDays > 0) {
      const expireDate = new Date();
      expireDate.setDate(expireDate.getDate() + expiresInDays);
      expiresAt = expireDate;
    }

    // Insert into database
    await db.insert(apiKeys).values({
      userId,
      keyName: keyName.trim(),
      apiKey,
      apiSecret: hashedSecret,
      rateLimit,
      expiresAt,
    });

    // Return the credentials (ONLY TIME secret is shown)
    return NextResponse.json({
      success: true,
      message: 'API key created successfully. Save the secret securely - it will not be shown again.',
      apiKey,
      apiSecret, // Only returned once!
      keyName,
      rateLimit,
      expiresAt,
    });
  } catch (error) {
    console.error('Error creating API key:', error);
    return NextResponse.json(
      { error: 'Failed to create API key' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete API key
 */
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const keyId = searchParams.get('keyId');

    if (!keyId) {
      return NextResponse.json(
        { error: 'Key ID is required' },
        { status: 400 }
      );
    }

    // Delete key (verify ownership)
    const result = await db
      .delete(apiKeys)
      .where(
        and(
          eq(apiKeys.id, parseInt(keyId)),
          eq(apiKeys.userId, userId)
        )
      )
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'API key deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting API key:', error);
    return NextResponse.json(
      { error: 'Failed to delete API key' },
      { status: 500 }
    );
  }
}