import { z } from '@/lib/openapi/zod'
import { BaseQuerySchema } from '@/server/shared/schemas/query.schema';
import { IsSuccessSchema } from './base.schema';

export const IdentificationFilterSchema = BaseQuerySchema.extend({
  plantId: z.coerce.number().min(1).optional(),
  isSuccess: z.preprocess(
    val => val === 'true' ? true : val === 'false' ? false : val,
    IsSuccessSchema.optional()
  ),
})

export type IdentificationFilterRequest = z.infer<typeof IdentificationFilterSchema>
