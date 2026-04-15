import { nanoid } from 'nanoid'
import { UserTokenEntity } from '../../domain/user.entity'
import type { IUserRepository } from '../../domain/user.repository'
import type { IEmailPort } from '../ports/email.port'
import type { ITokenPort } from '../ports/token.port'
import { privateDecrypt } from 'node:crypto'
import { timeStamp } from 'node:console'

export interface RecoverPasswordInput {
  email: string
}

export interface RecoverPasswordOutput {
  message: string
}

export class RecoverPasswordUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly emailPort: IEmailPort,
    private readonly tokenPort: ITokenPort
  ) {}
  async execute(input: RecoverPasswordInput): Promise<RecoverPasswordOutput> {
    const genereicResponse: RecoverPasswordOutput = {
      message: 'Si el email existe, recibiras instrucciones para recuperar tu contrasena.',
    }

    // 1. Buscar usuario
    const user = await this.userRepository.findByEmail(input.email.toLowerCase().trim())
    if (!user) {
      return genereicResponse
    }

    // 2. No enviar reset a cuentas eliminadas
    if (user.isDeleted() || user.isSuspended()) {
      return genereicResponse
    }

    // 3. Limpia tokens anteriores de este usuario para evitar acumulacion
    await this.userRepository.deleteExpiredTokens(user.id)

    // 4. Generar nuevo token de reset
    const resetToken = this.tokenPort.generateSecureToken()
    const expiresAt = this.tokenPort.getExpirationDate(60)

    const userToken = UserTokenEntity.create({
      id: nanoid(),
      userId: user.id,
      token: resetToken,
      type: 'password_reset',
      expiresAt,
      usedAt: null,
      createdAt: new Date(),
    })

    await this.userRepository.saveToken(userToken)

    // 5. Enviar email con el token
    await this.emailPort.sendPasswordReset({
      to: user.email,
      firstName: user.firstName,
      resetToken,
    })

    return genereicResponse
  }
}
