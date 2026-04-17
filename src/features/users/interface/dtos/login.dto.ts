import { z } from 'zod'

export const LoginDto = z.object({
  email: z.email('Email invalido'),
  password: z.string().min(1, 'La contrasena es requerida'),
})

export type LoginDtoType = z.infer<typeof LoginDto>
