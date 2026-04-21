import { db } from '@/shared/config/database'
import { ROLES } from '@/shared/constants/roles'
import { Router } from 'express'

// Infrastructure
import { ProfileRepositoryImpl } from '@/features/profiles/infrastructure/db/profile.repository.impl'
import { UserRepositoryImpl } from '@/features/users/infrastructure/db/user.repository.impl'

import { ApproveClientProfileUseCase } from '@/features/profiles/application/use-cases/approve-client-profile.use-case'
// Use Cases
import { CreateClientProfileUseCase } from '@/features/profiles/application/use-cases/create-client-profile.use-case'
import { CreateDriverProfileUseCase } from '@/features/profiles/application/use-cases/create-driver-profile.use-case'
import { GetClientProfileUseCase } from '@/features/profiles/application/use-cases/get-client-profile.use-case'
import { GetDriverProfileUseCase } from '@/features/profiles/application/use-cases/get-driver-profile.use-case'
import { UpdateClientProfileUseCase } from '@/features/profiles/application/use-cases/update-client-profile.use-case'
import { UpdateDriverProfileUseCase } from '@/features/profiles/application/use-cases/update-driver-profile.use-case'

import {
  authMiddleware,
  requireRole,
  validateBody,
} from '@/features/users/interface/user.middleware'
// Interface
import { ProfileController } from './profile.controller'

// DTOs
import { CreateClientProfileDto } from './dtos/create-client-profile.dto'
import { CreateDriverProfileDto } from './dtos/create-driver-profile.dto'
import { UpdateClientProfileDto } from './dtos/update-client-profile.dto'
import { UpdateDriverProfileDto } from './dtos/update-driver-profile.dto'

// ─── Dependency Injection ────────────────────────────────
const profileRepository = new ProfileRepositoryImpl(db)
const userRepository = new UserRepositoryImpl(db)

const controller = new ProfileController(
  new CreateClientProfileUseCase(profileRepository, userRepository),
  new UpdateClientProfileUseCase(profileRepository),
  new GetClientProfileUseCase(profileRepository),
  new ApproveClientProfileUseCase(profileRepository),
  new CreateDriverProfileUseCase(profileRepository, userRepository),
  new UpdateDriverProfileUseCase(profileRepository),
  new GetDriverProfileUseCase(profileRepository)
)

export const profileRouter = Router()

// ─── Client Profile Routes ───────────────────────────────
// El cliente gestiona su propio perfil
profileRouter.post(
  '/client',
  authMiddleware,
  requireRole(ROLES.CLIENT),
  validateBody(CreateClientProfileDto),
  controller.createMyClientProfile
)

profileRouter.put(
  '/client',
  authMiddleware,
  requireRole(ROLES.CLIENT),
  validateBody(UpdateClientProfileDto),
  controller.updateMyClientProfile
)

profileRouter.get(
  '/client',
  authMiddleware,
  requireRole(ROLES.CLIENT),
  controller.getMyClientProfile
)

// ADMIN y OPERATOR pueden ver y aprobar perfiles de clientes
profileRouter.get(
  '/client/:userId',
  authMiddleware,
  requireRole(ROLES.ADMIN, ROLES.OPERATOR),
  controller.getClientProfileByUserId
)

profileRouter.patch(
  '/client/:userId/approve',
  authMiddleware,
  requireRole(ROLES.ADMIN, ROLES.OPERATOR),
  controller.approveClientProfileByUserId
)

// ─── Driver Profile Routes ───────────────────────────────
// El conductor gestiona su propio perfil
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

// ADMIN y OPERATOR pueden ver perfiles de conductores
profileRouter.get(
  '/driver/:userId',
  authMiddleware,
  requireRole(ROLES.ADMIN, ROLES.OPERATOR),
  controller.getDriverProfileByUserId
)
