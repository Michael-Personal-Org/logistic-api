import type { UserEntity, UserTokenEntity } from './user.entity'
import type { UserRole, UserStatus } from './user.entity'

export interface FindManyOptions {
  role?: UserRole | undefined
  status?: UserStatus | undefined
  page: number
  limit: number
}

export interface FindManyResult {
  users: UserEntity[]
  total: number
}

export interface IUserRepository {
  // Users
  findById(id: string): Promise<UserEntity | null>
  findByEmail(email: string): Promise<UserEntity | null>
  findMany(options: FindManyOptions): Promise<FindManyResult> // ← NUEVO
  save(user: UserEntity): Promise<void>
  update(user: UserEntity): Promise<void>
  softDelete(id: string): Promise<void>

  // Tokens
  saveToken(token: UserTokenEntity): Promise<void>
  findToken(token: string, type: 'activation' | 'password_reset'): Promise<UserTokenEntity | null>
  markTokenAsUsed(tokenId: string): Promise<void>
  deleteExpiredTokens(userId: string): Promise<void>
}
