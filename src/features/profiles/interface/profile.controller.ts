import type { ApproveClientProfileUseCase } from '@/features/profiles/application/use-cases/approve-client-profile.use-case'
import type { CreateClientProfileUseCase } from '@/features/profiles/application/use-cases/create-client-profile.use-case'
import type { CreateDriverProfileUseCase } from '@/features/profiles/application/use-cases/create-driver-profile.use-case'
import type { GetClientProfileUseCase } from '@/features/profiles/application/use-cases/get-client-profile.use-case'
import type { GetDriverProfileUseCase } from '@/features/profiles/application/use-cases/get-driver-profile.use-case'
import type { UpdateClientProfileUseCase } from '@/features/profiles/application/use-cases/update-client-profile.use-case'
import type { UpdateDriverProfileUseCase } from '@/features/profiles/application/use-cases/update-driver-profile.use-case'
import { ResponseUtils } from '@/shared/utils/response.utils'
import type { NextFunction, Request, Response } from 'express'

export class ProfileController {
  constructor(
    private readonly createClientProfile: CreateClientProfileUseCase,
    private readonly updateClientProfile: UpdateClientProfileUseCase,
    private readonly getClientProfile: GetClientProfileUseCase,
    private readonly approveClientProfile: ApproveClientProfileUseCase,
    private readonly createDriverProfile: CreateDriverProfileUseCase,
    private readonly updateDriverProfile: UpdateDriverProfileUseCase,
    private readonly getDriverProfile: GetDriverProfileUseCase
  ) {}

  // ─── Client Profile ──────────────────────────────────────

  createMyClientProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id ?? ''
      const result = await this.createClientProfile.execute({ userId, ...req.body })
      res.status(201).json(ResponseUtils.success(result))
    } catch (error) {
      next(error)
    }
  }

  updateMyClientProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id ?? ''
      const result = await this.updateClientProfile.execute({ userId, ...req.body })
      res.status(200).json(ResponseUtils.success(result))
    } catch (error) {
      next(error)
    }
  }

  getMyClientProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id ?? ''
      const result = await this.getClientProfile.execute({ userId })
      res.status(200).json(ResponseUtils.success(result))
    } catch (error) {
      next(error)
    }
  }

  // Para que ADMIN u OPERATOR vean el perfil de cualquier cliente
  getClientProfileByUserId = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = String(req.params.userId ?? '')
      const result = await this.getClientProfile.execute({ userId })
      res.status(200).json(ResponseUtils.success(result))
    } catch (error) {
      next(error)
    }
  }

  approveClientProfileByUserId = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = String(req.params.userId ?? '')
      const approvedBy = req.user?.id ?? ''
      const result = await this.approveClientProfile.execute({ userId, approvedBy })
      res.status(200).json(ResponseUtils.success(result))
    } catch (error) {
      next(error)
    }
  }

  // ─── Driver Profile ──────────────────────────────────────

  createMyDriverProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id ?? ''
      const result = await this.createDriverProfile.execute({ userId, ...req.body })
      res.status(201).json(ResponseUtils.success(result))
    } catch (error) {
      next(error)
    }
  }

  updateMyDriverProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id ?? ''
      const result = await this.updateDriverProfile.execute({ userId, ...req.body })
      res.status(200).json(ResponseUtils.success(result))
    } catch (error) {
      next(error)
    }
  }

  getMyDriverProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id ?? ''
      const result = await this.getDriverProfile.execute({ userId })
      res.status(200).json(ResponseUtils.success(result))
    } catch (error) {
      next(error)
    }
  }

  getDriverProfileByUserId = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = String(req.params.userId ?? '')
      const result = await this.getDriverProfile.execute({ userId })
      res.status(200).json(ResponseUtils.success(result))
    } catch (error) {
      next(error)
    }
  }
}
