import { z } from '@/lib/openapi/zod'

export const CreatePlantSchema = z.object({
  commonName: z.string().min(1).openapi({
    example: 'Acacia nilotica',
  }),
  scientificName: z.string().min(1).openapi({
    example: 'Vachellia nilotica',
  }),
  family: z.string().min(1).openapi({
    example: 'Fabaceae',
  }),
  genus: z.string().min(1).openapi({
    example: 'Vachellia',
  }),
  botanicalDescription: z.string().min(1).openapi({
    example: 'Thorny tree with pinnate leaves',
  }),
  ecologicalInformation: z.string().min(1).openapi({
    example: 'Invasive in savanna ecosystems',
  }),
  environmentalImpact: z.string().min(1).openapi({
    example: 'Displaces native grass species',
  }),
  imagePath: z.string().default('').openapi({
    example: '/images/acacia.jpg',
  }),
}).openapi({
  title: 'CreatePlantRequest',
})

export type CreatePlantRequest = z.infer<typeof CreatePlantSchema>
