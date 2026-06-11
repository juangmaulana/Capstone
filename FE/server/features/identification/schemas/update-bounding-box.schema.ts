import { z } from '@/lib/openapi/zod'
import { PlantIdSchema } from './base.schema'

export const BoundingBoxSchema = z.coerce.number().min(0).openapi({
  example: 30
})

export const UpdateBoundingBoxSchema = z.object({
  x1: BoundingBoxSchema,
  x2: BoundingBoxSchema,
  y1: BoundingBoxSchema,
  y2: BoundingBoxSchema,
  plantId: PlantIdSchema.optional(),
}).openapi({
  title: 'UpdateBoundingBoxRequest',
})

export type UpdateBoundingBoxRequest = z.infer<typeof UpdateBoundingBoxSchema>
