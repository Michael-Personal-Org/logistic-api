import { z } from 'zod'

const cargoTypeEnum = z.enum([
  'GENERAL',
  'FRAGILE',
  'CHEMICAL',
  'TEXTILE',
  'REFRIGERATED',
  'HAZARDOUS',
])

export const UpdateTruckDto = z.object({
  model: z.string().min(2).max(100).optional(),
  capacity: z.string().min(1).max(50).optional(),
  allowedCargoTypes: z.array(cargoTypeEnum).min(1).optional(),
  isAvailable: z.boolean().optional(),
})

export type UpdateTruckDtoType = z.infer<typeof UpdateTruckDto>
