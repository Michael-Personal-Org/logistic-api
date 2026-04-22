import { redisClient } from '@/features/users/infrastructure/cache/redis.session.store'
import { db } from '@/shared/config/database'
import { env } from '@/shared/config/env'
import { logger } from '@/shared/utils/logger'
import { sql } from 'drizzle-orm'
import { createApp } from './app'

async function bootstrap() {
  // ---- Verificar conexiones antes de aceptar trafico ----
  try {
    await db.execute(sql`SELECT 1`)
    logger.info('PostgreSQL: conexion verificada')
  } catch (error) {
    logger.error('PostgreSQL: fallo la conexion', { error })
    process.exit(1)
  }

  try {
    await redisClient.ping()
    logger.info('Redis: conexion verificada')
  } catch (error) {
    logger.error('Redis: fallo la conexion', { error })
    process.exit(1)
  }

  // ---- Levantar servidor ----
  const app = createApp()

  const server = app.listen(env.PORT, () => {
    logger.info(`Servidor corriendo en puerto ${env.PORT} [${env.NODE_ENV}]`)
  })

  // ---- Graceful Shutdown ----
  async function shutdown(signal: string) {
    logger.info(`${signal} recibido - iniciando graceful shutdown`)

    server.close(async () => {
      try {
        await redisClient.quit()
        logger.info('Redis: conexin cerrada')

        logger.info('Servidor cerrado correctamente')
        process.exit(0)
      } catch (error) {
        logger.error('Error durante shutdown', { error })
        process.exit(1)
      }
    })
    setTimeout(() => {
      logger.error('Shutdown forzado por timeout')
      process.exit(1)
    }, 10_000)
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
}

bootstrap()
