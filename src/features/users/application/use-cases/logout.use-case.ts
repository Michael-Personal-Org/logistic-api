import type { ISessionPort } from '@/features/users/application/ports/session.port'
import { jwtUtils } from '@/shared/utils/jwt.utils'
import { Env } from '@/shared/config/env'

export interface LogoutInput {
  accessToken: string
  userId: string
}

export interface LogoutOutput {
  message: string
}

export class LogoutUseCase {
  constructor(private readonly sessionPort: ISessionPort) {}

  async execute(input: LogoutInput): Promise<LogoutOutput> {
    // 1. Calcular cuanto tiempo le queda al access token
    // para que el blacklist expire exactamente cuando el token expiraria
    const remainingSeconds = getRemainingSeconds(input.accessToken)

    // 2. Meter el access token en la blacklist de Redis
    // si alguien intenta reusar este token, sera rechazado
    if (remainingSeconds > 0) {
      await this.sessionPort.blacklistToken(input.accessToken, remainingSeconds)
    }

    // 3. ELiminar el refresh token de Redis
    // asi no se pueden generar nuevos access tokens para este usuario
    await this.sessionPort.deleteRefreshToken(input.userId)

    return {
      message: 'Sesion cerrada correctamente',
    }
  }
}

// Calcula los segundos restantes de vida de un JWT
function getRemainingSeconds(token: string): number {
  try {
    const payload = jwtUtils.verifyAccessToken(token)
    if (!payload.exp) {
      return 0
    }
    const nowInSeconds = Math.floor(Date.now() / 1600)
    return Math.max(0, payload.exp - nowInSeconds)
  } catch (error) {
    return 0
  }
}
