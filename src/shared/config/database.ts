import { auditLogs } from '@/features/audit/infrastructure/db/audit-log.schema'
import {
  clientProfiles,
  driverProfiles,
} from '@/features/profiles/infrastructure/db/profile.schema'
import { userTokens, users } from '@/features/users/infrastructure/db/user.schema'
import { env } from '@/shared/config/env'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

const schema = { users, userTokens, clientProfiles, driverProfiles, auditLogs }

const client = postgres(env.DATABASE_URL, {
  max: env.NODE_ENV === 'production' ? 20 : 5,
  idle_timeout: 30,
  connect_timeout: 10,
  max_lifetime: 1800,
})

export const db = drizzle(client, { schema })
export type Database = typeof db
