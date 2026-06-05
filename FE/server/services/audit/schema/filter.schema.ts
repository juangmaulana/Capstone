import { z } from '@/lib/openapi/zod'
import { BaseQuerySchema } from '@/server/shared/schemas/query.schema';

export const AuditFilterSchema = BaseQuerySchema
  .omit({
    search: true
  })
  .extend({
    entityType: z.string().optional().openapi({
      example: 'Plant'
    }),
    action: z.string().optional().openapi({
      example: 'UPDATE'
    }),
  })

export type AuditFilterRequest = z.infer<typeof AuditFilterSchema>
