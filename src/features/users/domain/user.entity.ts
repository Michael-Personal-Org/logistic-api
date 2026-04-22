export type UserStatus = 'pending' | 'active' | 'suspended'
export type UserRole = 'CLIENT' | 'DRIVER' | 'OPERATOR' | 'ADMIN'

export interface UserProps {
  id: string
  email: string
  passwordHash: string
  firstName: string
  lastName: string
  status: UserStatus
  role: UserRole
  twoFactorSecret: string | null
  twoFactorEnabled: boolean
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export interface UserTokenProps {
  id: string
  userId: string
  token: string
  type: 'activation' | 'password_reset'
  expiresAt: Date
  usedAt: Date | null
  createdAt: Date
}

export class UserEntity {
  private constructor(private readonly props: UserProps) {}

  static create(props: UserProps): UserEntity {
    return new UserEntity(props)
  }

  // Getters
  get id(): string {
    return this.props.id
  }
  get email(): string {
    return this.props.email
  }
  get passwordHash(): string {
    return this.props.passwordHash
  }
  get firstName(): string {
    return this.props.firstName
  }
  get lastName(): string {
    return this.props.lastName
  }
  get status(): UserStatus {
    return this.props.status
  }
  get role(): UserRole {
    return this.props.role
  }
  get twoFactorSecret(): string | null {
    return this.props.twoFactorSecret
  }
  get twoFactorEnabled(): boolean {
    return this.props.twoFactorEnabled
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

  // Queries de estado
  isActive(): boolean {
    return this.props.status === 'active' && this.props.deletedAt === null
  }

  isPending(): boolean {
    return this.props.status === 'pending'
  }

  isSuspended(): boolean {
    return this.props.status === 'suspended'
  }

  isDeleted(): boolean {
    return this.props.deletedAt !== null
  }

  hasTwoFactorEnabled(): boolean {
    return this.props.twoFactorEnabled && this.props.twoFactorSecret !== null
  }

  // Helpers de rol
  isClient(): boolean {
    return this.props.role === 'CLIENT'
  }
  isDriver(): boolean {
    return this.props.role === 'DRIVER'
  }
  isOperator(): boolean {
    return this.props.role === 'OPERATOR'
  }
  isAdmin(): boolean {
    return this.props.role === 'ADMIN'
  }
  isStaff(): boolean {
    return this.props.role === 'OPERATOR' || this.props.role === 'ADMIN'
  }

  fullName(): string {
    return `${this.props.firstName} ${this.props.lastName}`
  }

  // Retorno de los datos planos para su persistencia en db
  toObject(): UserProps {
    return { ...this.props }
  }
}

export class UserTokenEntity {
  private constructor(private readonly props: UserTokenProps) {}

  static create(props: UserTokenProps): UserTokenEntity {
    return new UserTokenEntity(props)
  }

  get id(): string {
    return this.props.id
  }
  get userId(): string {
    return this.props.userId
  }
  get token(): string {
    return this.props.token
  }
  get type(): 'activation' | 'password_reset' {
    return this.props.type
  }
  get expiresAt(): Date {
    return this.props.expiresAt
  }
  get usedAt(): Date | null {
    return this.props.usedAt
  }

  isExpired(): boolean {
    return new Date() > this.props.expiresAt
  }

  isUsed(): boolean {
    return this.props.usedAt !== null
  }

  isValid(): boolean {
    return !this.isExpired() && !this.isUsed()
  }

  toObject(): UserTokenProps {
    return { ...this.props }
  }
}
