import type { UserRole, UserStatus } from '@/features/users/domain/user.entity'
import type { IUserRepository } from '@/features/users/domain/user.repository'

export interface ListUsersInput {
  role?: UserRole
  status?: UserStatus
  page: number
  limit: number
}

export interface UserSummary {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  status: UserStatus
  createdAt: Date
}

export interface ListUsersOutput {
  users: UserSummary[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export class ListUsersUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: ListUsersInput): Promise<ListUsersOutput> {
    const { users, total } = await this.userRepository.findMany({
      role: input.role,
      status: input.status,
      page: input.page,
      limit: input.limit,
    })

    return {
      users: users.map((user) => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
      })),
      total,
      page: input.page,
      limit: input.limit,
      totalPages: Math.ceil(total / input.limit),
    }
  }
}
