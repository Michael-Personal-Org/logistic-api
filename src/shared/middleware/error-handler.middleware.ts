import type { Request, Response, NextFunction } from 'express'
import { AppError } from '@/shared/errors/app.error'
import { env } from '@/shared/config/env'
import { logger } from '@/shared/utils/logger'
import { ResponseUtils } from '@/shared/utils/response.utils'

export function errorHandlerMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json(ResponseUtils.error(err.code, err.message))
    return
  }

  logger.error('Unhandled error', { error: err })

  const message =
    env.NODE_ENV === 'production'
      ? 'Ocurrió un error interno'
      : err instanceof Error
        ? err.message
        : 'Error desconocido'

  res.status(500).json(ResponseUtils.error('INTERNAL_ERROR', message))
}
