import { z } from 'zod'

export const ListUsersDto = z.object({
  role: z.enum(['CLIENT', 'DRIVER', 'OPERATOR', 'ADMIN']).optional(),
  status: z.enum(['pending', 'active', 'suspended']).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
})

export type ListUsersDtoType = z.infer<typeof ListUsersDto>
