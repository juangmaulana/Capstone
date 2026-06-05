import { z } from '@/lib/openapi/zod'

export const LatitudeSchema = z.coerce.number().min(-90).max(90).openapi({
  example: -7.2575,
  description: '-90 <= latitude <= 90'
})

export const LongitudeSchema = z.coerce.number().min(-180).max(180).openapi({
  example: 112.7521,
  description: '-180 <= longitude <= 180'
})

export const ElevationSchema = z.coerce.number().min(-100).max(2000).openapi({
  example: 51,
  description: '-100 <= elevation <= 2000'
})