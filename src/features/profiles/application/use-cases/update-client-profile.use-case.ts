import { ClientProfileEntity } from '@/features/profiles/domain/client-profile.entity'
import { ProfileNotFoundError } from '@/features/profiles/domain/profile.errors'
import type { IProfileRepository } from '@/features/profiles/domain/profile.repository'

export interface UpdateClientProfileInput {
  userId: string
  companyName?: string
  rnc?: string
  emergencyContact?: string
}

export interface UpdateClientProfileOutput {
  message: string
}

export class UpdateClientProfileUseCase {
  constructor(private readonly profileRepository: IProfileRepository) {}

  async execute(input: UpdateClientProfileInput): Promise<UpdateClientProfileOutput> {
    // 1. Buscar perfil existente
    const profile = await this.profileRepository.findClientProfileByUserId(input.userId)
    if (!profile) throw new ProfileNotFoundError()

    // 2. Actualizar solo los campos que llegaron
    const updated = ClientProfileEntity.create({
      ...profile.toObject(),
      companyName: input.companyName?.trim() ?? profile.companyName,
      rnc: input.rnc?.trim() ?? profile.rnc,
      emergencyContact: input.emergencyContact?.trim() ?? profile.emergencyContact,
      // Si el perfil ya estaba aprobado y cambia datos importantes,
      // vuelve a pendiente de aprobación
      isApproved: input.companyName || input.rnc ? false : profile.isApproved,
      approvedBy: input.companyName || input.rnc ? null : profile.approvedBy,
      approvedAt: input.companyName || input.rnc ? null : profile.approvedAt,
      updatedAt: new Date(),
    })

    await this.profileRepository.updateClientProfile(updated)

    return { message: 'Perfil actualizado correctamente.' }
  }
}
