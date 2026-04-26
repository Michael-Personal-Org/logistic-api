import { db } from '@/shared/config/database'
import { ROLES } from '@/shared/constants/roles'
import { Router } from 'express'

import { ProfileRepositoryImpl } from '@/features/profiles/infrastructure/db/profile.repository.impl'
import { UserRepositoryImpl } from '@/features/users/infrastructure/db/user.repository.impl'

import { CreateDriverProfileUseCase } from '@/features/profiles/application/use-cases/create-driver-profile.use-case'
import { GetDriverProfileUseCase } from '@/features/profiles/application/use-cases/get-driver-profile.use-case'
import { UpdateDriverProfileUseCase } from '@/features/profiles/application/use-cases/update-driver-profile.use-case'

import {
  authMiddleware,
  requireRole,
  validateBody,
} from '@/features/users/interface/user.middleware'
import { CreateDriverProfileDto } from './dtos/create-driver-profile.dto'
import { UpdateDriverProfileDto } from './dtos/update-driver-profile.dto'
import { ProfileController } from './profile.controller'

const profileRepository = new ProfileRepositoryImpl(db)
const userRepository = new UserRepositoryImpl(db)

const controller = new ProfileController(
  new CreateDriverProfileUseCase(profileRepository, userRepository),
  new UpdateDriverProfileUseCase(profileRepository),
  new GetDriverProfileUseCase(profileRepository)
)

export const profileRouter = Router()

profileRouter.post(
  '/driver',
  authMiddleware,
  requireRole(ROLES.DRIVER),
  validateBody(CreateDriverProfileDto),
  controller.createMyDriverProfile
)

profileRouter.put(
  '/driver',
  authMiddleware,
  requireRole(ROLES.DRIVER),
  validateBody(UpdateDriverProfileDto),
  controller.updateMyDriverProfile
)

profileRouter.get(
  '/driver',
  authMiddleware,
  requireRole(ROLES.DRIVER),
  controller.getMyDriverProfile
)

profileRouter.get(
  '/driver/:userId',
  authMiddleware,
  requireRole(ROLES.ADMIN, ROLES.OPERATOR),
  controller.getDriverProfileByUserId
)
