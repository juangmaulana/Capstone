import { z } from '@/lib/openapi/zod'

export const IdentificationValidationStageSchema = z.enum(['none', 'ranger', 'admin']).openapi({
  example: 'admin',
})

export const UpdateIdentificationValidationSchema = z.object({
  rangerValidated: z.boolean().optional(),
  adminValidated: z.boolean().optional(),
  notes: z.string().max(1000).nullable().optional(),
}).refine((input) => input.rangerValidated !== undefined || input.adminValidated !== undefined || input.notes !== undefined, {
  message: 'rangerValidated, adminValidated, or notes is required',
}).openapi({
  title: 'UpdateIdentificationValidationRequest',
})

export type UpdateIdentificationValidationRequest = z.infer<typeof UpdateIdentificationValidationSchema>
