import { sql } from 'drizzle-orm';
import { pgTable, uuid, text, boolean, timestamp, jsonb, uniqueIndex } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const oauthAccounts = pgTable('oauth_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull(),
  providerId: text('provider_id').notNull(),
}, (table) => [
  uniqueIndex('oauth_provider_id_idx').on(table.provider, table.providerId),
]);

export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  revoked: boolean('revoked').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const templates = pgTable('templates', {
  id: text('id').primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  category: text('category').notNull().default('uncategorized'),  
  version: text('version').notNull().default('v1'), 
  blocks: jsonb('blocks').notNull(),
  isStarter: boolean('is_starter').notNull().default(false),
  isPublic: boolean('is_public').notNull().default(false),
  // Id of the linked template in the owner's Axene Mailer account, if saved there.
  mailerTemplateId: text('mailer_template_id'),
  // Mailer's updated_at for the linked template, exactly as Mailer sent it, at the last open or save.
  // Save to Mailer only overwrites when Mailer still reports this value.
  mailerSyncedAt: text('mailer_synced_at'),
  // When this row was last made equal to the Mailer copy. updated_at later than this means local edits.
  mailerSyncedLocalAt: timestamp('mailer_synced_local_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  // One Templates copy per user and Mailer template; open relies on it instead of a per-process lock.
  uniqueIndex('templates_user_mailer_template_idx')
    .on(table.userId, table.mailerTemplateId)
    .where(sql`${table.mailerTemplateId} IS NOT NULL`),
]);

// One Axene Mailer API key per Templates user, encrypted at rest (AES-256-GCM).
// Only the last four characters are kept in the clear, for display.
export const mailerConnections = pgTable('mailer_connections', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  apiKeyEncrypted: text('api_key_encrypted').notNull(),
  keyHint: text('key_hint').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
