import { AUDIT_ACTIONS, AUDIT_RESOURCES } from '@/features/audit/domain/audit-log.constants'
import type { IEmailPort } from '@/features/users/application/ports/email.port'
import type { AuditService } from '@/shared/services/audit.service'
import { OrganizationInvitationEntity } from '../../domain/organization-invitation.entity'
import {
  OrganizationNotFoundError,
  OrganizationSuspendedError,
} from '../../domain/organization.errors'
import type { IOrganizationRepository } from '../../domain/organization.repository'

export interface InviteUserInput {
  organizationId: string
  invitedBy: string
  email: string
  role: 'ORG_ORDER' | 'ORG_TRACK'
  ipAddress?: string | undefined
}

export interface InviteUserOutput {
  invitationId: string
  message: string
}

export class InviteUserUseCase {
  constructor(
    private readonly organizationRepository: IOrganizationRepository,
    private readonly emailPort: IEmailPort,
    private readonly auditService: AuditService
  ) {}

  async execute(input: InviteUserInput): Promise<InviteUserOutput> {
    const organization = await this.organizationRepository.findById(input.organizationId)
    if (!organization) throw new OrganizationNotFoundError(input.organizationId)
    if (organization.isSuspended()) throw new OrganizationSuspendedError()

    const now = new Date()
    const expiresAt = new Date(now.getTime() + 1000 * 60 * 60 * 48) // 48h

    const invitation = OrganizationInvitationEntity.create({
      id: crypto.randomUUID(),
      organizationId: input.organizationId,
      email: input.email.toLowerCase().trim(),
      role: input.role,
      token: crypto.randomUUID(),
      status: 'pending',
      invitedBy: input.invitedBy,
      expiresAt,
      createdAt: now,
    })

    await this.organizationRepository.saveInvitation(invitation)

    // TODO: crear método sendInvitation en emailPort
    // await this.emailPort.sendInvitation({
    //   to: invitation.email,
    //   organizationName: organization.name,
    //   role: invitation.role,
    //   token: invitation.token,
    // })

    await this.auditService.log(
      { userId: input.invitedBy, ipAddress: input.ipAddress },
      AUDIT_ACTIONS.ORGANIZATION_USER_INVITED,
      AUDIT_RESOURCES.ORGANIZATION,
      input.organizationId
    )

    return {
      invitationId: invitation.id,
      message: `Invitación enviada a ${input.email}.`,
    }
  }
}
