import type { ISessionPort } from '@/features/users/application/ports/session.port'
import {
  AccountNotActiveError,
  AccountSuspendedError,
  InvalidCredentialsError,
} from '@/features/users/domain/user.errors'
import type { IUserRepository } from '@/features/users/domain/user.repository'
import { env } from '@/shared/config/env'
import { jwtUtils } from '@/shared/utils/jwt.utils'
import { passwordUtils } from '@/shared/utils/password.utils'
import { parseExpiresIn } from '@/shared/utils/time.utils'

export interface LoginInput {
  email: string
  password: string
}

export interface LoginOutput {
  accessToken: string
  refreshToken: string
  requiresTwoFactor: boolean
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
  }
}

export class LoginUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly sessionPort: ISessionPort
  ) {}

  async execute(input: LoginInput): Promise<LoginOutput> {
    // 1. Buscar usuario por email
    const user = await this.userRepository.findByEmail(input.email.toLowerCase().trim())

    // 2. Si no existe, error generico
    if (!user) {
      throw new InvalidCredentialsError()
    }

    // 3. Verificar contrasena antes de chequear estado
    const isPasswordValid = await passwordUtils.compare(input.password, user.passwordHash)
    if (!isPasswordValid) {
      throw new InvalidCredentialsError()
    }

    // 4. Verificar estado de la cuenta
    if (user.isPending()) {
      throw new AccountNotActiveError()
    }

    if (user.isSuspended()) {
      throw new AccountSuspendedError()
    }

    if (user.isDeleted()) {
      throw new InvalidCredentialsError()
    }

    // 5. Si tiene 2FA activo, no se emite token
    if (user.hasTwoFactorEnabled()) {
      return {
        accessToken: '',
        refreshToken: '',
        requiresTwoFactor: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      }
    }

    // 6. Generar tokens
    const payload = { sub: user.id, email: user.email, role: user.role }
    const accessToken = jwtUtils.signAccessToken(payload)
    const refreshToken = jwtUtils.signRefreshToken(payload)

    // 7. Guardar refresh token en Redis
    const refreshExpiresInSeconds = parseExpiresIn(env.JWT_REFRESH_EXPIRES_IN)
    await this.sessionPort.saveRefreshToken(user.id, refreshToken, refreshExpiresInSeconds)

    return {
      accessToken,
      refreshToken,
      requiresTwoFactor: false,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    }
  }
}
