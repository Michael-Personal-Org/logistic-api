import { z } from 'zod'

export const ActivateAccountDto = z.object({
  token: z.string().min(1, 'Token requerido'),
})

export type ActivateAccountDtoType = z.infer<typeof ActivateAccountDto>
