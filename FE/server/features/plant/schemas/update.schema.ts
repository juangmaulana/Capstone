import { z } from '@/lib/openapi/zod'
import { PlantBaseSchema } from './base.schema';

export const UpdatePlantSchema = PlantBaseSchema.extend({
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
  kingdom: z.string().optional().openapi({ example: 'Plantae' }),
  phylum: z.string().optional().openapi({ example: 'Tracheophyta' }),
  taxClass: z.string().optional().openapi({ example: 'Magnoliopsida' }),
  orderRank: z.string().optional().openapi({ example: 'Fabales' }),
  taxSpecies: z.string().optional().openapi({ example: 'V. nilotica' }),
  source: z.string().optional().openapi({ example: 'www.gbif.org\npowo.science.kew.org' }),
}).partial().openapi({
  title: 'UpdatePlantRequest',
})

export type UpdatePlantRequest = z.infer<typeof UpdatePlantSchema>;
