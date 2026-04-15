import {
  UserNotFoundError,
  InvalidCredentialsError,
  AccountNotActiveError,
} from '@/features/users/domain/user.errors'
import type { IUserRepository } from '@/features/users/domain/user.repository'
import type { ISessionPort } from '@/features/users/application/ports/session.port'
import { passwordUtils } from '@/shared/utils/password.utils'

export interface DeleteAccountInput {
  userId: string
  password: string
  accessToken: string
}

export interface DeleteAccountOutput {
  message: string
}

export class DeleteAccountUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly sessionPort: ISessionPort
  ) {}

  async execute(input: DeleteAccountInput): Promise<DeleteAccountOutput> {
    // 1. Buscar el usuario
    const user = await this.userRepository.findById(input.userId)
    if (!user) {
      throw new UserNotFoundError(input.userId)
    }

    // 2. Solo cuentas activas pueden eliminarse
    if (!user.isActive()) {
      throw new AccountNotActiveError()
    }

    // 3. Confirmar identidad con contrasena antes de eliminar
    // accin destructiva
    const isPasswordValid = await passwordUtils.compare(input.password, user.passwordHash)
    if (!isPasswordValid) {
      throw new InvalidCredentialsError()
    }

    // 4. Invalidar sesion activa - blacklist del access token
    const remainingSeconds = getRemainingSeconds(input.accessToken)
    if (remainingSeconds > 0) {
      await this.sessionPort.blacklistToken(input.accessToken, remainingSeconds)
    }

    // 5. Eliminar refresh token de Redis
    await this.sessionPort.deleteRefreshToken(input.userId)

    // 6. Soft delete - nunca borramos datos fisicamente
    await this.userRepository.softDelete(input.userId)

    return {
      message: 'Cuenta eliminada correctamente',
    }
  }
}

function getRemainingSeconds(token: string): number {
  try {
    const [, payload] = token.split('.')
    if (!payload) return 0
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString())
    if (!decoded.exp) return 0
    const nowInSeconds = Math.floor(Date.now() / 1000)
    return Math.max(0, decoded.exp - nowInSeconds)
  } catch (error) {
    return 0
  }
}
