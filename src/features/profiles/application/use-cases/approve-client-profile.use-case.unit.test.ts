import { ClientProfileEntity } from '@/features/profiles/domain/client-profile.entity'
import { ProfileNotFoundError } from '@/features/profiles/domain/profile.errors'
import type { IProfileRepository } from '@/features/profiles/domain/profile.repository'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApproveClientProfileUseCase } from './approve-client-profile.use-case'

function makeProfile(overrides: Partial<Parameters<typeof ClientProfileEntity.create>[0]> = {}) {
  return ClientProfileEntity.create({
    id: 'profile-123',
    userId: 'user-123',
    companyName: 'Mi Empresa S.A.',
    rnc: '123456789',
    isApproved: false,
    approvedBy: null,
    approvedAt: null,
    emergencyContact: null,
    createdAt: new Date(),
    updatedAt: new Date(),
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

function makeUseCase() {
  return new ApproveClientProfileUseCase(mockProfileRepository)
}

describe('ApproveClientProfileUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(mockProfileRepository.updateClientProfile).mockResolvedValue()
  })

  describe('cuando el perfil existe y está pendiente', () => {
    it('debe aprobar el perfil', async () => {
      vi.mocked(mockProfileRepository.findClientProfileByUserId).mockResolvedValue(makeProfile())

      const useCase = makeUseCase()
      await useCase.execute({ userId: 'user-123', approvedBy: 'operator-456' })

      expect(mockProfileRepository.updateClientProfile).toHaveBeenCalledOnce()
      const updatedProfile = vi.mocked(mockProfileRepository.updateClientProfile).mock.calls[0]?.[0]
      expect(updatedProfile?.isApproved).toBe(true)
      expect(updatedProfile?.approvedBy).toBe('operator-456')
    })
  })

  describe('cuando el perfil ya está aprobado', () => {
    it('debe retornar mensaje sin actualizar', async () => {
      vi.mocked(mockProfileRepository.findClientProfileByUserId).mockResolvedValue(
        makeProfile({ isApproved: true, approvedBy: 'operator-123', approvedAt: new Date() })
      )

      const useCase = makeUseCase()
      const result = await useCase.execute({ userId: 'user-123', approvedBy: 'operator-456' })

      expect(mockProfileRepository.updateClientProfile).not.toHaveBeenCalled()
      expect(result.message).toBeDefined()
    })
  })

  describe('cuando el perfil no existe', () => {
    it('debe lanzar ProfileNotFoundError', async () => {
      vi.mocked(mockProfileRepository.findClientProfileByUserId).mockResolvedValue(null)

      const useCase = makeUseCase()

      await expect(
        useCase.execute({ userId: 'nonexistent', approvedBy: 'operator-456' })
      ).rejects.toThrow(ProfileNotFoundError)
    })
  })
})
