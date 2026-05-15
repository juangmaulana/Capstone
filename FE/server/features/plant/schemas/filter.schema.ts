import { z } from '@/lib/openapi/zod'
import { FamilySchema, GenusSchema } from './base.schema';
import { BaseQuerySchema } from '@/server/shared/schemas/query.schema';

export const PlantFilterSchema = BaseQuerySchema.extend({
  family: FamilySchema.optional(),
  genus: GenusSchema.optional(),
})

export type PlantFilterRequest = z.infer<typeof PlantFilterSchema>
