import { z } from 'zod'

export const DeleteAccountDto = z.object({
  password: z.string().min(1, 'La contrasena es requerida'),
})

export type DeleteAccountDtoType = z.infer<typeof DeleteAccountDto>
