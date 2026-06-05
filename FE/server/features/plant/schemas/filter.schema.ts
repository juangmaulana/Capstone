import { z } from '@/lib/openapi/zod'
import { BaseQuerySchema } from '@/server/shared/schemas/query.schema';

export const PlantFilterSchema = BaseQuerySchema

export type PlantFilterRequest = z.infer<typeof PlantFilterSchema>
