import type { ITokenPort } from '@/features/users/application/ports/token.port'
import { nanoid } from 'nanoid'

export class TokenService implements ITokenPort {
  // Genera un token URL-safe criptograficamente seguro
  generateSecureToken(): string {
    return nanoid(64)
  }

  getExpirationDate(minutes: number): Date {
    const now = new Date()
    now.setMinutes(now.getMinutes() + minutes)
    return now
  }
}
