import { z } from '@/lib/openapi/zod'

export const userResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    id: z.number(),
    name: z.string(),
    email: z.string(),
  }),
})
.openapi({
  example: {
    success: true,
    data: {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
    },
  },
})