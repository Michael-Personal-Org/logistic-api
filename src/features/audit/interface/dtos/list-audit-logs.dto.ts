import { z } from 'zod'

export const ListAuditLogsDto = z.object({
  userId: z.uuid().optional(),
  action: z.string().optional(),
  resource: z.string().optional(),
  resourceId: z.uuid().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
})

export type ListAuditLogsDtoType = z.infer<typeof ListAuditLogsDto>
