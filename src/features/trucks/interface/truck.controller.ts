import type { AssignDriverUseCase } from '@/features/trucks/application/use-cases/assign-driver.use-case'
import type { CreateTruckUseCase } from '@/features/trucks/application/use-cases/create-truck.use-case'
import type { DeleteTruckUseCase } from '@/features/trucks/application/use-cases/delete-truck.use-case'
import type { GetTruckUseCase } from '@/features/trucks/application/use-cases/get-truck.use-case'
import type { ListTrucksUseCase } from '@/features/trucks/application/use-cases/list-trucks.use-case'
import type { UpdateTruckUseCase } from '@/features/trucks/application/use-cases/update-truck.use-case'
import type { CargoType } from '@/features/trucks/domain/truck.entity'
import { ResponseUtils } from '@/shared/utils/response.utils'
import type { NextFunction, Request, Response } from 'express'

export class TruckController {
  constructor(
    private readonly createTruckUseCase: CreateTruckUseCase,
    private readonly updateTruckUseCase: UpdateTruckUseCase,
    private readonly getTruckUseCase: GetTruckUseCase,
    private readonly listTrucksUseCase: ListTrucksUseCase,
    private readonly assignDriverUseCase: AssignDriverUseCase,
    private readonly deleteTruckUseCase: DeleteTruckUseCase
  ) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const performedBy = req.user?.id ?? ''
      const ipAddress = req.ip ?? ''

      const result = await this.createTruckUseCase.execute({
        ...req.body,
        performedBy,
        ipAddress,
      })
      res.status(201).json(ResponseUtils.success(result))
    } catch (error) {
      next(error)
    }
  }

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const truckId = String(req.params.truckId ?? '')
      const performedBy = req.user?.id ?? ''
      const ipAddress = req.ip ?? ''

      const result = await this.updateTruckUseCase.execute({
        truckId,
        ...req.body,
        performedBy,
        ipAddress,
      })
      res.status(200).json(ResponseUtils.success(result))
    } catch (error) {
      next(error)
    }
  }

  getOne = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const truckId = String(req.params.truckId ?? '')
      const result = await this.getTruckUseCase.execute({ truckId })
      res.status(200).json(ResponseUtils.success(result))
    } catch (error) {
      next(error)
    }
  }

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.listTrucksUseCase.execute({
        isAvailable:
          req.query.isAvailable !== undefined ? req.query.isAvailable === 'true' : undefined,
        cargoType: req.query.cargoType as CargoType | undefined,
        page: Number(req.query.page ?? 1),
        limit: Number(req.query.limit ?? 20),
      })
      res.status(200).json(ResponseUtils.success(result))
    } catch (error) {
      next(error)
    }
  }

  assignDriver = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const truckId = String(req.params.truckId ?? '')
      const performedBy = req.user?.id ?? ''
      const ipAddress = req.ip ?? ''

      const result = await this.assignDriverUseCase.execute({
        truckId,
        driverId: req.body.driverId,
        performedBy,
        ipAddress,
      })
      res.status(200).json(ResponseUtils.success(result))
    } catch (error) {
      next(error)
    }
  }

  remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const truckId = String(req.params.truckId ?? '')
      const performedBy = req.user?.id ?? ''
      const ipAddress = req.ip ?? ''

      const result = await this.deleteTruckUseCase.execute({
        truckId,
        performedBy,
        ipAddress,
      })
      res.status(200).json(ResponseUtils.success(result))
    } catch (error) {
      next(error)
    }
  }
}
