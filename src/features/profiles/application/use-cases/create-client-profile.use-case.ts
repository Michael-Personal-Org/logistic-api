import { ClientProfileEntity } from '@/features/profiles/domain/client-profile.entity'
import {
  InvalidRoleForProfileError,
  ProfileAlreadyExistsError,
} from '@/features/profiles/domain/profile.errors'
import type { IProfileRepository } from '@/features/profiles/domain/profile.repository'
import { UserNotFoundError } from '@/features/users/domain/user.errors'
import type { IUserRepository } from '@/features/users/domain/user.repository'

export interface CreateClientProfileInput {
  userId: string
  companyName: string
  rnc?: string
  emergencyContact?: string
}

export interface CreateClientProfileOutput {
  profileId: string
  message: string
}

export class CreateClientProfileUseCase {
  constructor(
    private readonly profileRepository: IProfileRepository,
    private readonly userRepository: IUserRepository
  ) {}

  async execute(input: CreateClientProfileInput): Promise<CreateClientProfileOutput> {
    // 1. Verificar que el usuario existe
    const user = await this.userRepository.findById(input.userId)
    if (!user) throw new UserNotFoundError(input.userId)

    // 2. Solo usuarios con rol CLIENT pueden tener perfil de cliente
    if (!user.isClient()) {
      throw new InvalidRoleForProfileError('CLIENT')
    }

    // 3. Verificar que no tenga ya un perfil
    const existing = await this.profileRepository.findClientProfileByUserId(input.userId)
    if (existing) throw new ProfileAlreadyExistsError()

    // 4. Crear entidad
    const now = new Date()
    const profile = ClientProfileEntity.create({
      id: crypto.randomUUID(),
      userId: input.userId,
      companyName: input.companyName.trim(),
      rnc: input.rnc?.trim() ?? null,
      isApproved: false, // siempre inicia pendiente de aprobación
      approvedBy: null,
      approvedAt: null,
      emergencyContact: input.emergencyContact?.trim() ?? null,
      createdAt: now,
      updatedAt: now,
    })

    await this.profileRepository.saveClientProfile(profile)

    return {
      profileId: profile.id,
      message: 'Perfil creado. Pendiente de aprobación por un operador.',
    }
  }
}
