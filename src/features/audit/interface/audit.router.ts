import { ListAuditLogsUseCase } from '@/features/audit/application/use-cases/list-audit-logs.use-case'
import { AuditLogRepositoryImpl } from '@/features/audit/infrastructure/db/audit-log.repository.impl'
import { authMiddleware, requireRole } from '@/features/users/interface/user.middleware'
import { db } from '@/shared/config/database'
import { ROLES } from '@/shared/constants/roles'
import { Router } from 'express'
import { AuditController } from './audit.controller'

const auditLogRepository = new AuditLogRepositoryImpl(db)
const controller = new AuditController(new ListAuditLogsUseCase(auditLogRepository))

export const auditRouter = Router()

// Solo ADMIN puede ver los audit logs
auditRouter.get('/', authMiddleware, requireRole(ROLES.ADMIN), controller.list)
