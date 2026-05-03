import { z } from '@/lib/openapi/zod'

export const BaseQuerySchema = z.object({
  search: z.string().optional().openapi({
    example: 'Test',
    description: 'Searched through attributes (Case Insensitive)',
  }),
  limit: z.coerce.number().min(1).max(100).default(20).optional().openapi({
    example: 20,
  }),
  offset: z.coerce.number().min(0).optional().openapi({
    example: 0,
  }),
});
