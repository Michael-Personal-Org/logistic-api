import { z } from 'zod'

export const RegisterOrganizationDto = z.object({
  // Empresa
  orgName: z.string().min(2).max(255),
  rnc: z.string().min(9).max(20).optional(),
  orgPhone: z.string().min(7).max(50),
  orgEmail: z.email(),
  address: z.string().min(5).max(500),
  industry: z.string().max(100).optional(),

  // Admin principal
  firstName: z.string().min(2).max(100),
  lastName: z.string().min(2).max(100),
  adminEmail: z.email(),
  adminPhone: z.string().min(7).max(50),
  jobTitle: z.string().max(100).optional(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, 'Debe tener al menos una mayúscula')
    .regex(/[0-9]/, 'Debe tener al menos un número')
    .regex(/[^a-zA-Z0-9]/, 'Debe tener al menos un carácter especial'),
})
