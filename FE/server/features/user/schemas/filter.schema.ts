import { z } from '@/lib/openapi/zod'
import { BaseQuerySchema } from '@/server/shared/schemas/query.schema'

export const UserFilterSchema = BaseQuerySchema.extend({
  roleId: z.coerce.number().min(1).optional().openapi({
    example: 1,
  }),
})
.openapi({
  title: 'UserFilterRequest'
})

export type UserFilterRequest = z.infer<typeof UserFilterSchema>