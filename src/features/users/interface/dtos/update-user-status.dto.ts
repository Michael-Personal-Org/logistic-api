import { z } from 'zod'

export const UpdateUserStatusDto = z.object({
  status: z.enum(['active', 'suspended']),
})

export type UpdateUserStatusDtoType = z.infer<typeof UpdateUserStatusDto>
