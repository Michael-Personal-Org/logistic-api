import type { ISessionPort } from '@/features/users/application/ports/session.port'
import { env } from '@/shared/config/env'
import { logger } from '@/shared/utils/logger'
import IORedis from 'ioredis'

// Singleton - una sola conexion para toda la app
export const redisClient = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    if (times > 3) {
      logger.error('Redis: no se pudo reconectar despues de 3 intentos')
      return null
    }
    return Math.min(times * 200, 1000)
  },
})

redisClient.on('connect', () => logger.info('Redis: conexion establecida'))
redisClient.on('error', (err) => logger.error('Redis: error de conexion', { error: err }))

// Prefijos para organizar las keys en Redis
const KEYS = {
  blacklist: (token: string) => `blacklist:${token}`,
  refreshToken: (userId: string) => `refresh:${userId}`,
}

export class RedisSessionStore implements ISessionPort {
  constructor(private readonly redis: IORedis) {}

  async blacklistToken(token: string, expiresInSeconds: number): Promise<void> {
    await this.redis.set(KEYS.blacklist(token), '1', 'EX', expiresInSeconds)
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const result = await this.redis.get(KEYS.blacklist(token))
    return result !== null
  }

  async saveRefreshToken(userId: string, token: string, expiresInSeconds: number): Promise<void> {
    await this.redis.set(KEYS.refreshToken(userId), token, 'EX', expiresInSeconds)
  }

  async findRefreshToken(userId: string): Promise<string | null> {
    return this.redis.get(KEYS.refreshToken(userId))
  }

  async deleteRefreshToken(userId: string): Promise<void> {
    await this.redis.del(KEYS.refreshToken(userId))
  }
}
