// src/lib/api-key-utils.ts
import { nanoid } from 'nanoid';
import crypto from 'crypto';

export interface APIKey {
  id: number;
  userId: string;
  keyName: string;
  apiKey: string;
  apiSecret: string;
  isActive: boolean;
  rateLimit: number;
  createdAt: Date;
  lastUsedAt?: Date | null;
  expiresAt?: Date | null;
}

/**
 * Generate a new API key and secret
 */
export function generateAPICredentials() {
  const apiKey = `kg_${nanoid(32)}`; // kg = knowledge graph
  const apiSecret = nanoid(48);
  
  return { apiKey, apiSecret };
}

/**
 * Hash API secret for storage (never store plain secrets)
 */
export function hashSecret(secret: string): string {
  return crypto
    .createHash('sha256')
    .update(secret)
    .digest('hex');
}

/**
 * Verify API key and secret
 */
export function verifySecret(providedSecret: string, hashedSecret: string): boolean {
  const hashedProvided = hashSecret(providedSecret);
  return crypto.timingSafeEqual(
    Buffer.from(hashedProvided),
    Buffer.from(hashedSecret)
  );
}

/**
 * Mask API key for display (show first 8 and last 4 characters)
 */
export function maskAPIKey(apiKey: string): string {
  if (apiKey.length < 12) return apiKey;
  const prefix = apiKey.substring(0, 8);
  const suffix = apiKey.substring(apiKey.length - 4);
  return `${prefix}...${suffix}`;
}