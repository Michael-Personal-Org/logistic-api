import { redisClient } from '@/features/users/infrastructure/cache/redis.session.store'
import { db } from '@/shared/config/database'
import { Router } from 'express'

// Infrastructure
import { RedisSessionStore } from '@/features/users/infrastructure/cache/redis.session.store'
import { UserRepositoryImpl } from '@/features/users/infrastructure/db/user.repository.impl'
import { ResendEmailService } from '@/features/users/infrastructure/services/resend.email.service'
import { TokenService } from '@/features/users/infrastructure/services/token.service'
import { TotpService } from '@/features/users/infrastructure/services/totp.service'

// Use Cases
import { ActivateAccountUseCase } from '@/features/users/application/use-cases/activate-account.use-case'
import { DeleteAccountUseCase } from '@/features/users/application/use-cases/delete-account.use-case'
import { Enable2FAUseCase } from '@/features/users/application/use-cases/enable-2fa.use-case'
import { LoginUseCase } from '@/features/users/application/use-cases/login.use-case'
import { LogoutUseCase } from '@/features/users/application/use-cases/logout.use-case'
import { RecoverPasswordUseCase } from '@/features/users/application/use-cases/recover-password.use-case'
import { RegisterUseCase } from '@/features/users/application/use-cases/register.use-case'
import { ResetPasswordUseCase } from '@/features/users/application/use-cases/reset-password.use-case'
import { Verify2FAUseCase } from '@/features/users/application/use-cases/verify-2fa.use-case'

// Interface
import { UserController } from './user.controller'
import { authMiddleware, validateBody } from './user.middleware'

import { DEFAULT_CIPHERS } from 'node:tls'
// DTOs
import { DeleteAccountDto } from './dtos/delete-account.dto'
import { ForgotPasswordDto } from './dtos/forgot-password.dto'
import { LoginDto } from './dtos/login.dto'
import { RegisterDto } from './dtos/register.dto'
import { ResetPasswordDto } from './dtos/reset-password.dto'
import { Verify2FADto } from './dtos/verify-2fa.dto'

// Inyeccion de dependencia manual
const userRepository = new UserRepositoryImpl(db)
const sessionStore = new RedisSessionStore(redisClient)
const tokenService = new TokenService()
const totpService = new TotpService()
const emailService = new ResendEmailService()

const controller = new UserController(
  new RegisterUseCase(userRepository, emailService, tokenService),
  new LoginUseCase(userRepository, sessionStore),
  new LogoutUseCase(sessionStore),
  new ActivateAccountUseCase(userRepository),
  new RecoverPasswordUseCase(userRepository, emailService, tokenService),
  new ResetPasswordUseCase(userRepository),
  new Enable2FAUseCase(userRepository, totpService),
  new Verify2FAUseCase(userRepository, sessionStore, totpService),
  new DeleteAccountUseCase(userRepository, sessionStore)
)

export const userRouter = Router()

// Rutas publicas
userRouter.post('/register', validateBody(RegisterDto), controller.register)
userRouter.post('/login', validateBody(LoginDto), controller.login)
userRouter.get('/activate', controller.activateAccount)
userRouter.post('/forgot-password', validateBody(ForgotPasswordDto), controller.recoverPassword)
userRouter.post('/reset-password', validateBody(ResetPasswordDto), controller.resetPassword)
userRouter.post('/2fa/verify', validateBody(Verify2FADto), controller.verify2FA)

// Rutas protegidas
userRouter.post('/logout', authMiddleware, controller.logout)
userRouter.post('/2fa/enable', authMiddleware, controller.enable2FA)
userRouter.post(
  '/account',
  authMiddleware,
  validateBody(DeleteAccountDto),
  controller.deleteAccount
)
