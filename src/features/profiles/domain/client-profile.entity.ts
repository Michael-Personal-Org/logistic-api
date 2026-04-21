export interface ClientProfileProps {
  id: string
  userId: string
  companyName: string
  rnc: string | null
  isApproved: boolean
  approvedBy: string | null
  approvedAt: Date | null
  emergencyContact: string | null
  createdAt: Date
  updatedAt: Date
}

export class ClientProfileEntity {
  private constructor(private readonly props: ClientProfileProps) {}

  static create(props: ClientProfileProps): ClientProfileEntity {
    return new ClientProfileEntity(props)
  }

  get id(): string {
    return this.props.id
  }
  get userId(): string {
    return this.props.userId
  }
  get companyName(): string {
    return this.props.companyName
  }
  get rnc(): string | null {
    return this.props.rnc
  }
  get isApproved(): boolean {
    return this.props.isApproved
  }
  get approvedBy(): string | null {
    return this.props.approvedBy
  }
  get approvedAt(): Date | null {
    return this.props.approvedAt
  }
  get emergencyContact(): string | null {
    return this.props.emergencyContact
  }
  get createdAt(): Date {
    return this.props.createdAt
  }
  get updatedAt(): Date {
    return this.props.updatedAt
  }

  isPending(): boolean {
    return !this.props.isApproved
  }

  toObject(): ClientProfileProps {
    return { ...this.props }
  }
}
