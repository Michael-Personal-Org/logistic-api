import type { CreateDriverProfileUseCase } from '@/features/profiles/application/use-cases/create-driver-profile.use-case'
import type { GetDriverProfileUseCase } from '@/features/profiles/application/use-cases/get-driver-profile.use-case'
import type { UpdateDriverProfileUseCase } from '@/features/profiles/application/use-cases/update-driver-profile.use-case'
import { ResponseUtils } from '@/shared/utils/response.utils'
import type { NextFunction, Request, Response } from 'express'

export class ProfileController {
  constructor(
    private readonly createDriverProfile: CreateDriverProfileUseCase,
    private readonly updateDriverProfile: UpdateDriverProfileUseCase,
    private readonly getDriverProfile: GetDriverProfileUseCase
  ) {}

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
