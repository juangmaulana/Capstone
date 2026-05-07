import { z } from '@/lib/openapi/zod'

export const PlantFilterSchema = z.object({
  search: z.string().optional().openapi({
    example: 'Acacia',
    description: 'Search through common_name, scientific_name, descriptions (case insensitive)',
  }),
  family: z.string().optional().openapi({
    example: 'Fabaceae',
  }),
  genus: z.string().optional().openapi({
    example: 'Vachellia',
  }),
  limit: z.coerce.number().min(1).max(100).default(20).optional().openapi({
    example: 20,
  }),
  offset: z.coerce.number().min(0).default(0).optional().openapi({
    example: 0,
  }),
}).openapi({
  title: 'PlantFilterQuery',
})

export type PlantFilterRequest = z.infer<typeof PlantFilterSchema>
