import { z } from '@/lib/openapi/zod'
import { BaseQuerySchema } from '@/server/shared/schemas/query.schema';
import { IsSuccessSchema, PlantIdSchema } from './base.schema';

export const IdentificationFilterSchema = BaseQuerySchema.extend({
  plantId: PlantIdSchema.optional(),
  isSuccess: IsSuccessSchema.optional(),
})

export type IdentificationFilterRequest = z.infer<typeof IdentificationFilterSchema>
