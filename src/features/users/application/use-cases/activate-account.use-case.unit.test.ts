import { UserEntity, UserTokenEntity } from '@/features/users/domain/user.entity'
import { InvalidOrExpiredTokenError, UserNotFoundError } from '@/features/users/domain/user.errors'
import type { IUserRepository } from '@/features/users/domain/user.repository'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ActivateAccountUseCase } from './activate-account.use-case'

// ─── Helpers ─────────────────────────────────────────────
function makeUser(overrides: Partial<Parameters<typeof UserEntity.create>[0]> = {}) {
  return UserEntity.create({
    id: 'user-123',
    email: 'john@example.com',
    passwordHash: 'hash',
    firstName: 'John',
    lastName: 'Doe',
    phone: null,
    jobTitle: null,
    organizationId: null,
    mustChangePassword: false,
    status: 'pending',
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
    token: 'valid-token',
    type: 'activation',
    expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1 hora en el futuro
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
  return new ActivateAccountUseCase(mockUserRepository)
}

// ─── Tests ───────────────────────────────────────────────
describe('ActivateAccountUseCase', () => {
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

    it('debe activar la cuenta del usuario', async () => {
      const useCase = makeUseCase()
      await useCase.execute({ token: 'valid-token' })

      expect(mockUserRepository.update).toHaveBeenCalledOnce()
      const updatedUser = vi.mocked(mockUserRepository.update).mock.calls[0]?.[0]
      expect(updatedUser?.status).toBe('active')
    })

    it('debe marcar el token como usado', async () => {
      const useCase = makeUseCase()
      await useCase.execute({ token: 'valid-token' })

      expect(mockUserRepository.markTokenAsUsed).toHaveBeenCalledOnce()
      expect(mockUserRepository.markTokenAsUsed).toHaveBeenCalledWith('token-123')
    })

    it('debe retornar mensaje de exito', async () => {
      const useCase = makeUseCase()
      const result = await useCase.execute({ token: 'valid-token' })

      expect(result.message).toBeDefined()
    })
  })

  describe('cuando el token no existe', () => {
    it('debe lanzar InvalidOrExpiredTokenError', async () => {
      vi.mocked(mockUserRepository.findToken).mockResolvedValue(null)

      const useCase = makeUseCase()

      await expect(useCase.execute({ token: 'nonexistent-token' })).rejects.toThrow(
        InvalidOrExpiredTokenError
      )
    })
  })

  describe('cuando el token esta expirado', () => {
    it('debe lanzar InvalidOrExpiredTokenError', async () => {
      vi.mocked(mockUserRepository.findToken).mockResolvedValue(
        makeToken({ expiresAt: new Date(Date.now() - 1000) }) // pasado
      )

      const useCase = makeUseCase()

      await expect(useCase.execute({ token: 'expired-token' })).rejects.toThrow(
        InvalidOrExpiredTokenError
      )
    })
  })

  describe('cuando el token ya fue usado', () => {
    it('debe lanzar InvalidOrExpiredTokenError', async () => {
      vi.mocked(mockUserRepository.findToken).mockResolvedValue(
        makeToken({ usedAt: new Date() }) // ya usado
      )

      const useCase = makeUseCase()

      await expect(useCase.execute({ token: 'used-token' })).rejects.toThrow(
        InvalidOrExpiredTokenError
      )
    })
  })

  describe('cuando el usuario no existe', () => {
    it('debe lanzar UserNotFoundError', async () => {
      vi.mocked(mockUserRepository.findToken).mockResolvedValue(makeToken())
      vi.mocked(mockUserRepository.findById).mockResolvedValue(null)

      const useCase = makeUseCase()

      await expect(useCase.execute({ token: 'valid-token' })).rejects.toThrow(UserNotFoundError)
    })
  })
})
