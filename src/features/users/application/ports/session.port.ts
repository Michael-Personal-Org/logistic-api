export interface ISessionPort {
  // Blacklist de access tokens
  blacklistToken(token: string, expiresInSeconds: number): Promise<void>
  isTokenBlacklisted(token: string): Promise<void>

  // Refresh tokens
  saveRefreshToken(userId: string, token: string, expiresInSeconds: number): Promise<void>
  findRefreshToken(userId: string): Promise<string | null>
  deleteRefreshToken(userId: string): Promise<void>
}
