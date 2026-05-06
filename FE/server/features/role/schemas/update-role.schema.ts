import { z } from '@/lib/openapi/zod'

export const updateRoleSchema = z.object({
  name: z.string().min(1).optional().openapi({
    example: 'Admin',
  }),
  description: z.string().optional().openapi({
    example: 'Privillage user with CRUD abilities',
  }),
})

.refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be provided',
})

.openapi({
  title: 'UpdateRoleRequest',
})

export type UpdateRoleRequest = z.infer<typeof updateRoleSchema>