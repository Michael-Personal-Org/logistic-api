import { profileRouter } from '@/features/profiles/interface/profile.router'
import { adminRouter } from '@/features/users/interface/admin.router'
import { userRouter } from '@/features/users/interface/user.router'
import { healthRouter } from '@/shared/health/health.router'
import { corsMiddleware } from '@/shared/middleware/cors-middleware'
import { errorHandlerMiddleware } from '@/shared/middleware/error-handler.middleware'
import {
  authRateLimit,
  globalRateLimit,
  passwordResetRateLimit,
} from '@/shared/middleware/rate-limit-middleware'
import { requestIdMiddleware, securityMiddleware } from '@/shared/middleware/security-middleare'
import { logger } from '@/shared/utils/logger'
import express from 'express'

export function createApp() {
  const app = express()

  // ---- Security ----
  app.use(securityMiddleware)
  app.use(corsMiddleware)
  app.use(requestIdMiddleware)

  // ---- Body Parsers ----
  app.use(express.json({ limit: '10mb' }))
  app.use(express.urlencoded({ extended: true }))

  // ---- Rate Limiting Global ----
  app.use('/api/', globalRateLimit)

  // ---- Request Logger ----
  app.use((req, _res, next) => {
    const requestId = req.headers['x-request-id'] as string
    logger.info(`${req.method} ${req.path}`, { requestId })
    next()
  })

  // ---- Health Check ----
  app.use('/health', healthRouter)

  // ---- Routes ----
  // ---- Rate limits especificos por endpoint sensible
  app.use('/api/v1/auth/login', authRateLimit)
  app.use('/api/v1/auth/register', authRateLimit)
  app.use('/api/v1/auth/forgot-password', passwordResetRateLimit)

  app.use('/api/v1/auth', userRouter)
  app.use('/api/v1/admin', adminRouter)
  app.use('/api/v1/profiles', profileRouter)

  // ---- 404 Handler ----
  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Ruta no encontrada',
      },
    })
  })

  // ---- Global Error Handler ----
  app.use(errorHandlerMiddleware)

  return app
}
