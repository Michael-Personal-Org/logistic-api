import { AUDIT_ACTIONS, AUDIT_RESOURCES } from '@/features/audit/domain/audit-log.constants'
import { UserEntity } from '@/features/users/domain/user.entity'
import {
  InsufficientPermissionsError,
  UserNotFoundError,
} from '@/features/users/domain/user.errors'
import type { IUserRepository } from '@/features/users/domain/user.repository'
import type { AuditService } from '@/shared/service/audit.service'

export interface UpdateUserStatusInput {
  targetUserId: string
  newStatus: 'active' | 'suspended'
  performedBy: string
  ipAddress?: string
}

export interface UpdateUserStatusOutput {
  message: string
}

export class UpdateUserStatusUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly auditService: AuditService
  ) {}

  async execute(input: UpdateUserStatusInput): Promise<UpdateUserStatusOutput> {
    const user = await this.userRepository.findById(input.targetUserId)
    if (!user || user.isDeleted()) {
      throw new UserNotFoundError(input.targetUserId)
    }

    if (user.isAdmin()) {
      throw new InsufficientPermissionsError('No se puede cambiar el estado de un administrador')
    }

    const updatedUser = UserEntity.create({
      ...user.toObject(),
      status: input.newStatus,
      updatedAt: new Date(),
    })

    await this.userRepository.update(updatedUser)

    await this.auditService.log(
      { userId: input.performedBy, ipAddress: input.ipAddress },
      input.newStatus === 'active' ? AUDIT_ACTIONS.USER_REACTIVATED : AUDIT_ACTIONS.USER_SUSPENDED,
      AUDIT_RESOURCES.USER,
      input.targetUserId,
      { previousStatus: user.status, newStatus: input.newStatus }
    )
    const action = input.newStatus === 'active' ? 'reactivada' : 'suspendida'
    return {
      message: `Cuenta ${action} correctamente.`,
    }
  }
}
