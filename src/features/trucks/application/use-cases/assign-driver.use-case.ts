import { AUDIT_ACTIONS, AUDIT_RESOURCES } from '@/features/audit/domain/audit-log.constants'
import { TruckEntity } from '@/features/trucks/domain/truck.entity'
import {
  TruckAlreadyAssignedError,
  TruckNotFoundError,
} from '@/features/trucks/domain/truck.errors'
import type { ITruckRepository } from '@/features/trucks/domain/truck.repository'
import { UserNotFoundError } from '@/features/users/domain/user.errors'
import type { IUserRepository } from '@/features/users/domain/user.repository'
import type { AuditService } from '@/shared/services/audit.service'

export interface AssignDriverInput {
  truckId: string
  driverId: string
  performedBy: string
  ipAddress?: string
}

export interface AssignDriverOutput {
  message: string
}

export class AssignDriverUseCase {
  constructor(
    private readonly truckRepository: ITruckRepository,
    private readonly userRepository: IUserRepository,
    private readonly auditService: AuditService
  ) {}

  async execute(input: AssignDriverInput): Promise<AssignDriverOutput> {
    // 1. Verificar que el camión existe
    const truck = await this.truckRepository.findById(input.truckId)
    if (!truck || truck.isDeleted()) {
      throw new TruckNotFoundError(input.truckId)
    }

    // 2. Verificar que no tenga ya un conductor asignado
    if (truck.isAssigned()) {
      throw new TruckAlreadyAssignedError()
    }

    // 3. Verificar que el conductor existe y tiene rol DRIVER
    const driver = await this.userRepository.findById(input.driverId)
    if (!driver || !driver.isDriver()) {
      throw new UserNotFoundError(input.driverId)
    }

    // 4. Asignar conductor
    const updated = TruckEntity.create({
      ...truck.toObject(),
      assignedDriverId: input.driverId,
      updatedAt: new Date(),
    })

    await this.truckRepository.update(updated)

    await this.auditService.log(
      { userId: input.performedBy, ipAddress: input.ipAddress },
      AUDIT_ACTIONS.TRUCK_ASSIGNED,
      AUDIT_RESOURCES.TRUCK,
      truck.id,
      { driverId: input.driverId, plateNumber: truck.plateNumber }
    )

    return { message: 'Conductor asignado correctamente.' }
  }
}
