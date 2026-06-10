import { z } from '@/lib/openapi/zod'
import { BaseQuerySchema } from '@/server/shared/schemas/query.schema';

export const LocationFilterSchema = BaseQuerySchema
  .omit({
    search: true
  })
  .extend({
    species: z.string().optional().openapi({
      example: 'Acer'
    })
  })

export type LocationFilterRequest = z.infer<typeof LocationFilterSchema>