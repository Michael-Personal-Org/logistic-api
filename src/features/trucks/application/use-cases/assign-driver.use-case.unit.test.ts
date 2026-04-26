import { TruckEntity } from '@/features/trucks/domain/truck.entity'
import {
  TruckAlreadyAssignedError,
  TruckNotFoundError,
} from '@/features/trucks/domain/truck.errors'
import type { ITruckRepository } from '@/features/trucks/domain/truck.repository'
import { UserEntity } from '@/features/users/domain/user.entity'
import type { IUserRepository } from '@/features/users/domain/user.repository'
import type { AuditService } from '@/shared/services/audit.service'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AssignDriverUseCase } from './assign-driver.use-case'

function makeTruck(overrides: Partial<Parameters<typeof TruckEntity.create>[0]> = {}) {
  return TruckEntity.create({
    id: 'truck-123',
    plateNumber: 'A123456',
    model: 'Volvo FH16',
    capacity: '20 toneladas',
    allowedCargoTypes: ['GENERAL'],
    isAvailable: true,
    assignedDriverId: null,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  })
}

function makeDriver(overrides: Partial<Parameters<typeof UserEntity.create>[0]> = {}) {
  return UserEntity.create({
    id: 'driver-123',
    email: 'driver@example.com',
    passwordHash: 'hash',
    firstName: 'John',
    lastName: 'Doe',
    phone: null,
    jobTitle: null,
    organizationId: null,
    mustChangePassword: false,
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

const mockTruckRepository: ITruckRepository = {
  findById: vi.fn(),
  findByPlateNumber: vi.fn(),
  findMany: vi.fn(),
  save: vi.fn(),
  update: vi.fn(),
  softDelete: vi.fn(),
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

const mockAuditService = {
  log: vi.fn().mockResolvedValue(undefined),
} as unknown as AuditService

function makeUseCase() {
  return new AssignDriverUseCase(mockTruckRepository, mockUserRepository, mockAuditService)
}

describe('AssignDriverUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(mockTruckRepository.update).mockResolvedValue()
  })

  describe('cuando la asignación es exitosa', () => {
    beforeEach(() => {
      vi.mocked(mockTruckRepository.findById).mockResolvedValue(makeTruck())
      vi.mocked(mockUserRepository.findById).mockResolvedValue(makeDriver())
    })

    it('debe asignar el conductor al camión', async () => {
      const useCase = makeUseCase()
      await useCase.execute({
        truckId: 'truck-123',
        driverId: 'driver-123',
        performedBy: 'admin-456',
      })

      expect(mockTruckRepository.update).toHaveBeenCalledOnce()
      const updatedTruck = vi.mocked(mockTruckRepository.update).mock.calls[0]?.[0]
      expect(updatedTruck?.assignedDriverId).toBe('driver-123')
    })

    it('debe registrar audit log', async () => {
      const useCase = makeUseCase()
      await useCase.execute({
        truckId: 'truck-123',
        driverId: 'driver-123',
        performedBy: 'admin-456',
      })

      expect(mockAuditService.log).toHaveBeenCalledOnce()
    })
  })

  describe('cuando el camión no existe', () => {
    it('debe lanzar TruckNotFoundError', async () => {
      vi.mocked(mockTruckRepository.findById).mockResolvedValue(null)

      const useCase = makeUseCase()

      await expect(
        useCase.execute({
          truckId: 'nonexistent',
          driverId: 'driver-123',
          performedBy: 'admin-456',
        })
      ).rejects.toThrow(TruckNotFoundError)
    })
  })

  describe('cuando el camión ya tiene conductor', () => {
    it('debe lanzar TruckAlreadyAssignedError', async () => {
      vi.mocked(mockTruckRepository.findById).mockResolvedValue(
        makeTruck({ assignedDriverId: 'other-driver' })
      )

      const useCase = makeUseCase()

      await expect(
        useCase.execute({ truckId: 'truck-123', driverId: 'driver-123', performedBy: 'admin-456' })
      ).rejects.toThrow(TruckAlreadyAssignedError)
    })
  })

  describe('cuando el usuario no es DRIVER', () => {
    it('debe lanzar UserNotFoundError', async () => {
      vi.mocked(mockTruckRepository.findById).mockResolvedValue(makeTruck())
      vi.mocked(mockUserRepository.findById).mockResolvedValue(makeDriver({ role: 'ORG_ADMIN' }))

      const useCase = makeUseCase()

      await expect(
        useCase.execute({ truckId: 'truck-123', driverId: 'driver-123', performedBy: 'admin-456' })
      ).rejects.toThrow()
    })
  })
})
