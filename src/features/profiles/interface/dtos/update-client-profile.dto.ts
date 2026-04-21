import { z } from 'zod'

export const UpdateClientProfileDto = z.object({
  companyName: z.string().min(2).max(255).optional(),
  rnc: z.string().min(9).max(20).optional(),
  emergencyContact: z.string().max(255).optional(),
})

export type UpdateClientProfileDtoType = z.infer<typeof UpdateClientProfileDto>
