import { AUDIT_ACTIONS, AUDIT_RESOURCES } from '@/features/audit/domain/audit-log.constants'
import type { IUserRepository } from '@/features/users/domain/user.repository'
import type { AuditService } from '@/shared/services/audit.service'
import { OrganizationEntity } from '../../domain/organization.entity'
import {
  OrganizationAlreadyApprovedError,
  OrganizationNotFoundError,
} from '../../domain/organization.errors'
import type { IOrganizationRepository } from '../../domain/organization.repository'

export interface ApproveOrganizationInput {
  organizationId: string
  approvedBy: string
  ipAddress?: string | undefined
}

export interface ApproveOrganizationOutput {
  message: string
}

export class ApproveOrganizationUseCase {
  constructor(
    private readonly organizationRepository: IOrganizationRepository,
    private readonly userRepository: IUserRepository,
    private readonly auditService: AuditService
  ) {}

  async execute(input: ApproveOrganizationInput): Promise<ApproveOrganizationOutput> {
    const organization = await this.organizationRepository.findById(input.organizationId)
    if (!organization) throw new OrganizationNotFoundError(input.organizationId)
    if (organization.isApproved) throw new OrganizationAlreadyApprovedError()

    const now = new Date()

    const updated = OrganizationEntity.create({
      ...organization.toObject(),
      status: 'active',
      isApproved: true,
      approvedAt: now,
      approvedBy: input.approvedBy,
      updatedAt: now,
    })

    await this.organizationRepository.update(updated)

    // Activar al usuario ORG_ADMIN de la organización
    // (ya debería estar activo por activación de email, pero por si acaso)

    await this.auditService.log(
      { userId: input.approvedBy, ipAddress: input.ipAddress },
      AUDIT_ACTIONS.ORGANIZATION_APPROVED,
      AUDIT_RESOURCES.ORGANIZATION,
      organization.id
    )

    return { message: 'Organización aprobada correctamente.' }
  }
}
