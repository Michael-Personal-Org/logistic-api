import { z } from 'zod'

export const ChangeUserRoleDto = z.object({
  role: z.enum(['CLIENT', 'DRIVER', 'OPERATOR', 'ADMIN']),
})

export type ChangeUserRoleDtoType = z.infer<typeof ChangeUserRoleDto>
