import { AUDIT_ACTIONS, AUDIT_RESOURCES } from '@/features/audit/domain/audit-log.constants'
import { UserEntity } from '@/features/users/domain/user.entity'
import type { UserRole } from '@/features/users/domain/user.entity'
import {
  InsufficientPermissionsError,
  UserNotFoundError,
} from '@/features/users/domain/user.errors'
import type { IUserRepository } from '@/features/users/domain/user.repository'
import type { AuditService } from '@/shared/services/audit.service'

export interface ChangeUserRoleInput {
  targetUserId: string
  newRole: UserRole
  performedBy: string
  ipAddress?: string
}

export interface ChangeUserRoleOutput {
  message: string
}

export class ChangeUserRoleUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly auditService: AuditService
  ) {}

  async execute(input: ChangeUserRoleInput): Promise<ChangeUserRoleOutput> {
    const user = await this.userRepository.findById(input.targetUserId)
    if (!user || user.isDeleted()) {
      throw new UserNotFoundError(input.targetUserId)
    }

    if (user.isAdmin()) {
      throw new InsufficientPermissionsError('No se puede cambiar el rol de un administrador')
    }

    if (user.role === input.newRole) {
      return { message: 'El usuario ya tiene ese rol.' }
    }

    const updatedUser = UserEntity.create({
      ...user.toObject(),
      role: input.newRole,
      updatedAt: new Date(),
    })

    await this.userRepository.update(updatedUser)

    await this.auditService.log(
      { userId: input.performedBy, ipAddress: input.ipAddress },
      AUDIT_ACTIONS.USER_ROLE_CHANGED,
      AUDIT_RESOURCES.USER,
      input.targetUserId,
      { previouesRole: user.role, newRole: input.newRole }
    )

    return {
      message: `Rol actualizado a ${input.newRole} correctamente.`,
    }
  }
}
