import type { IEmailPort } from '@/features/users/application/ports/email.port'
import type { ITokenPort } from '@/features/users/application/ports/token.port'
import { UserEntity } from '@/features/users/domain/user.entity'
import type { IUserRepository } from '@/features/users/domain/user.repository'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RecoverPasswordUseCase } from './recover-password.use-case'

// ─── Helpers ─────────────────────────────────────────────
function makeUser(overrides: Partial<Parameters<typeof UserEntity.create>[0]> = {}) {
  return UserEntity.create({
    id: 'user-123',
    email: 'john@example.com',
    passwordHash: 'hash',
    firstName: 'John',
    lastName: 'Doe',
    status: 'active',
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
  save: vi.fn(),
  update: vi.fn(),
  softDelete: vi.fn(),
  saveToken: vi.fn(),
  findToken: vi.fn(),
  markTokenAsUsed: vi.fn(),
  deleteExpiredTokens: vi.fn(),
}

const mockEmailPort: IEmailPort = {
  sendWelcome: vi.fn(),
  sendPasswordReset: vi.fn(),
}

const mockTokenPort: ITokenPort = {
  generateSecureToken: vi.fn().mockReturnValue('mock-reset-token'),
  getExpirationDate: vi.fn().mockReturnValue(new Date('2099-01-01')),
}

function makeUseCase() {
  return new RecoverPasswordUseCase(mockUserRepository, mockEmailPort, mockTokenPort)
}

// ─── Tests ───────────────────────────────────────────────
describe('RecoverPasswordUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(mockUserRepository.deleteExpiredTokens).mockResolvedValue()
    vi.mocked(mockUserRepository.saveToken).mockResolvedValue()
    vi.mocked(mockEmailPort.sendPasswordReset).mockResolvedValue()
  })

  describe('cuando el email existe y la cuenta esta activa', () => {
    beforeEach(() => {
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(makeUser())
    })

    it('debe enviar el email de reset', async () => {
      const useCase = makeUseCase()
      await useCase.execute({ email: 'john@example.com' })

      expect(mockEmailPort.sendPasswordReset).toHaveBeenCalledOnce()
      expect(mockEmailPort.sendPasswordReset).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'john@example.com' })
      )
    })

    it('debe guardar el token de reset', async () => {
      const useCase = makeUseCase()
      await useCase.execute({ email: 'john@example.com' })

      expect(mockUserRepository.saveToken).toHaveBeenCalledOnce()
    })

    it('debe limpiar tokens expirados antes de crear uno nuevo', async () => {
      const useCase = makeUseCase()
      await useCase.execute({ email: 'john@example.com' })

      expect(mockUserRepository.deleteExpiredTokens).toHaveBeenCalledBefore(
        vi.mocked(mockUserRepository.saveToken)
      )
    })

    it('debe retornar mensaje generico', async () => {
      const useCase = makeUseCase()
      const result = await useCase.execute({ email: 'john@example.com' })

      expect(result.message).toBeDefined()
    })
  })

  describe('cuando el email no existe', () => {
    it('debe retornar el mismo mensaje generico sin enviar email', async () => {
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null)

      const useCase = makeUseCase()
      const result = await useCase.execute({ email: 'noexiste@example.com' })

      expect(result.message).toBeDefined()
      expect(mockEmailPort.sendPasswordReset).not.toHaveBeenCalled()
      expect(mockUserRepository.saveToken).not.toHaveBeenCalled()
    })
  })

  describe('cuando la cuenta esta eliminada o suspendida', () => {
    it('no debe enviar email si la cuenta esta eliminada', async () => {
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(
        makeUser({ deletedAt: new Date() })
      )

      const useCase = makeUseCase()
      await useCase.execute({ email: 'john@example.com' })

      expect(mockEmailPort.sendPasswordReset).not.toHaveBeenCalled()
    })

    it('no debe enviar email si la cuenta esta suspendida', async () => {
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(makeUser({ status: 'suspended' }))

      const useCase = makeUseCase()
      await useCase.execute({ email: 'john@example.com' })

      expect(mockEmailPort.sendPasswordReset).not.toHaveBeenCalled()
    })
  })
})
