import { z } from '@/lib/openapi/zod'

export const LatitudeParamSchema = z.string().openapi({
  example: -7.2575,
  description: '-90 <= latitude <= 90'
}).transform(Number)

export const LongitudeParamSchema = z.string().openapi({
  example: 112.7521,
  description: '-180 <= longitude <= 180'
}).transform(Number)

export const ElevationParamSchema = z.string().openapi({
  example: 51,
  description: '-100 <= elevation <= 2000'
}).transform(Number)