import { AppError, ConflictError, NotFoundError } from '@/shared/errors/app.error'

export class TruckNotFoundError extends NotFoundError {
  constructor(identifier: string) {
    super(`Camion no encontrado: ${identifier}`)
  }
}

export class TruckAlreadyExistsError extends ConflictError {
  constructor(plateNumber: string) {
    super(`Ya existe un camion con la placa: ${plateNumber}`)
  }
}

export class TruckNotAvailableError extends AppError {
  constructor() {
    super('El camion no esta disponible', 409, 'TRUCK_NOT_AVAILABLE')
  }
}

export class TruckAlreadyAssignedError extends AppError {
  constructor() {
    super('El camion ya tiene un conductor asignado', 409, 'TRUCK_ALREADY_ASSGINED')
  }
}

export class CargoTypeNotSupportedError extends AppError {
  constructor(cargoType: string) {
    super(`El camion no soporta el tipo de carga ${cargoType}`, 400, 'CARGO_TYPE_NOT_SUPPORTED')
  }
}
