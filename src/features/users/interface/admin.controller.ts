import type { ChangeUserRoleUseCase } from '@/features/users/application/use-cases/change-user-role.use-case'
import type { CreateUserUseCase } from '@/features/users/application/use-cases/create-user.use-case'
import type { DeleteAccountUseCase } from '@/features/users/application/use-cases/delete-account.use-case'
import type { GetUserUseCase } from '@/features/users/application/use-cases/get-user.use-case'
import type { ListUsersUseCase } from '@/features/users/application/use-cases/list-users.use-case'
import type { UpdateUserStatusUseCase } from '@/features/users/application/use-cases/update-user-status.use-case'
import { ResponseUtils } from '@/shared/utils/response.utils'
import type { NextFunction, Request, Response } from 'express'

export class AdminController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly listUsersUseCase: ListUsersUseCase,
    private readonly getUserUseCase: GetUserUseCase,
    private readonly updateUserStatusUseCase: UpdateUserStatusUseCase,
    private readonly changeUserRoleUseCase: ChangeUserRoleUseCase,
    private readonly deleteAccountUseCase: DeleteAccountUseCase
  ) {}

  createUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const createdByRole = req.user?.role
      if (!createdByRole) throw new Error('No autenticado')

      const result = await this.createUserUseCase.execute({
        createdByRole,
        ...req.body,
      })
      res.status(201).json(ResponseUtils.success(result))
    } catch (error) {
      next(error)
    }
  }

  listUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.listUsersUseCase.execute({
        role: req.query.role as string | undefined as never,
        status: req.query.status as string | undefined as never,
        page: Number(req.query.page ?? 1),
        limit: Number(req.query.limit ?? 20),
      })
      res.status(200).json(ResponseUtils.success(result))
    } catch (error) {
      next(error)
    }
  }

  getUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = String(req.params.userId ?? '')
      const result = await this.getUserUseCase.execute({ userId })
      res.status(200).json(ResponseUtils.success(result))
    } catch (error) {
      next(error)
    }
  }

  updateUserStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const targetUserId = String(req.params.userId ?? '')
      const result = await this.updateUserStatusUseCase.execute({
        targetUserId,
        newStatus: req.body.status,
      })
      res.status(200).json(ResponseUtils.success(result))
    } catch (error) {
      next(error)
    }
  }

  changeUserRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const targetUserId = String(req.params.userId ?? '')
      const result = await this.changeUserRoleUseCase.execute({
        targetUserId,
        newRole: req.body.role,
      })
      res.status(200).json(ResponseUtils.success(result))
    } catch (error) {
      next(error)
    }
  }

  deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const targetUserId = String(req.params.userId ?? '')
      const authHeader = req.headers.authorization
      const accessToken = authHeader?.split(' ')[1] ?? ''

      const result = await this.deleteAccountUseCase.execute({
        userId: targetUserId,
        password: req.body.password,
        accessToken,
      })
      res.status(200).json(ResponseUtils.success(result))
    } catch (error) {
      next(error)
    }
  }
}
