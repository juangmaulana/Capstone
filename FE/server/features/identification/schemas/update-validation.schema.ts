import { z } from '@/lib/openapi/zod'

export const UpdateIdentificationValidationSchema = z.object({
  adminId: z.coerce.number().min(1).openapi({
    example: 1,
  }),
}).openapi({
  title: 'UpdateValidationRequest',
})

export const UpdateValidationSchema = UpdateIdentificationValidationSchema

export type UpdateIdentificationValidationRequest = z.infer<typeof UpdateIdentificationValidationSchema>
export type UpdateValidationRequest = UpdateIdentificationValidationRequest
