import type { IEmailPort } from '@/features/users/application/ports/email.port'
import type { ITokenPort } from '@/features/users/application/ports/token.port'
import {
  InsufficientPermissionsError,
  UserAlreadyExistsError,
} from '@/features/users/domain/user.errors'
import type { IUserRepository } from '@/features/users/domain/user.repository'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CreateUserUseCase } from './create-user.use-case'

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

const mockEmailPort: IEmailPort = {
  sendWelcome: vi.fn(),
  sendPasswordReset: vi.fn(),
}

const mockTokenPort: ITokenPort = {
  generateSecureToken: vi.fn().mockReturnValue('mock-token'),
  getExpirationDate: vi.fn().mockReturnValue(new Date('2099-01-01')),
}

function makeUseCase() {
  return new CreateUserUseCase(mockUserRepository, mockEmailPort, mockTokenPort)
}

describe('CreateUserUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null)
    vi.mocked(mockUserRepository.save).mockResolvedValue()
    vi.mocked(mockUserRepository.saveToken).mockResolvedValue()
    vi.mocked(mockEmailPort.sendWelcome).mockResolvedValue()
  })

  describe('cuando ADMIN crea usuarios', () => {
    it('debe crear un DRIVER correctamente', async () => {
      const useCase = makeUseCase()
      const result = await useCase.execute({
        createdByRole: 'ADMIN',
        email: 'driver@example.com',
        password: 'Password1!',
        firstName: 'John',
        lastName: 'Doe',
        role: 'DRIVER',
      })

      expect(result.role).toBe('DRIVER')
      expect(result.email).toBe('driver@example.com')
      expect(mockUserRepository.save).toHaveBeenCalledOnce()
    })

    it('debe crear un OPERATOR correctamente', async () => {
      const useCase = makeUseCase()
      const result = await useCase.execute({
        createdByRole: 'ADMIN',
        email: 'operator@example.com',
        password: 'Password1!',
        firstName: 'Jane',
        lastName: 'Doe',
        role: 'OPERATOR',
      })

      expect(result.role).toBe('OPERATOR')
    })

    it('debe crear un ADMIN correctamente', async () => {
      const useCase = makeUseCase()
      const result = await useCase.execute({
        createdByRole: 'ADMIN',
        email: 'admin2@example.com',
        password: 'Password1!',
        firstName: 'Admin',
        lastName: 'Two',
        role: 'ADMIN',
      })

      expect(result.role).toBe('ADMIN')
    })

    it('el usuario creado debe estar activo directamente', async () => {
      const useCase = makeUseCase()
      await useCase.execute({
        createdByRole: 'ADMIN',
        email: 'driver@example.com',
        password: 'Password1!',
        firstName: 'John',
        lastName: 'Doe',
        role: 'DRIVER',
      })

      const savedUser = vi.mocked(mockUserRepository.save).mock.calls[0]?.[0]
      expect(savedUser?.status).toBe('active')
    })

    it('debe enviar email de bienvenida', async () => {
      const useCase = makeUseCase()
      await useCase.execute({
        createdByRole: 'ADMIN',
        email: 'driver@example.com',
        password: 'Password1!',
        firstName: 'John',
        lastName: 'Doe',
        role: 'DRIVER',
      })

      expect(mockEmailPort.sendWelcome).toHaveBeenCalledOnce()
    })
  })

  describe('cuando OPERATOR crea usuarios', () => {
    it('debe poder crear un DRIVER', async () => {
      const useCase = makeUseCase()
      const result = await useCase.execute({
        createdByRole: 'OPERATOR',
        email: 'driver@example.com',
        password: 'Password1!',
        firstName: 'John',
        lastName: 'Doe',
        role: 'DRIVER',
      })

      expect(result.role).toBe('DRIVER')
    })

    it('NO debe poder crear un OPERATOR', async () => {
      const useCase = makeUseCase()

      await expect(
        useCase.execute({
          createdByRole: 'OPERATOR',
          email: 'operator2@example.com',
          password: 'Password1!',
          firstName: 'Jane',
          lastName: 'Doe',
          role: 'OPERATOR',
        })
      ).rejects.toThrow(InsufficientPermissionsError)
    })

    it('NO debe poder crear un ADMIN', async () => {
      const useCase = makeUseCase()

      await expect(
        useCase.execute({
          createdByRole: 'OPERATOR',
          email: 'admin@example.com',
          password: 'Password1!',
          firstName: 'Admin',
          lastName: 'User',
          role: 'ADMIN',
        })
      ).rejects.toThrow(InsufficientPermissionsError)
    })
  })

  describe('cuando el email ya existe', () => {
    it('debe lanzar UserAlreadyExistsError', async () => {
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue({
        id: 'existing-id',
      } as never)

      const useCase = makeUseCase()

      await expect(
        useCase.execute({
          createdByRole: 'ADMIN',
          email: 'existing@example.com',
          password: 'Password1!',
          firstName: 'John',
          lastName: 'Doe',
          role: 'DRIVER',
        })
      ).rejects.toThrow(UserAlreadyExistsError)
    })
  })
})
