import { z } from 'zod'

export const CreateUserDto = z.object({
  email: z.email('Email inválido'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número')
    .regex(/[^a-zA-Z0-9]/, 'Debe contener al menos un carácter especial'),
  firstName: z.string().min(2).max(100),
  lastName: z.string().min(2).max(100),
  role: z.enum(['CLIENT', 'DRIVER', 'OPERATOR', 'ADMIN']),
})

export type CreateUserDtoType = z.infer<typeof CreateUserDto>
