export type CargoType =
  | 'GENERAL'
  | 'FRAGILE'
  | 'CHEMICAL'
  | 'TEXTILE'
  | 'REFRIGERATED'
  | 'HAZARDOUS'

export interface TruckProps {
  id: string
  plateNumber: string
  model: string
  capacity: string
  allowedCargoTypes: CargoType[]
  isAvailable: boolean
  assignedDriverId: string | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export class TruckEntity {
  private constructor(private readonly props: TruckProps) {}

  static create(props: TruckProps): TruckEntity {
    return new TruckEntity(props)
  }

  get id(): string {
    return this.props.id
  }
  get plateNumber(): string {
    return this.props.plateNumber
  }
  get model(): string {
    return this.props.model
  }
  get capacity(): string {
    return this.props.capacity
  }
  get allowedCargoType(): CargoType[] {
    return this.props.allowedCargoTypes
  }
  get isAvailable(): boolean {
    return this.props.isAvailable
  }
  get assignedDriverId(): string | null {
    return this.props.assignedDriverId
  }
  get createdAt(): Date {
    return this.props.createdAt
  }
  get updatedAt(): Date {
    return this.props.updatedAt
  }
  get deletedAt(): Date | null {
    return this.props.deletedAt
  }

  isDeleted(): boolean {
    return this.props.deletedAt !== null
  }

  isAssigned(): boolean {
    return this.props.assignedDriverId !== null
  }

  supportsCargoType(cargType: CargoType): boolean {
    return this.props.allowedCargoTypes.includes(cargType)
  }

  isReadyForAssignment(): boolean {
    return this.props.isAvailable && !this.isDeleted()
  }

  toObject(): TruckProps {
    return { ...this.props }
  }
}
