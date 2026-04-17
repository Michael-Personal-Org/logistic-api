import { z } from 'zod'

export const Enable2FADto = z.object({
  userId: z.string().min(1, 'userId requerido'),
})

export type Enable2FADtoType = z.infer<typeof Enable2FADto>
