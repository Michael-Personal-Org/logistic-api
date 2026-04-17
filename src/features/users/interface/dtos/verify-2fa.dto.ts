import { z } from 'zod'

export const Verify2FADto = z.object({
  userId: z.string().min(1, 'userId requerido'),
  code: z.string().length(6, 'EL codigo debe tener 6 digitos'),
  isSetupVerification: z.boolean().default(false),
})

export type Verify2FADtoType = z.infer<typeof Verify2FADto>
