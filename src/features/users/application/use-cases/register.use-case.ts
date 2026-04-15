import { nanoid } from 'nanoid'
import { UserEntity } from '@/features/users/domain/user.entity'
import { UserTokenEntity } from '@/features/users/domain/user.entity'
import { UserAlreadyExistsError } from '@/features/users/domain/user.errors'
import type { IUserRepository } from '@/features/users/domain/user.repository'
import type { IEmailPort } from '@/features/users/application/ports/email.port'
import type { ITokenPort } from '@/features/users/application/ports/token.port'
import { passwordUtils } from '@/shared/utils/password.utils'

// Input y Output
export interface RegisterInput {
  email: string
  password: string
  firstName: string
  lastName: string
}

export interface RegisterOutput {
  userId: string
  email: string
  message: string
}

export class RegisterUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly emailPort: IEmailPort,
    private readonly tokenPort: ITokenPort
  ) {}

  async execute(input: RegisterInput): Promise<RegisterOutput> {
    // 1. Verificar que el email no exista
    const existing = await this.userRepository.findByEmail(input.email)
    if (existing) {
      throw new UserAlreadyExistsError(input.email)
    }

    // 2. Hashear la contrasena
    const passwordHash = await passwordUtils.hash(input.password)

    // 3. Crear la entidad
    const now = new Date()
    const user = UserEntity.create({
      id: nanoid(),
      email: input.email.toLowerCase().trim(),
      passwordHash,
      firstName: input.firstName.toLowerCase().trim(),
      lastName: input.lastName.toLowerCase().trim(),
      status: 'pending',
      twoFactorSecret: null,
      twoFactorEnabled: false,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    })

    // 4. Persistir el usuario
    await this.userRepository.save(user)

    // 5. Generar token de activacion
    const activationToken = this.tokenPort.generateSecureToken()
    const expiresAt = this.tokenPort.getExpirationDate(60 * 24)

    const userToken = UserTokenEntity.create({
      id: nanoid(),
      userId: user.id,
      token: activationToken,
      type: 'activation',
      expiresAt,
      usedAt: null,
      createdAt: new Date(),
    })

    await this.userRepository.saveToken(userToken)

    // 6. Enviar email de bienvenida
    await this.emailPort.sendWelcome({
      to: user.email,
      firstName: user.firstName,
      activationToken,
    })

    return {
      userId: user.id,
      email: user.email,
      message: 'Cuenta creada. Revisa tu email para activarla.',
    }
  }
}
