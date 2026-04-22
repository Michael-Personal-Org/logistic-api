import { db } from '@/shared/config/database'
import { ROLES } from '@/shared/constants/roles'
import { Router } from 'express'

import { AuditLogRepositoryImpl } from '@/features/audit/infrastructure/db/audit-log.repository.impl'
// Infrastructure
import { TruckRepositoryImpl } from '@/features/trucks/infrastructure/db/truck.repository.impl'
import { UserRepositoryImpl } from '@/features/users/infrastructure/db/user.repository.impl'

import { CreateAuditLogUseCase } from '@/features/audit/application/use-cases/create-audit-log.use-case'
import { AssignDriverUseCase } from '@/features/trucks/application/use-cases/assign-driver.use-case'
// Use Cases
import { CreateTruckUseCase } from '@/features/trucks/application/use-cases/create-truck.use-case'
import { DeleteTruckUseCase } from '@/features/trucks/application/use-cases/delete-truck.use-case'
import { GetTruckUseCase } from '@/features/trucks/application/use-cases/get-truck.use-case'
import { ListTrucksUseCase } from '@/features/trucks/application/use-cases/list-trucks.use-case'
import { UpdateTruckUseCase } from '@/features/trucks/application/use-cases/update-truck.use-case'

import {
  authMiddleware,
  requireRole,
  validateBody,
} from '@/features/users/interface/user.middleware'
// Shared
import { AuditService } from '@/shared/services/audit.service'

// Interface
import { TruckController } from './truck.controller'

import { AssignDriverDto } from './dtos/assign-driver.dto'
// DTOs
import { CreateTruckDto } from './dtos/create-truck.dto'
import { UpdateTruckDto } from './dtos/update-truck.dto'

// ─── Dependency Injection ────────────────────────────────
const truckRepository = new TruckRepositoryImpl(db)
const userRepository = new UserRepositoryImpl(db)
const auditService = new AuditService(new CreateAuditLogUseCase(new AuditLogRepositoryImpl(db)))

const controller = new TruckController(
  new CreateTruckUseCase(truckRepository, auditService),
  new UpdateTruckUseCase(truckRepository, auditService),
  new GetTruckUseCase(truckRepository),
  new ListTrucksUseCase(truckRepository),
  new AssignDriverUseCase(truckRepository, userRepository, auditService),
  new DeleteTruckUseCase(truckRepository, auditService)
)

export const truckRouter = Router()

// Todas las rutas requieren autenticación
truckRouter.use(authMiddleware)

// Listar camiones — ADMIN, OPERATOR (y DRIVER para ver disponibles)
truckRouter.get('/', requireRole(ROLES.ADMIN, ROLES.OPERATOR, ROLES.DRIVER), controller.list)

// Ver detalle — ADMIN, OPERATOR, DRIVER
truckRouter.get(
  '/:truckId',
  requireRole(ROLES.ADMIN, ROLES.OPERATOR, ROLES.DRIVER),
  controller.getOne
)

// Crear camión — solo ADMIN y OPERATOR
truckRouter.post(
  '/',
  requireRole(ROLES.ADMIN, ROLES.OPERATOR),
  validateBody(CreateTruckDto),
  controller.create
)

// Actualizar camión — solo ADMIN y OPERATOR
truckRouter.put(
  '/:truckId',
  requireRole(ROLES.ADMIN, ROLES.OPERATOR),
  validateBody(UpdateTruckDto),
  controller.update
)

// Asignar conductor — solo ADMIN y OPERATOR
truckRouter.patch(
  '/:truckId/assign-driver',
  requireRole(ROLES.ADMIN, ROLES.OPERATOR),
  validateBody(AssignDriverDto),
  controller.assignDriver
)

// Eliminar camión — solo ADMIN
truckRouter.delete('/:truckId', requireRole(ROLES.ADMIN), controller.remove)
