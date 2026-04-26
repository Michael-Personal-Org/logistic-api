import { UserEntity, UserTokenEntity } from '@/features/users/domain/user.entity'
import { InvalidOrExpiredTokenError, UserNotFoundError } from '@/features/users/domain/user.errors'
import type { IUserRepository } from '@/features/users/domain/user.repository'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ResetPasswordUseCase } from './reset-password.use-case'

// ─── Helpers ─────────────────────────────────────────────
function makeUser(overrides: Partial<Parameters<typeof UserEntity.create>[0]> = {}) {
  return UserEntity.create({
    id: 'user-123',
    email: 'john@example.com',
    passwordHash: 'old-hash',
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

function makeToken(overrides: Partial<Parameters<typeof UserTokenEntity.create>[0]> = {}) {
  return UserTokenEntity.create({
    id: 'token-123',
    userId: 'user-123',
    token: 'valid-reset-token',
    type: 'password_reset',
    expiresAt: new Date(Date.now() + 1000 * 60 * 60),
    usedAt: null,
    createdAt: new Date(),
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

function makeUseCase() {
  return new ResetPasswordUseCase(mockUserRepository)
}

// ─── Tests ───────────────────────────────────────────────
describe('ResetPasswordUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(mockUserRepository.update).mockResolvedValue()
    vi.mocked(mockUserRepository.markTokenAsUsed).mockResolvedValue()
  })

  describe('cuando el token es valido', () => {
    beforeEach(() => {
      vi.mocked(mockUserRepository.findToken).mockResolvedValue(makeToken())
      vi.mocked(mockUserRepository.findById).mockResolvedValue(makeUser())
    })

    it('debe actualizar la contraseña del usuario', async () => {
      const useCase = makeUseCase()
      await useCase.execute({
        token: 'valid-reset-token',
        newPassword: 'NewPassword1!',
      })

      expect(mockUserRepository.update).toHaveBeenCalledOnce()
      const updatedUser = vi.mocked(mockUserRepository.update).mock.calls[0]?.[0]
      expect(updatedUser?.passwordHash).not.toBe('old-hash')
    })

    it('debe marcar el token como usado', async () => {
      const useCase = makeUseCase()
      await useCase.execute({
        token: 'valid-reset-token',
        newPassword: 'NewPassword1!',
      })

      expect(mockUserRepository.markTokenAsUsed).toHaveBeenCalledOnce()
      expect(mockUserRepository.markTokenAsUsed).toHaveBeenCalledWith('token-123')
    })

    it('debe retornar mensaje de exito', async () => {
      const useCase = makeUseCase()
      const result = await useCase.execute({
        token: 'valid-reset-token',
        newPassword: 'NewPassword1!',
      })

      expect(result.message).toBeDefined()
    })

    it('debe hashear la nueva contraseña', async () => {
      const useCase = makeUseCase()
      await useCase.execute({
        token: 'valid-reset-token',
        newPassword: 'NewPassword1!',
      })

      const updatedUser = vi.mocked(mockUserRepository.update).mock.calls[0]?.[0]
      // El hash nunca debe ser el texto plano
      expect(updatedUser?.passwordHash).not.toBe('NewPassword1!')
    })
  })

  describe('cuando el token no existe', () => {
    it('debe lanzar InvalidOrExpiredTokenError', async () => {
      vi.mocked(mockUserRepository.findToken).mockResolvedValue(null)

      const useCase = makeUseCase()

      await expect(
        useCase.execute({ token: 'nonexistent', newPassword: 'NewPassword1!' })
      ).rejects.toThrow(InvalidOrExpiredTokenError)
    })
  })

  describe('cuando el token esta expirado', () => {
    it('debe lanzar InvalidOrExpiredTokenError', async () => {
      vi.mocked(mockUserRepository.findToken).mockResolvedValue(
        makeToken({ expiresAt: new Date(Date.now() - 1000) })
      )

      const useCase = makeUseCase()

      await expect(
        useCase.execute({ token: 'expired-token', newPassword: 'NewPassword1!' })
      ).rejects.toThrow(InvalidOrExpiredTokenError)
    })
  })

  describe('cuando el token ya fue usado', () => {
    it('debe lanzar InvalidOrExpiredTokenError', async () => {
      vi.mocked(mockUserRepository.findToken).mockResolvedValue(makeToken({ usedAt: new Date() }))

      const useCase = makeUseCase()

      await expect(
        useCase.execute({ token: 'used-token', newPassword: 'NewPassword1!' })
      ).rejects.toThrow(InvalidOrExpiredTokenError)
    })
  })

  describe('cuando el usuario no existe', () => {
    it('debe lanzar UserNotFoundError', async () => {
      vi.mocked(mockUserRepository.findToken).mockResolvedValue(makeToken())
      vi.mocked(mockUserRepository.findById).mockResolvedValue(null)

      const useCase = makeUseCase()

      await expect(
        useCase.execute({ token: 'valid-reset-token', newPassword: 'NewPassword1!' })
      ).rejects.toThrow(UserNotFoundError)
    })
  })
})
