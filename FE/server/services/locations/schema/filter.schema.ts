import { z } from '@/lib/openapi/zod'
import { BaseQuerySchema } from '@/server/shared/schemas/query.schema';

export const LocationFilterSchema = BaseQuerySchema
  .omit({
    search: true
  })

export type LocationFilterRequest = z.infer<typeof LocationFilterSchema>