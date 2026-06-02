import { z } from '@/lib/openapi/zod'

export const loginSchema = z.object({
  email: z.email().openapi({
    example: 'john@example.com',
  }),
  password: z.string().min(8).openapi({
    example: 'secret123',
  }),
})
.openapi({
  title: 'LoginRequest',
})

export type LoginRequest = z.infer<typeof loginSchema>