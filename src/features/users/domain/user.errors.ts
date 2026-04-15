import {
  AppError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from '@/shared/errors/app.error'

export class UserAlreadyExistsError extends ConflictError {
  constructor(email: string) {
    super(`El email ${email} ya esta registrado`)
  }
}

export class UserNotFoundError extends NotFoundError {
  constructor(identifier: string) {
    super(`Usuario no encontrado: ${identifier}`)
  }
}

export class InvalidCredentialsError extends UnauthorizedError {
  constructor() {
    super('Crendeciales invalidas')
  }
}

export class AccountNotActiveError extends UnauthorizedError {
  constructor() {
    super('LA cuenta no esta activa. Verifica tu email')
  }
}

export class AccountSuspendedError extends UnauthorizedError {
  constructor() {
    super('La cuenta ha sido suspendida')
  }
}

export class InvalidOrExpiredTokenError extends AppError {
  constructor() {
    super('EL token es invalido o ha expirado.', 400, 'INVALID_OR_EXPIRED_TOKEN')
  }
}

export class TwoFactorAlreadyEnabledError extends AppError {
  constructor() {
    super('El 2FA ya esta habilitado', 409, 'TWO_FACTOR_ALREADY_ENABLED')
  }
}

export class TwoFactorNotEnabledError extends AppError {
  constructor() {
    super('El 2FA no esta habilitado', 400, 'TWO_FACTOR_NOT_ENABLED')
  }
}

export class InvalidTwoFactorCodeError extends UnauthorizedError {
  constructor() {
    super('Codigo 2FA invalido')
  }
}
