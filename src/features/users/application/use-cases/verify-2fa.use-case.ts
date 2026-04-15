import { UserEntity } from '@/features/users/domain/user.entity'
import {
  UserNotFoundError,
  InvalidTwoFactorCodeError,
  TwoFactorNotEnabledError,
  AccountNotActiveError,
} from '@/features/users/domain/user.errors'
import type { IUserRepository } from '@/features/users/domain/user.repository'
import type { ISessionPort } from '@/features/users/application/ports/session.port'
import type { ITotpPort } from '@/features/users/application/ports/totp.port'
import { jwtUtils } from '@/shared/utils/jwt.utils'
import { env } from '@/shared/config/env'
import { parseExpiresIn } from '@/shared/utils/time.utils'

export interface Verify2FAInput {
  userId: string
  code: string
  isSetupVerification: boolean
}

export interface Verify2FAOutput {
  accessToken: string
  refreshToken: string
  twoFactorEnabled: boolean
  message: string
}

export class Verify2FAUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly sessionPort: ISessionPort,
    private readonly totpPort: ITotpPort
  ) {}

  async execute(input: Verify2FAInput): Promise<Verify2FAOutput> {
    // 1. Buscar el usuario
    const user = await this.userRepository.findById(input.userId)
    if (!user) {
      throw new UserNotFoundError(input.userId)
    }

    // 2. Verificar que la cuenta este activa
    if (!user.isActive()) {
      throw new AccountNotActiveError()
    }

    // 3. Verificar que tenga un secret generado
    if (!user.twoFactorSecret) {
      throw new TwoFactorNotEnabledError()
    }

    // 4. Verificar el codigo TOTP contra el secret generado
    const isValid = this.totpPort.verifyToken(input.code, user.twoFactorSecret)
    if (!isValid) {
      throw new InvalidTwoFactorCodeError()
    }

    // 5. Si es verificacion de setup, activar 2FA
    if (input.isSetupVerification) {
      const updatedUser = UserEntity.create({
        ...user.toObject(),
        twoFactorEnabled: true,
        updatedAt: new Date(),
      })

      await this.userRepository.update(updatedUser)
    }

    // 6. Eliminar tokens (flujo de login completado o 2FA activado)
    const payload = { sub: user.id, email: user.email }
    const accessToken = jwtUtils.signAccessToken(payload)
    const refreshToken = jwtUtils.signRefreshToken(payload)

    const refreshExpiresInSeconds = parseExpiresIn(env.JWT_REFRESH_EXPIRES_IN)
    await this.sessionPort.saveRefreshToken(user.id, refreshToken, refreshExpiresInSeconds)

    return {
      accessToken,
      refreshToken,
      twoFactorEnabled: input.isSetupVerification ? true : user.twoFactorEnabled,
      message: input.isSetupVerification
        ? '2FA activado correctamente.'
        : 'Verificacion 2FA exitosa.',
    }
  }
}
