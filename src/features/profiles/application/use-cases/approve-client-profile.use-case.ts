import { AUDIT_ACTIONS, AUDIT_RESOURCES } from '@/features/audit/domain/audit-log.constants'
import { ClientProfileEntity } from '@/features/profiles/domain/client-profile.entity'
import { ProfileNotFoundError } from '@/features/profiles/domain/profile.errors'
import type { IProfileRepository } from '@/features/profiles/domain/profile.repository'
import type { AuditService } from '@/shared/service/audit.service'

export interface ApproveClientProfileInput {
  userId: string
  approvedBy: string
  ipAddress?: string
}

export interface ApproveClientProfileOutput {
  message: string
}

export class ApproveClientProfileUseCase {
  constructor(
    private readonly profileRepository: IProfileRepository,
    private readonly auditService: AuditService
  ) {}

  async execute(input: ApproveClientProfileInput): Promise<ApproveClientProfileOutput> {
    const profile = await this.profileRepository.findClientProfileByUserId(input.userId)
    if (!profile) throw new ProfileNotFoundError()

    // Si ya está aprobado, no hacemos nada
    if (!profile.isPending()) {
      return { message: 'El perfil ya estaba aprobado.' }
    }

    const approved = ClientProfileEntity.create({
      ...profile.toObject(),
      isApproved: true,
      approvedBy: input.approvedBy,
      approvedAt: new Date(),
      updatedAt: new Date(),
    })

    await this.profileRepository.updateClientProfile(approved)

    await this.auditService.log(
      { userId: input.userId, ipAddress: input.ipAddress },
      AUDIT_ACTIONS.CLIENT_PROFILE_APPROVED,
      AUDIT_RESOURCES.CLIENT_PROFILE,
      profile.id,
      { clientUserId: input.userId }
    )

    return { message: 'Perfil aprobado correctamente.' }
  }
}
