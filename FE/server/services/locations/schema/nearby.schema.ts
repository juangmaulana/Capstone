import { z } from '@/lib/openapi/zod'
import { LatitudeParamSchema, LongitudeParamSchema } from '@/server/shared/schemas/coordinate.schema'

export const NearbyImagesSchema = z.object({
  species: z.string().optional().openapi({
    example: 'Acer'
  }),
  latitude: LatitudeParamSchema,
  longitude: LongitudeParamSchema,
  radius: z.string().openapi({
    example: 5,
    description: 'Circle radius (km) of nearby images: 0 <= radius <= 100',
  }).transform(Number)
})

export type NearbyImagesRequest = z.infer<typeof NearbyImagesSchema>