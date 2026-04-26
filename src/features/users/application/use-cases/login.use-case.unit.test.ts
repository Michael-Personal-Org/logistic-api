import type { ISessionPort } from '@/features/users/application/ports/session.port'
import { UserEntity } from '@/features/users/domain/user.entity'
import {
  AccountNotActiveError,
  AccountSuspendedError,
  InvalidCredentialsError,
} from '@/features/users/domain/user.errors'
import type { IUserRepository } from '@/features/users/domain/user.repository'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LoginUseCase } from './login.use-case'

// ─── Helpers ─────────────────────────────────────────────
function makeUser(overrides: Partial<Parameters<typeof UserEntity.create>[0]> = {}) {
  return UserEntity.create({
    id: 'user-123',
    email: 'john@example.com',
    passwordHash: '',
    firstName: 'John',
    lastName: 'Doe',
    status: 'active',
    phone: null,
    jobTitle: null,
    organizationId: null,
    mustChangePassword: false,
    role: 'ORG_ADMIN',
    twoFactorSecret: null,
    twoFactorEnabled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  })
}

// ─── Mocks ───────────────────────────────────────────────
const mockUserRepository: IUserRepository = {
  findById: vi.fn(),
  findByEmail: vi.fn(),
  findMany: vi.fn(),
  save: vi.fn(),
  update: vi.fn(),
  softDelete: vi.fn(),
  saveToken: vi.fn(),
  findToken: vi.fn(),
  markTokenAsUsed: vi.fn(),
  deleteExpiredTokens: vi.fn(),
}

const mockSessionPort: ISessionPort = {
  blacklistToken: vi.fn(),
  isTokenBlacklisted: vi.fn(),
  saveRefreshToken: vi.fn(),
  findRefreshToken: vi.fn(),
  deleteRefreshToken: vi.fn(),
}

function makeUseCase() {
  return new LoginUseCase(mockUserRepository, mockSessionPort)
}

// ─── Tests ───────────────────────────────────────────────
describe('LoginUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('cuando las credenciales son validas', () => {
    beforeEach(async () => {
      const { hash } = await import('argon2')
      const passwordHash = await hash('Password1!')

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(makeUser({ passwordHash }))
      vi.mocked(mockSessionPort.saveRefreshToken).mockResolvedValue()
    })

    it('debe retornar accessToken y refreshToken', async () => {
      const useCase = makeUseCase()
      const result = await useCase.execute({
        email: 'john@example.com',
        password: 'Password1!',
      })

      expect(result.accessToken).toBeDefined()
      expect(result.refreshToken).toBeDefined()
      expect(result.requiresTwoFactor).toBe(false)
    })

    it('debe retornar los datos del usuario', async () => {
      const useCase = makeUseCase()
      const result = await useCase.execute({
        email: 'john@example.com',
        password: 'Password1!',
      })

      expect(result.user.email).toBe('john@example.com')
      expect(result.user.id).toBe('user-123')
    })

    it('debe guardar el refresh token en sesion', async () => {
      const useCase = makeUseCase()
      await useCase.execute({
        email: 'john@example.com',
        password: 'Password1!',
      })

      expect(mockSessionPort.saveRefreshToken).toHaveBeenCalledOnce()
    })
  })

  describe('cuando el usuario no existe', () => {
    it('debe lanzar InvalidCredentialsError', async () => {
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null)

      const useCase = makeUseCase()

      await expect(
        useCase.execute({ email: 'noexiste@example.com', password: 'Password1!' })
      ).rejects.toThrow(InvalidCredentialsError)
    })
  })

  describe('cuando la contraseña es incorrecta', () => {
    it('debe lanzar InvalidCredentialsError', async () => {
      const { hash } = await import('argon2')
      const passwordHash = await hash('Password1!')

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(makeUser({ passwordHash }))

      const useCase = makeUseCase()

      await expect(
        useCase.execute({ email: 'john@example.com', password: 'WrongPassword1!' })
      ).rejects.toThrow(InvalidCredentialsError)
    })
  })

  describe('cuando la cuenta no esta activa', () => {
    it('debe lanzar AccountNotActiveError si esta pendiente', async () => {
      const { hash } = await import('argon2')
      const passwordHash = await hash('Password1!')

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(
        makeUser({ passwordHash, status: 'pending' })
      )

      const useCase = makeUseCase()

      await expect(
        useCase.execute({ email: 'john@example.com', password: 'Password1!' })
      ).rejects.toThrow(AccountNotActiveError)
    })

    it('debe lanzar AccountSuspendedError si esta suspendida', async () => {
      const { hash } = await import('argon2')
      const passwordHash = await hash('Password1!')

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(
        makeUser({ passwordHash, status: 'suspended' })
      )

      const useCase = makeUseCase()

      await expect(
        useCase.execute({ email: 'john@example.com', password: 'Password1!' })
      ).rejects.toThrow(AccountSuspendedError)
    })
  })

  describe('cuando el usuario tiene 2FA activo', () => {
    it('debe retornar requiresTwoFactor true sin tokens', async () => {
      const { hash } = await import('argon2')
      const passwordHash = await hash('Password1!')

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(
        makeUser({
          passwordHash,
          twoFactorEnabled: true,
          twoFactorSecret: 'secret-totp',
        })
      )

      const useCase = makeUseCase()
      const result = await useCase.execute({
        email: 'john@example.com',
        password: 'Password1!',
      })

      expect(result.requiresTwoFactor).toBe(true)
      expect(result.accessToken).toBe('')
      expect(result.refreshToken).toBe('')
      expect(mockSessionPort.saveRefreshToken).not.toHaveBeenCalled()
    })
  })
})
