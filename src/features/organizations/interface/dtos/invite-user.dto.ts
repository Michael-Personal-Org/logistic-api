import { z } from 'zod'

export const InviteUserDto = z.object({
  email: z.email(),
  role: z.enum(['ORG_ORDER', 'ORG_TRACK']),
})
