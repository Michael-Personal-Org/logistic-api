import { z } from 'zod'

export const AssignDriverDto = z.object({
  driverId: z.uuid('ID de conductor inválido'),
})

export type AssignDriverDtoType = z.infer<typeof AssignDriverDto>
