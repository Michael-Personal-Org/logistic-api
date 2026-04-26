import { AUDIT_ACTIONS, AUDIT_RESOURCES } from '@/features/audit/domain/audit-log.constants'
import { OrganizationInvitationEntity } from '@/features/organizations/domain/organization-invitation.entity'
import type { IOrganizationRepository } from '@/features/organizations/domain/organization.repository'
import type { IEmailPort } from '@/features/users/application/ports/email.port'
import type { ITokenPort } from '@/features/users/application/ports/token.port'
import { UserEntity } from '@/features/users/domain/user.entity'
import { UserAlreadyExistsError } from '@/features/users/domain/user.errors'
import type { IUserRepository } from '@/features/users/domain/user.repository'
import type { UserRole } from '@/features/users/domain/user.types'
import type { AuditService } from '@/shared/services/audit.service'
import { passwordUtils } from '@/shared/utils/password.utils'
import {
  InvitationAlreadyUsedError,
  InvitationExpiredError,
  InvitationNotFoundError,
} from '../../domain/organization.errors'

export interface AcceptInvitationInput {
  token: string
  firstName: string
  lastName: string
  phone: string
  password: string
  ipAddress?: string | undefined
}

export interface AcceptInvitationOutput {
  userId: string
  message: string
}

export class AcceptInvitationUseCase {
  constructor(
    private readonly organizationRepository: IOrganizationRepository,
    private readonly userRepository: IUserRepository,
    private readonly emailPort: IEmailPort,
    private readonly tokenPort: ITokenPort,
    private readonly auditService: AuditService
  ) {}

  async execute(input: AcceptInvitationInput): Promise<AcceptInvitationOutput> {
    // 1. Buscar invitación
    const invitation = await this.organizationRepository.findInvitationByToken(input.token)
    if (!invitation) throw new InvitationNotFoundError()
    if (invitation.isAccepted()) throw new InvitationAlreadyUsedError()
    if (invitation.isExpired()) throw new InvitationExpiredError()

    // 2. Verificar que el email no esté registrado
    const existing = await this.userRepository.findByEmail(invitation.email)
    if (existing) throw new UserAlreadyExistsError(invitation.email)

    const now = new Date()
    const passwordHash = await passwordUtils.hash(input.password)

    // 3. Crear usuario
    const user = UserEntity.create({
      id: crypto.randomUUID(),
      email: invitation.email,
      passwordHash,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      phone: input.phone.trim(),
      jobTitle: null,
      organizationId: invitation.organizationId,
      mustChangePassword: false,
      status: 'active',
      role: invitation.role as UserRole,
      twoFactorSecret: null,
      twoFactorEnabled: false,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    })

    await this.userRepository.save(user)

    // 4. Marcar invitación como aceptada
    const updatedInvitation = Object.assign(
      Object.create(Object.getPrototypeOf(invitation)),
      invitation.toObject(),
      { status: 'accepted' as const }
    )
    // Re-crear con status actualizado:
    const acceptedInvitation = OrganizationInvitationEntity.create({
      ...invitation.toObject(),
      status: 'accepted',
    })

    await this.organizationRepository.updateInvitation(acceptedInvitation)

    // 5. Audit
    await this.auditService.log(
      { userId: user.id, ipAddress: input.ipAddress },
      AUDIT_ACTIONS.ORGANIZATION_USER_JOINED,
      AUDIT_RESOURCES.ORGANIZATION,
      invitation.organizationId
    )

    return {
      userId: user.id,
      message: 'Te has unido a la organización correctamente.',
    }
  }
}
