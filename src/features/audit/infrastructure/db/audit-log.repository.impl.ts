import { AuditLogEntity } from '@/features/audit/domain/audit-log.entity'
import type { AuditLogProps } from '@/features/audit/domain/audit-log.entity'
import type {
  FindAuditLogsOptions,
  FindAuditLogsResult,
  IAuditLogRepository,
} from '@/features/audit/domain/audit-log.repository'
import type { Database } from '@/shared/config/database'
import { DatabaseError } from '@/shared/errors/app.error'
import { and, between, count, eq } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import { auditLogs } from './audit-log.schema'

export class AuditLogRepositoryImpl implements IAuditLogRepository {
  constructor(private readonly db: Database) {}

  private toEntity(row: typeof auditLogs.$inferSelect): AuditLogEntity {
    const props: AuditLogProps = {
      id: row.id,
      userId: row.userId ?? null,
      action: row.action as AuditLogProps['action'],
      resource: row.resource as AuditLogProps['resource'],
      resourceId: row.resourceId ?? null,
      metadata: row.metadata as Record<string, unknown> | null,
      ipAddress: row.ipAddress ?? null,
      createdAt: row.createdAt,
    }
    return AuditLogEntity.create(props)
  }

  async save(log: AuditLogEntity): Promise<void> {
    try {
      const data = log.toObject()
      await this.db.insert(auditLogs).values({
        id: data.id,
        userId: data.userId,
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId,
        metadata: data.metadata,
        ipAddress: data.ipAddress,
        createdAt: data.createdAt,
      })
    } catch (error) {
      throw new DatabaseError(`Error al guardar audit log: ${error}`)
    }
  }

  async findMany(options: FindAuditLogsOptions): Promise<FindAuditLogsResult> {
    try {
      const { page, limit, userId, action, resource, resourceId, from, to } = options
      const offset = (page - 1) * limit

      const filters: SQL[] = []
      if (userId) filters.push(eq(auditLogs.userId, userId))
      if (action) filters.push(eq(auditLogs.userId, action))
      if (resource) filters.push(eq(auditLogs.userId, resource))
      if (resourceId) filters.push(eq(auditLogs.userId, resourceId))
      if (from && to) filters.push(between(auditLogs.createdAt, from, to))

      const where = filters.length > 0 ? and(...filters) : undefined

      const [rows, countResult] = await Promise.all([
        this.db
          .select()
          .from(auditLogs)
          .where(where)
          .orderBy(auditLogs.createdAt)
          .limit(limit)
          .offset(offset),
        this.db.select({ count: count() }).from(auditLogs).where(where),
      ])

      const total = countResult[0]?.count ?? 0

      return {
        logs: rows.map((row) => this.toEntity(row)),
        total: Number(total),
      }
    } catch (error) {
      throw new DatabaseError(`Error al listar audi logs: ${error}`)
    }
  }
}
