import { z } from '@/lib/openapi/zod'
import { LatitudeSchema, LongitudeSchema } from '@/server/shared/schemas/coordinate.schema'

export const NearbyImagesSchema = z.object({
  latitude: LatitudeSchema,
  longitude: LongitudeSchema,
  radius: z.coerce.number().min(0).max(100).openapi({
    example: 5,
    description: 'Circle radius (km) of nearby images: 0 <= radius <= 100',
  })
})

export type NearbyImagesRequest = z.infer<typeof NearbyImagesSchema>