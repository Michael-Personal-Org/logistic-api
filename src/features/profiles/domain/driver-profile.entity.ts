export interface DriverProfileProps {
  id: string
  userId: string
  vehiclePlate: string
  licenseNumber: string
  licenseType: string
  isAvailable: boolean
  createdAt: Date
  updatedAt: Date
}

export class DriverProfileEntity {
  private constructor(private readonly props: DriverProfileProps) {}

  static create(props: DriverProfileProps): DriverProfileEntity {
    return new DriverProfileEntity(props)
  }

  get id(): string {
    return this.props.id
  }
  get userId(): string {
    return this.props.userId
  }
  get vehiclePlate(): string {
    return this.props.vehiclePlate
  }
  get licenseNumber(): string {
    return this.props.licenseNumber
  }
  get licenseType(): string {
    return this.props.licenseType
  }
  get isAvailable(): boolean {
    return this.props.isAvailable
  }
  get createdAt(): Date {
    return this.props.createdAt
  }
  get updatedAt(): Date {
    return this.props.updatedAt
  }

  isReadyForAssignment(): boolean {
    return this.props.isAvailable
  }

  toObject(): DriverProfileProps {
    return { ...this.props }
  }
}
