import { z } from '../openapi/zod'

export const paramNumberIdSchema = z.object({
  id: z.coerce.number().min(1)
})