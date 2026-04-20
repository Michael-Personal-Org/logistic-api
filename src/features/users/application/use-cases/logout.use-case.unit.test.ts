import type { ISessionPort } from '@/features/users/application/ports/session.port'
import { jwtUtils } from '@/shared/utils/jwt.utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LogoutUseCase } from './logout.use-case'

// ─── Mocks ───────────────────────────────────────────────
const mockSessionPort: ISessionPort = {
  blacklistToken: vi.fn(),
  isTokenBlacklisted: vi.fn(),
  saveRefreshToken: vi.fn(),
  findRefreshToken: vi.fn(),
  deleteRefreshToken: vi.fn(),
}

function makeUseCase() {
  return new LogoutUseCase(mockSessionPort)
}

// ─── Tests ───────────────────────────────────────────────
describe('LogoutUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(mockSessionPort.blacklistToken).mockResolvedValue()
    vi.mocked(mockSessionPort.deleteRefreshToken).mockResolvedValue()
  })

  describe('cuando el token es valido', () => {
    it('debe blacklistear el access token', async () => {
      const accessToken = jwtUtils.signAccessToken({
        sub: 'user-123',
        email: 'john@example.com',
        role: 'CLIENT',
      })

      const useCase = makeUseCase()
      await useCase.execute({ accessToken, userId: 'user-123' })

      expect(mockSessionPort.blacklistToken).toHaveBeenCalledOnce()
      expect(mockSessionPort.blacklistToken).toHaveBeenCalledWith(accessToken, expect.any(Number))
    })

    it('debe eliminar el refresh token', async () => {
      const accessToken = jwtUtils.signAccessToken({
        sub: 'user-123',
        email: 'john@example.com',
        role: 'CLIENT',
      })

      const useCase = makeUseCase()
      await useCase.execute({ accessToken, userId: 'user-123' })

      expect(mockSessionPort.deleteRefreshToken).toHaveBeenCalledOnce()
      expect(mockSessionPort.deleteRefreshToken).toHaveBeenCalledWith('user-123')
    })

    it('debe retornar mensaje de exito', async () => {
      const accessToken = jwtUtils.signAccessToken({
        sub: 'user-123',
        email: 'john@example.com',
        role: 'CLIENT',
      })

      const useCase = makeUseCase()
      const result = await useCase.execute({ accessToken, userId: 'user-123' })

      expect(result.message).toBeDefined()
    })
  })

  describe('cuando el token ya esta expirado', () => {
    it('no debe intentar blacklistear un token expirado', async () => {
      const expiredToken = 'invalid.token.here'

      const useCase = makeUseCase()
      await useCase.execute({ accessToken: expiredToken, userId: 'user-123' })

      expect(mockSessionPort.blacklistToken).not.toHaveBeenCalled()
      expect(mockSessionPort.deleteRefreshToken).toHaveBeenCalledOnce()
    })
  })
})
