import { env } from '@/shared/config/env'
import cors from 'cors'

const allowedOrigins = [
  env.APP_URL,
  env.CORS_CLIENT_URL,
  env.CORS_ADMIN_URL,
  env.CORS_DRIVER_URL,
].filter(Boolean) as string[]

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)

    if (allowedOrigins.includes(origin)) {
      return callback(null, true)
    }

    callback(new Error(`Origin ${origin} no permitido por CORS`))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  exposedHeaders: ['X-Request-ID'],
})
