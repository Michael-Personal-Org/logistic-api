import { DriverProfileEntity } from '@/features/profiles/domain/driver-profile.entity'
import { ProfileNotFoundError } from '@/features/profiles/domain/profile.errors'
import type { IProfileRepository } from '@/features/profiles/domain/profile.repository'

export interface UpdateDriverProfileInput {
  userId: string
  vehiclePlate?: string
  licenseNumber?: string
  licenseType?: string
  isAvailable?: boolean
}

export interface UpdateDriverProfileOutput {
  message: string
}

export class UpdateDriverProfileUseCase {
  constructor(private readonly profileRepository: IProfileRepository) {}

  async execute(input: UpdateDriverProfileInput): Promise<UpdateDriverProfileOutput> {
    const profile = await this.profileRepository.findDriverProfileByUserId(input.userId)
    if (!profile) throw new ProfileNotFoundError()

    const updated = DriverProfileEntity.create({
      ...profile.toObject(),
      vehiclePlate: input.vehiclePlate?.trim().toUpperCase() ?? profile.vehiclePlate,
      licenseNumber: input.licenseNumber?.trim().toUpperCase() ?? profile.licenseNumber,
      licenseType: input.licenseType?.trim().toUpperCase() ?? profile.licenseType,
      isAvailable: input.isAvailable ?? profile.isAvailable,
      updatedAt: new Date(),
    })

    await this.profileRepository.updateDriverProfile(updated)

    return { message: 'Perfil actualizado correctamente.' }
  }
}
