import type { ListAuditLogsUseCase } from '@/features/audit/application/use-cases/list-audit-logs.use-case'
import type { AuditAction, AuditResource } from '@/features/audit/domain/audit-log.constants'
import { ResponseUtils } from '@/shared/utils/response.utils'
import type { NextFunction, Request, Response } from 'express'

export class AuditController {
  constructor(private readonly listAuditLogs: ListAuditLogsUseCase) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.listAuditLogs.execute({
        userId: req.query.userId as string | undefined,
        action: req.query.action as AuditAction | undefined,
        resource: req.query.resource as AuditResource | undefined,
        resourceId: req.query.resourceId as string | undefined,
        from: req.query.from ? new Date(req.query.from as string) : undefined,
        to: req.query.to ? new Date(req.query.to as string) : undefined,
        page: Number(req.query.page ?? 1),
        limit: Number(req.query.limit ?? 20),
      })
      res.status(200).json(ResponseUtils.success(result))
    } catch (error) {
      next(error)
    }
  }
}
