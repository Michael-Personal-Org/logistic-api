import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

config()

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error('DATABASE_URL no está definida')
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/features/users/infrastructure/db/user.schema.ts',
  out: './src/db/migrations',
  dbCredentials: {
    url: databaseUrl,
  },
})
