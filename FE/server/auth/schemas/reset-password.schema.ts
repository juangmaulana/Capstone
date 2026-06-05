import { z } from '@/lib/openapi/zod'

export const resetPasswordSchema = z.object({
  resetToken: z.string().openapi({
    example: '57f354fde822adbc9f10478c0d0c31d93886c1830a3ef37046f9052f',
  }),
  newPassword: z.string().min(8).openapi({
    example: 'secret123'
  }),
})
.openapi({
  title: 'ResetPasswordRequest',
})

export type ResetPasswordRequest = z.infer<typeof resetPasswordSchema>