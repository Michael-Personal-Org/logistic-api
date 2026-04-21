import { ProfileNotFoundError } from '@/features/profiles/domain/profile.errors'
import type { IProfileRepository } from '@/features/profiles/domain/profile.repository'

export interface GetDriverProfileInput {
  userId: string
}

export interface GetDriverProfileOutput {
  id: string
  userId: string
  vehiclePlate: string
  licenseNumber: string
  licenseType: string
  isAvailable: boolean
  createdAt: Date
  updatedAt: Date
}

export class GetDriverProfileUseCase {
  constructor(private readonly profileRepository: IProfileRepository) {}

  async execute(input: GetDriverProfileInput): Promise<GetDriverProfileOutput> {
    const profile = await this.profileRepository.findDriverProfileByUserId(input.userId)
    if (!profile) throw new ProfileNotFoundError()

    return {
      id: profile.id,
      userId: profile.userId,
      vehiclePlate: profile.vehiclePlate,
      licenseNumber: profile.licenseNumber,
      licenseType: profile.licenseType,
      isAvailable: profile.isAvailable,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    }
  }
}
