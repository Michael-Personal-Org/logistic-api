import { z } from 'zod'

export const UpdateDriverProfileDto = z.object({
  vehiclePlate: z.string().min(6).max(20).optional(),
  licenseNumber: z.string().min(5).max(20).optional(),
  licenseType: z.enum(['A', 'B', 'C', 'D', 'E']).optional(),
  isAvailable: z.boolean().optional(),
})

export type UpdateDriverProfileDtoType = z.infer<typeof UpdateDriverProfileDto>
