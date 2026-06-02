import { z } from '@/lib/openapi/zod'

export const forgotPasswordSchema = z.object({
  email: z.email().openapi({
    example: 'john@example.com',
  }),
})
.openapi({
  title: 'ForgotPasswordRequest',
})

export type ForgotPasswordRequest = z.infer<typeof forgotPasswordSchema>