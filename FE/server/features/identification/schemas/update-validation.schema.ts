import { z } from '@/lib/openapi/zod'

export const IdentificationValidationStatusSchema = z.enum(['pending', 'validated', 'rejected']).openapi({
  example: 'validated',
})

export const UpdateIdentificationValidationSchema = z.object({
  validationStatus: IdentificationValidationStatusSchema.optional(),
  notes: z.string().max(1000).nullable().optional(),
}).refine((input) => input.validationStatus !== undefined || input.notes !== undefined, {
  message: 'validationStatus or notes is required',
}).openapi({
  title: 'UpdateIdentificationValidationRequest',
})

export type UpdateIdentificationValidationRequest = z.infer<typeof UpdateIdentificationValidationSchema>
