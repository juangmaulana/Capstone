import { z } from '@/lib/openapi/zod'

export const listUsersSchema = z.object({
  search: z.string().optional().openapi({
    example: 'john',
    description: 'Searched through names and emails (Case Insensitive)',
  }),
  roleId: z.coerce.number().min(1).optional().openapi({
    example: 1,
  }),
  limit: z.coerce.number().min(1).max(100).default(20).optional().openapi({
    example: 20,
  }),
  offset: z.coerce.number().min(0).optional().openapi({
    example: 0,
  }),
})
.openapi({
  title: 'ListUsersQuery'
})

export type ListUsersQuery = z.infer<typeof listUsersSchema>