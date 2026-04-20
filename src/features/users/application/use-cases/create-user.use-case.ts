import type { IEmailPort } from '@/features/users/application/ports/email.port'
import type { ITokenPort } from '@/features/users/application/ports/token.port'
import { UserEntity } from '@/features/users/domain/user.entity'
import type { UserRole } from '@/features/users/domain/user.entity'
import {
  InsufficientPermissionsError,
  UserAlreadyExistsError,
} from '@/features/users/domain/user.errors'
import type { IUserRepository } from '@/features/users/domain/user.repository'
import { ROLES } from '@/shared/constants/roles'
import { passwordUtils } from '@/shared/utils/password.utils'

export interface CreateUserInput {
  createdByRole: UserRole
  email: string
  password: string
  firstName: string
  lastName: string
  role: UserRole
}

export interface CreateUserOutput {
  userId: string
  email: string
  role: UserRole
  message: string
}

const ALLOWED_CREATIONS: Record<string, UserRole[]> = {
  [ROLES.ADMIN]: [ROLES.CLIENT, ROLES.DRIVER, ROLES.OPERATOR, ROLES.ADMIN],
  [ROLES.OPERATOR]: [ROLES.DRIVER],
}

export class CreateUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly emailPort: IEmailPort,
    private readonly tokenPort: ITokenPort
  ) {}

  async execute(input: CreateUserInput): Promise<CreateUserOutput> {
    // 1. Verificar permisos
    const allowedRoles = ALLOWED_CREATIONS[input.createdByRole] ?? []
    if (!allowedRoles.includes(input.role)) {
      throw new InsufficientPermissionsError(
        `El rol ${input.createdByRole} no puede crear usuarios con rol ${input.role}`
      )
    }

    // 2. Verificar que el email no exista
    const existing = await this.userRepository.findByEmail(input.email)
    if (existing) {
      throw new UserAlreadyExistsError(input.email)
    }

    // 3. Hashear contraseña
    const passwordHash = await passwordUtils.hash(input.password)

    // 4. Crear entidad — los usuarios creados por admin arrancan como 'active'
    const now = new Date()
    const user = UserEntity.create({
      id: crypto.randomUUID(),
      email: input.email.toLowerCase().trim(),
      passwordHash,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      status: 'active',
      role: input.role,
      twoFactorSecret: null,
      twoFactorEnabled: false,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    })

    // 5. Persistir
    await this.userRepository.save(user)

    // 6. Generar token de activación para que el usuario establezca su contraseña
    const activationToken = this.tokenPort.generateSecureToken()
    const expiresAt = this.tokenPort.getExpirationDate(60 * 48) // 48 horas

    const userToken = await import('@/features/users/domain/user.entity').then(
      ({ UserTokenEntity }) =>
        UserTokenEntity.create({
          id: crypto.randomUUID(),
          userId: user.id,
          token: activationToken,
          type: 'activation',
          expiresAt,
          usedAt: null,
          createdAt: new Date(),
        })
    )

    await this.userRepository.saveToken(userToken)

    // 7. Notificar al usuario con sus credenciales
    await this.emailPort.sendWelcome({
      to: user.email,
      firstName: user.firstName,
      activationToken,
    })

    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      message: `Usuario ${user.role} creado correctamente.`,
    }
  }
}
