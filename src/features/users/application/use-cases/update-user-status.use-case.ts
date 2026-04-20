import { UserEntity } from '@/features/users/domain/user.entity'
import {
  InsufficientPermissionsError,
  UserNotFoundError,
} from '@/features/users/domain/user.errors'
import type { IUserRepository } from '@/features/users/domain/user.repository'

export interface UpdateUserStatusInput {
  targetUserId: string
  newStatus: 'active' | 'suspended'
}

export interface UpdateUserStatusOutput {
  message: string
}

export class UpdateUserStatusUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: UpdateUserStatusInput): Promise<UpdateUserStatusOutput> {
    const user = await this.userRepository.findById(input.targetUserId)
    if (!user || user.isDeleted()) {
      throw new UserNotFoundError(input.targetUserId)
    }

    if (user.isAdmin()) {
      throw new InsufficientPermissionsError('No se puede cambiar el estado de un administrador')
    }

    const updatedUser = UserEntity.create({
      ...user.toObject(),
      status: input.newStatus,
      updatedAt: new Date(),
    })

    await this.userRepository.update(updatedUser)

    const action = input.newStatus === 'active' ? 'reactivada' : 'suspendida'
    return {
      message: `Cuenta ${action} correctamente.`,
    }
  }
}
