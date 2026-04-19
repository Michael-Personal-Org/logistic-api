import { redisClient } from '@/features/users/infrastructure/cache/redis.session.store'
import { db } from '@/shared/config/database'
import { env } from '@/shared/config/env'
import { sql } from 'drizzle-orm'

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy'

interface ServiceHealth {
  status: HealthStatus
  latencyMs: number
  error?: string
}

interface HealthReport {
  status: HealthStatus
  version: string
  environment: string
  uptime: number
  timestamp: string
  services: {
    database: ServiceHealth
    redis: ServiceHealth
  }
}

async function checkDatabase(): Promise<ServiceHealth> {
  const start = Date.now()
  try {
    await db.execute(sql`SELECT 1`)
    return { status: 'healthy', latencyMs: Date.now() - start }
  } catch (error) {
    return {
      status: 'unhealthy',
      latencyMs: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

async function checkRedis(): Promise<ServiceHealth> {
  const start = Date.now()
  try {
    await redisClient.ping()
    return { status: 'healthy', latencyMs: Date.now() - start }
  } catch (error) {
    return {
      status: 'unhealthy',
      latencyMs: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export async function getHealthReport(): Promise<HealthReport> {
  const [database, redis] = await Promise.all([checkDatabase(), checkRedis()])

  const allHealthy = database.status === 'healthy' && redis.status === 'healthy'
  const allUnhealthy = database.status === 'unhealthy' && redis.status === 'unhealthy'

  const status: HealthStatus = allHealthy ? 'healthy' : allUnhealthy ? 'unhealthy' : 'degraded'

  return {
    status,
    version: process.env.npm_package_version ?? '1.0.0',
    environment: env.NODE_ENV,
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    services: { database, redis },
  }
}
