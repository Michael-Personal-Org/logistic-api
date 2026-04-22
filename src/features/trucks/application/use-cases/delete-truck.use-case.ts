import { AUDIT_ACTIONS, AUDIT_RESOURCES } from '@/features/audit/domain/audit-log.constants'
import { TruckNotFoundError } from '@/features/trucks/domain/truck.errors'
import type { ITruckRepository } from '@/features/trucks/domain/truck.repository'
import type { AuditService } from '@/shared/services/audit.service'

export interface DeleteTruckInput {
  truckId: string
  performedBy: string
  ipAddress?: string
}

export interface DeleteTruckOutput {
  message: string
}

export class DeleteTruckUseCase {
  constructor(
    private readonly truckRepository: ITruckRepository,
    private readonly auditService: AuditService
  ) {}

  async execute(input: DeleteTruckInput): Promise<DeleteTruckOutput> {
    const truck = await this.truckRepository.findById(input.truckId)
    if (!truck || truck.isDeleted()) {
      throw new TruckNotFoundError(input.truckId)
    }

    await this.truckRepository.softDelete(input.truckId)

    await this.auditService.log(
      { userId: input.performedBy, ipAddress: input.ipAddress },
      AUDIT_ACTIONS.TRUCK_DELETED,
      AUDIT_RESOURCES.TRUCK,
      input.truckId,
      { plateNumber: truck.plateNumber }
    )

    return { message: 'Camión eliminado correctamente.' }
  }
}
