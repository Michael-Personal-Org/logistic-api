import { z } from 'zod'

export const CreateDriverProfileDto = z.object({
  vehiclePlate: z.string().min(6, 'Placa inválida').max(20),
  licenseNumber: z.string().min(5, 'Número de licencia inválido').max(20),
  licenseType: z.enum(['A', 'B', 'C', 'D', 'E']).default('B'),
})

export type CreateDriverProfileDtoType = z.infer<typeof CreateDriverProfileDto>
