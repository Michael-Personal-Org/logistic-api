import { AppError, ConflictError, ForbiddenError, NotFoundError } from '@/shared/errors/app.error'

export class ProfileAlreadyExistsError extends ConflictError {
  constructor() {
    super('Ya tienes un perfil creado')
  }
}

export class ProfileNotFoundError extends NotFoundError {
  constructor() {
    super('Perfil no encontrado')
  }
}

export class ProfileNotApprovedError extends ForbiddenError {
  constructor() {
    super('Tu perfil aún no ha sido aprobado')
  }
}

export class InvalidRoleForProfileError extends AppError {
  constructor(expectedRole: string) {
    super(
      `Solo usuarios con rol ${expectedRole} pueden tener este tipo de perfil`,
      400,
      'INVALID_ROLE_FOR_PROFILE'
    )
  }
}
