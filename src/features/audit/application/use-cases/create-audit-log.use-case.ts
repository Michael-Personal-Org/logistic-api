import type { AuditAction, AuditResource } from '@/features/audit/domain/audit-log.constants'
import { AuditLogEntity } from '@/features/audit/domain/audit-log.entity'
import type { IAuditLogRepository } from '@/features/audit/domain/audit-log.repository'

export interface CreateAuditLogInput {
  userId: string | null
  action: AuditAction
  resource: AuditResource
  resourceId?: string | undefined
  metadata?: Record<string, unknown> | undefined
  ipAddress?: string | undefined
}

export class CreateAuditLogUseCase {
  constructor(private readonly auditLogRepository: IAuditLogRepository) {}

  async execute(input: CreateAuditLogInput): Promise<void> {
    const log = AuditLogEntity.create({
      id: crypto.randomUUID(),
      userId: input.userId,
      action: input.action,
      resource: input.resource,
      resourceId: input.resourceId ?? null,
      metadata: input.metadata ?? null,
      ipAddress: input.ipAddress ?? null,
      createdAt: new Date(),
    })

    await this.auditLogRepository.save(log)
  }
}
