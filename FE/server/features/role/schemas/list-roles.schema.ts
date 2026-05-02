import { z } from '@/lib/openapi/zod'

export const listRolesSchema = z.object({
  search: z.string().optional().openapi({
    example: 'Admin',
    description: 'Searched through names and descriptions (Case Insensitive)',
  }),
  limit: z.coerce.number().min(1).max(100).default(20).optional().openapi({
    example: 20,
  }),
  offset: z.coerce.number().min(0).optional().openapi({
    example: 0,
  }),
})
.openapi({
  title: 'ListRolesQuery'
})

export type ListRolesQuery = z.infer<typeof listRolesSchema>