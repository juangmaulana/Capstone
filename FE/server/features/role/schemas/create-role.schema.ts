import { z } from '@/lib/openapi/zod'

export const createRoleSchema = z.object({
  name: z.string().min(1).openapi({
    example: 'Admin',
  }),
  description: z.string().openapi({
    example: 'Privillage user with CRUD abilities',
  }),
})

.openapi({
  title: 'CreateRoleRequest',
})

export type CreateRoleRequest = z.infer<typeof createRoleSchema>