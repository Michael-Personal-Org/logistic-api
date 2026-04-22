import { TruckEntity } from '@/features/trucks/domain/truck.entity'
import { TruckNotFoundError } from '@/features/trucks/domain/truck.errors'
import type { ITruckRepository } from '@/features/trucks/domain/truck.repository'
import type { AuditService } from '@/shared/services/audit.service'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DeleteTruckUseCase } from './delete-truck.use-case'

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

const mockTruckRepository: ITruckRepository = {
  findById: vi.fn(),
  findByPlateNumber: vi.fn(),
  findMany: vi.fn(),
  save: vi.fn(),
  update: vi.fn(),
  softDelete: vi.fn(),
}

const mockAuditService = {
  log: vi.fn().mockResolvedValue(undefined),
} as unknown as AuditService

function makeUseCase() {
  return new DeleteTruckUseCase(mockTruckRepository, mockAuditService)
}

describe('DeleteTruckUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(mockTruckRepository.softDelete).mockResolvedValue()
  })

  describe('cuando el camión existe', () => {
    it('debe hacer soft delete', async () => {
      vi.mocked(mockTruckRepository.findById).mockResolvedValue(makeTruck())

      const useCase = makeUseCase()
      const result = await useCase.execute({
        truckId: 'truck-123',
        performedBy: 'admin-456',
      })

      expect(mockTruckRepository.softDelete).toHaveBeenCalledOnce()
      expect(mockTruckRepository.softDelete).toHaveBeenCalledWith('truck-123')
      expect(result.message).toBeDefined()
    })

    it('debe registrar audit log', async () => {
      vi.mocked(mockTruckRepository.findById).mockResolvedValue(makeTruck())

      const useCase = makeUseCase()
      await useCase.execute({ truckId: 'truck-123', performedBy: 'admin-456' })

      expect(mockAuditService.log).toHaveBeenCalledOnce()
    })
  })

  describe('cuando el camión no existe', () => {
    it('debe lanzar TruckNotFoundError', async () => {
      vi.mocked(mockTruckRepository.findById).mockResolvedValue(null)

      const useCase = makeUseCase()

      await expect(
        useCase.execute({ truckId: 'nonexistent', performedBy: 'admin-456' })
      ).rejects.toThrow(TruckNotFoundError)
    })
  })

  describe('cuando el camión ya fue eliminado', () => {
    it('debe lanzar TruckNotFoundError', async () => {
      vi.mocked(mockTruckRepository.findById).mockResolvedValue(
        makeTruck({ deletedAt: new Date() })
      )

      const useCase = makeUseCase()

      await expect(
        useCase.execute({ truckId: 'truck-123', performedBy: 'admin-456' })
      ).rejects.toThrow(TruckNotFoundError)
    })
  })
})
