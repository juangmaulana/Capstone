import { z } from '@/lib/openapi/zod'

export const BooleanFromStringSchema = z
  .union([z.literal('true'), z.literal('false')])
  .transform((v) => v === 'true')