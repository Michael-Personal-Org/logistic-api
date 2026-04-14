import jwt, { type SignOptions } from 'jsonwebtoken'
import { env } from '@/shared/config/env'

export interface JwtPayload {
  sub: string
  email: string
  iat?: number
  exp?: number
}

type TokenPayload = Omit<JwtPayload, 'iat' | 'exp'>

const accessOptions: SignOptions = {
  expiresIn: env.JWT_ACCESS_EXPIRES_IN as string & SignOptions['expiresIn'],
}

const refreshOptions: SignOptions = {
  expiresIn: env.JWT_REFRESH_EXPIRES_IN as string & SignOptions['expiresIn'],
}

export const jwtUtils = {
  signAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, accessOptions)
  },

  signRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, refreshOptions)
  },

  verifyAccessToken(token: string): JwtPayload {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload
  },

  verifyRefreshToken(token: string): JwtPayload {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload
  },
}
