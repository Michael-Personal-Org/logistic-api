import { UserEntity } from '@/features/users/domain/user.entity'
import {
  InsufficientPermissionsError,
  UserNotFoundError,
} from '@/features/users/domain/user.errors'
import type { IUserRepository } from '@/features/users/domain/user.repository'
import type { AuditService } from '@/shared/services/audit.service'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { UpdateUserStatusUseCase } from './update-user-status.use-case'

function makeUser(overrides: Partial<Parameters<typeof UserEntity.create>[0]> = {}) {
  return UserEntity.create({
    id: 'user-123',
    email: 'user@example.com',
    passwordHash: 'hash',
    firstName: 'John',
    lastName: 'Doe',
    status: 'active',
    phone: null,
    jobTitle: null,
    organizationId: null,
    mustChangePassword: false,
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
  return new UpdateUserStatusUseCase(mockUserRepository, mockAuditService)
}

describe('UpdateUserStatusUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(mockUserRepository.update).mockResolvedValue()
  })

  describe('cuando suspende un usuario válido', () => {
    it('debe suspender un DRIVER', async () => {
      vi.mocked(mockUserRepository.findById).mockResolvedValue(makeUser())

      const useCase = makeUseCase()
      const result = await useCase.execute({
        targetUserId: 'user-123',
        newStatus: 'suspended',
        performedBy: 'admin-456',
      })

      expect(mockUserRepository.update).toHaveBeenCalledOnce()
      expect(result.message).toBeDefined()
    })

    it('debe reactivar un usuario suspendido', async () => {
      vi.mocked(mockUserRepository.findById).mockResolvedValue(makeUser({ status: 'suspended' }))

      const useCase = makeUseCase()
      const result = await useCase.execute({
        targetUserId: 'user-123',
        newStatus: 'active',
        performedBy: 'admin-456',
      })

      expect(mockUserRepository.update).toHaveBeenCalledOnce()
      expect(result.message).toBeDefined()
    })
  })

  describe('cuando intenta suspender un ADMIN', () => {
    it('debe lanzar InsufficientPermissionsError', async () => {
      vi.mocked(mockUserRepository.findById).mockResolvedValue(makeUser({ role: 'ADMIN' }))

      const useCase = makeUseCase()

      await expect(
        useCase.execute({ targetUserId: 'user-123', newStatus: 'suspended', performedBy: '' })
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
          newStatus: 'suspended',
          performedBy: 'admin-456',
        }) // ← agregar
      ).rejects.toThrow(UserNotFoundError)
    })
  })
})
