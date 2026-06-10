import { z } from '@/lib/openapi/zod'

export const BoundingBoxSchema = z.coerce.number().min(0).openapi({
  example: 30
})

export const UpdateBoundingBoxSchema = z.object({
  x1: BoundingBoxSchema,
  x2: BoundingBoxSchema,
  y1: BoundingBoxSchema,
  y2: BoundingBoxSchema,
}).openapi({
  title: 'UpdateBoundingBoxRequest',
})

export type UpdateBoundingBoxRequest = z.infer<typeof UpdateBoundingBoxSchema>
