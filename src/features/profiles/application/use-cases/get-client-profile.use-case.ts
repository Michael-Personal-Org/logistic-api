import { ProfileNotFoundError } from '@/features/profiles/domain/profile.errors'
import type { IProfileRepository } from '@/features/profiles/domain/profile.repository'

export interface GetClientProfileInput {
  userId: string
}

export interface GetClientProfileOutput {
  id: string
  userId: string
  companyName: string
  rnc: string | null
  isApproved: boolean
  approvedAt: Date | null
  emergencyContact: string | null
  createdAt: Date
  updatedAt: Date
}

export class GetClientProfileUseCase {
  constructor(private readonly profileRepository: IProfileRepository) {}

  async execute(input: GetClientProfileInput): Promise<GetClientProfileOutput> {
    const profile = await this.profileRepository.findClientProfileByUserId(input.userId)
    if (!profile) throw new ProfileNotFoundError()

    return {
      id: profile.id,
      userId: profile.userId,
      companyName: profile.companyName,
      rnc: profile.rnc,
      isApproved: profile.isApproved,
      approvedAt: profile.approvedAt,
      emergencyContact: profile.emergencyContact,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    }
  }
}
