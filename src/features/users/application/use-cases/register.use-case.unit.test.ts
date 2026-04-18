import { measureMemory } from 'node:vm'
import type { IEmailPort } from '@/features/users/application/ports/email.port'
import type { ITokenPort } from '@/features/users/application/ports/token.port'
import { UserAlreadyExistsError } from '@/features/users/domain/user.errors'
import type { IUserRepository } from '@/features/users/domain/user.repository'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RegisterUseCase } from './register.use-case'

// ----- Mocks -----
// Implementaciones falsas que cumplen del contrato de la interfaz
const mockUserRepository: IUserRepository = {
  findById: vi.fn(),
  findByEmail: vi.fn(),
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
  generateSecureToken: vi.fn().mockReturnValue('mock-secure-token-64-chars'),
  getExpirationDate: vi.fn().mockReturnValue(new Date('2099-01-01')),
}

// ----- Factory del use-case -----
function makeUseCase() {
  return new RegisterUseCase(mockUserRepository, mockEmailPort, mockTokenPort)
}

// ----- Tests -----
describe('RegisterUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('cuando el registro es exitoso', () => {
    beforeEach(() => {
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null)
      vi.mocked(mockUserRepository.save).mockResolvedValue()
      vi.mocked(mockUserRepository.saveToken).mockResolvedValue()
      vi.mocked(mockEmailPort.sendWelcome).mockResolvedValue()
    })

    it('debe retornar userId y email', async () => {
      const useCase = makeUseCase()
      const result = await useCase.execute({
        email: 'john@example.com',
        password: 'Password1!',
        firstName: 'John',
        lastName: 'Doe',
      })

      expect(result.email).toBe('john@example.com')
      expect(result.userId).toBeDefined()
      expect(result.message).toBeDefined()
    })

    it('debe guardar el usuario en el repositorio', async () => {
      const useCase = makeUseCase()
      await useCase.execute({
        email: 'john@example.com',
        password: 'Password1!',
        firstName: 'John',
        lastName: 'Doe',
      })

      expect(mockUserRepository.save).toHaveBeenCalledOnce()
    })

    it('debe guardar el token de activacion', async () => {
      const useCase = makeUseCase()
      await useCase.execute({
        email: 'john@example.com',
        password: 'Password1!',
        firstName: 'John',
        lastName: 'Doe',
      })

      expect(mockUserRepository.saveToken).toHaveBeenCalledOnce()
    })

    it('debe enviar el email de bienvenida', async () => {
      const useCase = makeUseCase()
      await useCase.execute({
        email: 'john@example.com',
        password: 'Password1!',
        firstName: 'John',
        lastName: 'Doe',
      })

      expect(mockEmailPort.sendWelcome).toHaveBeenCalledOnce()
      expect(mockEmailPort.sendWelcome).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'john@example.com',
          firstName: 'John',
        })
      )
    })

    it('debe normalizar el email a minusculas', async () => {
      const useCase = makeUseCase()
      const result = await useCase.execute({
        email: 'JOHN@EXAMPLE.COM',
        password: 'Password1!',
        firstName: 'John',
        lastName: 'Doe',
      })

      expect(result.email).toBe('john@example.com')
    })
  })

  describe('cuando el email ya existe', () => {
    it('debe lanzar UserAlreadyExistsError', async () => {
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue({
        id: 'existing-id',
        email: 'john@example.com',
      } as never)

      const useCase = makeUseCase()

      await expect(
        useCase.execute({
          email: 'john@example.com',
          password: 'Password1!',
          firstName: 'John',
          lastName: 'Doe',
        })
      ).rejects.toThrow(UserAlreadyExistsError)
    })

    it('no debe guardar el usuario si el email ya existe', async () => {
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue({
        id: 'existing-id',
      } as never)

      const useCase = makeUseCase()

      await expect(
        useCase.execute({
          email: 'john@example.com',
          password: 'Password1!',
          firstName: 'John',
          lastName: 'Doe',
        })
      ).rejects.toThrow()

      expect(mockUserRepository.save).not.toHaveBeenCalled()
      expect(mockEmailPort.sendWelcome).not.toHaveBeenCalled()
    })
  })
})
