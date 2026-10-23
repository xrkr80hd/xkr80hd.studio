import { pgTable, serial, text, timestamp, integer, bigint, jsonb, uuid } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID / local owner UID
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const xstudioOwners = pgTable('xstudio_owners', {
  userId: text('user_id').primaryKey(),
  email: text('email'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const xstudioAssets = pgTable('xstudio_assets', {
  id: uuid('id').defaultRandom().primaryKey(),
  ownerId: text('owner_id').notNull(),
  projectId: text('project_id'),
  kind: text('kind').notNull(),
  name: text('name').notNull(),
  mimeType: text('mime_type').notNull(),
  byteSize: bigint('byte_size', { mode: 'number' }).notNull(),
  storagePath: text('storage_path').notNull(),
  sourceProvider: text('source_provider').default('manual'),
  status: text('status').notNull().default('ready'),
  workflowStatus: text('workflow_status').notNull().default('draft'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const xceProjects = pgTable('xce_projects', {
  id: serial('id').primaryKey(),
  owner: text('owner').notNull(),
  project: text('project').notNull(),
  revision: integer('revision').notNull().default(0),
  manifest: text('manifest').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const xceActiveContext = pgTable('xce_active_context', {
  owner: text('owner').primaryKey(),
  project: text('project'),
  projectOrder: jsonb('project_order'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const xceProjectCodes = pgTable('xce_project_codes', {
  code: text('code').primaryKey(),
  owner: text('owner').notNull(),
  project: text('project').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const xstudioAssetFiles = pgTable('xstudio_asset_files', {
  key: text('key').primaryKey(),
  mimeType: text('mime_type').notNull(),
  size: bigint('size', { mode: 'number' }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

