import { DriverProfileEntity } from '@/features/profiles/domain/driver-profile.entity'
import {
  InvalidRoleForProfileError,
  ProfileAlreadyExistsError,
} from '@/features/profiles/domain/profile.errors'
import type { IProfileRepository } from '@/features/profiles/domain/profile.repository'
import { UserNotFoundError } from '@/features/users/domain/user.errors'
import type { IUserRepository } from '@/features/users/domain/user.repository'

export interface CreateDriverProfileInput {
  userId: string
  vehiclePlate: string
  licenseNumber: string
  licenseType: string
}

export interface CreateDriverProfileOutput {
  profileId: string
  message: string
}

export class CreateDriverProfileUseCase {
  constructor(
    private readonly profileRepository: IProfileRepository,
    private readonly userRepository: IUserRepository
  ) {}

  async execute(input: CreateDriverProfileInput): Promise<CreateDriverProfileOutput> {
    // 1. Verificar que el usuario existe
    const user = await this.userRepository.findById(input.userId)
    if (!user) throw new UserNotFoundError(input.userId)

    // 2. Solo usuarios con rol DRIVER
    if (!user.isDriver()) {
      throw new InvalidRoleForProfileError('DRIVER')
    }

    // 3. Verificar que no tenga ya un perfil
    const existing = await this.profileRepository.findDriverProfileByUserId(input.userId)
    if (existing) throw new ProfileAlreadyExistsError()

    // 4. Crear entidad
    const now = new Date()
    const profile = DriverProfileEntity.create({
      id: crypto.randomUUID(),
      userId: input.userId,
      vehiclePlate: input.vehiclePlate.trim().toUpperCase(),
      licenseNumber: input.licenseNumber.trim().toUpperCase(),
      licenseType: input.licenseType.trim().toUpperCase(),
      isAvailable: false, // inicia como no disponible
      createdAt: now,
      updatedAt: now,
    })

    await this.profileRepository.saveDriverProfile(profile)

    return {
      profileId: profile.id,
      message: 'Perfil de conductor creado correctamente.',
    }
  }
}
