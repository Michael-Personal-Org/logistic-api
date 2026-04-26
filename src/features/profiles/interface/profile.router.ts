import { db } from '@/shared/config/database'
import { ROLES } from '@/shared/constants/roles'
import { Router } from 'express'

import { AuditLogRepositoryImpl } from '@/features/audit/infrastructure/db/audit-log.repository.impl'
import { ProfileRepositoryImpl } from '@/features/profiles/infrastructure/db/profile.repository.impl'
import { UserRepositoryImpl } from '@/features/users/infrastructure/db/user.repository.impl'

import { CreateAuditLogUseCase } from '@/features/audit/application/use-cases/create-audit-log.use-case'
import { ApproveClientProfileUseCase } from '@/features/profiles/application/use-cases/approve-client-profile.use-case'
import { CreateClientProfileUseCase } from '@/features/profiles/application/use-cases/create-client-profile.use-case'
import { CreateDriverProfileUseCase } from '@/features/profiles/application/use-cases/create-driver-profile.use-case'
import { GetClientProfileUseCase } from '@/features/profiles/application/use-cases/get-client-profile.use-case'
import { GetDriverProfileUseCase } from '@/features/profiles/application/use-cases/get-driver-profile.use-case'
import { UpdateClientProfileUseCase } from '@/features/profiles/application/use-cases/update-client-profile.use-case'
import { UpdateDriverProfileUseCase } from '@/features/profiles/application/use-cases/update-driver-profile.use-case'

import {
  authMiddleware,
  requireRole,
  validateBody,
} from '@/features/users/interface/user.middleware'
import { AuditService } from '@/shared/services/audit.service'
import { ProfileController } from './profile.controller'

import { CreateClientProfileDto } from './dtos/create-client-profile.dto'
import { CreateDriverProfileDto } from './dtos/create-driver-profile.dto'
import { UpdateClientProfileDto } from './dtos/update-client-profile.dto'
import { UpdateDriverProfileDto } from './dtos/update-driver-profile.dto'

// ─── Dependency Injection ────────────────────────────────
const profileRepository = new ProfileRepositoryImpl(db)
const userRepository = new UserRepositoryImpl(db)
const auditLogRepository = new AuditLogRepositoryImpl(db)
const auditService = new AuditService(new CreateAuditLogUseCase(auditLogRepository))

const controller = new ProfileController(
  new CreateClientProfileUseCase(profileRepository, userRepository),
  new UpdateClientProfileUseCase(profileRepository),
  new GetClientProfileUseCase(profileRepository),
  new ApproveClientProfileUseCase(profileRepository, auditService),
  new CreateDriverProfileUseCase(profileRepository, userRepository),
  new UpdateDriverProfileUseCase(profileRepository),
  new GetDriverProfileUseCase(profileRepository)
)

export const profileRouter = Router()

profileRouter.post(
  '/client',
  authMiddleware,
  requireRole(ROLES.ORG_ADMIN, ROLES.ORG_ORDER, ROLES.ORG_TRACK),
  validateBody(CreateClientProfileDto),
  controller.createMyClientProfile
)

profileRouter.put(
  '/client',
  authMiddleware,
  requireRole(ROLES.ORG_ADMIN, ROLES.ORG_ORDER, ROLES.ORG_TRACK),
  validateBody(UpdateClientProfileDto),
  controller.updateMyClientProfile
)

profileRouter.get(
  '/client',
  authMiddleware,
  requireRole(ROLES.ORG_ADMIN, ROLES.ORG_ORDER, ROLES.ORG_TRACK),
  controller.getMyClientProfile
)

profileRouter.get(
  '/client/:userId',
  authMiddleware,
  requireRole(ROLES.ADMIN, ROLES.OPERATOR),
  controller.getClientProfileByUserId
)

profileRouter.patch(
  '/client/:userId/approve',
  authMiddleware,
  requireRole(ROLES.ADMIN, ROLES.OPERATOR),
  controller.approveClientProfileByUserId
)

profileRouter.post(
  '/driver',
  authMiddleware,
  requireRole(ROLES.DRIVER),
  validateBody(CreateDriverProfileDto),
  controller.createMyDriverProfile
)

profileRouter.put(
  '/driver',
  authMiddleware,
  requireRole(ROLES.DRIVER),
  validateBody(UpdateDriverProfileDto),
  controller.updateMyDriverProfile
)

profileRouter.get(
  '/driver',
  authMiddleware,
  requireRole(ROLES.DRIVER),
  controller.getMyDriverProfile
)

profileRouter.get(
  '/driver/:userId',
  authMiddleware,
  requireRole(ROLES.ADMIN, ROLES.OPERATOR),
  controller.getDriverProfileByUserId
)
