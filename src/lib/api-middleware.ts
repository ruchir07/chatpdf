// src/lib/api-middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { verifySecret } from './api-key-utils';
import { db } from './db';
import { apiKeys, apiUsageLogs } from './db/schema';
import { eq } from 'drizzle-orm';

// In-memory rate limiter (use Redis in production)
const rateLimiter = new RateLimiterMemory({
  points: 100, // Number of requests
  duration: 3600, // Per hour
});

export interface AuthenticatedAPIKey {
  id: number;
  userId: string;
  keyName: string;
  rateLimit: number;
}

/**
 * Authenticate API request
 */
export async function authenticateAPIRequest(
  request: NextRequest
): Promise<{ authenticated: boolean; error?: string; apiKeyData?: AuthenticatedAPIKey }> {
  const apiKey = request.headers.get('X-API-Key');
  const apiSecret = request.headers.get('X-API-Secret');

  if (!apiKey || !apiSecret) {
    return {
      authenticated: false,
      error: 'Missing API credentials. Provide X-API-Key and X-API-Secret headers.',
    };
  }

  try {
    // Fetch API key from database
    const [keyData] = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.apiKey, apiKey));

    if (!keyData) {
      return {
        authenticated: false,
        error: 'Invalid API key',
      };
    }

    if (!keyData.isActive) {
      return {
        authenticated: false,
        error: 'API key is inactive',
      };
    }

    // Check expiration
    if (keyData.expiresAt && new Date(keyData.expiresAt) < new Date()) {
      return {
        authenticated: false,
        error: 'API key has expired',
      };
    }

    // Verify secret
    if (!verifySecret(apiSecret, keyData.apiSecret)) {
      return {
        authenticated: false,
        error: 'Invalid API secret',
      };
    }

    // Check rate limit
    try {
      await rateLimiter.consume(apiKey, 1);
    } catch (rateLimiterRes) {
      return {
        authenticated: false,
        error: 'Rate limit exceeded. Try again later.',
      };
    }

    // Update last used timestamp
    await db
      .update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, keyData.id));

    return {
      authenticated: true,
      apiKeyData: {
        id: keyData.id,
        userId: keyData.userId,
        keyName: keyData.keyName,
        rateLimit: keyData.rateLimit,
      },
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      authenticated: false,
      error: 'Authentication failed',
    };
  }
}

/**
 * Log API usage
 */
export async function logAPIUsage(
  apiKeyId: number,
  endpoint: string,
  method: string,
  statusCode: number,
  responseTimeMs: number
) {
  try {
    await db.insert(apiUsageLogs).values({
      apiKeyId,
      endpoint,
      method,
      statusCode,
      responseTimeMs,
    });
  } catch (error) {
    console.error('Failed to log API usage:', error);
  }
}

/**
 * Create standard API error response
 */
export function createAPIErrorResponse(
  message: string,
  statusCode: number = 400
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
      timestamp: new Date().toISOString(),
    },
    { status: statusCode }
  );
}

/**
 * Create standard API success response
 */
export function createAPISuccessResponse(data: any, statusCode: number = 200): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    },
    { status: statusCode }
  );
}