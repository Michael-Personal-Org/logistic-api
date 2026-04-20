import type { UserRole, UserStatus } from '@/features/users/domain/user.entity'
import { UserNotFoundError } from '@/features/users/domain/user.errors'
import type { IUserRepository } from '@/features/users/domain/user.repository'

export interface GetUserInput {
  userId: string
}

export interface GetUserOutput {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  status: UserStatus
  twoFactorEnabled: boolean
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export class GetUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: GetUserInput): Promise<GetUserOutput> {
    const user = await this.userRepository.findById(input.userId)
    if (!user) {
      throw new UserNotFoundError(input.userId)
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      twoFactorEnabled: user.twoFactorEnabled,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deletedAt: user.deletedAt,
    }
  }
}
