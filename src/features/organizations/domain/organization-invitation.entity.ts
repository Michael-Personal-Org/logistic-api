export type InvitationStatus = 'pending' | 'accepted' | 'expired'

export interface OrganizationInvitationProps {
  id: string
  organizationId: string
  email: string
  role: string
  token: string
  status: InvitationStatus
  invitedBy: string
  expiresAt: Date
  createdAt: Date
}

export class OrganizationInvitationEntity {
  private constructor(private readonly props: OrganizationInvitationProps) {}

  static create(props: OrganizationInvitationProps): OrganizationInvitationEntity {
    return new OrganizationInvitationEntity(props)
  }

  get id(): string {
    return this.props.id
  }
  get organizationId(): string {
    return this.props.organizationId
  }
  get email(): string {
    return this.props.email
  }
  get role(): string {
    return this.props.role
  }
  get token(): string {
    return this.props.token
  }
  get status(): InvitationStatus {
    return this.props.status
  }
  get invitedBy(): string {
    return this.props.invitedBy
  }
  get expiresAt(): Date {
    return this.props.expiresAt
  }
  get createdAt(): Date {
    return this.props.createdAt
  }

  isExpired(): boolean {
    return new Date() > this.props.expiresAt
  }
  isPending(): boolean {
    return this.props.status === 'pending'
  }
  isAccepted(): boolean {
    return this.props.status === 'accepted'
  }

  isValid(): boolean {
    return this.isPending() && !this.isExpired()
  }

  toObject(): OrganizationInvitationProps {
    return { ...this.props }
  }
}
