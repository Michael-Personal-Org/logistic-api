import { ResponseUtils } from '@/shared/utils/response.utils'
import type { NextFunction, Request, Response } from 'express'

// Use Cases
import type { ActivateAccountUseCase } from '@/features/users/application/use-cases/activate-account.use-case'
import type { DeleteAccountUseCase } from '@/features/users/application/use-cases/delete-account.use-case'
import type { Enable2FAUseCase } from '@/features/users/application/use-cases/enable-2fa.use-case'
import type { LoginUseCase } from '@/features/users/application/use-cases/login.use-case'
import type { LogoutUseCase } from '@/features/users/application/use-cases/logout.use-case'
import type { RecoverPasswordUseCase } from '@/features/users/application/use-cases/recover-password.use-case'
import type { RegisterUseCase } from '@/features/users/application/use-cases/register.use-case'
import type { ResetPasswordUseCase } from '@/features/users/application/use-cases/reset-password.use-case'
import type { Verify2FAUseCase } from '@/features/users/application/use-cases/verify-2fa.use-case'

export class UserController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly activateAccountUseCase: ActivateAccountUseCase,
    private readonly recoverPasswordUseCase: RecoverPasswordUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
    private readonly enable2FAUseCase: Enable2FAUseCase,
    private readonly verify2FAUseCase: Verify2FAUseCase,
    private readonly deleteAccountUseCase: DeleteAccountUseCase
  ) {}

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.registerUseCase.execute(req.body)
      res.status(201).json(ResponseUtils.success(result))
    } catch (error) {
      next(error)
    }
  }

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.loginUseCase.execute(req.body)
      res.status(200).json(ResponseUtils.success(result))
    } catch (error) {
      next(error)
    }
  }

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization
      const accessToken = authHeader?.split(' ')[1] ?? ''
      const userId = req.user?.id ?? ''

      const result = await this.logoutUseCase.execute({ accessToken, userId })
      res.status(200).json(ResponseUtils.success(result))
    } catch (error) {
      next(error)
    }
  }

  activateAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = req.query.token as string
      const result = await this.activateAccountUseCase.execute({ token })

      res.status(200).json(ResponseUtils.success(result))
    } catch (error) {
      next(error)
    }
  }

  recoverPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.recoverPasswordUseCase.execute(req.body)
      res.status(200).json(ResponseUtils.success(result))
    } catch (error) {
      next(error)
    }
  }

  resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.resetPasswordUseCase.execute(req.body)
      res.status(200).json(ResponseUtils.success(result))
    } catch (error) {
      next(error)
    }
  }

  enable2FA = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id ?? ''
      const result = await this.enable2FAUseCase.execute({ userId })
      res.status(200).json(ResponseUtils.success(result))
    } catch (error) {
      next(error)
    }
  }

  verify2FA = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.verify2FAUseCase.execute(req.body)
      res.status(200).json(ResponseUtils.success(result))
    } catch (error) {
      next(error)
    }
  }

  deleteAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization
      const accessToken = authHeader?.split(' ')[1] ?? ''
      const userId = req.user?.id ?? ''

      const result = await this.deleteAccountUseCase.execute({
        userId,
        password: req.body.password,
        accessToken,
      })
      res.status(200).json(ResponseUtils.success(result))
    } catch (error) {
      next(error)
    }
  }
}
