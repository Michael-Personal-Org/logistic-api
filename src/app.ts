import { userRouter } from '@/features/users/interface/user.router'
import { errorHandlerMiddleware } from '@/shared/middleware/error-handler.middleware'
import { logger } from '@/shared/utils/logger'
import express from 'express'

export function createApp() {
  const app = express()

  // ---- Body Parsers ----
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  // ---- Request Logger ----
  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`)
    next()
  })

  // ---- Health Check ----
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
    })
  })

  // ---- Router ----
  app.use('/api/v1/auth', userRouter)

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
