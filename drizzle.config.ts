import { defineConfig } from 'drizzle-kit'
import { config } from 'dotenv'

config() // carga el .env antes de leer process.env

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/features/users/infrastructure/db/user.schema.ts',
  out: './src/db/migrations',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
