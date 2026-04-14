import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { env } from '@/shared/config/env'
import { users, userTokens } from '@/features/users/infrastructure/db/user.schema'

const schema = { users, userTokens }

const client = postgres(env.DATABASE_URL, {
  max: env.NODE_ENV === 'production' ? 20 : 5,
  idle_timeout: 30,
})

export const db = drizzle(client, { schema })
export type Database = typeof db
