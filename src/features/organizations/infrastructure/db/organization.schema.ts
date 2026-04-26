import { users } from '@/features/users/infrastructure/db/user.schema'
import { relations } from 'drizzle-orm'
import { boolean, pgEnum, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

export const organizationStatusEnum = pgEnum('organization_status', [
  'pending',
  'active',
  'suspended',
])

export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  rnc: varchar('rnc', { length: 20 }).unique(),
  phone: varchar('phone', { length: 50 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  address: varchar('address', { length: 500 }).notNull(),
  industry: varchar('industry', { length: 100 }),
  status: organizationStatusEnum('status').notNull().default('pending'),
  isApproved: boolean('is_approved').notNull().default(false),
  approvedAt: timestamp('approved_at'),
  approvedBy: uuid('approved_by'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const invitationStatusEnum = pgEnum('invitation_status', ['pending', 'accepted', 'expired'])

export const organizationInvitations = pgTable('organization_invitations', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id),
  email: varchar('email', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  token: uuid('token').notNull().defaultRandom().unique(),
  status: invitationStatusEnum('status').notNull().default('pending'),
  invitedBy: uuid('invited_by')
    .notNull()
    .references(() => users.id),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const operatorOrganizations = pgTable('operator_organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  operatorId: uuid('operator_id')
    .notNull()
    .references(() => users.id),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id),
  assignedAt: timestamp('assigned_at').notNull().defaultNow(),
})

export const organizationsRelations = relations(organizations, ({ many, one }) => ({
  users: many(users),
  invitations: many(organizationInvitations),
  approvedByUser: one(users, {
    fields: [organizations.approvedBy],
    references: [users.id],
  }),
}))

export const operatorOrganizationsRelations = relations(operatorOrganizations, ({ one }) => ({
  operator: one(users, {
    fields: [operatorOrganizations.operatorId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [operatorOrganizations.organizationId],
    references: [organizations.id],
  }),
}))
