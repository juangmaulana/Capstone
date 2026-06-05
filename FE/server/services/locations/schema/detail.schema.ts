import { z } from '@/lib/openapi/zod'
import { LatitudeParamSchema, LongitudeParamSchema } from '@/server/shared/schemas/coordinate.schema'

export const LocationDetailSchema = z.object({
  latitude: LatitudeParamSchema,
  longitude: LongitudeParamSchema,
})

export type LocationDetailRequest = z.infer<typeof LocationDetailSchema>