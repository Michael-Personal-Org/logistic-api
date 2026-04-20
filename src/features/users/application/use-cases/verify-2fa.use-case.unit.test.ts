import type { ISessionPort } from '@/features/users/application/ports/session.port'
import type { ITotpPort } from '@/features/users/application/ports/totp.port'
import { UserEntity } from '@/features/users/domain/user.entity'
import {
  AccountNotActiveError,
  InvalidTwoFactorCodeError,
  TwoFactorNotEnabledError,
  UserNotFoundError,
} from '@/features/users/domain/user.errors'
import type { IUserRepository } from '@/features/users/domain/user.repository'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Verify2FAUseCase } from './verify-2fa.use-case'

// ─── Helpers ─────────────────────────────────────────────
function makeUser(overrides: Partial<Parameters<typeof UserEntity.create>[0]> = {}) {
  return UserEntity.create({
    id: 'user-123',
    email: 'john@example.com',
    passwordHash: 'hash',
    firstName: 'John',
    lastName: 'Doe',
    status: 'active',
    role: 'CLIENT',
    twoFactorSecret: 'MOCK_SECRET',
    twoFactorEnabled: true,
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

const mockTotpPort: ITotpPort = {
  generateSetup: vi.fn(),
  verifyToken: vi.fn(),
}

function makeUseCase() {
  return new Verify2FAUseCase(mockUserRepository, mockSessionPort, mockTotpPort)
}

// ─── Tests ───────────────────────────────────────────────
describe('Verify2FAUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(mockUserRepository.update).mockResolvedValue()
    vi.mocked(mockSessionPort.saveRefreshToken).mockResolvedValue()
  })

  describe('cuando el codigo es valido — flujo de login', () => {
    beforeEach(() => {
      vi.mocked(mockUserRepository.findById).mockResolvedValue(makeUser())
      vi.mocked(mockTotpPort.verifyToken).mockResolvedValue(true) // ← mockResolvedValue
    })

    it('debe retornar accessToken y refreshToken', async () => {
      const useCase = makeUseCase()
      const result = await useCase.execute({
        userId: 'user-123',
        code: '123456',
        isSetupVerification: false,
      })

      expect(result.accessToken).toBeDefined()
      expect(result.refreshToken).toBeDefined()
    })

    it('debe guardar el refresh token en sesion', async () => {
      const useCase = makeUseCase()
      await useCase.execute({
        userId: 'user-123',
        code: '123456',
        isSetupVerification: false,
      })

      expect(mockSessionPort.saveRefreshToken).toHaveBeenCalledOnce()
    })

    it('no debe actualizar el usuario en flujo de login', async () => {
      const useCase = makeUseCase()
      await useCase.execute({
        userId: 'user-123',
        code: '123456',
        isSetupVerification: false,
      })

      expect(mockUserRepository.update).not.toHaveBeenCalled()
    })
  })

  describe('cuando el codigo es valido — flujo de setup', () => {
    beforeEach(() => {
      vi.mocked(mockUserRepository.findById).mockResolvedValue(
        makeUser({ twoFactorEnabled: false })
      )
      vi.mocked(mockTotpPort.verifyToken).mockResolvedValue(true) // ← mockResolvedValue
    })

    it('debe habilitar 2FA en el usuario', async () => {
      const useCase = makeUseCase()
      await useCase.execute({
        userId: 'user-123',
        code: '123456',
        isSetupVerification: true,
      })

      expect(mockUserRepository.update).toHaveBeenCalledOnce()
      const updatedUser = vi.mocked(mockUserRepository.update).mock.calls[0]?.[0]
      expect(updatedUser?.twoFactorEnabled).toBe(true)
    })

    it('debe retornar twoFactorEnabled true', async () => {
      const useCase = makeUseCase()
      const result = await useCase.execute({
        userId: 'user-123',
        code: '123456',
        isSetupVerification: true,
      })

      expect(result.twoFactorEnabled).toBe(true)
    })
  })

  describe('cuando el codigo es invalido', () => {
    it('debe lanzar InvalidTwoFactorCodeError', async () => {
      vi.mocked(mockUserRepository.findById).mockResolvedValue(makeUser())
      vi.mocked(mockTotpPort.verifyToken).mockResolvedValue(false) // ← mockResolvedValue

      const useCase = makeUseCase()

      await expect(
        useCase.execute({ userId: 'user-123', code: '000000', isSetupVerification: false })
      ).rejects.toThrow(InvalidTwoFactorCodeError)
    })
  })

  describe('cuando el usuario no existe', () => {
    it('debe lanzar UserNotFoundError', async () => {
      vi.mocked(mockUserRepository.findById).mockResolvedValue(null)

      const useCase = makeUseCase()

      await expect(
        useCase.execute({ userId: 'nonexistent', code: '123456', isSetupVerification: false })
      ).rejects.toThrow(UserNotFoundError)
    })
  })

  describe('cuando no hay secret configurado', () => {
    it('debe lanzar TwoFactorNotEnabledError', async () => {
      vi.mocked(mockUserRepository.findById).mockResolvedValue(
        makeUser({ twoFactorSecret: null, twoFactorEnabled: false })
      )

      const useCase = makeUseCase()

      await expect(
        useCase.execute({ userId: 'user-123', code: '123456', isSetupVerification: false })
      ).rejects.toThrow(TwoFactorNotEnabledError)
    })
  })

  describe('cuando la cuenta no esta activa', () => {
    it('debe lanzar AccountNotActiveError', async () => {
      vi.mocked(mockUserRepository.findById).mockResolvedValue(makeUser({ status: 'pending' }))

      const useCase = makeUseCase()

      await expect(
        useCase.execute({ userId: 'user-123', code: '123456', isSetupVerification: false })
      ).rejects.toThrow(AccountNotActiveError)
    })
  })
})
