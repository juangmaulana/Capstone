import { z } from '@/lib/openapi/zod'


export const assignRoleSchema = z.object({
  userId: z.coerce.number().min(1).openapi({
    example: 1,
  }),
  roleId: z.coerce.number().min(1).openapi({
    example: 1,
  }),
})

export type AssignRoleRequest = z.infer<typeof assignRoleSchema>