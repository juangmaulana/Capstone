import { z } from '@/lib/openapi/zod'
import { BaseQuerySchema } from '@/server/shared/schemas/query.schema'

export const RoleFilterSchema = BaseQuerySchema

export type RoleFilterRequest = z.infer<typeof RoleFilterSchema>