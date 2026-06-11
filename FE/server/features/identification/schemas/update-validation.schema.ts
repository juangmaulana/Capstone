import { z } from '@/lib/openapi/zod'
import { AdminIdSchema } from './base.schema'

export const UpdateValidationSchema = z.object({
  adminId: AdminIdSchema
}).openapi({
  title: 'UpdateValidationRequest',
})

export type UpdateValidationRequest = z.infer<typeof UpdateValidationSchema>
