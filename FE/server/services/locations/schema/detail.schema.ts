import { z } from '@/lib/openapi/zod'
import { LatitudeSchema, LongitudeSchema } from '@/server/shared/schemas/coordinate.schema'

export const LocationDetailSchema = z.object({
  latitude: LatitudeSchema,
  longitude: LongitudeSchema,
})

export type LocationDetailRequest = z.infer<typeof LocationDetailSchema>