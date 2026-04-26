import { z } from 'zod'

export const AcceptInvitationDto = z.object({
  token: z.uuid(),
  firstName: z.string().min(2).max(100),
  lastName: z.string().min(2).max(100),
  phone: z.string().min(7).max(50),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, 'Debe tener al menos una mayúscula')
    .regex(/[0-9]/, 'Debe tener al menos un número')
    .regex(/[^a-zA-Z0-9]/, 'Debe tener al menos un carácter especial'),
})
