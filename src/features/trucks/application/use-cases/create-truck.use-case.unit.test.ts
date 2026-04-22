import { TruckAlreadyExistsError } from '@/features/trucks/domain/truck.errors'
import type { ITruckRepository } from '@/features/trucks/domain/truck.repository'
import type { AuditService } from '@/shared/services/audit.service'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CreateTruckUseCase } from './create-truck.use-case'

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
  return new CreateTruckUseCase(mockTruckRepository, mockAuditService)
}

describe('CreateTruckUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(mockTruckRepository.findByPlateNumber).mockResolvedValue(null)
    vi.mocked(mockTruckRepository.save).mockResolvedValue()
  })

  describe('cuando el camión se crea correctamente', () => {
    it('debe crear el camión y retornar truckId', async () => {
      const useCase = makeUseCase()
      const result = await useCase.execute({
        plateNumber: 'A123456',
        model: 'Volvo FH16',
        capacity: '20 toneladas',
        allowedCargoTypes: ['GENERAL', 'FRAGILE'],
        performedBy: 'admin-123',
      })

      expect(result.truckId).toBeDefined()
      expect(mockTruckRepository.save).toHaveBeenCalledOnce()
    })

    it('debe normalizar la placa a mayusculas', async () => {
      const useCase = makeUseCase()
      await useCase.execute({
        plateNumber: 'a123456',
        model: 'Volvo FH16',
        capacity: '20 toneladas',
        allowedCargoTypes: ['GENERAL'],
        performedBy: 'admin-123',
      })

      const savedTruck = vi.mocked(mockTruckRepository.save).mock.calls[0]?.[0]
      expect(savedTruck?.plateNumber).toBe('A123456')
    })

    it('debe crear el camión como disponible por defecto', async () => {
      const useCase = makeUseCase()
      await useCase.execute({
        plateNumber: 'A123456',
        model: 'Volvo FH16',
        capacity: '20 toneladas',
        allowedCargoTypes: ['GENERAL'],
        performedBy: 'admin-123',
      })

      const savedTruck = vi.mocked(mockTruckRepository.save).mock.calls[0]?.[0]
      expect(savedTruck?.isAvailable).toBe(true)
      expect(savedTruck?.assignedDriverId).toBeNull()
    })

    it('debe registrar audit log', async () => {
      const useCase = makeUseCase()
      await useCase.execute({
        plateNumber: 'A123456',
        model: 'Volvo FH16',
        capacity: '20 toneladas',
        allowedCargoTypes: ['GENERAL'],
        performedBy: 'admin-123',
      })

      expect(mockAuditService.log).toHaveBeenCalledOnce()
    })
  })

  describe('cuando la placa ya existe', () => {
    it('debe lanzar TruckAlreadyExistsError', async () => {
      vi.mocked(mockTruckRepository.findByPlateNumber).mockResolvedValue({
        isDeleted: () => false,
      } as never)

      const useCase = makeUseCase()

      await expect(
        useCase.execute({
          plateNumber: 'A123456',
          model: 'Volvo FH16',
          capacity: '20 toneladas',
          allowedCargoTypes: ['GENERAL'],
          performedBy: 'admin-123',
        })
      ).rejects.toThrow(TruckAlreadyExistsError)
    })
  })
})
