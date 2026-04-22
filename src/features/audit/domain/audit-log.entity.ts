import { Response } from 'express'
import type { AuditAction, AuditResource } from './audit-log.constants'

export interface AuditLogProps {
  id: string
  userId: string | null
  action: AuditAction
  resource: AuditResource
  resourceId: string | null
  metadata: Record<string, unknown> | null
  ipAddress: string | null
  createdAt: Date
}

export class AuditLogEntity {
  private constructor(private readonly props: AuditLogProps) {}

  static create(props: AuditLogProps): AuditLogEntity {
    return new AuditLogEntity(props)
  }

  get id(): string {
    return this.props.id
  }
  get userId(): string | null {
    return this.props.userId
  }
  get action(): AuditAction {
    return this.props.action
  }
  get resource(): AuditResource {
    return this.props.resource
  }
  get resourceId(): string | null {
    return this.props.resourceId
  }
  get metadata(): Record<string, unknown> | null {
    return this.props.metadata
  }
  get ipAddress(): string | null {
    return this.props.ipAddress
  }
  get createdAt(): Date {
    return this.props.createdAt
  }

  toObject(): AuditLogProps {
    return { ...this.props }
  }
}
