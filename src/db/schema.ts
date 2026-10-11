import { pgTable, text, timestamp, integer, uuid, primaryKey, boolean, jsonb, doublePrecision, uniqueIndex } from 'drizzle-orm/pg-core';
import { v7 as uuidv7 } from 'uuid';
import type { PlayBeat } from '@/lib/validators/play';

/**
 * Users table per PRD §7.1
 * Authentication, profile, and theme preference
 */
export const users = pgTable('users', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('email_verified_at', { mode: 'date' }),
  passwordHash: text('password_hash'),
  image: text('image'),
  themePref: text('theme_pref').default('system').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

/**
 * OAuth accounts connected to a user per PRD §7.1 / Auth.js adapter
 */
export const accounts = pgTable(
  'accounts',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;

/**
 * Sessions table for database session strategy per Auth.js adapter
 */
export const sessions = pgTable('sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

/**
 * Verification tokens for passwordless/OAuth verification
 */
export const verificationTokens = pgTable(
  'verification_tokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({
      columns: [vt.identifier, vt.token],
    }),
  })
);

export type VerificationToken = typeof verificationTokens.$inferSelect;

/**
 * Email OTP table per PRD §7.1
 * Stores argon2id hashed codes with 10-minute expiry and 5-attempt limit
 */
export const emailOtps = pgTable('email_otps', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  codeHash: text('code_hash').notNull(),
  purpose: text('purpose').notNull(), // 'verify_email' | 'reset_password'
  expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
  attempts: integer('attempts').default(0).notNull(),
  consumedAt: timestamp('consumed_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

export type EmailOtp = typeof emailOtps.$inferSelect;
export type NewEmailOtp = typeof emailOtps.$inferInsert;

/**
 * Projects table per PRD §7.1, §8.2
 * Novel workspaces owned by a user
 */
export const projects = pgTable('projects', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  ownerId: uuid('owner_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  logline: text('logline'),
  genre: text('genre'),
  coverImageUrl: text('cover_image_url'),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

/**
 * Acts table per PRD §7.1
 * Default acts seeded upon project creation (Act I, II, III)
 */
export const acts = pgTable('acts', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  orderIndex: integer('order_index').notNull(),
  color: text('color').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export type Act = typeof acts.$inferSelect;
export type NewAct = typeof acts.$inferInsert;

/**
 * Story Maps table per PRD §7.4
 * Multiple story maps per project; primary map auto-seeded on project creation
 */
export const storyMaps = pgTable('story_maps', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  name: text('name').default('Main Story Map').notNull(),
  kind: text('kind').default('story').notNull(), // 'story' | 'character' | 'thread'
  isDefault: boolean('is_default').default(true).notNull(),
  viewport: jsonb('viewport').$type<{ x: number; y: number; zoom: number } | null>(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export type StoryMap = typeof storyMaps.$inferSelect;
export type NewStoryMap = typeof storyMaps.$inferInsert;

/**
 * Locations table per PRD §7.1
 * Story settings and locations
 */
export const locations = pgTable('locations', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export type Location = typeof locations.$inferSelect;
export type NewLocation = typeof locations.$inferInsert;

/**
 * Chapters table per PRD §7.1, §7.4
 * Book chapters belonging to a project and story map
 */
export const chapters = pgTable('chapters', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  mapId: uuid('map_id').references(() => storyMaps.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  orderIndex: integer('order_index').default(0).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export type Chapter = typeof chapters.$inferSelect;
export type NewChapter = typeof chapters.$inferInsert;

/**
 * Threads table per PRD §7.1
 * Plot and thematic story threads with color coding
 */
export const threads = pgTable('threads', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  color: text('color').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export type Thread = typeof threads.$inferSelect;
export type NewThread = typeof threads.$inferInsert;

/**
 * Scenes table per PRD §7.3
 * Atomic story unit; seed stubs created via quick-add input in Phase 2
 */
export const scenes = pgTable('scenes', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  status: text('status').default('seed').notNull(), // 'seed' | 'sketched' | 'planned' | 'played' | 'drafted'
  description: text('description'),
  sceneType: text('scene_type'), // 'setup' | 'inciting' | 'escalation' | 'reveal' | etc.
  purpose: text('purpose'),
  locationId: uuid('location_id').references(() => locations.id, { onDelete: 'set null' }),
  chapterId: uuid('chapter_id').references(() => chapters.id, { onDelete: 'set null' }),
  timeLabel: text('time_label'),
  actId: uuid('act_id').references(() => acts.id, { onDelete: 'set null' }),
  color: text('color'),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export type Scene = typeof scenes.$inferSelect;
export type NewScene = typeof scenes.$inferInsert;

/**
 * Characters table per PRD §7.2, §8.3
 * Novel characters owned by a project
 */
export const characters = pgTable('characters', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  imageUrl: text('image_url'),
  role: text('role').default('supporting').notNull(), // 'protagonist' | 'love_interest' | 'antagonist' | 'villain' | 'supporting' | 'mentor' | 'custom'
  roleCustom: text('role_custom'),
  description: text('description'),
  personality: text('personality'),
  goals: text('goals'),
  fears: text('fears'),
  background: text('background'),
  arc: text('arc'),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export type Character = typeof characters.$inferSelect;
export type NewCharacter = typeof characters.$inferInsert;

/**
 * Character Custom Fields table per PRD §7.2
 * User-defined attributes such as Clan, Powers, Occupation with reorder support
 */
export const characterCustomFields = pgTable('character_custom_fields', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  characterId: uuid('character_id')
    .notNull()
    .references(() => characters.id, { onDelete: 'cascade' }),
  key: text('key').notNull(),
  value: text('value').default('').notNull(),
  orderIndex: integer('order_index').default(0).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export type CharacterCustomField = typeof characterCustomFields.$inferSelect;
export type NewCharacterCustomField = typeof characterCustomFields.$inferInsert;

/**
 * Character Relationships table per PRD §7.2
 * Connections between characters with directed/undirected and optional scene anchors
 */
export const characterRelationships = pgTable('character_relationships', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  sourceCharacterId: uuid('source_character_id')
    .notNull()
    .references(() => characters.id, { onDelete: 'cascade' }),
  targetCharacterId: uuid('target_character_id')
    .notNull()
    .references(() => characters.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // e.g. 'love', 'distrust', 'friendship', 'betrayal', etc.
  description: text('description'),
  isDirected: boolean('is_directed').default(true).notNull(),
  startSceneId: uuid('start_scene_id').references(() => scenes.id, { onDelete: 'set null' }),
  endSceneId: uuid('end_scene_id').references(() => scenes.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export type CharacterRelationship = typeof characterRelationships.$inferSelect;
export type NewCharacterRelationship = typeof characterRelationships.$inferInsert;

/**
 * Scene Characters join table per PRD §7.3
 * Associates characters with a scene with an optional role_in_scene
 */
export const sceneCharacters = pgTable(
  'scene_characters',
  {
    sceneId: uuid('scene_id')
      .notNull()
      .references(() => scenes.id, { onDelete: 'cascade' }),
    characterId: uuid('character_id')
      .notNull()
      .references(() => characters.id, { onDelete: 'cascade' }),
    roleInScene: text('role_in_scene'),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    compoundKey: primaryKey({
      columns: [table.sceneId, table.characterId],
    }),
  })
);

export type SceneCharacter = typeof sceneCharacters.$inferSelect;
export type NewSceneCharacter = typeof sceneCharacters.$inferInsert;

/**
 * Scene Threads join table per PRD §7.3
 * Associates story threads with a scene
 */
export const sceneThreads = pgTable(
  'scene_threads',
  {
    sceneId: uuid('scene_id')
      .notNull()
      .references(() => scenes.id, { onDelete: 'cascade' }),
    threadId: uuid('thread_id')
      .notNull()
      .references(() => threads.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    compoundKey: primaryKey({
      columns: [table.sceneId, table.threadId],
    }),
  })
);

export type SceneThread = typeof sceneThreads.$inferSelect;
export type NewSceneThread = typeof sceneThreads.$inferInsert;

/**
 * Map Groups table per PRD §7.4
 * Visual grouping boxes on the canvas
 */
export const mapGroups = pgTable('map_groups', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  mapId: uuid('map_id')
    .notNull()
    .references(() => storyMaps.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  color: text('color').default('slate').notNull(),
  x: doublePrecision('x').default(0).notNull(),
  y: doublePrecision('y').default(0).notNull(),
  width: doublePrecision('width').default(400).notNull(),
  height: doublePrecision('height').default(300).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export type MapGroup = typeof mapGroups.$inferSelect;
export type NewMapGroup = typeof mapGroups.$inferInsert;

/**
 * Map Nodes table per PRD §7.4
 * Persistent visual coordinates, sequence index, and group/chapter assignments
 */
export const mapNodes = pgTable(
  'map_nodes',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    mapId: uuid('map_id')
      .notNull()
      .references(() => storyMaps.id, { onDelete: 'cascade' }),
    sceneId: uuid('scene_id').references(() => scenes.id, { onDelete: 'cascade' }),
    characterId: uuid('character_id').references(() => characters.id, { onDelete: 'cascade' }),
    x: doublePrecision('x').default(0).notNull(),
    y: doublePrecision('y').default(0).notNull(),
    width: doublePrecision('width'),
    height: doublePrecision('height'),
    groupId: uuid('group_id').references(() => mapGroups.id, { onDelete: 'set null' }),
    chapterId: uuid('chapter_id').references(() => chapters.id, { onDelete: 'set null' }),
    sequenceIndex: integer('sequence_index'),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    uniqueMapScene: uniqueIndex('map_nodes_map_scene_idx').on(table.mapId, table.sceneId),
  })
);

export type MapNode = typeof mapNodes.$inferSelect;
export type NewMapNode = typeof mapNodes.$inferInsert;

/**
 * Map Edges table per PRD §7.4
 * Main path sequence edges and narrative annotation edges
 */
export const mapEdges = pgTable('map_edges', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  mapId: uuid('map_id')
    .notNull()
    .references(() => storyMaps.id, { onDelete: 'cascade' }),
  sourceNodeId: uuid('source_node_id')
    .notNull()
    .references(() => mapNodes.id, { onDelete: 'cascade' }),
  targetNodeId: uuid('target_node_id')
    .notNull()
    .references(() => mapNodes.id, { onDelete: 'cascade' }),
  edgeType: text('edge_type').default('sequence').notNull(), // 'sequence' | 'branch' | 'cause' | 'setup_payoff'
  label: text('label'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export type MapEdge = typeof mapEdges.$inferSelect;
export type NewMapEdge = typeof mapEdges.$inferInsert;

/**
 * Scene Plays table per PRD §7.3, §8.6
 * Scripted beat-based screenplay editor content for scenes
 */
export const scenePlays = pgTable('scene_plays', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  sceneId: uuid('scene_id')
    .notNull()
    .unique()
    .references(() => scenes.id, { onDelete: 'cascade' }),
  content: jsonb('content').$type<PlayBeat[]>().default([]).notNull(),
  purposeNote: text('purpose_note'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export type ScenePlay = typeof scenePlays.$inferSelect;
export type NewScenePlay = typeof scenePlays.$inferInsert;


