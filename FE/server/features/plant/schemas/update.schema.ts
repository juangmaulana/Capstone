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
  botanicalDescriptionEn: z.string().optional().openapi({
    example: 'Thorny tree with bipinnate leaves',
  }),
  botanicalDescriptionId: z.string().optional().openapi({
    example: 'Pohon berduri dengan daun majemuk menyirip ganda',
  }),
  ecologicalInformation: z.string().min(1).optional().openapi({
    example: 'Invasive in savanna ecosystems',
  }),
  ecologicalInformationEn: z.string().optional().openapi({
    example: 'Invasive in savanna ecosystems',
  }),
  ecologicalInformationId: z.string().optional().openapi({
    example: 'Invasif di ekosistem sabana',
  }),
  environmentalImpact: z.string().min(1).optional().openapi({
    example: 'Displaces native grass species',
  }),
  environmentalImpactEn: z.string().optional().openapi({
    example: 'Displaces native grass species',
  }),
  environmentalImpactId: z.string().optional().openapi({
    example: 'Menggeser spesies rumput asli',
  }),
  imagePath: z.string().optional().openapi({
    example: '/images/acacia.jpg',
  }),
}).openapi({
  title: 'UpdatePlantRequest',
})

export type UpdatePlantRequest = z.infer<typeof UpdatePlantSchema>
