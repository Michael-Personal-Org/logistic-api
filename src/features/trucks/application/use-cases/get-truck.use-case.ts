import type { CargoType } from '@/features/trucks/domain/truck.entity'
import { TruckNotFoundError } from '@/features/trucks/domain/truck.errors'
import type { ITruckRepository } from '@/features/trucks/domain/truck.repository'

export interface GetTruckInput {
  truckId: string
}

export interface GetTruckOutput {
  id: string
  plateNumber: string
  model: string
  capacity: string
  allowedCargoTypes: CargoType[]
  isAvailable: boolean
  assignedDriverId: string | null
  createdAt: Date
  updatedAt: Date
}

export class GetTruckUseCase {
  constructor(private readonly truckRepository: ITruckRepository) {}

  async execute(input: GetTruckInput): Promise<GetTruckOutput> {
    const truck = await this.truckRepository.findById(input.truckId)
    if (!truck || truck.isDeleted()) {
      throw new TruckNotFoundError(input.truckId)
    }

    return {
      id: truck.id,
      plateNumber: truck.plateNumber,
      model: truck.model,
      capacity: truck.capacity,
      allowedCargoTypes: truck.allowedCargoTypes,
      isAvailable: truck.isAvailable,
      assignedDriverId: truck.assignedDriverId,
      createdAt: truck.createdAt,
      updatedAt: truck.updatedAt,
    }
  }
}
