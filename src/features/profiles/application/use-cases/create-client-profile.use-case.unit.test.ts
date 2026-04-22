import {
  InvalidRoleForProfileError,
  ProfileAlreadyExistsError,
} from '@/features/profiles/domain/profile.errors'
import type { IProfileRepository } from '@/features/profiles/domain/profile.repository'
import { UserEntity } from '@/features/users/domain/user.entity'
import { UserNotFoundError } from '@/features/users/domain/user.errors'
import type { IUserRepository } from '@/features/users/domain/user.repository'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CreateClientProfileUseCase } from './create-client-profile.use-case'

// ─── Helpers ─────────────────────────────────────────────
function makeUser(overrides: Partial<Parameters<typeof UserEntity.create>[0]> = {}) {
  return UserEntity.create({
    id: 'user-123',
    email: 'client@example.com',
    passwordHash: 'hash',
    firstName: 'John',
    lastName: 'Doe',
    status: 'active',
    role: 'CLIENT',
    twoFactorSecret: null,
    twoFactorEnabled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  })
}

// ─── Mocks ───────────────────────────────────────────────
const mockProfileRepository: IProfileRepository = {
  findClientProfileByUserId: vi.fn(),
  saveClientProfile: vi.fn(),
  updateClientProfile: vi.fn(),
  findDriverProfileByUserId: vi.fn(),
  saveDriverProfile: vi.fn(),
  updateDriverProfile: vi.fn(),
}

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
  return new CreateClientProfileUseCase(mockProfileRepository, mockUserRepository)
}

// ─── Tests ───────────────────────────────────────────────
describe('CreateClientProfileUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(mockProfileRepository.saveClientProfile).mockResolvedValue()
    vi.mocked(mockProfileRepository.findClientProfileByUserId).mockResolvedValue(null)
  })

  describe('cuando el perfil se crea correctamente', () => {
    beforeEach(() => {
      vi.mocked(mockUserRepository.findById).mockResolvedValue(makeUser())
    })

    it('debe crear el perfil y retornar el profileId', async () => {
      const useCase = makeUseCase()
      const result = await useCase.execute({
        userId: 'user-123',
        companyName: 'Mi Empresa S.A.',
        rnc: '123456789',
      })

      expect(result.profileId).toBeDefined()
      expect(mockProfileRepository.saveClientProfile).toHaveBeenCalledOnce()
    })

    it('debe crear el perfil con isApproved false', async () => {
      const useCase = makeUseCase()
      await useCase.execute({
        userId: 'user-123',
        companyName: 'Mi Empresa S.A.',
      })

      const savedProfile = vi.mocked(mockProfileRepository.saveClientProfile).mock.calls[0]?.[0]
      expect(savedProfile?.isApproved).toBe(false)
    })

    it('debe retornar mensaje de pendiente de aprobacion', async () => {
      const useCase = makeUseCase()
      const result = await useCase.execute({
        userId: 'user-123',
        companyName: 'Mi Empresa S.A.',
      })

      expect(result.message).toBeDefined()
    })
  })

  describe('cuando el usuario no existe', () => {
    it('debe lanzar UserNotFoundError', async () => {
      vi.mocked(mockUserRepository.findById).mockResolvedValue(null)

      const useCase = makeUseCase()

      await expect(
        useCase.execute({ userId: 'nonexistent', companyName: 'Empresa' })
      ).rejects.toThrow(UserNotFoundError)
    })
  })

  describe('cuando el usuario no es CLIENT', () => {
    it('debe lanzar InvalidRoleForProfileError', async () => {
      vi.mocked(mockUserRepository.findById).mockResolvedValue(makeUser({ role: 'DRIVER' }))

      const useCase = makeUseCase()

      await expect(useCase.execute({ userId: 'user-123', companyName: 'Empresa' })).rejects.toThrow(
        InvalidRoleForProfileError
      )
    })
  })

  describe('cuando ya tiene un perfil', () => {
    it('debe lanzar ProfileAlreadyExistsError', async () => {
      vi.mocked(mockUserRepository.findById).mockResolvedValue(makeUser())
      vi.mocked(mockProfileRepository.findClientProfileByUserId).mockResolvedValue({
        id: 'profile-123',
      } as never)

      const useCase = makeUseCase()

      await expect(useCase.execute({ userId: 'user-123', companyName: 'Empresa' })).rejects.toThrow(
        ProfileAlreadyExistsError
      )
    })
  })
})
