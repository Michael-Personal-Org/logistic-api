import {
  InvalidRoleForProfileError,
  ProfileAlreadyExistsError,
} from '@/features/profiles/domain/profile.errors'
import type { IProfileRepository } from '@/features/profiles/domain/profile.repository'
import { UserEntity } from '@/features/users/domain/user.entity'
import { UserNotFoundError } from '@/features/users/domain/user.errors'
import type { IUserRepository } from '@/features/users/domain/user.repository'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CreateDriverProfileUseCase } from './create-driver-profile.use-case'

function makeUser(overrides: Partial<Parameters<typeof UserEntity.create>[0]> = {}) {
  return UserEntity.create({
    id: 'user-123',
    email: 'driver@example.com',
    passwordHash: 'hash',
    firstName: 'John',
    lastName: 'Doe',
    status: 'active',
    role: 'DRIVER',
    twoFactorSecret: null,
    twoFactorEnabled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  })
}

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
  return new CreateDriverProfileUseCase(mockProfileRepository, mockUserRepository)
}

describe('CreateDriverProfileUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(mockProfileRepository.saveDriverProfile).mockResolvedValue()
    vi.mocked(mockProfileRepository.findDriverProfileByUserId).mockResolvedValue(null)
  })

  describe('cuando el perfil se crea correctamente', () => {
    beforeEach(() => {
      vi.mocked(mockUserRepository.findById).mockResolvedValue(makeUser())
    })

    it('debe crear el perfil y retornar profileId', async () => {
      const useCase = makeUseCase()
      const result = await useCase.execute({
        userId: 'user-123',
        vehiclePlate: 'A123456',
        licenseNumber: 'LIC12345',
        licenseType: 'B',
      })

      expect(result.profileId).toBeDefined()
      expect(mockProfileRepository.saveDriverProfile).toHaveBeenCalledOnce()
    })

    it('debe crear el perfil con isAvailable false', async () => {
      const useCase = makeUseCase()
      await useCase.execute({
        userId: 'user-123',
        vehiclePlate: 'A123456',
        licenseNumber: 'LIC12345',
        licenseType: 'B',
      })

      const savedProfile = vi.mocked(mockProfileRepository.saveDriverProfile).mock.calls[0]?.[0]
      expect(savedProfile?.isAvailable).toBe(false)
    })

    it('debe normalizar la placa a mayusculas', async () => {
      const useCase = makeUseCase()
      await useCase.execute({
        userId: 'user-123',
        vehiclePlate: 'a123456',
        licenseNumber: 'lic12345',
        licenseType: 'b',
      })

      const savedProfile = vi.mocked(mockProfileRepository.saveDriverProfile).mock.calls[0]?.[0]
      expect(savedProfile?.vehiclePlate).toBe('A123456')
      expect(savedProfile?.licenseNumber).toBe('LIC12345')
    })
  })

  describe('cuando el usuario no es DRIVER', () => {
    it('debe lanzar InvalidRoleForProfileError', async () => {
      vi.mocked(mockUserRepository.findById).mockResolvedValue(makeUser({ role: 'CLIENT' }))

      const useCase = makeUseCase()

      await expect(
        useCase.execute({
          userId: 'user-123',
          vehiclePlate: 'A123456',
          licenseNumber: 'LIC12345',
          licenseType: 'B',
        })
      ).rejects.toThrow(InvalidRoleForProfileError)
    })
  })

  describe('cuando ya tiene un perfil', () => {
    it('debe lanzar ProfileAlreadyExistsError', async () => {
      vi.mocked(mockUserRepository.findById).mockResolvedValue(makeUser())
      vi.mocked(mockProfileRepository.findDriverProfileByUserId).mockResolvedValue({
        id: 'profile-123',
      } as never)

      const useCase = makeUseCase()

      await expect(
        useCase.execute({
          userId: 'user-123',
          vehiclePlate: 'A123456',
          licenseNumber: 'LIC12345',
          licenseType: 'B',
        })
      ).rejects.toThrow(ProfileAlreadyExistsError)
    })
  })

  describe('cuando el usuario no existe', () => {
    it('debe lanzar UserNotFoundError', async () => {
      vi.mocked(mockUserRepository.findById).mockResolvedValue(null)

      const useCase = makeUseCase()

      await expect(
        useCase.execute({
          userId: 'nonexistent',
          vehiclePlate: 'A123456',
          licenseNumber: 'LIC12345',
          licenseType: 'B',
        })
      ).rejects.toThrow(UserNotFoundError)
    })
  })
})
