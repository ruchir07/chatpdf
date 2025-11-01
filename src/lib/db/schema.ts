// src/lib/db/schema.ts
import { pgTable, serial, text, timestamp, varchar, integer, pgEnum, boolean } from 'drizzle-orm/pg-core'

export const userSystemEnum = pgEnum("user_system_enum", ['system', 'user']);

export const chats = pgTable('chats', {
    id: serial('id').primaryKey(),
    pdfName: text('pdf_name').notNull(),
    pdfUrl: text('pdf_url').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    userId: varchar('user_id', { length: 256 }).notNull(),
    filekey: text('file_key').notNull(),
});

export type DrizzleChat = typeof chats.$inferSelect;

export const messages = pgTable('messages', {
    id: serial('id').primaryKey(),
    chatId: integer('chat_id').references(() => chats.id).notNull(),
    content: text('content').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    role: userSystemEnum('role').notNull().default('user')
})

// ============= NEW API TABLES =============

export const apiKeys = pgTable('api_keys', {
    id: serial('id').primaryKey(),
    userId: varchar('user_id', { length: 256 }).notNull(),
    keyName: text('key_name').notNull(),
    apiKey: text('api_key').notNull().unique(),
    apiSecret: text('api_secret').notNull(), // Hashed
    isActive: boolean('is_active').notNull().default(true),
    rateLimit: integer('rate_limit').notNull().default(100),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    lastUsedAt: timestamp('last_used_at'),
    expiresAt: timestamp('expires_at'),
});

export type DrizzleAPIKey = typeof apiKeys.$inferSelect;

export const apiUsageLogs = pgTable('api_usage_logs', {
    id: serial('id').primaryKey(),
    apiKeyId: integer('api_key_id').references(() => apiKeys.id).notNull(),
    endpoint: text('endpoint').notNull(),
    method: text('method').notNull(),
    statusCode: integer('status_code').notNull(),
    responseTimeMs: integer('response_time_ms').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type DrizzleAPIUsageLog = typeof apiUsageLogs.$inferSelect;