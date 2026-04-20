import { redisClient } from '@/features/users/infrastructure/cache/redis.session.store'
import { db } from '@/shared/config/database'
import { ROLES } from '@/shared/constants/roles'
import { Router } from 'express'

import { RedisSessionStore } from '@/features/users/infrastructure/cache/redis.session.store'
// Infrastructure
import { UserRepositoryImpl } from '@/features/users/infrastructure/db/user.repository.impl'
import { ResendEmailService } from '@/features/users/infrastructure/services/resend.email.service'
import { TokenService } from '@/features/users/infrastructure/services/token.service'

import { ChangeUserRoleUseCase } from '@/features/users/application/use-cases/change-user-role.use-case'
// Use Cases
import { CreateUserUseCase } from '@/features/users/application/use-cases/create-user.use-case'
import { DeleteAccountUseCase } from '@/features/users/application/use-cases/delete-account.use-case'
import { GetUserUseCase } from '@/features/users/application/use-cases/get-user.use-case'
import { ListUsersUseCase } from '@/features/users/application/use-cases/list-users.use-case'
import { UpdateUserStatusUseCase } from '@/features/users/application/use-cases/update-user-status.use-case'

// Interface
import { AdminController } from './admin.controller'
import { authMiddleware, requireRole, validateBody } from './user.middleware'

import { ChangeUserRoleDto } from './dtos/change-user-role.dto'
// DTOs
import { CreateUserDto } from './dtos/create-user.dto'
import { UpdateUserStatusDto } from './dtos/update-user-status.dto'

// --- Dependency Injection ---
const userRepository = new UserRepositoryImpl(db)
const sessionStore = new RedisSessionStore(redisClient)
const tokenService = new TokenService()
const emailService = new ResendEmailService()

const controller = new AdminController(
  new CreateUserUseCase(userRepository, emailService, tokenService),
  new ListUsersUseCase(userRepository),
  new GetUserUseCase(userRepository),
  new UpdateUserStatusUseCase(userRepository),
  new ChangeUserRoleUseCase(userRepository),
  new DeleteAccountUseCase(userRepository, sessionStore)
)

export const adminRouter = Router()

// Todas las rutas requieren autenticación
adminRouter.use(authMiddleware)

// Crear usuario — ADMIN y OPERATOR
adminRouter.post(
  '/users',
  requireRole(ROLES.ADMIN, ROLES.OPERATOR),
  validateBody(CreateUserDto),
  controller.createUser
)

// Listar usuarios — ADMIN y OPERATOR
adminRouter.get('/users', requireRole(ROLES.ADMIN, ROLES.OPERATOR), controller.listUsers)

// Ver detalle de usuario — ADMIN y OPERATOR
adminRouter.get('/users/:userId', requireRole(ROLES.ADMIN, ROLES.OPERATOR), controller.getUser)

// Suspender/reactivar — solo ADMIN
adminRouter.patch(
  '/users/:userId/status',
  requireRole(ROLES.ADMIN),
  validateBody(UpdateUserStatusDto),
  controller.updateUserStatus
)

// Cambiar rol — solo ADMIN
adminRouter.patch(
  '/users/:userId/role',
  requireRole(ROLES.ADMIN),
  validateBody(ChangeUserRoleDto),
  controller.changeUserRole
)

// Eliminar usuario — solo ADMIN
adminRouter.delete('/users/:userId', requireRole(ROLES.ADMIN), controller.deleteUser)
