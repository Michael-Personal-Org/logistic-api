import { AppError } from '@/shared/errors/app.error'

export class OrganizationNotFoundError extends AppError {
  constructor(id: string) {
    super(`Organización ${id} no encontrada`, 404, 'ORGANIZATION_NOT_FOUND')
  }
}

export class OrganizationAlreadyExistsError extends AppError {
  constructor(field: string) {
    super(`Ya existe una organización con ese ${field}`, 409, 'ORGANIZATION_ALREADY_EXISTS')
  }
}

export class OrganizationAlreadyApprovedError extends AppError {
  constructor() {
    super('La organización ya está aprobada', 409, 'ORGANIZATION_ALREADY_APPROVED')
  }
}

export class OrganizationSuspendedError extends AppError {
  constructor() {
    super('La organización está suspendida', 403, 'ORGANIZATION_SUSPENDED')
  }
}

export class InvitationNotFoundError extends AppError {
  constructor() {
    super('Invitación no encontrada o expirada', 404, 'INVITATION_NOT_FOUND')
  }
}

export class InvitationAlreadyUsedError extends AppError {
  constructor() {
    super('Esta invitación ya fue utilizada', 409, 'INVITATION_ALREADY_USED')
  }
}

export class InvitationExpiredError extends AppError {
  constructor() {
    super('Esta invitación ha expirado', 410, 'INVITATION_EXPIRED')
  }
}
