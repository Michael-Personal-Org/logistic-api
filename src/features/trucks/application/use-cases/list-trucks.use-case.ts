import type { CargoType } from '@/features/trucks/domain/truck.entity'
import type { ITruckRepository } from '@/features/trucks/domain/truck.repository'

export interface ListTrucksInput {
  isAvailable?: boolean
  cargoType?: CargoType
  page: number
  limit: number
}

export interface TruckSummary {
  id: string
  plateNumber: string
  model: string
  capacity: string
  allowedCargoTypes: CargoType[]
  isAvailable: boolean
  assignedDriverId: string | null
}

export interface ListTrucksOutput {
  trucks: TruckSummary[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export class ListTrucksUseCase {
  constructor(private readonly truckRepository: ITruckRepository) {}

  async execute(input: ListTrucksInput): Promise<ListTrucksOutput> {
    const { trucks, total } = await this.truckRepository.findMany({
      isAvailable: input.isAvailable,
      cargoType: input.cargoType,
      page: input.page,
      limit: input.limit,
    })

    return {
      trucks: trucks.map((truck) => ({
        id: truck.id,
        plateNumber: truck.plateNumber,
        model: truck.model,
        capacity: truck.capacity,
        allowedCargoTypes: truck.allowedCargoTypes,
        isAvailable: truck.isAvailable,
        assignedDriverId: truck.assignedDriverId,
      })),
      total,
      page: input.page,
      limit: input.limit,
      totalPages: Math.ceil(total / input.limit),
    }
  }
}
