import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

async function runMigrations() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error('DATABASE_URL no está definida')

  console.log('Ejecutando migraciones...')

  const client = postgres(databaseUrl, { max: 1 })
  const db = drizzle(client)

  try {
    await migrate(db, { migrationsFolder: './src/db/migrations' })
    console.log('✅ Migraciones aplicadas correctamente')
  } finally {
    await client.end()
  }
}

runMigrations().catch((error) => {
  console.error('Error en migraciones:', error)
  process.exit(1)
})
