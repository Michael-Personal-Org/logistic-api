export interface ITokenPort {
  generateSecureToken(): string

  getExpirationDate(minutes: number): Date
}
