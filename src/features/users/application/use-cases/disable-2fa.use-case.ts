import type { ITotpPort } from '@/features/users/application/ports/totp.port'
import { UserEntity } from '@/features/users/domain/user.entity'
import {
  InvalidTwoFactorCodeError,
  TwoFactorNotEnabledError,
  UserNotFoundError,
} from '@/features/users/domain/user.errors'
import type { IUserRepository } from '@/features/users/domain/user.repository'

export interface Disable2FAInput {
  userId: string
  code: string
}

export interface Disable2FAOutput {
  message: string
}

export class Disable2FAUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly totpPort: ITotpPort
  ) {}

  async execute(input: Disable2FAInput): Promise<Disable2FAOutput> {
    const user = await this.userRepository.findById(input.userId)
    if (!user) throw new UserNotFoundError(input.userId)

    if (!user.hasTwoFactorEnabled()) {
      throw new TwoFactorNotEnabledError()
    }

    // Verificar código antes de desactivar
    const secret = user.twoFactorSecret
    if (!secret) throw new TwoFactorNotEnabledError()
    const isValid = await this.totpPort.verifyToken(input.code, secret)
    if (!isValid) throw new InvalidTwoFactorCodeError()

    const updated = UserEntity.create({
      ...user.toObject(),
      twoFactorSecret: null,
      twoFactorEnabled: false,
      updatedAt: new Date(),
    })

    await this.userRepository.update(updated)

    return { message: '2FA desactivado correctamente.' }
  }
}
