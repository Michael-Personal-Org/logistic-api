import type { CreateAuditLogUseCase } from '@/features/audit/application/use-cases/create-audit-log.use-case'
import type { AuditAction, AuditResource } from '@/features/audit/domain/audit-log.constants'
import { logger } from '@/shared/utils/logger'

export interface AuditContext {
  userId: string | null
  ipAddress?: string | undefined
}

export class AuditService {
  constructor(private readonly createAuditLog: CreateAuditLogUseCase) {}

  async log(
    context: AuditContext,
    action: AuditAction,
    resource: AuditResource,
    resourceId?: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    try {
      await this.createAuditLog.execute({
        userId: context.userId,
        action,
        resource,
        resourceId,
        metadata,
        ipAddress: context.ipAddress,
      })
    } catch (error) {
      logger.error('Error al guardar audit log', { error, action, resource, resourceId })
    }
  }
}
