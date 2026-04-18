import type { ISessionPort } from '@/features/users/application/ports/session.port'
import { UserEntity } from '@/features/users/domain/user.entity'
import {
  AccountNotActiveError,
  InvalidCredentialsError,
  UserNotFoundError,
} from '@/features/users/domain/user.errors'
import type { IUserRepository } from '@/features/users/domain/user.repository'
import { jwtUtils } from '@/shared/utils/jwt.utils'
import { hash } from 'argon2'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DeleteAccountUseCase } from './delete-account.use-case'

// ─── Helpers ─────────────────────────────────────────────
function makeUser(overrides: Partial<Parameters<typeof UserEntity.create>[0]> = {}) {
  return UserEntity.create({
    id: 'user-123',
    email: 'john@example.com',
    passwordHash: '',
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

const mockSessionPort: ISessionPort = {
  blacklistToken: vi.fn(),
  isTokenBlacklisted: vi.fn(),
  saveRefreshToken: vi.fn(),
  findRefreshToken: vi.fn(),
  deleteRefreshToken: vi.fn(),
}

function makeUseCase() {
  return new DeleteAccountUseCase(mockUserRepository, mockSessionPort)
}

// ─── Tests ───────────────────────────────────────────────
describe('DeleteAccountUseCase', () => {
  let accessToken: string
  let passwordHash: string

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.mocked(mockUserRepository.softDelete).mockResolvedValue()
    vi.mocked(mockSessionPort.blacklistToken).mockResolvedValue()
    vi.mocked(mockSessionPort.deleteRefreshToken).mockResolvedValue()

    accessToken = jwtUtils.signAccessToken({ sub: 'user-123', email: 'john@example.com' })
    passwordHash = await hash('Password1!')
  })

  describe('cuando las credenciales son validas', () => {
    beforeEach(() => {
      vi.mocked(mockUserRepository.findById).mockResolvedValue(makeUser({ passwordHash }))
    })

    it('debe hacer soft delete del usuario', async () => {
      const useCase = makeUseCase()
      await useCase.execute({ userId: 'user-123', password: 'Password1!', accessToken })

      expect(mockUserRepository.softDelete).toHaveBeenCalledOnce()
      expect(mockUserRepository.softDelete).toHaveBeenCalledWith('user-123')
    })

    it('debe invalidar la sesion activa', async () => {
      const useCase = makeUseCase()
      await useCase.execute({ userId: 'user-123', password: 'Password1!', accessToken })

      expect(mockSessionPort.blacklistToken).toHaveBeenCalledOnce()
      expect(mockSessionPort.deleteRefreshToken).toHaveBeenCalledOnce()
    })

    it('debe retornar mensaje de exito', async () => {
      const useCase = makeUseCase()
      const result = await useCase.execute({
        userId: 'user-123',
        password: 'Password1!',
        accessToken,
      })

      expect(result.message).toBeDefined()
    })
  })

  describe('cuando el usuario no existe', () => {
    it('debe lanzar UserNotFoundError', async () => {
      vi.mocked(mockUserRepository.findById).mockResolvedValue(null)

      const useCase = makeUseCase()

      await expect(
        useCase.execute({ userId: 'nonexistent', password: 'Password1!', accessToken })
      ).rejects.toThrow(UserNotFoundError)
    })
  })

  describe('cuando la contraseña es incorrecta', () => {
    it('debe lanzar InvalidCredentialsError', async () => {
      vi.mocked(mockUserRepository.findById).mockResolvedValue(makeUser({ passwordHash }))

      const useCase = makeUseCase()

      await expect(
        useCase.execute({ userId: 'user-123', password: 'WrongPassword1!', accessToken })
      ).rejects.toThrow(InvalidCredentialsError)
    })

    it('no debe hacer soft delete si la contraseña es incorrecta', async () => {
      vi.mocked(mockUserRepository.findById).mockResolvedValue(makeUser({ passwordHash }))

      const useCase = makeUseCase()

      await expect(
        useCase.execute({ userId: 'user-123', password: 'WrongPassword1!', accessToken })
      ).rejects.toThrow()

      expect(mockUserRepository.softDelete).not.toHaveBeenCalled()
    })
  })

  describe('cuando la cuenta no esta activa', () => {
    it('debe lanzar AccountNotActiveError si esta pendiente', async () => {
      vi.mocked(mockUserRepository.findById).mockResolvedValue(
        makeUser({ passwordHash, status: 'pending' })
      )

      const useCase = makeUseCase()

      await expect(
        useCase.execute({ userId: 'user-123', password: 'Password1!', accessToken })
      ).rejects.toThrow(AccountNotActiveError)
    })

    it('debe lanzar AccountNotActiveError si ya fue eliminada', async () => {
      vi.mocked(mockUserRepository.findById).mockResolvedValue(
        makeUser({ passwordHash, deletedAt: new Date() })
      )

      const useCase = makeUseCase()

      await expect(
        useCase.execute({ userId: 'user-123', password: 'Password1!', accessToken })
      ).rejects.toThrow(AccountNotActiveError)
    })
  })
})
