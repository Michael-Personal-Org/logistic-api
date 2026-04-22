import { env } from '@/shared/config/env'
import rateLimit from 'express-rate-limit'

const isTest = () => process.env.NODE_ENV === 'test' || process.env.VITEST === 'true'

// Rate limit general para toda la api
export const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest() ? 500 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: isTest,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Demasiadas solicitudes. Intenta de nuevo en 15 minutos',
    },
  },
})

// Rate limit estricto para auth
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: isTest,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Demasiadas solicitudes. Intenta de nuevo en 15 minutos',
    },
  },
})

// Rate limit para forget password
export const passwordResetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  skip: isTest,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Demasiadas solicitudes de reset. Intenta de nuevo en 1 hora.',
    },
  },
})
