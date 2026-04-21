import type { TruckEntity } from './truck.entity'
import type { CargoType } from './truck.entity'

export interface FindTrucksOptions {
  isAvailable?: boolean | undefined
  cargoType?: CargoType | undefined
  assignedDriverId?: string | undefined
  page: number
  limit: number
}

export interface FindTrucksResult {
  trucks: TruckEntity[]
  total: number
}

export interface ITruckRepository {
  findById(id: string): Promise<TruckEntity | null>
  findByPlateNumber(plateNumber: string): Promise<TruckEntity | null>
  findMany(options: FindTrucksOptions): Promise<FindTrucksResult>
  save(truck: TruckEntity): Promise<void>
  update(truck: TruckEntity): Promise<void>
  softDelete(id: string): Promise<void>
}
