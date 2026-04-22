import { UserEntity } from '@/features/users/domain/user.entity'
import { InvalidOrExpiredTokenError, UserNotFoundError } from '@/features/users/domain/user.errors'
import type { IUserRepository } from '@/features/users/domain/user.repository'
import { passwordUtils } from '@/shared/utils/password.utils'

export interface ResetPasswordInput {
  token: string
  newPassword: string
}

export interface ResetPasswordOutput {
  message: string
}

export class ResetPasswordUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: ResetPasswordInput): Promise<ResetPasswordOutput> {
    // 1. Buscar el token en DB
    const userToken = await this.userRepository.findToken(input.token, 'password_reset')
    if (!userToken) {
      throw new InvalidOrExpiredTokenError()
    }

    // 2. Validar que no este expirado ni usado
    if (!userToken.isValid()) {
      throw new InvalidOrExpiredTokenError()
    }

    // 3. Buscar el usuario asociado
    const user = await this.userRepository.findById(userToken.userId)
    if (!user) {
      throw new UserNotFoundError(userToken.userId)
    }

    // 4. Hashead la nueva contrasena
    const passwordHash = await passwordUtils.hash(input.newPassword)

    // 5. Crear usuario actualizado con la nueva contrasena
    const updatedUser = UserEntity.create({
      ...user.toObject(),
      passwordHash,
      updatedAt: new Date(),
    })

    // 6. Persistir el nuevo password
    await this.userRepository.update(updatedUser)

    // 7. Marcar el token como usado
    await this.userRepository.markTokenAsUsed(userToken.id)

    return {
      message: 'COntrasena actualizada correctamente. Ya puedes iniciar sesion.',
    }
  }
}
