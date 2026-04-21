import { users } from '@/features/users/infrastructure/db/user.schema'
import { boolean, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

export const clientProfiles = pgTable('client_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  companyName: varchar('company_name', { length: 255 }).notNull(),
  rnc: varchar('rnc', { length: 20 }).unique(),
  isApproved: boolean('is_approved').default(false).notNull(),
  approvedBy: uuid('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at'),
  emergencyContact: varchar('emergency_contact', { length: 255 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const driverProfiles = pgTable('driver_profile', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  vehiclePlate: varchar('vehicule_plate', { length: 20 }).notNull(),
  licenseNumber: varchar('license_number', { length: 20 }).notNull(),
  licenseType: varchar('license_type', { length: 10 }).notNull().default('B'),
  isAvailable: boolean('is_available').default(false).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// Tipos inferidos
export type ClientProfile = typeof clientProfiles.$inferSelect
export type NewClientProfile = typeof clientProfiles.$inferInsert
export type DriverProfile = typeof driverProfiles.$inferSelect
export type NewDriverProfile = typeof driverProfiles.$inferInsert
