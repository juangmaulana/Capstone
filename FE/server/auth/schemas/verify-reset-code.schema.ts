import { z } from '@/lib/openapi/zod'

export const verifyResetCodeSchema = z.object({
  email: z.email().openapi({
    example: 'john@example.com',
  }),
  code: z.string().openapi({
    example: '123456'
  }),
})
.openapi({
  title: 'VerifyResetCodeRequest',
})

export type VerifyResetCodeRequest = z.infer<typeof verifyResetCodeSchema>