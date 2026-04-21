import { AUDIT_ACTIONS, AUDIT_RESOURCES } from '@/features/audit/domain/audit-log.constants'
import { TruckEntity } from '@/features/trucks/domain/truck.entity'
import type { CargoType } from '@/features/trucks/domain/truck.entity'
import { TruckAlreadyExistsError } from '@/features/trucks/domain/truck.errors'
import type { ITruckRepository } from '@/features/trucks/domain/truck.repository'
import type { AuditService } from '@/shared/services/audit.service'

export interface CreateTruckInput {
  plateNumber: string
  model: string
  capacity: string
  allowedCargoTypes: CargoType[]
  performedBy: string
  ipAddress?: string
}

export interface CreateTruckOutput {
  truckId: string
  message: string
}

export class CreateTruckUseCase {
  constructor(
    private readonly truckRepository: ITruckRepository,
    private readonly auditService: AuditService
  ) {}

  async execute(input: CreateTruckInput): Promise<CreateTruckOutput> {
    // 1. Verificar que la placa no exista
    const existing = await this.truckRepository.findByPlateNumber(
      input.plateNumber.toUpperCase().trim()
    )
    if (existing && !existing.isDeleted()) {
      throw new TruckAlreadyExistsError(input.plateNumber)
    }

    // 2. Crear entidad
    const now = new Date()
    const truck = TruckEntity.create({
      id: crypto.randomUUID(),
      plateNumber: input.plateNumber.toUpperCase().trim(),
      model: input.model.trim(),
      capacity: input.capacity.trim(),
      allowedCargoTypes: input.allowedCargoTypes,
      isAvailable: true,
      assignedDriverId: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    })

    await this.truckRepository.save(truck)

    // 3. Audit log
    await this.auditService.log(
      { userId: input.performedBy, ipAddress: input.ipAddress },
      AUDIT_ACTIONS.TRUCK_CREATED,
      AUDIT_RESOURCES.TRUCK,
      truck.id,
      { plateNumber: truck.plateNumber, model: truck.model }
    )

    return {
      truckId: truck.id,
      message: 'Camión registrado correctamente.',
    }
  }
}
