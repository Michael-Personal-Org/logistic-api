import { boolean, pgEnum, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

// --- Enums ---
export const userStatusEnum = pgEnum('user_status', ['pending', 'active', 'suspended'])

export const tokenTypeEnum = pgEnum('token_type', ['activation', 'password_reset'])

export const userRoleEnum = pgEnum('user_role', [
  'ADMIN',
  'OPERATOR',
  'DRIVER',
  'ORG_ADMIN',
  'ORG_ORDER',
  'ORG_TRACK',
])

// --- Tabla principal ---
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  jobTitle: varchar('job_title', { length: 100 }),
  organizationId: uuid('organization_id'),
  mustChangePassword: boolean('must_change_password').notNull().default(false),
  status: userStatusEnum('status').notNull().default('pending'),
  role: userRoleEnum('role').notNull().default('ORG_ADMIN'),
  twoFactorSecret: varchar('two_factor_secret', { length: 255 }),
  twoFactorEnabled: boolean('two_factor_enabled').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
})

// --- Tokens de un solo uso ---
export const userTokens = pgTable('user_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: varchar('token', { length: 512 }).notNull().unique(),
  type: tokenTypeEnum('type').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// --- Tipos inferidos para usar en el dominio ---
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type UserToken = typeof userTokens.$inferSelect
export type NewUserToken = typeof userTokens.$inferInsert
