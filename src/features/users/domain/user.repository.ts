import type { UserEntity, UserTokenEntity } from './user.entity'

export interface IUserRepository {
  // Users
  findById(id: string): Promise<UserEntity | null>
  findByEmail(email: string): Promise<UserEntity | null>
  save(user: UserEntity): Promise<void>
  update(user: UserEntity): Promise<void>
  softDelete(id: string): Promise<void>

  // Tokens
  saveToken(token: UserTokenEntity): Promise<void>
  findToken(token: string, type: 'activation' | 'password_reset'): Promise<UserTokenEntity | null>
  markTokenAsUsed(tokenId: string): Promise<void>
  deleteExpiredTokens(userId: string): Promise<void>
}
