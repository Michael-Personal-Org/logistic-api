import { UserEntity } from '@/features/users/domain/user.entity'
import { InvalidCredentialsError, UserNotFoundError } from '@/features/users/domain/user.errors'
import type { IUserRepository } from '@/features/users/domain/user.repository'
import { passwordUtils } from '@/shared/utils/password.utils'

export interface ChangePasswordInput {
  userId: string
  currentPassword: string
  newPassword: string
}

export interface ChangePasswordOutput {
  message: string
}

export class ChangePasswordUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: ChangePasswordInput): Promise<ChangePasswordOutput> {
    const user = await this.userRepository.findById(input.userId)
    if (!user) throw new UserNotFoundError(input.userId)

    // Verificar contraseña actual
    const isValid = await passwordUtils.compare(user.passwordHash, input.currentPassword)
    if (!isValid) throw new InvalidCredentialsError()

    // Hashear nueva contraseña
    const newHash = await passwordUtils.hash(input.newPassword)

    const updated = UserEntity.create({
      ...user.toObject(),
      passwordHash: newHash,
      updatedAt: new Date(),
    })

    await this.userRepository.update(updated)

    return { message: 'Contraseña actualizada correctamente.' }
  }
}
