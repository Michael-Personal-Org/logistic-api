import type { AuditAction, AuditResource } from './audit-log.constants'
import type { AuditLogEntity } from './audit-log.entity'

export interface FindAuditLogsOptions {
  userId?: string | undefined
  action?: AuditAction | undefined
  resource?: AuditResource | undefined
  resourceId?: string | undefined
  from?: Date | undefined
  to?: Date | undefined
  page: number
  limit: number
}

export interface FindAuditLogsResult {
  logs: AuditLogEntity[]
  total: number
}

export interface IAuditLogRepository {
  save(log: AuditLogEntity): Promise<void>
  findMany(options: FindAuditLogsOptions): Promise<FindAuditLogsResult>
}
