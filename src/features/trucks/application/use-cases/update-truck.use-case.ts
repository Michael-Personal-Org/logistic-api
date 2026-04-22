import { AUDIT_ACTIONS, AUDIT_RESOURCES } from '@/features/audit/domain/audit-log.constants'
import { TruckEntity } from '@/features/trucks/domain/truck.entity'
import type { CargoType } from '@/features/trucks/domain/truck.entity'
import { TruckNotFoundError } from '@/features/trucks/domain/truck.errors'
import type { ITruckRepository } from '@/features/trucks/domain/truck.repository'
import type { AuditService } from '@/shared/services/audit.service'

export interface UpdateTruckInput {
  truckId: string
  model?: string
  capacity?: string
  allowedCargoTypes?: CargoType[]
  isAvailable?: boolean
  performedBy: string
  ipAddress?: string
}

export interface UpdateTruckOutput {
  message: string
}

export class UpdateTruckUseCase {
  constructor(
    private readonly truckRepository: ITruckRepository,
    private readonly auditService: AuditService
  ) {}

  async execute(input: UpdateTruckInput): Promise<UpdateTruckOutput> {
    const truck = await this.truckRepository.findById(input.truckId)
    if (!truck || truck.isDeleted()) {
      throw new TruckNotFoundError(input.truckId)
    }

    const updated = TruckEntity.create({
      ...truck.toObject(),
      model: input.model?.trim() ?? truck.model,
      capacity: input.capacity?.trim() ?? truck.capacity,
      allowedCargoTypes: input.allowedCargoTypes ?? truck.allowedCargoTypes,
      isAvailable: input.isAvailable ?? truck.isAvailable,
      updatedAt: new Date(),
    })

    await this.truckRepository.update(updated)

    await this.auditService.log(
      { userId: input.performedBy, ipAddress: input.ipAddress },
      AUDIT_ACTIONS.TRUCK_UPDATED,
      AUDIT_RESOURCES.TRUCK,
      truck.id,
      { changes: input }
    )

    return { message: 'Camión actualizado correctamente.' }
  }
}
