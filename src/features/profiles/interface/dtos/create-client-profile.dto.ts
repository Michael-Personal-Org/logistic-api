import { z } from 'zod'

export const CreateClientProfileDto = z.object({
  companyName: z.string().min(2, 'Nombre de empresa muy corto').max(255),
  rnc: z.string().min(9, 'RNC inválido').max(20).optional(),
  emergencyContact: z.string().max(255).optional(),
})

export type CreateClientProfileDtoType = z.infer<typeof CreateClientProfileDto>
