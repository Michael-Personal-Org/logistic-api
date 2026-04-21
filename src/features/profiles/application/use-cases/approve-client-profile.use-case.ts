import { ClientProfileEntity } from '@/features/profiles/domain/client-profile.entity'
import { ProfileNotFoundError } from '@/features/profiles/domain/profile.errors'
import type { IProfileRepository } from '@/features/profiles/domain/profile.repository'

export interface ApproveClientProfileInput {
  userId: string // ID del cliente cuyo perfil se aprueba
  approvedBy: string // ID del operador/admin que aprueba
}

export interface ApproveClientProfileOutput {
  message: string
}

export class ApproveClientProfileUseCase {
  constructor(private readonly profileRepository: IProfileRepository) {}

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

    return { message: 'Perfil aprobado correctamente.' }
  }
}
