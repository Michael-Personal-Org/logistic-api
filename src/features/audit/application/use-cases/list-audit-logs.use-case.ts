import type { AuditAction, AuditResource } from '@/features/audit/domain/audit-log.constants'
import type { IAuditLogRepository } from '@/features/audit/domain/audit-log.repository'

export interface ListAuditLogsInput {
  userId?: string | undefined
  action?: AuditAction | undefined
  resource?: AuditResource | undefined
  resourceId?: string | undefined
  from?: Date | undefined
  to?: Date | undefined
  page: number
  limit: number
}

export interface AuditLogSummary {
  id: string
  userId: string | null
  action: AuditAction
  resource: AuditResource
  resourceId: string | null
  metadata: Record<string, unknown> | null
  ipAddress: string | null
  createdAt: Date
}

export interface ListAuditLogsOutput {
  logs: AuditLogSummary[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export class ListAuditLogsUseCase {
  constructor(private readonly auditLogRepository: IAuditLogRepository) {}

  async execute(input: ListAuditLogsInput): Promise<ListAuditLogsOutput> {
    const { logs, total } = await this.auditLogRepository.findMany({
      userId: input.userId,
      action: input.action,
      resource: input.resource,
      resourceId: input.resourceId,
      from: input.from,
      to: input.to,
      page: input.page,
      limit: input.limit,
    })

    return {
      logs: logs.map((log) => ({
        id: log.id,
        userId: log.userId,
        action: log.action,
        resource: log.resource,
        resourceId: log.resourceId,
        metadata: log.metadata,
        ipAddress: log.ipAddress,
        createdAt: log.createdAt,
      })),
      total,
      page: input.page,
      limit: input.limit,
      totalPages: Math.ceil(total / input.limit),
    }
  }
}
