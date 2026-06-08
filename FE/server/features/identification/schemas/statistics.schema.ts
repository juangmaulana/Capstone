import { z } from '@/lib/openapi/zod'
import { PlantIdSchema } from './base.schema'

export const IdentificationStatisticsFilterSchema = z.object({
  year: z.coerce.number().min(0).optional().openapi({
    example: 2026
  }),
  plantId: PlantIdSchema.optional(),
})

export type IdentificationStatisticsFilterRequest = z.infer<typeof IdentificationStatisticsFilterSchema>
