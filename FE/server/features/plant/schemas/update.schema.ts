import { z } from '@/lib/openapi/zod'

export const UpdatePlantSchema = z.object({
  commonName: z.string().min(1).optional().openapi({
    example: 'Acacia nilotica',
  }),
  scientificName: z.string().min(1).optional().openapi({
    example: 'Vachellia nilotica',
  }),
  family: z.string().min(1).optional().openapi({
    example: 'Fabaceae',
  }),
  genus: z.string().min(1).optional().openapi({
    example: 'Vachellia',
  }),
  botanicalDescription: z.string().min(1).optional().openapi({
    example: 'Thorny tree with pinnate leaves',
  }),
  ecologicalInformation: z.string().min(1).optional().openapi({
    example: 'Invasive in savanna ecosystems',
  }),
  environmentalImpact: z.string().min(1).optional().openapi({
    example: 'Displaces native grass species',
  }),
  imagePath: z.string().optional().openapi({
    example: '/images/acacia.jpg',
  }),
}).openapi({
  title: 'UpdatePlantRequest',
})

export type UpdatePlantRequest = z.infer<typeof UpdatePlantSchema>
