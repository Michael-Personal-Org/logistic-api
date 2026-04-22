import { z } from 'zod'

const cargoTypeEnum = z.enum([
  'GENERAL',
  'FRAGILE',
  'CHEMICAL',
  'TEXTILE',
  'REFRIGERATED',
  'HAZARDOUS',
])

export const CreateTruckDto = z.object({
  plateNumber: z.string().min(6, 'Placa inválida').max(20),
  model: z.string().min(2, 'Modelo muy corto').max(100),
  capacity: z.string().min(1, 'Capacidad requerida').max(50),
  allowedCargoTypes: z
    .array(cargoTypeEnum)
    .min(1, 'Debe tener al menos un tipo de carga')
    .default(['GENERAL']),
})

export type CreateTruckDtoType = z.infer<typeof CreateTruckDto>
