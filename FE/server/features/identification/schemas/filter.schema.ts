import { z } from '@/lib/openapi/zod'

export const IdentificationFilterSchema = z.object({
  search: z.string().optional().openapi({
    example: 'acacia',
    description: 'Search through ai_response (case insensitive)',
  }),
  plantId: z.coerce.number().min(1).optional().openapi({
    example: 1,
  }),
  isSuccess: z.preprocess(
    (v) => v === 'true' ? true : v === 'false' ? false : undefined,
    z.boolean().optional()
  ).openapi({
    example: true,
  }),
  limit: z.coerce.number().min(1).max(100).default(20).optional().openapi({
    example: 20,
  }),
  offset: z.coerce.number().min(0).default(0).optional().openapi({
    example: 0,
  }),
}).openapi({
  title: 'IdentificationFilterQuery',
})

export type IdentificationFilterRequest = z.infer<typeof IdentificationFilterSchema>
