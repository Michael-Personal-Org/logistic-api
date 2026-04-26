import { CreateAuditLogUseCase } from '@/features/audit/application/use-cases/create-audit-log.use-case'
import { AuditLogRepositoryImpl } from '@/features/audit/infrastructure/db/audit-log.repository.impl'
import { InviteUserUseCase } from '@/features/organizations/application/use-cases/invite-use.use-case'
import { ListOrganizationsUseCase } from '@/features/organizations/application/use-cases/list-organization.use-case'
import { UserRepositoryImpl } from '@/features/users/infrastructure/db/user.repository.impl'
import { ResendEmailService } from '@/features/users/infrastructure/services/resend.email.service'
import { TokenService } from '@/features/users/infrastructure/services/token.service'
import {
  authMiddleware,
  requireRole,
  validateBody,
} from '@/features/users/interface/user.middleware'
import { db } from '@/shared/config/database'
import { ROLES } from '@/shared/constants/roles'
import { AuditService } from '@/shared/services/audit.service'
import { Router } from 'express'
import { AcceptInvitationUseCase } from '../application/use-cases/accept-invitation.use-case'
import { ApproveOrganizationUseCase } from '../application/use-cases/approve-organization.use-case'
import { RegisterOrganizationUseCase } from '../application/use-cases/register-organization.use-case'
import { OrganizationRepositoryImpl } from '../infrastructure/db/organization.repository.impl'
import { AcceptInvitationDto } from './dtos/accept-invitation.dto'
import { InviteUserDto } from './dtos/invite-user.dto'
import { RegisterOrganizationDto } from './dtos/register-organization.dto'
import { OrganizationController } from './organization.controller'

// ─── DI ──────────────────────────────────────────────────
const organizationRepository = new OrganizationRepositoryImpl(db)
const userRepository = new UserRepositoryImpl(db)
const emailService = new ResendEmailService()
const tokenService = new TokenService()
const auditRepository = new AuditLogRepositoryImpl(db)
const createAuditLog = new CreateAuditLogUseCase(auditRepository)
const auditService = new AuditService(createAuditLog)

const controller = new OrganizationController(
  new RegisterOrganizationUseCase(
    organizationRepository,
    userRepository,
    emailService,
    tokenService,
    auditService
  ),
  new ApproveOrganizationUseCase(organizationRepository, userRepository, auditService),
  new ListOrganizationsUseCase(organizationRepository),
  new InviteUserUseCase(organizationRepository, emailService, auditService),
  new AcceptInvitationUseCase(
    organizationRepository,
    userRepository,
    emailService,
    tokenService,
    auditService
  )
)

export const organizationRouter = Router()

// Públicas
organizationRouter.post('/register', validateBody(RegisterOrganizationDto), controller.register)

organizationRouter.post(
  '/invitations/accept',
  validateBody(AcceptInvitationDto),
  controller.acceptInvitation
)

// Protegidas — ADMIN y OPERATOR
organizationRouter.get(
  '/',
  authMiddleware,
  requireRole(ROLES.ADMIN, ROLES.OPERATOR),
  controller.list
)

organizationRouter.patch(
  '/:id/approve',
  authMiddleware,
  requireRole(ROLES.ADMIN, ROLES.OPERATOR),
  controller.approve
)

// Protegidas — ORG_ADMIN
organizationRouter.post(
  '/:id/invite',
  authMiddleware,
  requireRole(ROLES.ORG_ADMIN),
  validateBody(InviteUserDto),
  controller.invite
)
