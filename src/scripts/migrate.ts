import { logger } from '@/shared/utils/logger'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

async function runMigrations() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error('DATABASE_URL no está definida')

  logger.info('Ejecutando migraciones...')

  const client = postgres(databaseUrl, { max: 1 })
  const db = drizzle(client)

  try {
    await migrate(db, { migrationsFolder: './src/db/migrations' })
    logger.info('✅ Migraciones aplicadas correctamente')
  } finally {
    await client.end()
  }
}

runMigrations().catch((error) => {
  logger.error('Error en migraciones', { error })
  process.exit(1)
})
