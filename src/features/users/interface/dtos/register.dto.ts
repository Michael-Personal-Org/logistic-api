import { z } from 'zod'

export const RegisterDto = z.object({
  email: z.email('Email invalido'),
  password: z
    .string()
    .min(8, 'La contrasena debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayuscula')
    .regex(/[0-9]/, 'Debe contener al menos un numero')
    .regex(/[^a-zA-Z0-9]/, 'Debe contener al menos un caracteres especial'),
  firstName: z.string().min(2, 'Nombre muy corto').max(100),
  lastName: z.string().min(2, 'Apellido muy corto').max(100),
})

export type RegisterDtoType = z.infer<typeof RegisterDto>
