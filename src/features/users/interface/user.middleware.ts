import { userInfo } from 'node:os'
import {
  RedisSessionStore,
  redisClient,
} from '@/features/users/infrastructure/cache/redis.session.store'
import type { Role } from '@/shared/constants/roles'
import { UnauthorizedError } from '@/shared/errors/app.error'
import { ValidationError } from '@/shared/errors/app.error'
import { ForbiddenError } from '@/shared/errors/app.error'
import { jwtUtils } from '@/shared/utils/jwt.utils'
import type { NextFunction, Request, Response } from 'express'
import type { z } from 'zod'

const sessionStore = new RedisSessionStore(redisClient)

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
        role: Role
      }
    }
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const userRole = req.user?.role

    if (!userRole || !roles.includes(userRole)) {
      next(new ForbiddenError('No tienes permisos para realizar esta acción'))
      return
    }
    next()
  }
}

export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // 1. extraer token del header authorization: bearer <token>
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Token no proporcionado')
    }

    const token = authHeader.split(' ')[1]
    if (!token) {
      throw new UnauthorizedError('Token no proporcionado')
    }

    // 2. verificar que no este en la blacklist
    const isBlacklisted = await sessionStore.isTokenBlacklisted(token)
    if (isBlacklisted) {
      throw new UnauthorizedError('Token invalido')
    }

    // 3. verificar firma y expiracion del jwt
    const payload = jwtUtils.verifyAccessToken(token)

    // 4. adjuntar usuario al request para uso en controllers
    req.user = { id: payload.sub, email: payload.email, role: payload.role }

    next()
  } catch (error) {
    next(error)
  }
}

// middleware de validacion de dtos con zod
export function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      const messages = result.error.issues
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join(', ')
      next(new ValidationError(messages))
      return
    }
    req.body = result.data
    next()
  }
}
