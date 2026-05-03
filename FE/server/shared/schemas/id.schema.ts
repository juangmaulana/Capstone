import { z } from '@/lib/openapi/zod'

export const IdSchema = z.object({
  id: z.coerce.number().min(1)
})