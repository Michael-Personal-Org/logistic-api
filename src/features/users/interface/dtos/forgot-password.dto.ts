import { z } from 'zod'

export const ForgotPasswordDto = z.object({
  email: z.email('Email invalido'),
})

export type ForgotPasswordDtoType = z.infer<typeof ForgotPasswordDto>
