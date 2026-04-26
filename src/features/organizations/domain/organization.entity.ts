export type OrganizationStatus = 'pending' | 'active' | 'suspended'

export interface OrganizationProps {
  id: string
  name: string
  rnc: string | null
  phone: string
  email: string
  address: string
  industry: string | null
  status: OrganizationStatus
  isApproved: boolean
  approvedAt: Date | null
  approvedBy: string | null
  createdAt: Date
  updatedAt: Date
}

export class OrganizationEntity {
  private constructor(private readonly props: OrganizationProps) {}

  static create(props: OrganizationProps): OrganizationEntity {
    return new OrganizationEntity(props)
  }

  get id(): string {
    return this.props.id
  }
  get name(): string {
    return this.props.name
  }
  get rnc(): string | null {
    return this.props.rnc
  }
  get phone(): string {
    return this.props.phone
  }
  get email(): string {
    return this.props.email
  }
  get address(): string {
    return this.props.address
  }
  get industry(): string | null {
    return this.props.industry
  }
  get status(): OrganizationStatus {
    return this.props.status
  }
  get isApproved(): boolean {
    return this.props.isApproved
  }
  get approvedAt(): Date | null {
    return this.props.approvedAt
  }
  get approvedBy(): string | null {
    return this.props.approvedBy
  }
  get createdAt(): Date {
    return this.props.createdAt
  }
  get updatedAt(): Date {
    return this.props.updatedAt
  }

  isPending(): boolean {
    return this.props.status === 'pending'
  }
  isActive(): boolean {
    return this.props.status === 'active'
  }
  isSuspended(): boolean {
    return this.props.status === 'suspended'
  }

  toObject(): OrganizationProps {
    return { ...this.props }
  }
}
