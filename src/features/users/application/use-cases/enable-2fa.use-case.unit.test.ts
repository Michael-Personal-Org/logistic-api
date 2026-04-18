import type { ITotpPort } from '@/features/users/application/ports/totp.port'
import { UserEntity } from '@/features/users/domain/user.entity'
import {
  AccountNotActiveError,
  TwoFactorAlreadyEnabledError,
  UserNotFoundError,
} from '@/features/users/domain/user.errors'
import type { IUserRepository } from '@/features/users/domain/user.repository'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Enable2FAUseCase } from './enable-2fa.use-case'

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

const mockTotpPort: ITotpPort = {
  generateSetup: vi.fn().mockResolvedValue({
    secret: 'MOCK_SECRET_BASE32',
    otpauthUrl: 'otpauth://totp/test',
    qrCodeDataUrl: 'data:image/png;base64,mock',
  }),
  verifyToken: vi.fn(),
}

function makeUseCase() {
  return new Enable2FAUseCase(mockUserRepository, mockTotpPort)
}

// ─── Tests ───────────────────────────────────────────────
describe('Enable2FAUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(mockUserRepository.update).mockResolvedValue()
  })

  describe('cuando el usuario es valido y no tiene 2FA', () => {
    beforeEach(() => {
      vi.mocked(mockUserRepository.findById).mockResolvedValue(makeUser())
    })

    it('debe retornar el secret y el qrCodeDataUrl', async () => {
      const useCase = makeUseCase()
      const result = await useCase.execute({ userId: 'user-123' })

      expect(result.secret).toBe('MOCK_SECRET_BASE32')
      expect(result.qrCodeDataUrl).toBe('data:image/png;base64,mock')
    })

    it('debe guardar el secret pero NO habilitar 2FA aun', async () => {
      const useCase = makeUseCase()
      await useCase.execute({ userId: 'user-123' })

      expect(mockUserRepository.update).toHaveBeenCalledOnce()
      const updatedUser = vi.mocked(mockUserRepository.update).mock.calls[0]?.[0]
      expect(updatedUser?.twoFactorSecret).toBe('MOCK_SECRET_BASE32')
      expect(updatedUser?.twoFactorEnabled).toBe(false)
    })

    it('debe retornar mensaje de exito', async () => {
      const useCase = makeUseCase()
      const result = await useCase.execute({ userId: 'user-123' })

      expect(result.message).toBeDefined()
    })
  })

  describe('cuando el usuario no existe', () => {
    it('debe lanzar UserNotFoundError', async () => {
      vi.mocked(mockUserRepository.findById).mockResolvedValue(null)

      const useCase = makeUseCase()

      await expect(useCase.execute({ userId: 'nonexistent' })).rejects.toThrow(UserNotFoundError)
    })
  })

  describe('cuando la cuenta no esta activa', () => {
    it('debe lanzar AccountNotActiveError si esta pendiente', async () => {
      vi.mocked(mockUserRepository.findById).mockResolvedValue(makeUser({ status: 'pending' }))

      const useCase = makeUseCase()

      await expect(useCase.execute({ userId: 'user-123' })).rejects.toThrow(AccountNotActiveError)
    })

    it('debe lanzar AccountNotActiveError si esta eliminada', async () => {
      vi.mocked(mockUserRepository.findById).mockResolvedValue(makeUser({ deletedAt: new Date() }))

      const useCase = makeUseCase()

      await expect(useCase.execute({ userId: 'user-123' })).rejects.toThrow(AccountNotActiveError)
    })
  })

  describe('cuando el 2FA ya esta habilitado', () => {
    it('debe lanzar TwoFactorAlreadyEnabledError', async () => {
      vi.mocked(mockUserRepository.findById).mockResolvedValue(
        makeUser({
          twoFactorEnabled: true,
          twoFactorSecret: 'existing-secret',
        })
      )

      const useCase = makeUseCase()

      await expect(useCase.execute({ userId: 'user-123' })).rejects.toThrow(
        TwoFactorAlreadyEnabledError
      )
    })
  })
})
