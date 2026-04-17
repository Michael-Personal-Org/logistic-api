import { z } from 'zod'

export const ResetPasswordDto = z.object({
  token: z.string().min(1, 'Token requerido'),
  newPassword: z
    .string()
    .min(8, 'La contrasena debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayuscula')
    .regex(/[0-9]/, 'Debe contener al menos un numero')
    .regex(/[^a-zA-Z0-9]/, 'Debe contener al menos un caracteres especial'),
})

export type ResetPasswordDtoType = z.infer<typeof ResetPasswordDto>
