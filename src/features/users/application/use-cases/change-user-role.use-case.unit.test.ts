import { UserEntity } from '@/features/users/domain/user.entity'
import {
  InsufficientPermissionsError,
  UserNotFoundError,
} from '@/features/users/domain/user.errors'
import type { IUserRepository } from '@/features/users/domain/user.repository'
import type { AuditService } from '@/shared/services/audit.service'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ChangeUserRoleUseCase } from './change-user-role.use-case'

function makeUser(overrides: Partial<Parameters<typeof UserEntity.create>[0]> = {}) {
  return UserEntity.create({
    id: 'user-123',
    email: 'user@example.com',
    passwordHash: 'hash',
    firstName: 'John',
    lastName: 'Doe',
    phone: null,
    jobTitle: null,
    organizationId: null,
    mustChangePassword: false,
    status: 'active',
    role: 'DRIVER',
    twoFactorSecret: null,
    twoFactorEnabled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  })
}

const mockUserRepository: IUserRepository = {
  findById: vi.fn(),
  findByEmail: vi.fn(),
  findMany: vi.fn(),
  save: vi.fn(),
  update: vi.fn(),
  softDelete: vi.fn(),
  saveToken: vi.fn(),
  findToken: vi.fn(),
  markTokenAsUsed: vi.fn(),
  deleteExpiredTokens: vi.fn(),
}

const mockAuditService = {
  log: vi.fn().mockResolvedValue(undefined),
} as unknown as AuditService

function makeUseCase() {
  return new ChangeUserRoleUseCase(mockUserRepository, mockAuditService)
}

describe('ChangeUserRoleUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(mockUserRepository.update).mockResolvedValue()
  })

  describe('cuando cambia el rol correctamente', () => {
    it('debe cambiar de DRIVER a OPERATOR', async () => {
      vi.mocked(mockUserRepository.findById).mockResolvedValue(makeUser())

      const useCase = makeUseCase()
      const result = await useCase.execute({
        targetUserId: 'user-123',
        newRole: 'OPERATOR',
        performedBy: 'admin-456', // ← NUEVO
      })

      expect(mockUserRepository.update).toHaveBeenCalledOnce()
      const updatedUser = vi.mocked(mockUserRepository.update).mock.calls[0]?.[0]
      expect(updatedUser?.role).toBe('OPERATOR')
      expect(result.message).toBeDefined()
    })

    it('debe retornar mensaje si ya tiene ese rol', async () => {
      vi.mocked(mockUserRepository.findById).mockResolvedValue(makeUser({ role: 'DRIVER' }))

      const useCase = makeUseCase()
      const result = await useCase.execute({
        targetUserId: 'user-123',
        newRole: 'DRIVER',
        performedBy: 'admin-456', // ← agregar
      })

      expect(mockUserRepository.update).not.toHaveBeenCalled()
      expect(result.message).toBeDefined()
    })
  })

  describe('cuando intenta cambiar el rol de un ADMIN', () => {
    it('debe lanzar InsufficientPermissionsError', async () => {
      vi.mocked(mockUserRepository.findById).mockResolvedValue(makeUser({ role: 'ADMIN' }))

      const useCase = makeUseCase()

      await expect(
        useCase.execute({ targetUserId: 'user-123', newRole: 'OPERATOR', performedBy: 'admin-456' }) // ← agregar
      ).rejects.toThrow(InsufficientPermissionsError)
    })
  })

  describe('cuando el usuario no existe', () => {
    it('debe lanzar UserNotFoundError', async () => {
      vi.mocked(mockUserRepository.findById).mockResolvedValue(null)

      const useCase = makeUseCase()

      await expect(
        useCase.execute({
          targetUserId: 'nonexistent',
          newRole: 'OPERATOR',
          performedBy: 'admin-456',
        }) // ← agregar
      ).rejects.toThrow(UserNotFoundError)
    })
  })
})
