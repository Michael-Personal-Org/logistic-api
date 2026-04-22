import { users } from '@/features/users/infrastructure/db/user.schema'
import { boolean, json, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

export const trucks = pgTable('trucks', {
  id: uuid('id').primaryKey().defaultRandom(),
  plateNumber: varchar('plate_number', { length: 20 }).notNull().unique(),
  model: varchar('model', { length: 100 }).notNull(),
  capacity: varchar('capacity', { length: 50 }).notNull(),
  allowedCargoTypes: json('allowed_cargo_types').$type<string[]>().notNull().default(['GENERAL']),
  isAvailable: boolean('is_available').notNull().default(true),
  assignedDriverId: uuid('assigned_driver_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
})

export type Truck = typeof trucks.$inferSelect
export type NewTruck = typeof trucks.$inferInsert
